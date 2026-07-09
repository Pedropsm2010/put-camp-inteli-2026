
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
-- has_role remains callable by authenticated (used by RLS as invoker)
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
