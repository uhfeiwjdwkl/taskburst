-- Auto-delete unverified accounts after 24 hours
-- Requires pg_cron + pg_net extensions (typically available in Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.kommenszlapf_cleanup_unverified()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  DELETE FROM auth.users
  WHERE email_confirmed_at IS NULL
    AND created_at < now() - interval '24 hours';
$$;

-- Schedule daily cleanup at 03:00 UTC
DO $$
BEGIN
  PERFORM cron.unschedule('kommenszlapf_cleanup_unverified_daily');
EXCEPTION WHEN OTHERS THEN
  -- job didn't exist yet
  NULL;
END $$;

SELECT cron.schedule(
  'kommenszlapf_cleanup_unverified_daily',
  '0 3 * * *',
  $$ SELECT public.kommenszlapf_cleanup_unverified(); $$
);