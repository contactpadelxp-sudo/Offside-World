-- ============================================================================
-- Le team building se réserve sur de vrais créneaux — 24 septembre 2026
-- ============================================================================
--
-- DEMANDÉ PAR MATHIS, le jour de la mise en ligne : « quand quelqu'un fait une
-- demande de devis il choisit son créneau et ça le bloque, mais Brahim doit
-- aussi pouvoir bloquer lui-même dans le back-office. Les créneaux de team
-- building doivent avoir le même fonctionnement que les créneaux
-- anniversaires. » Et la journée entière, matin ET après-midi.
--
-- Les heures sont enfin connues : 09h00-13h00 et 14h00-18h00. Les jours, eux,
-- l'étaient depuis le 17 septembre : lundi, mardi et jeudi matin et
-- après-midi ; vendredi matin seulement.
--
-- ── Ce qui change de nature ─────────────────────────────────────────────────
--
-- Le team building était une DEMANDE, sans créneau : l'entreprise indiquait
-- une préférence, le complexe confirmait. Le commentaire de la table le disait
-- — « cela n'occupe donc aucun créneau tant que le devis n'est pas accepté ».
-- Deux sociétés pouvaient donc demander le même lundi matin, et rien ne le
-- voyait avant que Brahim rappelle la seconde.
--
-- Désormais une demande TIENT son créneau dès l'envoi. Ce n'est pas une
-- réservation ferme — le prix reste à fixer — mais la place n'est plus
-- proposée à une autre entreprise tant que la demande vit.
--
-- ── Pourquoi une table à part, et pas une colonne sur les demandes ──────────
--
-- Une journée entière tient DEUX créneaux. Une colonne `creneau_id` sur
-- `demandes_devis` n'en porte qu'un. `devis_creneaux` relie une demande à
-- autant de créneaux qu'il le faut, et c'est elle qui porte la règle :
--
--   UN CRÉNEAU N'EST TENU QUE PAR UNE SEULE DEMANDE ACTIVE — index unique
--   partiel sur `creneau_id where actif`. C'est la même garantie que
--   `reservations_un_seul_actif_par_creneau` pour les anniversaires : deux
--   entreprises qui envoient au même instant ne peuvent pas passer toutes les
--   deux, c'est la base qui tranche, pas le navigateur.
--
-- Une demande refusée ne supprime pas ses lignes : elle les DÉSACTIVE. On sait
-- ainsi toujours quel créneau une demande avait visé, et rouvrir la demande
-- peut tenter de le reprendre.
--
-- ── Pourquoi la libération passe par un déclencheur ─────────────────────────
--
-- Un devis refusé qui garderait ses créneaux les bloquerait pour toujours, en
-- silence : c'est l'invariant qui compte le plus ici. Il ne dépend donc pas du
-- bon chemin de code — un déclencheur le tient, que le statut change depuis le
-- back-office, depuis l'éditeur SQL ou depuis un outil qui n'existe pas
-- encore.
--
-- La RÉOUVERTURE, elle, n'est pas dans le déclencheur, et c'est voulu : si le
-- créneau a été repris entre-temps, reprendre le créneau échoue — et dans un
-- déclencheur, cet échec ferait échouer le changement de statut lui-même. On
-- ne pourrait plus rouvrir une demande dont le créneau a été repris. C'est le
-- code applicatif qui tente de le reprendre, et qui dit s'il n'a pas pu.
--
-- ── Un créneau par Fun zone, comme les anniversaires ────────────────────────
--
-- « Même fonctionnement que les créneaux anniversaires » : chaque demi-journée
-- existe donc une fois par espace actif. Deux entreprises peuvent prendre le
-- même lundi matin, chacune un terrain. Une grande société qui veut les deux
-- terrains : Brahim ferme le second à la main, depuis le back-office.
--
-- ── ⚠ LE CONFLIT AVEC SPORT-FINDER, écrit plutôt que deviné ─────────────────
--
-- Les jours de team building sont les jours SANS anniversaire. Ces jours-là,
-- Sport-Finder loue les mêmes terrains à partir de 14h00
-- (`data/plages-sport-finder.ts`). Les APRÈS-MIDIS du lundi, du mardi et du
-- jeudi tombent donc en plein dedans.
--
-- Ils sont générés quand même : c'est ce que Brahim propose, et une demande de
-- devis n'est pas une vente — il la relit avant d'envoyer un prix. Mais
-- lorsqu'il accepte un après-midi, IL DOIT FERMER CETTE PLAGE SUR
-- SPORT-FINDER. Le back-office le rappelle : rouvrir un après-midi déclenche
-- l'avertissement Sport-Finder habituel.

-- ── 1. La journée entière devient une période possible ─────────────────────

alter table demandes_devis drop constraint if exists demandes_devis_periode_check;
alter table demandes_devis add constraint demandes_devis_periode_check
  check (periode = any (array['matin'::text, 'apres-midi'::text, 'journee'::text]));

comment on table demandes_devis is
  'Team building, sur devis. Depuis le 24 septembre 2026, une demande TIENT son '
  'ou ses créneaux dès l''envoi (table `devis_creneaux`) : ce n''est pas une '
  'réservation ferme, le prix reste à fixer, mais la place n''est plus proposée '
  'à une autre entreprise. Refuser la demande libère ses créneaux.';

-- ── 2. Le lien entre une demande et les créneaux qu'elle tient ──────────────

