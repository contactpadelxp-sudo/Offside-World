-- ============================================================================
-- La purge oubliait l'horodatage du consentement santé — 22 septembre 2026
-- ============================================================================
--
-- La migration 0030 a ajouté `allergies_consenties_le` : l'horodatage du
-- consentement explicite exigé par l'article 9.2.a pour traiter une allergie.
-- `anonymiser_reservations_anciennes` remettait bien `allergies` à `null`,
-- mais laissait cet horodatage derrière lui.
--
-- CE QUE ÇA LAISSAIT. Une ligne anonymisée portant encore la trace datée
-- qu'une personne avait, un jour, consenti à nous confier une donnée de santé.
-- La donnée était partie, la preuve qu'elle avait existé restait. Un
-- consentement ne se conserve que pour prouver le traitement qu'il autorise
-- (art. 7.1) ; une fois ce traitement effacé, l'horodatage n'a plus de
-- finalité, et le garder contredit l'article 5.1.c.
--
-- La contrainte `allergies_consenties` de la migration 0030 dit
-- « allergies is null or allergies_consenties_le is not null » : effacer les
-- deux ensemble la respecte, effacer l'horodatage seul l'aurait violée. C'est
-- bien dans cet ordre de dépendance que les deux colonnes vont de pair.
--
-- LE COMMENTAIRE DE LA FONCTION ÉTAIT DEVENU FAUX. Écrit en 0029, il affirmait
-- qu'« aucun formulaire ne collecte les allergies ». C'était vrai ce jour-là.
-- Depuis, le tunnel anniversaire a son champ, derrière sa propre case de
-- consentement. La raison d'effacer `note_interne` reste entière — c'est
-- toujours là que les appels téléphoniques atterrissent — mais elle ne peut
-- plus se justifier par l'absence d'un champ qui existe.

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
    -- Les deux colonnes s'effacent ensemble : la donnée de santé et la preuve
    -- datée du consentement qui l'autorisait.
    allergies_consenties_le = null,
    remarques        = null,
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
  'Efface AUSSI la note interne, où atterrissent les informations dictées par '
  'téléphone : c''est le champ le plus susceptible de porter une donnée de '
  'santé de mineur, et il échappait à l''effacement depuis l''origine. Efface '
  'l''allergie signalée ET l''horodatage du consentement qui l''autorisait, '
  'les deux ensemble. Le montant, la date et la prestation subsistent pour la '
  'comptabilité. Toute colonne ajoutée ici doit l''être aussi dans '
  'effacerDonneesReservation (src/lib/actions/admin.ts), qui efface la même '
  'liste à la demande.';
