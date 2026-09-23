-- ============================================================================
-- Le journal d'administration n'avait aucune durée de conservation
-- 22 septembre 2026 — durée fixée à 12 mois par Mathis
-- ============================================================================
--
-- `journal_admin` trace qui a consulté ou modifié quoi. Sa raison d'être est
-- écrite dans son propre commentaire depuis la migration 0001 : « Exigé pour
-- tracer les accès à des données de mineurs et de santé. »
--
-- CE QUI N'ALLAIT PAS. Toutes les autres tables ont leur purge — réservations
-- et devis à 13 mois, mesure d'audience à 13 mois, quotas à 1 jour, sessions
-- d'administration à 30 jours. Le journal, lui, n'en avait aucune : il gardait
-- sans limite l'adresse IP de l'exploitant, l'horodatage de chacun de ses
-- gestes et la référence des réservations touchées. L'article 5.1.e du RGPD
-- veut qu'une donnée personnelle ne soit conservée que le temps nécessaire à
-- la finalité poursuivie, et « pour toujours » n'est pas une durée.
--
-- POURQUOI DOUZE MOIS. C'est la durée qui couvre un cycle complet du complexe
-- — une saison entière, d'une rentrée à la suivante — donc le délai au-delà
-- duquel une trace ne sert plus à comprendre un incident. Elle est aussi
-- INFÉRIEURE aux 13 mois des réservations, et c'est voulu : le journal ne doit
-- pas survivre aux données qu'il trace, sinon il devient la dernière copie
-- d'une information qu'on a promis d'effacer.
--
-- POURQUOI UNE SUPPRESSION, ET PAS UNE ANONYMISATION. Une ligne de journal
-- anonymisée ne prouve plus rien : son intérêt tient entièrement à QUI a fait
-- le geste. Vidée de l'acteur, elle n'est plus une trace, seulement du volume.
-- Les réservations, elles, sont anonymisées et non supprimées parce que leur
-- montant et leur date restent dus à la comptabilité — ce qui n'est pas le cas
-- ici.
--
-- Pour vérifier ou modifier ensuite :
--   select jobname, schedule, active from cron.job;
--   select purger_journal_admin();                  -- purge immédiate
--   select purger_journal_admin(interval '24 months'); -- autre délai, ponctuel

create or replace function purger_journal_admin(delai interval default interval '12 months')
returns integer
language plpgsql
set search_path = pg_catalog, public
as $$
declare supprimees integer;
begin
  delete from journal_admin
  where created_at < now() - delai;
  get diagnostics supprimees = row_count;
  return supprimees;
end $$;

comment on function purger_journal_admin is
  'Supprime les lignes du journal d''administration de plus de 12 mois. '
  'Durée fixée le 22 septembre 2026 : elle couvre une saison complète du '
  'complexe et reste INFÉRIEURE aux 13 mois des réservations, pour que le '
  'journal ne survive jamais aux données qu''il trace. Suppression et non '
  'anonymisation : une trace sans son acteur ne prouve plus rien.';

-- Le dimanche à 4h30 UTC. Décalée plutôt que simultanée : deux tâches qui
-- démarrent à la même seconde rendent illisible le diagnostic quand l'une des
-- deux échoue. 4h15 avait d'abord été choisi contre la purge des sessions
-- (4h00) — sans voir que `purger-audience` l'occupait déjà. Le créneau libre
-- suivant est 4h30, et `purger-quotas` ne vient qu'à 4h45.
select cron.schedule(
  'purger-journal-admin',
  '30 4 * * 0',
  $$ select purger_journal_admin() $$
);
