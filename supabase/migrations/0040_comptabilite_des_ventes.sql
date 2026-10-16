-- ============================================================================
-- La comptabilité des ventes en ligne
--                                                        — 16 octobre 2026
-- ============================================================================
--
-- Demandé par Brahim le 14 octobre 2026 : « Je ne suis pas censé avoir un
-- récap de mes ventes pour envoyer à mon comptable ? » Puis par Mathis : un
-- export par période précise, avec la TVA, sérieux, puisqu'il part chez le
-- comptable.
--
-- Ce que la base savait jusqu'ici ne suffisait pas à le produire, pour quatre
-- raisons que cette migration lève une par une.
--
-- 1. AUCUN TAUX DE TVA. Les prix sont affichés TVAC aux particuliers, et rien
--    ne disait quelle part de 190 € est de la TVA. Le taux d'un anniversaire
--    n'est pas celui du team building (6 %, accès aux installations sportives)
--    tant que le comptable ne l'a pas dit : un forfait avec goûter, boissons ou
--    décoration peut relever d'autres taux. Il devient donc un RÉGLAGE, par
--    formule et par option, que Brahim renseigne dans « Tarifs ». Nul tant
--    qu'il ne l'a pas fait, et l'export le dit au lieu de deviner.
--
-- 2. AUCUN DÉTAIL FIGÉ. Une réservation ne gardait que son total. Le détail —
--    forfait, participants en plus, options — se recalculait avec les prix du
--    JOUR, qui changent : le 23 septembre, Kick-Off est passé une heure à 1 €
--    pour un essai. Une vente doit garder ses propres prix, et ses propres
--    taux. `reservations.lignes` les fige à l'écriture.
--
--    LE DÉTAIL EST CALCULÉ PAR LA BASE, PAS PAR LE SITE. Un déclencheur le
--    construit au moment de l'insertion, à partir des mêmes tables que celles
--    dont le site vient de tirer le total — et le compare à ce total. S'ils
--    divergent, on garde une ligne unique au montant exact plutôt qu'un détail
--    faux. Le parcours de réservation n'a ainsi pas changé d'une ligne : une
--    panne de cette comptabilité ne peut pas empêcher un client de réserver.
--
-- 3. AUCUNE DATE DE REMBOURSEMENT. `montant_rembourse_cents` est un cumul :
--    un remboursement de 95 € en novembre sur une vente d'octobre n'y laissait
--    aucune date. La table `remboursements` en garde une ligne par mouvement,
--    écrite par déclencheur — donc quel que soit le chemin qui a remboursé :
--    le bouton du back-office, un remboursement fait à la main dans Stripe, ou
--    une contestation bancaire perdue.
--
-- 4. AUCUNE DATE D'ENCAISSEMENT. `paiements.created_at` est l'ouverture de la
--    page Stripe, pas le paiement, et `updated_at` bouge à chaque
--    remboursement. `reussi_le` est posé une fois, par déclencheur, quand le
--    paiement aboutit.
--
-- Rien n'est supprimé, rien n'est réécrit : uniquement des colonnes, une table
-- et des déclencheurs nouveaux, plus la reprise de l'existant — pendant
-- laquelle les déclencheurs `*_touch` sont suspendus, pour ne pas remettre
-- toutes les dates de modification à l'heure de la migration.

-- ── 1. Le taux de TVA, par formule et par option ────────────────────────────

alter table formules
  add column if not exists tva_pourcent smallint
  check (tva_pourcent is null or (tva_pourcent >= 0 and tva_pourcent <= 25));

comment on column formules.tva_pourcent is
  'Taux de TVA applicable au forfait et aux participants supplémentaires, en '
  'pourcent. NULL = pas encore renseigné : l''export des ventes le signale au '
  'lieu de supposer un taux. 0 = exonéré, ce qui n''est pas la même chose.';

alter table options
  add column if not exists tva_pourcent smallint
  check (tva_pourcent is null or (tva_pourcent >= 0 and tva_pourcent <= 25));

comment on column options.tva_pourcent is
  'Taux de TVA de l''option, en pourcent. Voir formules.tva_pourcent.';

-- ── 2. Le détail de chaque vente, figé à l'écriture ─────────────────────────

