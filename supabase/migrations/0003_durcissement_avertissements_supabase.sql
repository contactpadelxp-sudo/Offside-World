-- ============================================================================
-- Durcissement suite aux avertissements du linter Supabase.
--
-- Les 8 avis « RLS enabled, no policy » ne sont PAS traités : ils sont
-- intentionnels. Aucune politique = aucun accès par les clés publiques, tout
-- passe par le serveur. C'est ce qui garantit que le prix ne peut pas être
-- écrit depuis le navigateur.
-- ============================================================================

-- 1. search_path figé sur nos deux fonctions.
--    Sans cela, un rôle appelant peut détourner la résolution des noms
--    (search_path mutable) et faire exécuter ses propres objets.
alter function public.touch_updated_at()
  set search_path = pg_catalog, public;

alter function public.anonymiser_reservations_anciennes(interval)
  set search_path = pg_catalog, public;

-- 2. rls_auto_enable : fonction SECURITY DEFINER appelable par anon et
--    authenticated via /rest/v1/rpc/. C'est un déclencheur d'événement qui
--    active RLS sur toute nouvelle table — utile, mais il n'a aucune raison
--    d'être appelable depuis l'API publique. Les déclencheurs d'événement sont
--    invoqués par le moteur, pas via le droit EXECUTE : révoquer ne le casse pas.
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;
revoke execute on function public.rls_auto_enable() from public;
