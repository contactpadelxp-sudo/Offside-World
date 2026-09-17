-- ============================================================================
-- `articles_touche` : fixer son `search_path` comme toutes les autres
--
-- Relevé le 17 septembre 2026 par le linter de sécurité Supabase
-- (`function_search_path_mutable`). C'était la SEULE fonction du projet sans
-- `search_path` explicite : toutes les autres portent
-- `set search_path = pg_catalog, public`.
--
-- Une fonction qui laisse ce paramètre mutable résout ses noms non qualifiés
-- selon le chemin de l'appelant. Le risque est faible ici — seule la clé de
-- service se connecte, et le corps de cette fonction n'appelle que `now()` —
-- mais l'incohérence était réelle, et c'est exactement le genre d'exception
-- qu'on oublie d'examiner quand le corps de la fonction grossit.
--
-- Après application, le linter ne remonte plus aucun avertissement : ne
-- restent que douze notices « RLS activée sans politique », qui sont le choix
-- délibéré du projet (voir la fin de la migration 0001) — RLS activée ET
-- forcée, aucune politique, donc rien ne lit ni n'écrit hors de la clé de
-- service.
-- ============================================================================

create or replace function public.articles_touche()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.modifie_le = now();
  return new;
end $$;

comment on function public.articles_touche is
  'Horodate la modification d''un article. `search_path` fixé comme toutes les '
  'autres fonctions du projet.';
