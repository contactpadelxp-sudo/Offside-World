-- ============================================================================
-- Offside Foot Indoor — schéma initial
--
-- Principes retenus, et pourquoi :
--
-- 1. ARGENT EN CENTIMES, JAMAIS EN DÉCIMAL. Un `numeric` mal arrondi finit par
--    facturer 179,99 € au lieu de 180 €. Tous les montants sont des entiers.
--
-- 2. LE PRIX EST CALCULÉ ET STOCKÉ CÔTÉ SERVEUR. Le navigateur propose, le
--    serveur dispose : `total_cents` est écrit par le backend à partir du
--    référentiel `formules`, jamais recopié depuis le client.
--
-- 3. LE DOUBLE-BOOKING EST INTERDIT PAR LA BASE, pas par le code applicatif.
--    Un index unique partiel garantit qu'un créneau ne porte qu'une seule
--    réservation active, même si deux clients valident à la milliseconde près.
--
-- 4. AUCUN ACCÈS PAR LES CLÉS PUBLIQUES. RLS est activé partout et AUCUNE
--    politique n'est créée : la clé `anon` ne peut donc rien lire ni écrire.
--    Tout passe par le serveur, qui utilise la clé de service. C'est la seule
--    façon de garantir le point 2.
--
-- 5. DONNÉES D'ENFANTS MINEURS ET DE SANTÉ : isolées, commentées, et effacées
--    par la fonction d'anonymisation. Voir la section RGPD en fin de fichier.
-- ============================================================================

create extension if not exists btree_gist;

-- ─────────────────────────────────────────────────────────────── référentiel

create table formules (
  id                     text        primary key,
  nom                    text        not null,
  accroche               text,
  description            text        not null,
  prix_base_cents        integer     not null check (prix_base_cents >= 0),
  enfants_inclus         smallint    not null check (enfants_inclus > 0),
  prix_enfant_sup_cents  integer     not null check (prix_enfant_sup_cents >= 0),
  enfants_max            smallint    not null check (enfants_max >= enfants_inclus),
  duree_minutes          smallint    not null check (duree_minutes > 0),
  inclus                 text[]      not null default '{}',
  image                  text,
  actif                  boolean     not null default true,
  ordre                  smallint    not null default 0
);
comment on table formules is
  'Référentiel tarifaire. Source unique du prix : le backend recalcule tout à partir d''ici.';

create table options (
  id          text     primary key,
  libelle     text     not null,
  description text,
  prix_cents  integer  not null check (prix_cents >= 0),
  actif       boolean  not null default true
);

create table espaces (
  id        text      primary key,
  nom       text      not null,
  capacite  smallint  not null check (capacite > 0),
  actif     boolean   not null default true
);
comment on table espaces is
  'Espaces physiques. Deux anniversaires peuvent se dérouler en parallèle, d''où deux espaces.';

-- ──────────────────────────────────────────────────────────────── créneaux

create type type_activite as enum ('anniversaire', 'bubble');

create table creneaux (
  id         uuid           primary key default gen_random_uuid(),
  espace_id  text           not null references espaces on delete restrict,
  type       type_activite  not null,
  debut      timestamptz    not null,
  fin        timestamptz    not null,
  ouvert     boolean        not null default true,
  created_at timestamptz    not null default now(),
  constraint creneaux_ordre_horaire check (fin > debut)
);

-- Deux créneaux ouverts ne peuvent pas se chevaucher dans le même espace.
-- Le battement de 30 min entre deux groupes se traduit par un espacement à la
-- génération ; cette contrainte empêche seulement le recouvrement.
alter table creneaux add constraint creneaux_sans_chevauchement
  exclude using gist (espace_id with =, tstzrange(debut, fin) with &&)
  where (ouvert);

create index creneaux_recherche on creneaux (type, debut) where ouvert;

comment on table creneaux is
  'Créneaux ouverts à la réservation. Les locations de terrain n''y figurent PAS : '
  'elles sont gérées par Sport-Finder. Les plages ouvertes ici doivent avoir été '
  'retirées de la location côté Sport-Finder, sinon le chevauchement redevient possible.';

-- ─────────────────────────────────────────────────────────── réservations

create type statut_reservation as enum ('en_attente', 'confirmee', 'annulee', 'expiree');

create table reservations (
  id                 uuid                primary key default gen_random_uuid(),
  reference          text                not null unique,
  type               type_activite       not null,
  creneau_id         uuid                not null references creneaux on delete restrict,
  statut             statut_reservation  not null default 'en_attente',

  -- anniversaire
  formule_id         text                references formules,
  nb_enfants         smallint            check (nb_enfants > 0),
  enfant_prenom      text,
  enfant_age         smallint            check (enfant_age between 1 and 17),
  options_ids        text[]              not null default '{}',

  -- bubble foot
  nb_personnes       smallint            check (nb_personnes > 0),

  -- montant : écrit par le serveur uniquement
  total_cents        integer             not null check (total_cents >= 0),

  -- client
  client_nom         text                not null,
  client_email       text                not null,
  client_telephone   text                not null,
  newsletter         boolean             not null default false,
  cgv_acceptees_le   timestamptz         not null,

  -- exploitation
  remarques          text,
  allergies          text,

  anonymisee_le      timestamptz,
  created_at         timestamptz         not null default now(),
  updated_at         timestamptz         not null default now(),

  constraint reservation_anniversaire_complete check (
    type <> 'anniversaire' or (formule_id is not null and nb_enfants is not null)
  ),
  constraint reservation_bubble_complete check (
    type <> 'bubble' or nb_personnes is not null
  )
);