alter table reservations
  add column if not exists lignes jsonb
  check (lignes is null or jsonb_typeof(lignes) = 'array');

comment on column reservations.lignes is
  'Détail facturé, figé à l''écriture par le déclencheur reservations_figer_lignes : '
  '[{nature, ref, designation, quantite, pu_cents, total_cents, tva_pourcent}]. '
  'La somme des total_cents vaut total_cents. Ne contient aucune donnée '
  'personnelle — il survit donc à l''anonymisation, comme la comptabilité l''exige.';

create or replace function lignes_de_vente(
  p_type          type_activite,
  p_formule_id    text,
  p_nb_enfants    integer,
  p_options_ids   text[],
  p_nb_personnes  integer,
  p_total_cents   integer
)
returns jsonb
language plpgsql
stable
set search_path = pg_catalog, public
as $$
declare
  f        record;
  o        record;
  lignes   jsonb := '[]'::jsonb;
  somme    integer := 0;
  sup      integer;
  commun   smallint;
begin
  if p_type = 'anniversaire' and p_formule_id is not null then
    select id, nom, prix_base_cents, enfants_inclus, prix_enfant_sup_cents, tva_pourcent
      into f
      from formules
     where id = p_formule_id;

    if found then
      lignes := lignes || jsonb_build_object(
        'nature', 'formule',
        'ref', f.id,
        'designation', 'Anniversaire — formule ' || f.nom,
        'quantite', 1,
        'pu_cents', f.prix_base_cents,
        'total_cents', f.prix_base_cents,
        'tva_pourcent', f.tva_pourcent
      );
      somme := somme + f.prix_base_cents;

      -- Même règle que `totalAnniversaireCents` (src/lib/tarification.ts) :
      -- seuls les participants AU-DELÀ du forfait se paient en plus.
      sup := greatest(0, coalesce(p_nb_enfants, 0) - f.enfants_inclus);
      if sup > 0 then
        lignes := lignes || jsonb_build_object(
          'nature', 'participant_sup',
          'ref', f.id,
          'designation', 'Participant supplémentaire — formule ' || f.nom,
          'quantite', sup,
          'pu_cents', f.prix_enfant_sup_cents,
          'total_cents', sup * f.prix_enfant_sup_cents,
          'tva_pourcent', f.tva_pourcent
        );
        somme := somme + sup * f.prix_enfant_sup_cents;
      end if;

      for o in
        select op.id, op.libelle, op.prix_cents, op.tva_pourcent
          from unnest(coalesce(p_options_ids, '{}'::text[])) with ordinality as u(id, rang)
          join options op on op.id = u.id
         order by u.rang
      loop
        lignes := lignes || jsonb_build_object(
          'nature', 'option',
          'ref', o.id,
          'designation', 'Option — ' || o.libelle,
          'quantite', 1,
          'pu_cents', o.prix_cents,
          'total_cents', o.prix_cents,
          'tva_pourcent', o.tva_pourcent
        );
        somme := somme + o.prix_cents;
      end loop;
    end if;

  elsif p_type = 'bubble'
        and coalesce(p_nb_personnes, 0) > 0
        and p_total_cents % p_nb_personnes = 0 then
    -- Le Bubble Foot n'a pas de ligne de tarif en base (prix à la personne,
    -- dans le code) : pas de taux enregistrable, il reste à renseigner.
    lignes := jsonb_build_array(jsonb_build_object(
      'nature', 'bubble',
      'ref', null,
      'designation', 'Bubble Foot — par personne',
      'quantite', p_nb_personnes,
      'pu_cents', p_total_cents / p_nb_personnes,
      'total_cents', p_total_cents,
      'tva_pourcent', null
    ));
    somme := p_total_cents;
  end if;

  if jsonb_array_length(lignes) > 0 and somme = p_total_cents then
    return lignes;
  end if;

  /*
    LE DÉTAIL NE TOMBE PAS JUSTE : ON NE L'INVENTE PAS.

    Un prix changé entre la lecture du site et l'écriture, une formule
    supprimée, une règle de calcul qui aurait évolué d'un côté seulement : le
    détail ne correspond plus à ce que le client a payé. On garde alors UNE
    ligne au montant exact. Son taux n'est connu que si toutes les lignes
    calculées en portaient un, et le même.
  */
  select case when count(*) > 0 and count(x) = count(*) and count(distinct x) = 1
              then min(x) end
    into commun
    from (select (l ->> 'tva_pourcent')::smallint as x
            from jsonb_array_elements(lignes) as l) s;

  return jsonb_build_array(jsonb_build_object(
    'nature', 'reservation',
    'ref', null,
    'designation', case p_type
                     when 'anniversaire' then 'Anniversaire'
                     when 'bubble' then 'Bubble Foot'
                     else 'Réservation'
                   end,
    'quantite', 1,
    'pu_cents', p_total_cents,
    'total_cents', p_total_cents,
    'tva_pourcent', commun
  ));
