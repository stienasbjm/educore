-- Evaluate auth.jwt() once per statement for the admin registry policy.
DROP POLICY IF EXISTS admins_read_own_email ON public.admins;
CREATE POLICY admins_read_own_email ON public.admins
  FOR SELECT TO authenticated
  USING ((SELECT lower(email) = lower(COALESCE((SELECT auth.jwt()) ->> 'email', ''))));
