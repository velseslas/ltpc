
REVOKE EXECUTE ON FUNCTION public.is_privileged_staff() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.current_intervenant_id() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.can_access_chantier_data(uuid) FROM authenticated;