end $$;

comment on function lignes_de_vente is
  'Détail facturé d''une réservation, aux prix et taux actuels des tables formules '
  'et options. Utilisée à l''écriture (déclencheur) et pour la reprise de l''existant.';

revoke all on function lignes_de_vente(type_activite, text, integer, text[], integer, integer)
  from public, anon, authenticated;

create or replace function figer_lignes_de_vente()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.lignes is null then
    new.lignes := lignes_de_vente(
      new.type, new.formule_id, new.nb_enfants, new.options_ids, new.nb_personnes, new.total_cents
    );
  end if;
  return new;
/*
  UNE PANNE DE LA COMPTABILITÉ NE BLOQUE JAMAIS UNE VENTE. Ce déclencheur
  s'exécute dans l'écriture de la réservation : s'il levait, le client verrait
  « réessayez » et le créneau serait perdu. Il laisse alors `lignes` vide —
  l'export traite ce cas comme une ligne unique au montant payé, et le signale.
*/
exception when others then
  raise warning 'Détail de vente non figé pour la réservation % : %', new.reference, sqlerrm;
  new.lignes := null;
  return new;
end $$;

comment on function figer_lignes_de_vente is
  'Fige reservations.lignes à l''insertion. Ne lève jamais : voir le corps.';

create or replace function proteger_lignes_de_vente()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  raise exception 'Le détail d''une vente ne se modifie pas après coup (réservation %).', old.reference;
end $$;

comment on function proteger_lignes_de_vente is
  'Une écriture comptable ne se réécrit pas : une correction passe par un '
  'remboursement, qui a sa propre date.';

-- Reprise de l'existant AVANT les déclencheurs, aux prix actuels — ceux en
-- vigueur lors de la seule vraie vente à ce jour. Une réservation dont le
-- détail ne retombe pas sur son total garde une ligne unique (voir plus haut).
--
-- `reservations_touch` est suspendu le temps de la reprise : il remettrait
-- `updated_at` à l'heure de la migration sur toutes les lignes, et effacerait
-- ainsi la seule date de dernière modification que la base connaisse.
--
-- UN SEUL BLOC, DONC TOUT OU RIEN : si la reprise échoue, le déclencheur n'a
-- jamais été suspendu. Et si le rôle qui applique la migration n'a pas le
-- droit de le suspendre (éditeur SQL), la reprise se fait quand même — seule
-- la date de dernière modification en pâtit, ce qui n'a aucune incidence.
do $$
declare
  suspendu boolean := true;
begin
  begin
    alter table reservations disable trigger reservations_touch;
  exception when others then
    suspendu := false;
    raise notice 'reservations_touch non suspendu (%) : updated_at sera mis à jour.', sqlerrm;
  end;

  update reservations
     set lignes = lignes_de_vente(type, formule_id, nb_enfants, options_ids, nb_personnes, total_cents)
   where lignes is null;

  if suspendu then
    alter table reservations enable trigger reservations_touch;
  end if;
end $$;

create or replace trigger reservations_figer_lignes
  before insert on reservations
  for each row
  execute function figer_lignes_de_vente();

create or replace trigger reservations_proteger_lignes
  before update of lignes on reservations
  for each row
  when (old.lignes is not null and new.lignes is distinct from old.lignes)
  execute function proteger_lignes_de_vente();

-- ── 3. Une ligne par remboursement ──────────────────────────────────────────

