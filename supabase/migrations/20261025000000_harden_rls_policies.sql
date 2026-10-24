-- Remove legacy public policies that bypass the admin-only RLS model.
DROP POLICY IF EXISTS "Allow public all on participants" ON public.participants;
DROP POLICY IF EXISTS "Allow public read and write on participants" ON public.participants;
DROP POLICY IF EXISTS "Allow public all on settings" ON public.settings;
DROP POLICY IF EXISTS "Allow public all on tokens" ON public.tokens;

-- Evaluate auth once per statement instead of once per row.
DROP POLICY IF EXISTS participants_admin_all ON public.participants;
CREATE POLICY participants_admin_all ON public.participants
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_user()))
  WITH CHECK ((SELECT public.is_admin_user()));

DROP POLICY IF EXISTS settings_admin_all ON public.settings;
CREATE POLICY settings_admin_all ON public.settings
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_user()))
  WITH CHECK ((SELECT public.is_admin_user()));

DROP POLICY IF EXISTS tokens_admin_all ON public.tokens;
CREATE POLICY tokens_admin_all ON public.tokens
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin_user()))
  WITH CHECK ((SELECT public.is_admin_user()));

DROP POLICY IF EXISTS admins_read_own_email ON public.admins;
CREATE POLICY admins_read_own_email ON public.admins
  FOR SELECT TO authenticated
  USING (lower(email) = lower(COALESCE((SELECT auth.jwt() ->> 'email'), '')));

-- This helper is only used by authenticated RLS policies, not by the browser.
REVOKE EXECUTE ON FUNCTION public.is_admin_user() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;
