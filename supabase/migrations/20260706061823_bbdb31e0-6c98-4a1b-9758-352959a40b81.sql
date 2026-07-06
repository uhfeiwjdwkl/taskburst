
-- Revoke EXECUTE on SECURITY DEFINER helper functions from public roles.
-- These functions are only invoked by triggers (kommenszlapf_handle_new_user,
-- kommenszlapf_set_updated_at) or scheduled maintenance
-- (kommenszlapf_cleanup_unverified) and must not be callable by clients.
REVOKE EXECUTE ON FUNCTION public.kommenszlapf_handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.kommenszlapf_cleanup_unverified() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.kommenszlapf_set_updated_at() FROM PUBLIC, anon, authenticated;

-- Hide internal tables from the auto-generated pg_graphql schema. The app
-- uses PostgREST (supabase-js) with RLS, so nothing needs the GraphQL view.
-- Excluding here removes them from anon and authenticated GraphQL discovery.
COMMENT ON TABLE public.kommenszlapf_profiles IS E'@graphql({"totalCount": {"enabled": false}})\n@graphql({"exclude": true})';
COMMENT ON TABLE public.kommenszlapf_user_data IS E'@graphql({"totalCount": {"enabled": false}})\n@graphql({"exclude": true})';

-- Belt-and-braces: revoke usage on the graphql_public schema for anon and
-- authenticated so no table is discoverable via GraphQL at all.
REVOKE USAGE ON SCHEMA graphql_public FROM anon, authenticated;
