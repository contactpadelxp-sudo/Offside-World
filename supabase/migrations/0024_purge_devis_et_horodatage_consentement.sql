-- ============================================================================
-- Ce que la politique de confidentialité promet, la base doit le tenir
-- — 19 septembre 2026
-- ============================================================================

-- ── 1. Les demandes de devis n'étaient jamais purgées ───────────────────────
--
-- L'article 7 de la politique annonce, pour les « demandes de contact sans
-- réservation », « le temps nécessaire pour répondre à la demande, puis
-- pendant une durée limitée permettant d'en assurer le suivi ». Aucune limite
-- n'existait : `demandes_devis` porte contact_nom, contact_email,
-- contact_telephone, entreprise, message, client_adresse et client_tva, et
-- rien ne les effaçait jamais. Les réservations, elles, sont anonymisées à
-- 13 mois depuis la migration 0001.
--
-- ON ANONYMISE, ON NE SUPPRIME PAS — comme pour les réservations. Une demande
-- acceptée devient une affaire : sa référence peut figurer dans la
-- comptabilité, et supprimer la ligne ferait un trou dans une piste d'audit.
-- Ce qui part, ce sont les données personnelles ; ce qui reste, c'est le
-- montant, la date et l'état.
--
-- MÊME DÉLAI QUE LES RÉSERVATIONS : 13 mois. Deux durées différentes pour deux
-- tables voisines seraient impossibles à justifier devant l'autorité, et
-- impossibles à retenir.

alter table demandes_devis
  add column if not exists anonymisee_le timestamptz;

alter table reservations
  add column if not exists newsletter_le timestamptz;
alter table demandes_devis
  add column if not exists newsletter_le timestamptz;

comment on column demandes_devis.anonymisee_le is
  'Date de l''anonymisation RGPD, nulle tant que la demande porte ses données '
  'personnelles. Même mécanisme que reservations.anonymisee_le.';

create or replace function anonymiser_devis_anciens(delai interval default interval '13 months')
returns integer
language plpgsql
set search_path = pg_catalog, public
as $$
declare touchees integer;
begin
  update demandes_devis set
    contact_nom       = 'anonymisé',
    contact_email     = 'anonymise@invalid',
    contact_telephone = '',
    message           = null,
    note_interne      = null,
    client_adresse    = null,
    client_tva        = null,
    newsletter        = false,
    newsletter_le     = null,
    anonymisee_le     = now()
  where anonymisee_le is null
    and created_at < now() - delai;
  get diagnostics touchees = row_count;
  return touchees;
end $$;

comment on function anonymiser_devis_anciens is
  'Minimisation (RGPD art. 5.1.e) des demandes de devis. `entreprise` est '
  'conservé : c''est une personne morale, pas une personne physique, et c''est '
  'ce qui rend la ligne encore lisible en comptabilité.';

revoke all on function anonymiser_devis_anciens(interval) from public, anon, authenticated;

-- Même heure que l'anonymisation des réservations, à une minute près : les
-- deux traitements font la même chose, les lire dans le journal côte à côte
-- vaut mieux que de les chercher à deux endroits de la nuit.
select cron.schedule(
  'anonymiser-devis',
  '31 3 * * *',
  $$ select anonymiser_devis_anciens() $$
);

-- ── 2. Le consentement marketing n'était pas horodaté ───────────────────────
--
-- `lib/email/envoi.ts` affirme que « le consentement marketing est bien
-- recueilli et HORODATÉ en base ». Il ne l'était pas : les deux tables ne
-- portent qu'un booléen `newsletter`, sans date ni trace de la version du
-- texte accepté.
--
-- L'article 7.1 du RGPD demande au responsable de pouvoir DÉMONTRER le
-- consentement. Un booléen ne démontre rien : il ne dit ni quand, ni à quoi.
-- Le jour où Brahim voudra écrire à ses clients — ce qu'un complexe qui vend
-- des anniversaires finit par vouloir —, il partirait d'une base de
-- consentements invérifiables, donc inutilisables.
--
-- La colonne est nulle pour les lignes existantes, et ce n'est pas un défaut :
-- on ne peut pas inventer après coup la date d'un consentement. Une ligne sans
-- date restera simplement hors de tout envoi.

comment on column reservations.newsletter_le is
  'Horodatage du consentement marketing (RGPD art. 7.1 : le responsable doit '
  'pouvoir le démontrer). Nul quand `newsletter` est faux, ou pour les lignes '
  'antérieures au 19 septembre 2026 — une date ne se reconstitue pas.';
comment on column demandes_devis.newsletter_le is
  'Voir reservations.newsletter_le.';

-- L'anonymisation efface aussi cette date : garder « cette personne a consenti
-- le 3 mars » après avoir effacé qui elle est n'a plus d'objet, et reste une
-- donnée liée à une personne.
create or replace function anonymiser_reservations_anciennes(delai interval default interval '13 months')
returns integer
language plpgsql
set search_path = pg_catalog, public
as $$
declare touchees integer;
begin
  update reservations set
    client_nom       = 'anonymisé',
    client_email     = 'anonymise@invalid',
    client_telephone = '',
    enfant_prenom    = null,
    enfant_age       = null,
    allergies        = null,
    remarques        = null,
    newsletter       = false,
    newsletter_le    = null,
    anonymisee_le    = now()
  where anonymisee_le is null
    and created_at < now() - delai;
  get diagnostics touchees = row_count;
  return touchees;
end $$;

comment on function anonymiser_reservations_anciennes is
  'Minimisation (RGPD art. 5.1.e). Les données de mineurs et de santé méritent '
  'un délai plus court que les 13 mois par défaut : à arbitrer avec le client. '
  'Le consentement marketing part avec le reste : il ne survit pas à la '
  'personne qu''il concernait.';
