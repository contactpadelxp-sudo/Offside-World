-- ============================================================================
-- Créer UN créneau, à la main
--
-- Il n'existait que la génération par période, qui applique des règles écrites
-- dans le SQL (migration 0014) — celles posées faute de connaître les vrais
-- horaires du complexe. L'exploitant ne pouvait donc pas saisir SON planning :
-- il pouvait seulement régénérer le nôtre.
--
-- POURQUOI PASSER PAR LE SQL PLUTÔT QUE PAR UN `insert` DEPUIS LE SERVEUR.
--
-- L'horaire est saisi en heure locale — « le 11 octobre à 15:30 » veut dire
-- 15:30 à Gembloux. La conversion `(timestamp) at time zone 'Europe/Brussels'`
-- est exactement celle qu'emploie la génération automatique. Les deux chemins
-- produisent donc le même instant pour le même horaire affiché, y compris la
-- nuit des changements d'heure. Le refaire en JavaScript aurait créé une
-- deuxième vérité, et les deux n'auraient divergé que deux fois par an —
-- c'est-à-dire précisément quand on prépare la saison suivante.
--
-- La contrainte d'exclusion sur le chevauchement s'applique comme partout
-- ailleurs : deux créneaux ouverts ne peuvent pas se recouvrir dans un même
-- espace, et l'erreur remonte telle quelle jusqu'à l'écran.
-- ============================================================================

create or replace function creer_creneau(
  p_espace text,
  p_type type_activite,
  p_jour date,
  p_heure text,
  p_duree_minutes integer
) returns uuid
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_debut timestamptz;
  v_fin   timestamptz;
  v_id    uuid;
begin
  v_debut := ((p_jour + p_heure::time) at time zone 'Europe/Brussels');
  v_fin   := v_debut + make_interval(mins => p_duree_minutes);

  insert into creneaux (espace_id, type, debut, fin)
  values (p_espace, p_type, v_debut, v_fin)
  returning id into v_id;

  return v_id;
end $$;

comment on function creer_creneau is
  'Crée un créneau unique à partir d''un jour et d''une heure locale de Bruxelles. '
  'Même conversion que la génération automatique, pour que les deux chemins ne '
  'divergent pas aux changements d''heure.';

revoke execute on function creer_creneau(text, type_activite, date, text, integer)
  from anon, authenticated, public;
