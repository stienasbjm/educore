-- Keep the admin registry private and evaluate the JWT once per statement.
DROP POLICY IF EXISTS admins_read_own_email ON public.admins;
CREATE POLICY admins_read_own_email ON public.admins
  FOR SELECT TO authenticated
  USING ((SELECT lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))));

-- token_is_active is not used by the deployed client or Edge Function.
-- Remove its public RPC surface; token validation uses check_exam_token or the Edge Function.
REVOKE ALL ON FUNCTION public.token_is_active(text) FROM PUBLIC;
