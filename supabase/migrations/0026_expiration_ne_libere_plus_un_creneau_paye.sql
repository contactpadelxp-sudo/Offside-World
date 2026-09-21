-- ============================================================================
-- Les deux expirations étaient fausses, chacune à sa façon — 21 septembre 2026
--
-- Trouvées par un audit à plusieurs agents de la mécanique de réservation, puis
-- vérifiées une à une jusqu'à l'exécution.
-- ============================================================================

-- ── 1. L'expiration à 45 minutes libérait un créneau DÉJÀ PAYÉ ──────────────
--
-- Son corps était, en entier :
--
--     update reservations set statut = 'expiree'
--      where statut = 'en_attente' and created_at < now() - delai;
--
-- Aucune condition sur la table `paiements`. Or `confirmerPaiement` procède en
-- DEUX écritures distinctes : la ligne de paiement passe à « reussi », PUIS la
-- réservation passe à « confirmee ». Entre les deux, la réservation est encore
-- « en_attente » alors que l'argent est encaissé.
--
-- Si l'expiration passe dans cet intervalle — ou si la seconde écriture échoue,
-- ou si un paiement Bancontact se dénoue après la 45e minute —, le créneau
-- retourne à la vente avec l'argent encaissé. Un second client l'achète. Le
-- premier a payé, n'a plus de place, et n'est prévenu par rien.
--
-- C'est exactement ce que le client redoutait en demandant « qu'aucune résa ne
-- tombe en même temps ou ne fonctionne pas ».
--
-- LA GARDE NE PORTE QUE SUR LES PAIEMENTS ABOUTIS. Un paiement « en_cours »
-- doit continuer d'expirer : c'est le client parti de la page Stripe sans
-- payer, et la session Stripe est morte depuis la 30e minute. L'exclure ici
-- retiendrait le créneau pour toujours.
--
-- Sa jumelle `expirer_reservations_passees` portait déjà cette garde. Les deux
-- disaient donc des choses différentes sur le même sujet, et c'est la plus
-- exposée qui avait tort.

create or replace function expirer_reservations_en_attente(delai interval default interval '48 hours')
returns integer
language plpgsql
set search_path = pg_catalog, public
as $$
declare touchees integer;
begin
  update reservations r
     set statut = 'expiree'
   where r.statut = 'en_attente'
     and r.created_at < now() - delai
     and not exists (
       select 1
         from paiements p
        where p.reservation_id = r.id
          and p.statut in ('reussi', 'partiellement_rembourse', 'rembourse')
     );
  get diagnostics touchees = row_count;
  return touchees;
end $$;

comment on function expirer_reservations_en_attente is
  'Libère les créneaux tenus par une réservation jamais payée. NE TOUCHE JAMAIS '
  'une réservation dont un paiement a abouti : entre l''écriture du paiement et '
  'celle de la réservation, elle est encore « en_attente » alors que l''argent '
  'est encaissé. Un paiement « en_cours » expire normalement — c''est un panier '
  'abandonné, et la session Stripe est morte depuis la 30e minute.';

-- ── 2. L'expiration des créneaux passés n'a JAMAIS tourné ───────────────────
--
-- Elle interrogeait `r.debut`, colonne qui n'existe pas sur `reservations` :
-- l'heure de début vit sur `creneaux`. Chaque appel levait donc
-- « 42703: column r.debut does not exist », et l'appelant écrivait l'erreur
-- dans une console que personne ne lit avant de continuer.
--
-- Vérifié en l'appelant le 21 septembre 2026 : l'erreur tombe toujours. La
-- fonction n'a donc pas nettoyé une seule ligne depuis sa création le
-- 15 septembre, et rien ne pouvait le signaler.
--
-- La garde sur les paiements, elle, était correcte dès l'origine — elle est
-- conservée telle quelle.

create or replace function expirer_reservations_passees()
returns integer
language plpgsql
set search_path = pg_catalog, public
as $$
declare touchees integer;
begin
  update reservations r
     set statut = 'expiree'
   where r.statut = 'en_attente'
     and exists (
       select 1
         from creneaux c
        where c.id = r.creneau_id
          and c.debut < now()
     )
     and not exists (
       select 1
         from paiements p
        where p.reservation_id = r.id
          and p.statut in ('reussi', 'partiellement_rembourse', 'rembourse')
     );
  get diagnostics touchees = row_count;
  return touchees;
end $$;

comment on function expirer_reservations_passees is
  'Marque « expirée » toute réservation jamais confirmée dont le créneau est '
  'passé. L''heure de début vient de `creneaux` — `reservations` n''a pas de '
  'colonne `debut`, et l''avoir interrogée a rendu cette fonction inopérante du '
  '15 au 21 septembre 2026 sans que rien ne le signale. Ne touche jamais une '
  'réservation payée.';
