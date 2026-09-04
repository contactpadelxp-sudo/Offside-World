-- ============================================================================
-- Back-office : sessions, notes internes, traçabilité
--
-- Le back-office passe de la consultation à la modification. Trois besoins en
-- découlent :
--
-- 1. DES SESSIONS RÉVOCABLES. Un jeton signé seul ne peut pas être annulé
--    avant son échéance : si quelqu'un ferme sa session, ou si un poste est
--    perdu, il faut pouvoir couper l'accès immédiatement. La session vit donc
--    en base, et « se déconnecter » la révoque vraiment.
--
-- 2. DES NOTES INTERNES. Distinctes des remarques du client : celles-ci
--    viennent du formulaire public, celles-là sont écrites par le complexe et
--    ne doivent jamais lui être renvoyées.
--
-- 3. UNE TRACE DE CHAQUE MODIFICATION. `journal_admin` existait déjà mais
--    restait vide. Toute action du back-office y écrit désormais — exigence
--    d'autant plus nette que ces réservations contiennent des données
--    d'enfants et de santé (RGPD art. 5.1.f et 32).
-- ============================================================================

-- ─────────────────────────────────────────────────────────────── sessions

create table if not exists admin_sessions (
  id           uuid         primary key default gen_random_uuid(),
  acteur       text         not null,
  cree_le      timestamptz  not null default now(),
  expire_le    timestamptz  not null,
  revoquee_le  timestamptz,
  ip           inet,
  agent        text
);

-- Sert la vérification à chaque requête : on ne lit que les sessions vivantes.
create index if not exists admin_sessions_vivantes
  on admin_sessions (expire_le)
  where revoquee_le is null;

comment on table admin_sessions is
  'Sessions du back-office. Stockées en base pour être révocables : la '
  'déconnexion annule la session, elle ne se contente pas d''effacer le cookie.';

alter table admin_sessions enable row level security;
alter table admin_sessions force  row level security;

-- Purge des sessions mortes. À planifier avec les autres tâches d'entretien.
create or replace function purger_sessions_admin(garde interval default interval '30 days')
returns integer
language plpgsql
set search_path = pg_catalog, public
as $$
declare supprimees integer;
begin
  delete from admin_sessions
   where expire_le < now() - garde;
  get diagnostics supprimees = row_count;
  return supprimees;
end $$;

revoke execute on function purger_sessions_admin(interval) from anon, authenticated, public;

-- ────────────────────────────────────────────────────────── notes internes

alter table reservations
  add column if not exists note_interne text;
alter table demandes_devis
  add column if not exists note_interne text;

comment on column reservations.note_interne is
  'Note du complexe, jamais affichée au client. À distinguer de `remarques`, '
  'qui vient du formulaire public.';
comment on column demandes_devis.note_interne is
  'Note du complexe, jamais affichée au client. À distinguer de `message`, '
  'qui vient du formulaire public.';

-- ──────────────────────────────────── la vue doit exposer la note interne

-- `create or replace view` ne sait qu'AJOUTER des colonnes à la fin : insérer
-- `note_interne` entre `remarques` et `created_at` lui fait croire qu'on renomme
-- une colonne existante (« cannot change name of view column »). On supprime
-- donc la vue avant de la recréer — rien n'en dépend, et cela permet de garder
-- les colonnes dans un ordre lisible.
drop view if exists reservations_detaillees;

create view reservations_detaillees
with (security_invoker = true) as
select
  r.id,
  r.reference,
  r.type,
  r.statut,
  r.total_cents,
  r.formule_id,
  f.nom              as formule_nom,
  r.nb_enfants,
  r.enfant_prenom,
  r.enfant_age,
  r.nb_personnes,
  r.options_ids,
  r.client_nom,
  r.client_email,
  r.client_telephone,
  r.allergies,
  r.remarques,
  r.note_interne,
  r.created_at,
  c.debut,
  c.fin,
  c.espace_id,
  e.nom              as espace_nom
from reservations r
join creneaux c  on c.id = r.creneau_id
join espaces  e  on e.id = c.espace_id
left join formules f on f.id = r.formule_id;

comment on view reservations_detaillees is
  'Réservations avec leur créneau et leur espace. Contient des données de mineurs '
  'et de santé : tout accès passe par le back-office authentifié.';

revoke all on reservations_detaillees from anon, authenticated;
