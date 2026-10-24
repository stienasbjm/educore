-- Token validation and access policy repair.
-- Run this migration in the Supabase project before deploying the frontend.

CREATE OR REPLACE FUNCTION public.token_is_active(token_code text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tokens
    WHERE lower(code) = lower(trim(token_code)) AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.check_exam_token(token_code text)
RETURNS SETOF public.tokens
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.*
  FROM public.tokens AS t
  WHERE lower(t.code) = lower(trim(token_code))
    AND t.is_active = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.check_exam_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_exam_token(text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.token_is_active(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.token_is_active(text) TO anon, authenticated;

-- A logged-in Supabase user is not automatically an administrator. Keep this
-- check server-side so frontend checks cannot be bypassed by a crafted request.
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.admins
      WHERE lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    );
$$;

REVOKE ALL ON FUNCTION public.is_admin_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO anon, authenticated;

-- The publishable key must not be able to enumerate every token. Participants
-- validate one code through the function above; admins use authenticated RLS.
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read and write on tokens" ON public.tokens;
DROP POLICY IF EXISTS tokens_anon_read ON public.tokens;
DROP POLICY IF EXISTS tokens_admin_all ON public.tokens;
CREATE POLICY tokens_admin_all ON public.tokens
  FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- Keep the public configuration readable, while writes remain admin-only.
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read and write on settings" ON public.settings;
DROP POLICY IF EXISTS settings_anon_read ON public.settings;
DROP POLICY IF EXISTS settings_admin_all ON public.settings;
CREATE POLICY settings_anon_read ON public.settings
  FOR SELECT TO anon USING (true);
CREATE POLICY settings_admin_all ON public.settings
  FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- If an older schema has this broad policy, replace it with the same admin
-- check. Participant writes from students continue through the anon policies
-- or the participant-mutations Edge Function.
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS participants_admin_all ON public.participants;
CREATE POLICY participants_admin_all ON public.participants
  FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

