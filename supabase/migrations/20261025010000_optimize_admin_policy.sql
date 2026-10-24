-- Keep the admin registry private and evaluate the JWT once per statement.
DROP POLICY IF EXISTS admins_read_own_email ON public.admins;
CREATE POLICY admins_read_own_email ON public.admins
  FOR SELECT TO authenticated
  USING ((SELECT lower(email) = lower(COALESCE((SELECT auth.jwt()) ->> 'email', ''))));

-- These RPC helpers are not used by the deployed client. Remove their public
-- surface; token validation uses the authenticated Edge Function endpoint.
REVOKE ALL ON FUNCTION public.token_is_active(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_exam_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.token_is_active(text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.check_exam_token(text) FROM anon, authenticated;

-- This helper only reads auth claims and the caller's own admin row. It must
-- not bypass RLS as SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.admins
      WHERE lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    );
$$;