create table if not exists remboursements (
  id            bigint       generated always as identity primary key,
  paiement_id   uuid         not null references paiements on delete restrict,
  -- Négatif quand le cumul redescend : le webhook relit l'état réel chez
  -- Stripe, et un remboursement que Stripe a annulé le fait baisser.
  montant_cents integer      not null check (montant_cents <> 0),
  survenu_le    timestamptz  not null default now(),
  -- Vrai pour les lignes reconstituées par cette migration, dont la date est
  -- celle de la dernière modification du paiement, et non celle du mouvement.
  repris        boolean      not null default false
);

comment on table remboursements is
  'Journal des remboursements, une ligne par mouvement, écrit par le déclencheur '
  'paiements_tracer_remboursement à chaque variation de paiements.montant_rembourse_cents. '
  'C''est sa date qui place un remboursement dans une période comptable.';

create index if not exists remboursements_par_date on remboursements (survenu_le);
create index if not exists remboursements_par_paiement on remboursements (paiement_id);

alter table remboursements enable row level security;
alter table remboursements force row level security;
revoke all on remboursements from anon, authenticated;

-- Reprise : un remboursement passé n'a laissé que son cumul, et la date de
-- dernière modification du paiement — c'est la meilleure approximation, et la
-- colonne `repris` le dit. Faite AVANT toute autre écriture sur `paiements`,
-- qui remettrait cette date à l'heure de la migration.
insert into remboursements (paiement_id, montant_cents, survenu_le, repris)
select id, montant_rembourse_cents, updated_at, true
  from paiements
 where montant_rembourse_cents > 0
   and not exists (select 1 from remboursements r where r.paiement_id = paiements.id);

create or replace function tracer_remboursement()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  -- Dans la même transaction que le cumul : l'un ne peut pas exister sans
  -- l'autre, et l'export retombe toujours sur le montant réellement rendu.
  insert into remboursements (paiement_id, montant_cents)
  values (new.id, new.montant_rembourse_cents - old.montant_rembourse_cents);
  return null;
end $$;

create or replace trigger paiements_tracer_remboursement
  after update of montant_rembourse_cents on paiements
  for each row
  when (new.montant_rembourse_cents is distinct from old.montant_rembourse_cents)
  execute function tracer_remboursement();

-- ── 4. La date d'encaissement ───────────────────────────────────────────────

alter table paiements
  add column if not exists reussi_le timestamptz;

comment on column paiements.reussi_le is
  'Moment où le paiement a abouti — la date d''encaissement de la vente. Posé une '
  'fois par le déclencheur paiements_horodater_reussite, jamais réécrit.';

-- Reprise : un paiement encore « reussi » n'a bougé qu'à sa confirmation, donc
-- `updated_at` est l'heure du paiement. Un paiement remboursé depuis a vu
-- `updated_at` bouger : on retient alors l'ouverture de la page Stripe, à
-- quelques minutes près la même chose.
--
-- `paiements_touch` est suspendu pour la même raison que plus haut, et selon
-- le même principe : il remettrait `updated_at` à l'heure de la migration, et
-- `paiementRemboursable` s'en sert pour choisir le paiement à rembourser.
do $$
declare
  suspendu boolean := true;
begin
  begin
    alter table paiements disable trigger paiements_touch;
  exception when others then
    suspendu := false;
    raise notice 'paiements_touch non suspendu (%) : updated_at sera mis à jour.', sqlerrm;
  end;

  update paiements
     set reussi_le = case when statut = 'reussi' then updated_at else created_at end
   where reussi_le is null
     and statut in ('reussi', 'partiellement_rembourse', 'rembourse');

  if suspendu then
    alter table paiements enable trigger paiements_touch;
  end if;
end $$;

create index if not exists paiements_par_reussite on paiements (reussi_le)
  where reussi_le is not null;

create or replace function horodater_paiement_reussi()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.reussi_le is null
     and new.statut in ('reussi', 'partiellement_rembourse', 'rembourse') then
    new.reussi_le := now();
  end if;
  return new;
end $$;

create or replace trigger paiements_horodater_reussite
  before insert or update of statut on paiements
  for each row
  execute function horodater_paiement_reussi();
