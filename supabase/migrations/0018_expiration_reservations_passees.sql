-- ============================================================================
-- Expiration des réservations dont la DATE D'ACTIVITÉ est passée
--
-- Il existait déjà `expirer_reservations_en_attente`, qui compte à partir de
-- `created_at` : c'est le panier abandonné, celui qu'il faut libérer vite pour
-- rendre le créneau à la vente.
--
-- Ce n'est pas le même cas. Ici la date de l'activité elle-même est passée, et
-- la réservation est restée « en attente ». Elle se présentait au back-office,
-- dans l'onglet « Passées », avec un bouton « Confirmer » — qui aurait envoyé
-- au client « votre réservation du 3 septembre est confirmée » le 15. Un état
-- qu'aucune action ne pouvait plus faire aboutir, et une seule issue possible
-- s'il avait été touché : un e-mail absurde.
--
-- CE QUI N'EST JAMAIS EXPIRÉ : une réservation dont un paiement a RÉUSSI.
--
-- C'est la précaution qui compte. Si de l'argent est arrivé sans que la
-- réservation ait basculé en « confirmée », c'est une anomalie à traiter — le
-- client a payé, le créneau est passé, il faut le rembourser ou s'expliquer.
-- La classer « expirée » la ferait disparaître dans l'onglet des annulées, avec
-- son paiement. On la laisse donc visible, exprès.
--
-- Aucun e-mail n'est envoyé : la fonction ne touche que la base. Prévenir
-- quelqu'un qu'une demande jamais confirmée a expiré, des jours après la date,
-- ne lui apprend rien qu'il ne sache déjà.
-- ============================================================================

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
     and r.debut < now()
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
  'Classe « expirée » toute réservation jamais confirmée dont la date est passée, '
  'sauf si un paiement a abouti — ce cas-là doit rester visible. N''envoie aucun e-mail.';

revoke execute on function expirer_reservations_passees() from anon, authenticated, public;
