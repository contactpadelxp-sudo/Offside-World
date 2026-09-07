-- ============================================================================
-- Stockage des images du blog
--
-- SANS CE SEAU, LE BLOG NE TIENT PAS SA PROMESSE. Brahim devrait saisir le
-- chemin d'un fichier déjà présent dans le dépôt : donc demander à un
-- développeur, et attendre un redéploiement, pour chaque photo. Un article de
-- complexe sportif sans photo n'a pas d'intérêt, et « il publie lui-même »
-- deviendrait faux.
--
-- Le seau est PUBLIC en lecture : ces images illustrent des articles destinés
-- à être vus, et une adresse signée à durée limitée casserait le partage sur
-- les réseaux sociaux, où l'aperçu est rechargé longtemps après la publication.
--
-- L'écriture, elle, n'est jamais publique : le téléversement passe par une
-- Server Action qui vérifie la session du back-office, et utilise la clé de
-- service. Les politiques RLS de `storage.objects` restent donc absentes, comme
-- pour les autres tables — rien n'est écrit par une clé publique.
--
-- Les bornes sont posées ici ET dans la Server Action. Volontairement : le
-- seau protège la base contre ce qui contournerait l'application, l'action
-- donne un message clair à celui qui dépose un fichier trop lourd.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog',
  'blog',
  true,
  5242880, -- 5 Mo. Les images sont réduites côté navigateur avant l'envoi
           -- (voir src/lib/blog/image-client.ts) ; cette limite n'attrape donc
           -- que ce qui aurait échappé à cette réduction.
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
