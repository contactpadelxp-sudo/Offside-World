-- ============================================================================
-- Limitation de débit partagée entre les instances
--
-- Le compteur vivait dans la mémoire de l'instance qui traitait la requête.
-- Sur Vercel, plusieurs instances coexistent et sont recyclées : cinq
-- tentatives autorisées par instance font cinq × N tentatives réelles, et
-- personne ne sait combien vaut N.
--
-- `src/lib/limiteur.ts` le disait déjà en toutes lettres, en précisant quand y
-- remédier : « à ajouter en même temps que le paiement, quand un abus coûtera
-- de l'argent ». Stripe encaisse depuis le 16 septembre 2026 — la condition est
-- remplie, et l'endroit le plus exposé est la page de connexion du back-office,
-- qui ouvre sur des données d'enfants, des allergies et les montants encaissés.
--
-- POURQUOI LA BASE PLUTÔT QU'UN SERVICE DÉDIÉ. Elle est le seul état partagé
-- du projet, elle est déjà là, et le volume est dérisoire : une ligne par
-- appelant et par action, purgée après un jour. Provisionner un Redis pour
-- compter jusqu'à cinq serait hors de proportion.
--
-- AUCUNE ADRESSE IP N'EST ÉCRITE. La clé est passée au SHA-256 côté serveur
-- avant d'arriver ici : le compteur n'a besoin que de distinguer deux
-- appelants, pas de savoir qui ils sont. Une table de quotas n'est pas un
-- registre de connexions, et n'a donc pas à en porter les données.
-- ============================================================================

create table if not exists quotas (
  cle            text        primary key,
  compte         integer     not null default 0,
  fenetre_debut  timestamptz not null default now()
);

comment on table quotas is
  'Compteurs de limitation de débit, partagés entre instances. La clé est une '
  'empreinte SHA-256 : aucune adresse IP n''est stockée.';

alter table quotas enable row level security;
alter table quotas force  row level security;

create index if not exists quotas_fenetre on quotas (fenetre_debut);

-- Incrément ATOMIQUE. Deux requêtes simultanées du même appelant ne peuvent pas
-- lire toutes deux « 4 » et écrire toutes deux « 5 » : l'`on conflict do update`
-- verrouille la ligne, et le compteur rendu est celui d'après l'écriture.
create or replace function consommer_quota(p_cle text, p_max integer, p_fenetre interval)
returns boolean
language plpgsql
set search_path = pg_catalog, public
as $$
declare v_compte integer;
begin
  insert into quotas as q (cle, compte, fenetre_debut)
  values (p_cle, 1, now())
  on conflict (cle) do update
     set compte = case when q.fenetre_debut < now() - p_fenetre then 1 else q.compte + 1 end,
         fenetre_debut = case when q.fenetre_debut < now() - p_fenetre then now() else q.fenetre_debut end
  returning q.compte into v_compte;

  return v_compte <= p_max;
end $$;

comment on function consommer_quota is
  'Incrémente le compteur de la clé et dit si l''appel reste sous le plafond. '
  'Atomique : l''incrément et la lecture ne peuvent pas être séparés.';

create or replace function purger_quotas(garde interval default interval '1 day')
returns integer
language plpgsql
set search_path = pg_catalog, public
as $$
declare n integer;
begin
  delete from quotas where fenetre_debut < now() - garde;
  get diagnostics n = row_count;
  return n;
end $$;

revoke execute on function consommer_quota(text, integer, interval) from anon, authenticated, public;
revoke execute on function purger_quotas(interval) from anon, authenticated, public;
