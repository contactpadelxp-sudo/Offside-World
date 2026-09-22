-- ============================================================================
-- La note interne échappait à l'anonymisation — 22 septembre 2026
-- ============================================================================
--
-- `anonymiser_reservations_anciennes` remet à zéro le nom, l'e-mail, le
-- téléphone, le prénom et l'âge de la personne fêtée, les allergies et les
-- remarques. Pas `note_interne`. La fonction jumelle pour les devis, écrite
-- dans la même migration 0024, la remet bien à `null` : c'est un oubli, pas un
-- arbitrage.
--
-- CE QUE CE CHAMP CONTIENT VRAIMENT. Aucun formulaire du site ne demande les
-- allergies — le tunnel n'a pas ce champ. Elles arrivent par téléphone, et
-- l'exploitant les écrit là. La note interne est donc, en pratique, le champ
-- le plus susceptible de porter une DONNÉE DE SANTÉ concernant un MINEUR :
-- « allergique aux arachides, prévenir la mère ». Le seul qui y échappait.
--
-- La politique de confidentialité promet qu'à 13 mois « le nom, l'e-mail, le
-- téléphone, le prénom et l'âge de la personne fêtée, les allergies signalées
-- et les remarques sont effacés automatiquement ». Elle ne mentionne pas la
-- note interne — ni comme effacée, ni comme conservée. Elle était donc gardée
-- sans limite et sans que personne ne l'ait décidé.

create or replace function anonymiser_reservations_anciennes(delai interval default interval '13 months')
returns integer
language plpgsql
set search_path = pg_catalog, public
as $$
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
    -- L'oubli que cette migration répare.
    note_interne     = null,
    newsletter       = false,
    newsletter_le    = null,
    anonymisee_le    = now()
  where anonymisee_le is null
    and created_at < now() - delai;
  get diagnostics touchees = row_count;
  return touchees;
end $$;

comment on function anonymiser_reservations_anciennes is
  'Efface les données personnelles d''une réservation après le délai légal. '
  'Efface AUSSI la note interne : aucun formulaire ne collecte les allergies, '
  'elles arrivent par téléphone et sont écrites là — c''est donc le champ le '
  'plus susceptible de porter une donnée de santé de mineur, et il échappait à '
  'l''effacement depuis l''origine. Le montant, la date et la prestation '
  'subsistent pour la comptabilité.';
