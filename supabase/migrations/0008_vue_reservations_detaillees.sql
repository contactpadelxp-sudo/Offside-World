-- ============================================================================
-- Vue de travail du back-office
--
-- Le résumé du jour a besoin, sur une seule ligne, de la réservation, de son
-- créneau et de son espace. Faire la jointure ici plutôt que dans le code
-- applicatif garantit qu'il n'existe qu'une définition de « une réservation
-- avec son horaire », et permet à PostgreSQL de trier par heure de début —
-- ce qu'un tri sur ressource imbriquée ne sait pas faire côté API.
--
-- security_invoker : la vue s'exécute avec les droits de l'appelant, donc RLS
-- des tables sous-jacentes s'applique. Elle n'ouvre aucun accès aux clés
-- publiques, alors même qu'elle expose des données personnelles.
-- ============================================================================

create or replace view reservations_detaillees
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
