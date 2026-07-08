ALTER TABLE public.kommenszlapf_user_data REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'kommenszlapf_user_data'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.kommenszlapf_user_data';
  END IF;
END $$;

DROP TRIGGER IF EXISTS kommenszlapf_user_data_set_updated_at ON public.kommenszlapf_user_data;
CREATE TRIGGER kommenszlapf_user_data_set_updated_at
BEFORE UPDATE ON public.kommenszlapf_user_data
FOR EACH ROW EXECUTE FUNCTION public.kommenszlapf_set_updated_at();