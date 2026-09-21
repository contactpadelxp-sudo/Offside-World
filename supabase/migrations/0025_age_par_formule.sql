-- ============================================================================
-- L'âge accepté cesse d'être écrit dans la base — 21 septembre 2026
-- ============================================================================

-- ── 1. La contrainte refusait ce que le site vendait ────────────────────────
--
-- `enfant_age` était borné à 1..17. Or Brahim a ouvert les anniversaires aux
-- adultes le 17 septembre — « à partir de 4 ans et pas de limite vu que bubble
-- possible pour adulte » —, le tunnel propose depuis lors 4 à 60 ans et le
-- serveur accepte jusqu'à 99.
--
-- Conséquence, vérifiée : TOUTE réservation d'anniversaire pour 18 ans ou plus
-- échouait. Le client remplissait le tunnel entier, cliquait, et tombait sur
-- une erreur brute — une violation de CHECK ne ressemble à rien pour lui, et
-- `enregistrerReservation` ne la traduit pas, elle ne reconnaît que le créneau
-- déjà pris.
--
-- La nouvelle borne est un GARDE-FOU, pas une règle commerciale : 1 à 120 ans.
-- La vraie règle vit désormais sur la formule, ci-dessous, là où l'exploitant
-- peut la changer sans qu'on redéploie. Une contrainte de base qui porte une
-- décision commerciale finit toujours par la contredire.

alter table reservations drop constraint if exists reservations_enfant_age_check;
alter table reservations
  add constraint reservations_enfant_age_check
  check (enfant_age is null or (enfant_age >= 1 and enfant_age <= 120));

comment on column reservations.enfant_age is
  'Âge de la personne fêtée — pas nécessairement un enfant depuis le '
  '17 septembre 2026. La colonne garde son nom : la renommer casserait les '
  'réservations existantes pour une question de vocabulaire. C''est ce que le '
  'client LIT qui a changé.';

-- ── 2. L'âge maximum devient un réglage de formule ──────────────────────────
--
-- POURQUOI SUR LA FORMULE ET NON DANS LE CODE. Les identifiants de formules
-- viennent de cette table : Brahim les renomme, en désactive et en ajoute
-- depuis /admin/tarifs. Une correspondance « kick-off → 17 ans, bubble → sans
-- limite » écrite dans le code mentirait au premier changement — c'est la
-- faute déjà corrigée trois fois sur ce projet, sur la carte du hero, sur les
-- onglets de formules et sur leur description.
--
-- `null` VEUT DIRE « PAS DE LIMITE », et c'est la valeur des deux formules
-- aujourd'hui. Brahim a dit « pas de limite » sans distinguer : on ne ferme
-- rien de notre propre chef. Le champ existe pour qu'il puisse fermer Kick-Off
-- aux adultes d'un réglage s'il le décide, pas parce qu'on l'a décidé pour lui.
--
-- Il n'y a pas d'`age_min` correspondant : le minimum de 4 ans vaut pour tout
-- le complexe, il vit dans `data/reglement.ts` avec les autres règles
-- communes. Une colonne par formule pour une valeur qui ne varie pas serait
-- trois endroits à tenir d'accord au lieu d'un.

alter table formules
  add column if not exists age_max smallint;

alter table formules drop constraint if exists formules_age_max_plausible;
alter table formules
  add constraint formules_age_max_plausible
  check (age_max is null or (age_max >= 1 and age_max <= 120));

comment on column formules.age_max is
  'Âge maximum de la personne fêtée pour cette formule. NULL = pas de limite, '
  'ce qui est le cas des deux formules au 21 septembre 2026. Réglable depuis '
  'l''écran Tarifs du back-office.';
