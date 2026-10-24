-- The frontend now validates tokens only through the Edge Function.
-- Remove explicit legacy grants from the old SECURITY DEFINER RPCs.
REVOKE ALL ON FUNCTION public.token_is_active(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_exam_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.token_is_active(text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.check_exam_token(text) FROM anon, authenticated;
