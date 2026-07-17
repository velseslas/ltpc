
-- 1) material_status_history: restrict INSERT to admin/manager (defense-in-depth; trigger uses SECURITY DEFINER)
DROP POLICY IF EXISTS "auth write status" ON public.material_status_history;
CREATE POLICY "admins insert status history"
ON public.material_status_history
FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_manager());

-- 2) ai_alerts UPDATE: restrict to admin/manager
DROP POLICY IF EXISTS "authenticated can update alerts" ON public.ai_alerts;
CREATE POLICY "admins update alerts"
ON public.ai_alerts
FOR UPDATE TO authenticated
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- 3) notifications: prevent role/category spoofing. Only service_role/admins can INSERT.
DROP POLICY IF EXISTS "Users insert their own notifications" ON public.notifications;
CREATE POLICY "Admins insert notifications"
ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (public.is_admin_only());

-- 4) documents-officiels bucket: scope reads to document owner, restrict writes
DROP POLICY IF EXISTS docs_officiels_read_auth ON storage.objects;
DROP POLICY IF EXISTS docs_officiels_insert_auth ON storage.objects;
DROP POLICY IF EXISTS docs_officiels_update_owner ON storage.objects;
DROP POLICY IF EXISTS docs_officiels_delete_owner ON storage.objects;

CREATE POLICY docs_officiels_read_scoped
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents-officiels'
  AND EXISTS (
    SELECT 1 FROM public.document_archives a
    WHERE a.pdf_url = storage.objects.name
      AND (a.generated_by = auth.uid() OR public.is_admin_or_manager())
  )
);

CREATE POLICY docs_officiels_insert_scoped
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents-officiels'
  AND auth.uid() = owner
  AND public.can_write_business()
);

CREATE POLICY docs_officiels_update_admin
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documents-officiels' AND public.is_admin_only())
WITH CHECK (bucket_id = 'documents-officiels' AND public.is_admin_only());

CREATE POLICY docs_officiels_delete_admin
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents-officiels' AND public.is_admin_only());

-- 5) Revoke anon EXECUTE from SECURITY DEFINER functions that are not intentionally public.
--    Keep public exposure only for get_entreprise_public and verify_archive_by_token.
REVOKE EXECUTE ON FUNCTION public.assign_rapport_numero() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.next_rapport_numero() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_user_role_from_utilisateurs() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.apply_movement_effects() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.restore_essai_field(text, uuid, text, jsonb, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_manager() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin_only() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_write_business() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.restore_deleted_essai(uuid) FROM anon, PUBLIC;
