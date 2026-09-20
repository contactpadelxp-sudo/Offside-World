# Les migrations de ce dépôt

**Ce dossier est l'état de référence du schéma. Le registre de Supabase ne
l'est pas.**

Cette phrase a coûté un faux diagnostic le 19 septembre 2026 — « le registre ne
liste pas tout le dépôt, une restauration repartirait d'un schéma incomplet ».
C'était l'inverse : le dépôt est complet, le registre est partiel, et c'est
normal.

## Pourquoi les deux divergent

Il n'y a pas de `supabase/config.toml` : le CLI Supabase n'est pas en place, et
`supabase db push` n'a jamais été le mode de travail. Les fichiers portent
d'ailleurs une numérotation séquentielle — `0001_`, `0002_` — et non
l'horodatage `<AAAAMMJJhhmmss>_` que le CLI exige pour les reconnaître.

Les migrations sont appliquées une par une, à la main. Certaines sont passées
par `apply_migration`, qui inscrit au passage une ligne dans
`supabase_migrations.schema_migrations` ; d'autres par une simple exécution
SQL, qui n'inscrit rien. Ce registre est donc un **sous-produit de l'outil
employé ce jour-là**, pas un journal.

Il contient même deux entrées sans fichier ici —
`restreindre_execution_purge_audience` et `generation_creneaux_parlante_v2` :
deux correctifs de suivi, depuis repliés dans `0011` et `0014`. Le dépôt porte
la version finale, le registre garde la trace du chemin.

## Ce qui fait foi, et comment le vérifier

Les fichiers de ce dossier, dans l'ordre de leur numéro. Vérifié le 20
septembre 2026 : chaque objet des migrations absentes du registre existe bien
en base — table `reservations` (0001), `formules` (0002), bucket `blog` (0013),
fonction `creer_creneau` (0019), les Fun zones (0020), table `quotas` et
fonction `consommer_quota` (0021), `search_path` sur `articles_touche` (0022).

## Restaurer sur une base neuve

Rejouer les fichiers dans l'ordre des numéros. Ils sont écrits pour cela :
`create table if not exists`, `create or replace function`, `on conflict do
update`. Le registre n'entre pas en jeu.

## Ajouter une migration

Prendre le numéro suivant et le format `NNNN_objet_de_la_migration.sql`.
Expliquer en tête **ce qui n'allait pas**, pas ce que fait le SQL — le SQL est
juste en dessous. Passer ensuite par `apply_migration` plutôt que par une
exécution SQL directe : c'est sans effet sur le schéma, mais cela laisse une
ligne datée de plus dans le registre, et une trace vaut mieux qu'aucune.