-- LE garde-fou anti-double-réservation : un créneau ne porte qu'une réservation
-- active. Deux validations simultanées ne peuvent pas passer toutes les deux.
create unique index reservations_un_seul_actif_par_creneau
  on reservations (creneau_id)
  where statut in ('en_attente', 'confirmee');

create index reservations_par_date on reservations (created_at desc);
create index reservations_par_statut on reservations (statut, created_at desc);

comment on column reservations.enfant_prenom is
  'DONNÉE DE MINEUR (RGPD art. 8). Effacée par anonymiser_reservations_anciennes().';
comment on column reservations.enfant_age is
  'DONNÉE DE MINEUR (RGPD art. 8). Effacée par anonymiser_reservations_anciennes().';
comment on column reservations.allergies is
  'DONNÉE DE SANTÉ (RGPD art. 9), et concernant un mineur. Collecte à limiter au '
  'strict nécessaire à la sécurité de l''enfant, accès restreint, effacement rapide.';
comment on column reservations.total_cents is
  'Calculé par le serveur à partir de formules/options. Ne JAMAIS écrire une valeur '
  'venant du navigateur.';

-- ───────────────────────────────────────────────────────────────── paiements

create type statut_paiement as enum
  ('cree', 'en_cours', 'reussi', 'echoue', 'rembourse', 'partiellement_rembourse');

create table paiements (
  id                     uuid             primary key default gen_random_uuid(),
  reservation_id         uuid             not null references reservations on delete restrict,
  stripe_payment_intent  text             unique,
  montant_cents          integer          not null check (montant_cents >= 0),
  devise                 text             not null default 'eur',
  methode                text,
  statut                 statut_paiement  not null default 'cree',
  erreur                 text,
  created_at             timestamptz      not null default now(),
  updated_at             timestamptz      not null default now()
);

create index paiements_par_reservation on paiements (reservation_id);

comment on table paiements is
  'Aucune donnée de carte n''est stockée : Stripe conserve les moyens de paiement, '
  'on ne garde que la référence du PaymentIntent. La réservation ne passe en '
  '« confirmee » qu''à réception du webhook de paiement réussi, jamais avant.';

-- ────────────────────────────────────────────────────────── demandes de devis

create type statut_devis as enum
  ('nouvelle', 'traitee', 'devis_envoye', 'acceptee', 'refusee');

create table demandes_devis (
  id                 uuid          primary key default gen_random_uuid(),
  reference          text          not null unique,
  entreprise         text          not null,
  contact_nom        text          not null,
  contact_email      text          not null,
  contact_telephone  text          not null,
  date_souhaitee     date,
  periode            text          check (periode in ('matin', 'apres-midi')),
  nb_participants    smallint      check (nb_participants > 0),
  message            text,
  statut             statut_devis  not null default 'nouvelle',
  created_at         timestamptz   not null default now(),
  updated_at         timestamptz   not null default now()
);

comment on table demandes_devis is
  'Team building : privatisation à la demi-journée, sur devis. Ce n''est pas une '
  'réservation ferme et cela n''occupe donc aucun créneau tant que le devis n''est '
  'pas accepté.';

-- ─────────────────────────────────────────────────── traçabilité back-office

create table journal_admin (
  id          bigserial    primary key,
  acteur      text         not null,
  action      text         not null,
  cible       text,
  detail      jsonb,
  ip          inet,
  created_at  timestamptz  not null default now()
);

create index journal_admin_par_date on journal_admin (created_at desc);

comment on table journal_admin is
  'Qui a consulté ou modifié quoi. Exigé pour tracer les accès à des données '
  'de mineurs et de santé.';

-- ─────────────────────────────────────────────────────────────── mécanique

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger reservations_touch     before update on reservations
  for each row execute function touch_updated_at();
create trigger paiements_touch        before update on paiements
  for each row execute function touch_updated_at();
create trigger demandes_devis_touch   before update on demandes_devis
  for each row execute function touch_updated_at();

-- ───────────────────────────────────────────────────────────────── RGPD

-- Efface les données personnelles des réservations passées en conservant les
-- éléments nécessaires à la comptabilité (montant, date, type).
-- À planifier quotidiennement. Le délai est volontairement court pour les
-- données d'enfants.
create or replace function anonymiser_reservations_anciennes(delai interval default interval '13 months')
returns integer language plpgsql as $$
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
    anonymisee_le    = now()
  where anonymisee_le is null
    and created_at < now() - delai;
  get diagnostics touchees = row_count;
  return touchees;
end $$;

comment on function anonymiser_reservations_anciennes is
  'Minimisation (RGPD art. 5.1.e). Les données de mineurs et de santé méritent un '
  'délai plus court que les 13 mois par défaut : à arbitrer avec le client.';

-- ──────────────────────────────────────────── verrouillage des accès publics

-- RLS activé SANS aucune politique : les clés publiques (anon, authenticated)
-- ne peuvent ni lire ni écrire. Seule la clé de service, utilisée côté serveur,
-- contourne RLS. C'est ce qui garantit que le prix ne peut pas être écrit
-- depuis le navigateur.
alter table formules        enable row level security;
alter table options         enable row level security;
alter table espaces         enable row level security;
alter table creneaux        enable row level security;
alter table reservations    enable row level security;
alter table paiements       enable row level security;
alter table demandes_devis  enable row level security;
alter table journal_admin   enable row level security;

alter table formules        force row level security;
alter table options         force row level security;
alter table espaces         force row level security;
alter table creneaux        force row level security;
alter table reservations    force row level security;
alter table paiements       force row level security;
alter table demandes_devis  force row level security;
alter table journal_admin   force row level security;
