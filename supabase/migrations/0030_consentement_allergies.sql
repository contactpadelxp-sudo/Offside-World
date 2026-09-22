-- ============================================================================
-- Les allergies sont des données de santé : elles demandent un consentement
-- explicite, et sa trace — 22 septembre 2026
-- ============================================================================
--
-- L'article 9 du RGPD INTERDIT par principe de traiter des données de santé.
-- Une allergie alimentaire en est une. L'interdiction ne tombe que par une
-- exception, et la seule qui vaille ici est le CONSENTEMENT EXPLICITE de la
-- personne (art. 9.2.a). « Explicite » veut dire davantage qu'un consentement
-- ordinaire : une démarche séparée, jamais noyée dans l'acceptation des
-- conditions générales, qui nomme la donnée et son usage.
--
-- CE QUI SE PASSAIT AVANT, relevé par l'audit du 22 septembre 2026 : la
-- colonne `allergies` existait, le serveur l'acceptait, la politique de
-- confidentialité annonçait la collecter, le back-office l'affichait — mais
-- AUCUN formulaire ne la demandait et AUCUN consentement n'était recueilli.
-- Les allergies arrivaient donc par téléphone et finissaient dans la note
-- interne, c'est-à-dire dans le seul champ qui échappait à l'effacement
-- automatique jusqu'à la migration 0029.
--
-- Le pire des trois mondes : on annonçait la collecte, on la subissait sans
-- la maîtriser, et on la conservait sans limite.
--
-- POURQUOI UN HORODATAGE ET PAS UN BOOLÉEN. L'article 7.1 exige de pouvoir
-- DÉMONTRER le consentement. Un booléen dit qu'il existe ; une date dit quand
-- il a été donné, ce qui est ce qu'on doit produire en cas de contestation.
-- C'est déjà le choix fait pour `newsletter_le` et `cgv_acceptees_le` : la
-- troisième colonne suit la même règle plutôt que d'en inventer une autre.
--
-- `null` VEUT DIRE « PAS DE CONSENTEMENT », et la contrainte ci-dessous en
-- fait une règle de la base et non une politesse du code applicatif : on ne
-- peut pas écrire d'allergies sans la date qui les autorise. Une action
-- serveur mal relue, un script d'import, une correction à la main — aucun
-- chemin ne peut contourner ça.

alter table reservations
  add column if not exists allergies_consenties_le timestamptz;

comment on column reservations.allergies_consenties_le is
  'Horodatage du consentement EXPLICITE au traitement des allergies, donnée de '
  'santé au sens de l''art. 9 du RGPD. L''art. 7.1 impose de pouvoir démontrer '
  'ce consentement : une date le démontre, un booléen l''affirme seulement. '
  '`null` = pas de consentement, et la contrainte allergies_consenties interdit '
  'alors d''enregistrer la moindre allergie.';

-- ── La règle, portée par la base et non par le code ─────────────────────────
--
-- Écrite « not valid » puis validée : la table ne porte aujourd'hui aucune
-- ligne avec des allergies, mais le faire en deux temps est l'habitude sûre
-- sur une table en production — la validation échouerait bruyamment plutôt que
-- de bloquer l'ajout de la contrainte.

alter table reservations
  add constraint allergies_consenties
  check (allergies is null or allergies_consenties_le is not null)
  not valid;

alter table reservations validate constraint allergies_consenties;
