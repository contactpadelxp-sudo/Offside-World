-- ============================================================================
-- Mesure d'audience — table d'événements
--
-- Pourquoi une table plutôt qu'un outil tiers : le bandeau cookies demandait
-- déjà au visiteur son accord pour la « mesure d'audience » alors qu'aucun
-- outil n'existait derrière. Le choix était écrit dans son navigateur et lu
-- par personne. On construit donc ce qui était promis, et les données restent
-- dans la base du complexe — rien n'est envoyé à un tiers.
--
-- CE QUI N'EST PAS COLLECTÉ, et pourquoi ça compte :
--   - aucune adresse IP, ni brute ni hachée ;
--   - aucun identifiant durable : `session` est tiré au hasard par le
--     navigateur et remis à zéro après 30 minutes d'inactivité, donc deux
--     visites du même visiteur ne peuvent pas être rapprochées ;
--   - aucune donnée saisie dans un formulaire (nom, e-mail, téléphone).
-- L'ensemble reste donc de la donnée de fréquentation, et non de la donnée
-- personnelle : pas de profilage, pas de droit d'accès à honorer visiteur par
-- visiteur. C'est délibéré, et c'est ce qui rend la table sûre à exploiter.
--
-- Rien n'est écrit sans le consentement « analytics » : la vérification est
-- faite côté navigateur avant l'envoi, et rappelée côté serveur.
-- ============================================================================

create table if not exists evenements_audience (
  id            bigint generated always as identity primary key,
  survenu_le    timestamptz not null default now(),

  -- Identifiant de session anonyme, tiré au hasard côté navigateur.
  -- Sert uniquement à relier les étapes d'une même visite entre elles.
  session       text not null,

  -- Nature de l'événement : 'page' pour une page vue, sinon une étape du
  -- tunnel de réservation ('activite', 'formule', 'creneau', 'formulaire',
  -- 'reservation', 'devis'). Texte libre volontairement : ajouter une étape
  -- ne doit pas demander une migration.
  nom           text not null,

  -- Page sur laquelle l'événement s'est produit, sans les paramètres de
  -- requête : ceux-ci peuvent contenir n'importe quoi.
  chemin        text,

  -- Valeur associée à l'événement — l'activité choisie, l'étape atteinte.
  detail        text,

  -- D'où vient le visiteur : hôte du référent (google.com, facebook.com)
  -- ou paramètre utm_source. Jamais l'URL complète.
  provenance    text,

  appareil      text check (appareil in ('mobile', 'tablette', 'ordinateur')),
  pays          text,
  langue        text,

  constraint session_courte check (length(session) between 8 and 64),
  constraint nom_court check (length(nom) between 1 and 40),
  constraint chemin_court check (chemin is null or length(chemin) <= 200),
  constraint detail_court check (detail is null or length(detail) <= 120),
  constraint provenance_courte check (provenance is null or length(provenance) <= 120),
  constraint pays_court check (pays is null or length(pays) <= 2),
  constraint langue_courte check (langue is null or length(langue) <= 12)
);

-- Les trois lectures du tableau de bord : par période, par nature, par visite.
create index if not exists evenements_audience_date_idx
  on evenements_audience (survenu_le desc);
create index if not exists evenements_audience_nom_date_idx
  on evenements_audience (nom, survenu_le desc);
create index if not exists evenements_audience_session_idx
  on evenements_audience (session, survenu_le);

-- Même régime que les huit autres tables : RLS activé ET forcé, sans aucune
-- politique. Les clés publiques ne peuvent donc rien lire ni écrire ; tout
-- passe par le serveur, qui utilise la clé de service.
alter table evenements_audience enable row level security;
alter table evenements_audience force row level security;

comment on table evenements_audience is
  'Fréquentation du site public. Aucune IP, aucun identifiant durable, aucune '
  'donnée de formulaire — voir l''en-tête de la migration 0011.';

-- ----------------------------------------------------------------------------
-- Conservation : treize mois, comme les réservations.
--
-- Treize et non douze, pour qu''une comparaison « septembre contre septembre »
-- reste possible jusqu''à la fin du mois. Au-delà, la donnée de fréquentation
-- ne sert plus à rien et la garder contredirait la minimisation (RGPD art. 5.1.e).
-- ----------------------------------------------------------------------------

create or replace function purger_audience_ancienne()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  supprimees integer;
begin
  delete from evenements_audience
   where survenu_le < now() - interval '13 months';
  get diagnostics supprimees = row_count;
  return supprimees;
end;
$$;

-- Le dimanche à 4h15 UTC, entre les deux tâches déjà en place.
select cron.schedule(
  'purger-audience',
  '15 4 * * 0',
  $$ select purger_audience_ancienne() $$
);

-- Une fonction `security definer` s'exécute avec les droits de son
-- propriétaire, et Supabase expose par défaut toute fonction du schéma public
-- sur `/rest/v1/rpc/`. Sans ces deux lignes, n'importe qui pouvait donc
-- déclencher la purge et effacer treize mois de mesures. Seul le rôle serveur
-- y a accès — c'est ce que fait déjà `purger_sessions_admin`.
revoke all on function purger_audience_ancienne() from public, anon, authenticated;
grant execute on function purger_audience_ancienne() to service_role;
