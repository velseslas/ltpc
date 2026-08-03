GRANT EXECUTE ON FUNCTION public.can_access_chantier_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_intervenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_privileged_staff() TO authenticated;