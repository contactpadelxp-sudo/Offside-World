-- ============================================================================
-- Créneaux : génération et lecture des disponibilités
--
-- Jusqu'ici les créneaux vivaient en dur dans src/data/salles.ts et
-- src/data/bubble-team.ts. Les déplacer ici est la condition pour que le prix
-- et la disponibilité aient une seule source — celle que le serveur relit au
-- moment d'écrire une réservation.
--
-- ⚠ LES PLAGES CI-DESSOUS SONT PROVISOIRES. Brahim n'a pas encore arrêté les
--   jours réservés aux anniversaires. Elles reprennent l'hypothèse déjà
--   affichée sur le site (mercredi après-midi et week-end, 2 heures par
--   groupe, 30 minutes de battement). Dès que les vraies plages seront
--   connues, il n'y aura plus de déploiement à faire : il suffira de fermer
--   les créneaux devenus faux et de rappeler la fonction de génération.
--
--   RAPPEL D'ÉTANCHÉITÉ : toute plage ouverte ici doit avoir été RETIRÉE de la
--   location de terrain sur Sport-Finder, sinon les deux canaux peuvent vendre
--   le même terrain au même moment.
-- ============================================================================

-- ─────────────────────────────────────────────── lecture des disponibilités

-- Un créneau est « libre » s'il ne porte aucune réservation active. C'est la
-- même règle que l'index unique partiel qui interdit le double-booking : la
-- vue montre donc exactement ce que la base acceptera d'écrire.
--
-- security_invoker : la vue s'exécute avec les droits de l'appelant, donc RLS
-- des tables sous-jacentes s'applique. Les clés publiques n'en tirent rien.
create or replace view creneaux_disponibles
with (security_invoker = true) as
select
  c.id,
  c.type,
  c.espace_id,
  e.nom       as espace_nom,
  e.capacite,
  c.debut,
  c.fin,
  not exists (
    select 1 from reservations r
    where r.creneau_id = c.id
      and r.statut in ('en_attente', 'confirmee')
  ) as libre
from creneaux c
join espaces e on e.id = c.espace_id
where c.ouvert and e.actif;

comment on view creneaux_disponibles is
  'Créneaux ouverts avec leur disponibilité réelle. security_invoker : rien n''est '
  'lisible par les clés publiques, la vue n''ouvre aucun accès.';

revoke all on creneaux_disponibles from anon, authenticated;

-- ──────────────────────────────────────────────────────────── génération

-- Idempotent : « on conflict do nothing » couvre aussi la contrainte
-- d'exclusion, donc rappeler la fonction sur une période déjà générée
-- n'ajoute rien et ne casse rien.
create or replace function generer_creneaux_anniversaire(du date, au date)
returns integer
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  jour     date;
  heures   time[];
  h        time;
  crees    integer := 0;
  ajoutes  integer;
begin
  if au < du then
    raise exception 'Période invalide : % est antérieur à %', au, du;
  end if;

  for jour in select generate_series(du, au, interval '1 day')::date loop
    -- 3 = mercredi, 6 = samedi, 7 = dimanche (ISO)
    continue when extract(isodow from jour) not in (3, 6, 7);

    -- Le mercredi, uniquement l'après-midi : les enfants sont à l'école le matin.
    heures := case when extract(isodow from jour) = 3
                   then array['15:00', '17:30']::time[]
                   else array['10:00', '12:30', '15:00', '17:30']::time[]
              end;

    foreach h in array heures loop
      insert into creneaux (espace_id, type, debut, fin)
      select e.id,
             'anniversaire',
             (jour + h) at time zone 'Europe/Brussels',
             (jour + h) at time zone 'Europe/Brussels' + interval '2 hours'
      from espaces e
      where e.actif
      on conflict do nothing;

      get diagnostics ajoutes = row_count;
      crees := crees + ajoutes;
    end loop;
  end loop;

  return crees;
end $$;

comment on function generer_creneaux_anniversaire is
  'Ouvre les créneaux anniversaire d''une période. Plages PROVISOIRES tant que '
  'Brahim n''a pas arrêté les jours réservés aux anniversaires.';

-- Le Bubble Foot se joue sur un terrain, en soirée, une heure par groupe.
-- Un seul espace pour l'instant : c'est ce que propose déjà le site, qui
-- n'offre pas de choix d'espace pour cette activité.
create or replace function generer_creneaux_bubble(du date, au date)
returns integer
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  jour     date;
  h        time;
  crees    integer := 0;
  ajoutes  integer;
begin
  if au < du then
    raise exception 'Période invalide : % est antérieur à %', au, du;
  end if;

  for jour in select generate_series(du, au, interval '1 day')::date loop
    -- du vendredi au dimanche
    continue when extract(isodow from jour) not in (5, 6, 7);

    foreach h in array array['18:00', '19:00', '20:00']::time[] loop
      insert into creneaux (espace_id, type, debut, fin)
      select e.id,
             'bubble',
             (jour + h) at time zone 'Europe/Brussels',
             (jour + h) at time zone 'Europe/Brussels' + interval '1 hour'
      from espaces e
      where e.actif and e.id = 'espace-1'
      on conflict do nothing;

      get diagnostics ajoutes = row_count;
      crees := crees + ajoutes;
    end loop;
  end loop;

  return crees;
end $$;

comment on function generer_creneaux_bubble is
  'Ouvre les créneaux Bubble Foot d''une période. Horaires PROVISOIRES.';

-- Ces fonctions ouvrent des créneaux à la vente : réservées au serveur.
revoke execute on function generer_creneaux_anniversaire(date, date) from anon, authenticated, public;
revoke execute on function generer_creneaux_bubble(date, date)       from anon, authenticated, public;

-- ─────────────────────────────────────────────────── ouverture initiale

-- Six mois glissants. À reconduire (tâche planifiée ou appel manuel) :
--   select generer_creneaux_anniversaire(current_date, current_date + 180);
--   select generer_creneaux_bubble(current_date, current_date + 180);
select generer_creneaux_anniversaire(current_date, current_date + 180);
select generer_creneaux_bubble(current_date, current_date + 180);