create table devis_creneaux (
  demande_id  uuid        not null references demandes_devis(id) on delete cascade,
  -- `restrict` : un créneau qui a été demandé garde sa trace, comme un créneau
  -- réservé. Le supprimer effacerait ce que l'entreprise avait choisi.
  creneau_id  uuid        not null references creneaux(id) on delete restrict,
  actif       boolean     not null default true,
  created_at  timestamptz not null default now(),
  primary key (demande_id, creneau_id)
);

-- LA garantie : un créneau n'est tenu que par une seule demande vivante.
create unique index devis_creneaux_un_seul_actif_par_creneau
  on devis_creneaux (creneau_id) where actif;

comment on table devis_creneaux is
  'Créneaux tenus par une demande de team building. Une ligne ACTIVE retire le '
  'créneau de la vente ; l''index unique partiel interdit que deux demandes '
  'tiennent le même. Une demande refusée désactive ses lignes (déclencheur '
  'liberer_creneaux_devis_refuse), elle ne les supprime pas.';

alter table devis_creneaux enable row level security;
alter table devis_creneaux force row level security;
revoke all on devis_creneaux from anon, authenticated;

-- ── 3. La disponibilité compte aussi les créneaux tenus par un devis ────────
--
-- Mêmes colonnes, même ordre : `create or replace view` l'exige, et le code
-- déjà déployé continue de lire la vue sans rien voir changer — sauf `libre`,
-- qui devient FAUX pour un créneau de team building tenu par une demande.

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
  )
  and not exists (
    select 1 from devis_creneaux dc
    where dc.creneau_id = c.id
      and dc.actif
  ) as libre
from creneaux c
join espaces e on e.id = c.espace_id
where c.ouvert and e.actif;

comment on view creneaux_disponibles is
  'Créneaux ouverts avec leur disponibilité réelle : ni réservation active, ni '
  'demande de devis active. security_invoker : rien n''est lisible par les clés '
  'publiques, la vue n''ouvre aucun accès.';

revoke all on creneaux_disponibles from anon, authenticated;

-- ── 4. Refuser une demande libère ses créneaux ──────────────────────────────

create or replace function liberer_creneaux_devis_refuse()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  update devis_creneaux
     set actif = false
   where demande_id = new.id
     and actif;
  return new;
end $$;

comment on function liberer_creneaux_devis_refuse is
  'Désactive les créneaux tenus par une demande qui passe à « refusee ». La '
  'reprise à la réouverture est faite par le code applicatif, jamais ici : un '
  'créneau repris entre-temps ferait échouer le changement de statut.';

create trigger demandes_devis_liberer_creneaux
  after update of statut on demandes_devis
  for each row
  when (new.statut = 'refusee' and old.statut is distinct from 'refusee')
  execute function liberer_creneaux_devis_refuse();

-- ── 5. Le générateur des créneaux de team building ──────────────────────────
--
-- Même mécanique que `generer_creneaux_anniversaire` depuis 0034 : un créneau
-- existant au même horaire, OUVERT OU FERMÉ, n'est jamais recréé. Fermer un
-- créneau à la main reste définitif jusqu'à ce qu'on le rouvre.

create or replace function generer_creneaux_team_building(du date, au date)
returns table(crees integer, deja_presents integer, refuses integer)
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  jour    date;
  heures  time[];
  h       time;
  espace  record;
  v_debut timestamptz;
  v_fin   timestamptz;
  ajoutes integer;
begin
  if au < du then
    raise exception 'Période invalide : % est antérieur à %', au, du;
  end if;

  crees := 0; deja_presents := 0; refuses := 0;

  for jour in select generate_series(du, au, interval '1 day')::date loop
    -- 1 = lundi, 2 = mardi, 4 = jeudi, 5 = vendredi (ISO). Ni le mercredi ni
    -- le week-end : ce sont les jours des anniversaires.
    continue when extract(isodow from jour) not in (1, 2, 4, 5);

    heures := case extract(isodow from jour)
                -- Vendredi : le matin seulement (Brahim, 17 septembre 2026).
                when 5 then array['09:00']::time[]
                else        array['09:00', '14:00']::time[]
              end;

    foreach h in array heures loop
      for espace in select id from espaces where actif loop
        v_debut := (jour + h) at time zone 'Europe/Brussels';
        -- Quatre heures : 09h00-13h00, 14h00-18h00.
        v_fin   := v_debut + interval '4 hours';

        if exists (
          select 1 from creneaux c
          where c.espace_id = espace.id
            and c.debut = v_debut and c.fin = v_fin
            and c.type = 'team_building'
        ) then
          deja_presents := deja_presents + 1;
          continue;
        end if;

        insert into creneaux (espace_id, type, debut, fin)
        values (espace.id, 'team_building', v_debut, v_fin)
        on conflict do nothing;

        get diagnostics ajoutes = row_count;
        if ajoutes = 1 then
          crees := crees + 1;
        else
          refuses := refuses + 1;
        end if;
      end loop;
    end loop;
  end loop;

  return next;
end $$;

comment on function generer_creneaux_team_building is
  'Créneaux de team building de 4 h : 09h00-13h00 et 14h00-18h00 les lundi, '
  'mardi et jeudi ; 09h00-13h00 seulement le vendredi. Un par espace actif, '
  'comme les anniversaires. Un créneau existant au même horaire, ouvert ou '
  'fermé, n''est jamais recréé. Attention : les après-midis tombent dans les '
  'heures de location de Sport-Finder (14h00-01h00 ces jours-là).';

revoke all on function generer_creneaux_team_building(date, date) from public, anon, authenticated;

-- ── 6. Six mois d'avance, comme les anniversaires ───────────────────────────

select generer_creneaux_team_building(current_date, current_date + 180);
