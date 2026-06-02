
-- Profiles table (shared across Kommenszlapf apps)
CREATE TABLE public.kommenszlapf_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kommenszlapf_profiles TO authenticated;
GRANT ALL ON public.kommenszlapf_profiles TO service_role;

ALTER TABLE public.kommenszlapf_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile"
  ON public.kommenszlapf_profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own profile"
  ON public.kommenszlapf_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own profile"
  ON public.kommenszlapf_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users delete own profile"
  ON public.kommenszlapf_profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Generic per-user data keyed by app + key (shared across Kommenszlapf apps)
CREATE TABLE public.kommenszlapf_user_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app text NOT NULL,
  key text NOT NULL,
  value jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, app, key)
);

CREATE INDEX kommenszlapf_user_data_user_app_idx
  ON public.kommenszlapf_user_data(user_id, app);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kommenszlapf_user_data TO authenticated;
GRANT ALL ON public.kommenszlapf_user_data TO service_role;

ALTER TABLE public.kommenszlapf_user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own data"
  ON public.kommenszlapf_user_data FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own data"
  ON public.kommenszlapf_user_data FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own data"
  ON public.kommenszlapf_user_data FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users delete own data"
  ON public.kommenszlapf_user_data FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.kommenszlapf_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER kommenszlapf_profiles_updated_at
  BEFORE UPDATE ON public.kommenszlapf_profiles
  FOR EACH ROW EXECUTE FUNCTION public.kommenszlapf_set_updated_at();

CREATE TRIGGER kommenszlapf_user_data_updated_at
  BEFORE UPDATE ON public.kommenszlapf_user_data
  FOR EACH ROW EXECUTE FUNCTION public.kommenszlapf_set_updated_at();

-- Auto-create profile on signup using metadata
CREATE OR REPLACE FUNCTION public.kommenszlapf_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.kommenszlapf_profiles (user_id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created_kommenszlapf
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.kommenszlapf_handle_new_user();
