-- ============================================================================
-- Une réservation expirait sans que personne ne le dise au client
--                                                        — 21 septembre 2026
-- ============================================================================
--
-- `expirer_reservations_en_attente` rendait un entier : le nombre de lignes
-- touchées. Personne ne le lisait, et surtout, il ne disait pas QUI avait été
-- expiré. Le client, lui, avait reçu « Nous avons bien reçu votre demande,
-- votre créneau est retenu » — puis plus rien, jamais.
--
-- DEUX SITUATIONS, TOUTES DEUX MUETTES.
--
-- Sans paiement en ligne, le délai est de 48 heures : la demande est un
-- rendez-vous téléphonique à prendre, et l'e-mail promet qu'on rappelle. Si
-- personne ne rappelle, la demande meurt en silence et le client attend un
-- appel qui ne viendra pas — le jour de l'anniversaire de son enfant.
--
-- Avec paiement, le délai est de 45 minutes : le client a quitté la page
-- Stripe sans payer, souvent sans le vouloir (onglet fermé, réseau perdu,
-- application bancaire qui ne s'ouvre pas). Il croit avoir réservé. Rien ne le
-- détrompe avant le jour dit.
--
-- La fonction retourne donc maintenant les lignes qu'elle vient d'expirer, et
-- l'appelant écrit au client.
--
-- UNE LIGNE N'EST RETOURNÉE QU'UNE FOIS, et c'est ce qui rend l'envoi sûr.
-- `update … returning` ne rend que les lignes que CET appel a fait basculer :
-- la clause `statut = 'en_attente'` les exclut de tout appel suivant, et deux
-- appels simultanés ne peuvent pas se partager la même ligne. Aucun garde-fou
-- applicatif n'est nécessaire pour éviter le double e-mail.
--
-- Le type de retour change, donc `create or replace` ne suffit pas : Postgres
-- refuse de changer la signature de sortie d'une fonction existante. On la
-- supprime d'abord — elle n'est appelée que par l'application, jamais depuis
-- une vue ou une contrainte.
--
-- LA GARDE SUR LES PAIEMENTS ABOUTIS EST CONSERVÉE MOT POUR MOT. C'est elle
-- qui empêche de rendre à la vente un créneau déjà payé (voir 0026), et c'est
-- la partie de cette fonction qu'il ne faut pas toucher.

drop function if exists expirer_reservations_en_attente(interval);

create function expirer_reservations_en_attente(delai interval default interval '48 hours')
returns table (
  id            uuid,
  reference     text,
  client_nom    text,
  client_email  text,
  type          type_activite,
  debut         timestamptz,
  fin           timestamptz
)
language plpgsql
set search_path = pg_catalog, public
as $$
-- Les colonnes de sortie s'appellent `id`, `reference`, `type`… comme les
-- colonnes des tables lues. Tout est qualifié ci-dessous, mais cette ligne
-- rend la règle explicite plutôt que dépendante de la vigilance : un nom nu
-- désigne la colonne, jamais la variable.
#variable_conflict use_column
begin
  return query
  with expirees as (
    update reservations r
       set statut = 'expiree'
     where r.statut = 'en_attente'
       and r.created_at < now() - delai
       and not exists (
         select 1
           from paiements p
          where p.reservation_id = r.id
            and p.statut in ('reussi', 'partiellement_rembourse', 'rembourse')
       )
    returning r.id, r.reference, r.client_nom, r.client_email, r.type, r.creneau_id
  )
  -- `join` et non `left join` : `creneau_id` est `not null` et référence
  -- `creneaux` en `on delete restrict`. Le créneau existe forcément, et un
  -- `left join` inviterait à écrire un e-mail sans date.
  select e.id, e.reference, e.client_nom, e.client_email, e.type, c.debut, c.fin
    from expirees e
    join creneaux c on c.id = e.creneau_id;
end $$;

comment on function expirer_reservations_en_attente is
  'Libère les créneaux tenus par une réservation jamais payée et RETOURNE les '
  'lignes expirées, pour que l''appelant prévienne le client — sans quoi une '
  'demande meurt en silence après qu''on lui a écrit « votre créneau est '
  'retenu ». Chaque ligne n''est retournée qu''une fois : `update … returning` '
  'ne rend que ce que cet appel a fait basculer. NE TOUCHE JAMAIS une '
  'réservation dont un paiement a abouti — entre l''écriture du paiement et '
  'celle de la réservation, elle est encore « en_attente » alors que l''argent '
  'est encaissé. Un paiement « en_cours » expire normalement : c''est un panier '
  'abandonné, et la session Stripe est morte depuis la 30e minute.';

revoke execute on function expirer_reservations_en_attente(interval) from anon, authenticated, public;
