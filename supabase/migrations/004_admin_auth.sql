-- ============================================================
-- Admin auth: profiles table with role-based access
-- Run this AFTER 001, 002, 003
-- ============================================================

CREATE TYPE user_role AS ENUM ('owner', 'staff');

CREATE TABLE profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT        NOT NULL,
  display_name TEXT,
  role         user_role   NOT NULL DEFAULT 'staff',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "profiles_self_read" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Auto-create profile when a new Supabase Auth user is created.
-- After running this migration, create your first user in the Supabase
-- dashboard (Authentication → Users → Invite user), then manually
-- run: UPDATE profiles SET role = 'owner' WHERE email = 'your@email.com';
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Admin update policies for duration price tables
-- (the service role key used in API routes already bypasses RLS;
-- these are for any direct queries using the anon key + session)
CREATE POLICY "pc_prices_admin_update" ON pc_duration_prices
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles));

CREATE POLICY "ps5_prices_admin_update" ON ps5_duration_prices
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles));
