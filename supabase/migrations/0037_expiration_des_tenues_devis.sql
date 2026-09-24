-- ============================================================================
-- Une demande de team building jamais traitée relâche ses créneaux
--                                                        — 24 septembre 2026
-- ============================================================================
--
-- RELEVÉ PAR LA RELECTURE DE LA MIGRATION 0036.
--
-- Une demande tient ses créneaux dès l'envoi, et jusqu'ici plus rien ne les
-- rendait — sauf un refus cliqué par Brahim. Or une demande ne coûte rien : ni
-- paiement, ni confirmation préalable. Un script qui change d'adresse e-mail à
-- chaque appel pouvait donc retirer de la vente des semaines de team building,
-- et le tunnel aurait affiché « complet » partout pendant six mois.
--
-- Les réservations d'anniversaire n'ont jamais eu ce défaut : impayées, elles
-- expirent (45 minutes avec Stripe, 48 heures sans). Les demandes de devis
-- suivent désormais la même logique, avec un délai adapté à ce qu'elles sont.
--
-- ── Pourquoi sept jours, et pourquoi « nouvelle » seulement ─────────────────
--
-- Le complexe promet une réponse sous 48 heures ouvrables. Sept jours laissent
-- une marge large — un long week-end, une semaine chargée — sans laisser une
-- place bloquée indéfiniment par une demande que personne n'a regardée.
--
-- SEULES LES DEMANDES « NOUVELLE » EXPIRENT. Dès que Brahim a agi — traitée
-- par téléphone, devis envoyé, acceptée —, quelqu'un s'est engagé envers
-- l'entreprise : sa place ne doit pas lui échapper parce qu'elle tarde à
-- répondre au devis.
--
-- LA DEMANDE N'EST PAS SUPPRIMÉE, seules ses tenues sont désactivées, comme
-- pour un refus. Elle reste au back-office, où sa fiche affiche « Rendu à la
-- vente ». Si Brahim la traite ensuite — envoie un devis, la passe en
-- « traitée » —, le code tente de reprendre ses créneaux et dit s'ils ont été
-- pris entre-temps (`reprendreCreneauxDevis`).
--
-- ── Complément au quota ─────────────────────────────────────────────────────
--
-- Le même jour, le code ajoute un second quota : trois demandes par 24 heures
-- et par appelant, en plus des cinq par dix minutes communs à tout le site.
-- L'expiration borne la durée du dégât ; le quota en borne l'ampleur.
--
-- ── Rappel : une demande tient désormais TOUS les terrains ──────────────────
--
-- Décidé le même soir, toujours sur relecture : le site annonce une
-- « privatisation du complexe » pour des groupes jusqu'à 60, alors que 0036
-- attribuait une seule Fun zone de 18 places. Le code tient donc désormais
-- tous les terrains actifs de la période (`candidatsTeamBuilding`). Aucun
-- changement de schéma n'était nécessaire : `devis_creneaux` accepte déjà
-- autant de lignes par demande qu'il le faut.

create or replace function expirer_tenues_devis(delai interval default interval '7 days')
returns integer
language plpgsql
set search_path = pg_catalog, public
as $$
declare n integer;
begin
  update devis_creneaux dc
     set actif = false
   where dc.actif
     and exists (
       select 1 from demandes_devis d
        where d.id = dc.demande_id
          and d.statut = 'nouvelle'
          and d.created_at < now() - delai
     );
  get diagnostics n = row_count;
  return n;
end $$;

comment on function expirer_tenues_devis is
  'Désactive les créneaux tenus par les demandes de team building restées '
  '« nouvelle » depuis plus de sept jours. La demande reste en place ; ses '
  'créneaux sont rendus à la vente. Planifiée chaque nuit.';

revoke all on function expirer_tenues_devis(interval) from public, anon, authenticated;

-- 5h00 UTC, après les autres tâches d'entretien (la dernière, la purge des
-- quotas, tourne à 4h45) et quand le complexe est fermé.
select cron.schedule(
  'expirer-tenues-devis',
  '0 5 * * *',
  $$ select expirer_tenues_devis() $$
);
