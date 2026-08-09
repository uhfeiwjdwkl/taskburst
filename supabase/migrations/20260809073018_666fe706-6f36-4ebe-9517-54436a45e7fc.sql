-- 1. Sync metadata on the shared user data table
CREATE SEQUENCE IF NOT EXISTS public.kommenszlapf_rev_seq AS bigint START 1;

ALTER TABLE public.kommenszlapf_user_data
  ADD COLUMN IF NOT EXISTS rev bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS device_id text,
  ADD COLUMN IF NOT EXISTS change_id text,
  ADD COLUMN IF NOT EXISTS client_ts timestamptz NOT NULL DEFAULT now();

-- backfill revisions for existing rows so old data is downloadable
UPDATE public.kommenszlapf_user_data
SET rev = nextval('public.kommenszlapf_rev_seq')
WHERE rev = 0;

CREATE UNIQUE INDEX IF NOT EXISTS kommenszlapf_user_data_uniq
  ON public.kommenszlapf_user_data (user_id, app, key);
CREATE INDEX IF NOT EXISTS kommenszlapf_user_data_rev_idx
  ON public.kommenszlapf_user_data (user_id, app, rev);

-- 2. Tiny cross-device sync notification table
CREATE TABLE IF NOT EXISTS public.kommenszlapf_sync_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app text NOT NULL,
  device_id text NOT NULL,
  request_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.kommenszlapf_sync_requests TO authenticated;
GRANT ALL ON public.kommenszlapf_sync_requests TO service_role;
ALTER TABLE public.kommenszlapf_sync_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own sync requests" ON public.kommenszlapf_sync_requests;
CREATE POLICY "Users view own sync requests" ON public.kommenszlapf_sync_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users create own sync requests" ON public.kommenszlapf_sync_requests;
CREATE POLICY "Users create own sync requests" ON public.kommenszlapf_sync_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users delete own sync requests" ON public.kommenszlapf_sync_requests;
CREATE POLICY "Users delete own sync requests" ON public.kommenszlapf_sync_requests
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS kommenszlapf_sync_requests_idx
  ON public.kommenszlapf_sync_requests (user_id, app, created_at DESC);

-- realtime for cross-device notifications
ALTER TABLE public.kommenszlapf_sync_requests REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kommenszlapf_sync_requests;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 3. Garbage collection: expire old tombstones + notifications
CREATE OR REPLACE FUNCTION public.kommenszlapf_sync_gc(p_app text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  DELETE FROM public.kommenszlapf_user_data
   WHERE user_id = uid AND app = p_app AND deleted
     AND updated_at < now() - interval '30 days';
  DELETE FROM public.kommenszlapf_sync_requests
   WHERE user_id = uid AND created_at < now() - interval '10 minutes';
END;
$$;

-- 4. Push: last-write-wins reconciliation, idempotent by change_id
CREATE OR REPLACE FUNCTION public.kommenszlapf_sync_push(
  p_app text,
  p_device text,
  p_changes jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  c jsonb;
  existing public.kommenszlapf_user_data;
  results jsonb := '[]'::jsonb;
  new_rev bigint;
  c_ts timestamptz;
  incoming_wins boolean;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF p_changes IS NULL OR jsonb_typeof(p_changes) <> 'array' THEN
    p_changes := '[]'::jsonb;
  END IF;

  FOR c IN SELECT * FROM jsonb_array_elements(p_changes)
  LOOP
    -- protect against wildly wrong device clocks
    c_ts := LEAST(COALESCE((c->>'ts')::timestamptz, now()), now());

    SELECT * INTO existing
      FROM public.kommenszlapf_user_data
     WHERE user_id = uid AND app = p_app AND key = (c->>'key')
     FOR UPDATE;

    IF existing.id IS NOT NULL AND existing.change_id IS NOT NULL
       AND existing.change_id = (c->>'change_id') THEN
      results := results || jsonb_build_object(
        'change_id', c->>'change_id', 'key', c->>'key',
        'status', 'duplicate', 'rev', existing.rev);
      CONTINUE;
    END IF;

    new_rev := nextval('public.kommenszlapf_rev_seq');

    IF existing.id IS NULL THEN
      INSERT INTO public.kommenszlapf_user_data
        (user_id, app, key, value, deleted, rev, device_id, change_id, client_ts, updated_at)
      VALUES (uid, p_app, c->>'key',
              CASE WHEN (c->>'op') = 'delete' THEN NULL ELSE c->'value' END,
              (c->>'op') = 'delete', new_rev, p_device, c->>'change_id', c_ts, now());
      results := results || jsonb_build_object(
        'change_id', c->>'change_id', 'key', c->>'key',
        'status', 'applied', 'rev', new_rev);
      CONTINUE;
    END IF;

    -- newest valid change wins; deterministic tie-break on change_id
    incoming_wins := (c_ts > existing.client_ts)
      OR (c_ts = existing.client_ts
          AND COALESCE(c->>'change_id','') > COALESCE(existing.change_id,''));

    IF incoming_wins THEN
      UPDATE public.kommenszlapf_user_data
         SET value = CASE WHEN (c->>'op') = 'delete' THEN NULL ELSE c->'value' END,
             deleted = ((c->>'op') = 'delete'),
             rev = new_rev,
             device_id = p_device,
             change_id = c->>'change_id',
             client_ts = c_ts,
             updated_at = now()
       WHERE id = existing.id;
      results := results || jsonb_build_object(
        'change_id', c->>'change_id', 'key', c->>'key',
        'status', 'applied', 'rev', new_rev);
    ELSE
      results := results || jsonb_build_object(
        'change_id', c->>'change_id', 'key', c->>'key',
        'status', 'stale', 'rev', existing.rev);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'server_time', now(),
    'server_rev', COALESCE((SELECT max(rev) FROM public.kommenszlapf_user_data
                             WHERE user_id = uid AND app = p_app), 0),
    'results', results);
END;
$$;

-- 5. Pull: only changes newer than the device checkpoint
CREATE OR REPLACE FUNCTION public.kommenszlapf_sync_pull(
  p_app text,
  p_since bigint DEFAULT 0,
  p_limit int DEFAULT 500
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  rows jsonb;
  lim int := LEAST(GREATEST(COALESCE(p_limit, 500), 1), 2000);
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT COALESCE(jsonb_agg(t ORDER BY t.rev), '[]'::jsonb) INTO rows
  FROM (
    SELECT key, value, deleted, rev, device_id, change_id, client_ts
      FROM public.kommenszlapf_user_data
     WHERE user_id = uid AND app = p_app AND rev > COALESCE(p_since, 0)
     ORDER BY rev
     LIMIT lim
  ) t;

  RETURN jsonb_build_object(
    'server_time', now(),
    'server_rev', COALESCE((SELECT max(rev) FROM public.kommenszlapf_user_data
                             WHERE user_id = uid AND app = p_app), 0),
    'rows', rows,
    'has_more', jsonb_array_length(rows) >= lim);
END;
$$;

REVOKE ALL ON FUNCTION public.kommenszlapf_sync_push(text, text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.kommenszlapf_sync_pull(text, bigint, int) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.kommenszlapf_sync_gc(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.kommenszlapf_sync_push(text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kommenszlapf_sync_pull(text, bigint, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kommenszlapf_sync_gc(text) TO authenticated;