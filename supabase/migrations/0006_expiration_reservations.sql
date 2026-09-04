-- ============================================================================
-- Expiration des réservations non confirmées
--
-- Une réservation « en_attente » occupe son créneau : c'est l'index unique
-- partiel qui l'impose, et c'est voulu — sinon deux clients pourraient réserver
-- le même créneau pendant que l'un paie. Mais sans mécanisme d'expiration, un
-- panier abandonné bloque le créneau pour toujours.
--
-- DÉLAI ACTUEL : 48 heures. Tant que le paiement en ligne n'existe pas, une
-- réservation est une demande que le complexe confirme ; il faut donc laisser à
-- Brahim le temps de répondre. Le jour où Stripe est branché, ce délai doit
-- descendre à quelques dizaines de minutes : c'est alors une fenêtre de
-- paiement, pas un délai de traitement.
-- ============================================================================

create or replace function expirer_reservations_en_attente(delai interval default interval '48 hours')
returns integer
language plpgsql
set search_path = pg_catalog, public
as $$
declare touchees integer;
begin
  update reservations
     set statut = 'expiree'
   where statut = 'en_attente'
     and created_at < now() - delai;
  get diagnostics touchees = row_count;
  return touchees;
end $$;

comment on function expirer_reservations_en_attente is
  'Libère les créneaux tenus par des réservations jamais confirmées. Appelée par '
  'le serveur avant de lire les disponibilités et avant d''écrire une réservation.';

revoke execute on function expirer_reservations_en_attente(interval) from anon, authenticated, public;
