-- ============================================================================
-- Tâches d'entretien planifiées
--
-- Deux fonctions existaient sans que rien ne les appelle : elles ne servaient
-- donc à rien. L'anonymisation, en particulier, n'est pas un confort — c'est
-- la minimisation exigée par le RGPD (art. 5.1.e), et une obligation qui ne
-- s'exécute jamais n'est pas respectée.
--
-- Les heures sont en UTC : 3h30 UTC correspond à 5h30 à Bruxelles en été,
-- 4h30 en hiver. Dans les deux cas, le complexe est fermé.
--
-- Pour vérifier ou modifier ensuite :
--   select jobname, schedule, active from cron.job;
--   select cron.unschedule('anonymiser-reservations');
-- ============================================================================

create extension if not exists pg_cron;

-- Anonymise chaque nuit les réservations de plus de 13 mois : le nom, l'e-mail,
-- le téléphone, le prénom et l'âge de l'enfant, les allergies et les remarques
-- sont effacés. Le montant, la date et le type restent, pour la comptabilité.
select cron.schedule(
  'anonymiser-reservations',
  '30 3 * * *',
  $$ select anonymiser_reservations_anciennes() $$
);

-- Supprime chaque dimanche les sessions du back-office expirées depuis plus
-- d'un mois. Sans ça, la table grossit indéfiniment.
select cron.schedule(
  'purger-sessions-admin',
  '0 4 * * 0',
  $$ select purger_sessions_admin() $$
);

-- `expirer_reservations_en_attente` n'est pas planifiée : elle est déjà appelée
-- avant chaque lecture de disponibilités et avant chaque écriture. Un créneau
-- tenu par un panier abandonné se libère donc au plus tard à la visite
-- suivante, ce qui est exactement le moment où cela compte.
