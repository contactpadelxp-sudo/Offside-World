-- btree_gist était installé dans `public`, ce qui expose ses 264 objets
-- (opérateurs, classes d'opérateurs) dans le schéma applicatif et, sur Supabase,
-- dans l'API REST. On le déplace dans le schéma `extensions` prévu pour cela.
--
-- Les contraintes référencent les classes d'opérateurs par OID et non par nom :
-- le déplacement ne casse donc pas la contrainte d'exclusion sur `creneaux`.
-- Vérifié après application : un chevauchement est toujours rejeté.
alter extension btree_gist set schema extensions;
