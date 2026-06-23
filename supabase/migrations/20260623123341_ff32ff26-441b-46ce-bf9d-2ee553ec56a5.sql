
-- CLIENTS
DROP POLICY IF EXISTS "Allow public delete on clients" ON public.clients;
DROP POLICY IF EXISTS "Allow public insert on clients" ON public.clients;
DROP POLICY IF EXISTS "Allow public update on clients" ON public.clients;
CREATE POLICY "Admins/managers can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Admins/managers can update clients" ON public.clients FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')) WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Admins can delete clients" ON public.clients FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- INTERVENANTS
DROP POLICY IF EXISTS "Allow public delete on intervenants" ON public.intervenants;
DROP POLICY IF EXISTS "Allow public insert on intervenants" ON public.intervenants;
DROP POLICY IF EXISTS "Allow public read access on intervenants" ON public.intervenants;
DROP POLICY IF EXISTS "Allow public update on intervenants" ON public.intervenants;
CREATE POLICY "Staff can read intervenants" ON public.intervenants FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Admins/managers can insert intervenants" ON public.intervenants FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Admins/managers can update intervenants" ON public.intervenants FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')) WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Admins can delete intervenants" ON public.intervenants FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- DOCUMENTS_RH
DROP POLICY IF EXISTS "Authenticated users can delete documents_rh" ON public.documents_rh;
DROP POLICY IF EXISTS "Authenticated users can insert documents_rh" ON public.documents_rh;
DROP POLICY IF EXISTS "Authenticated users can read documents_rh" ON public.documents_rh;
DROP POLICY IF EXISTS "Authenticated users can update documents_rh" ON public.documents_rh;
CREATE POLICY "Admins/managers can read documents_rh" ON public.documents_rh FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Admins/managers can insert documents_rh" ON public.documents_rh FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Admins/managers can update documents_rh" ON public.documents_rh FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')) WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Admins can delete documents_rh" ON public.documents_rh FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- ENTREPRISE
DROP POLICY IF EXISTS "Authenticated users can insert entreprise" ON public.entreprise;
DROP POLICY IF EXISTS "Authenticated users can update entreprise" ON public.entreprise;
CREATE POLICY "Admins can insert entreprise" ON public.entreprise FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update entreprise" ON public.entreprise FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- ESSAIS_DELETED
DROP POLICY IF EXISTS "Authenticated can insert deleted entries" ON public.essais_deleted;

-- JOURNAL_AUDIT
DROP POLICY IF EXISTS "Allow authenticated insert on journal_audit" ON public.journal_audit;
DROP POLICY IF EXISTS "Allow authenticated read on journal_audit" ON public.journal_audit;
CREATE POLICY "Admins can read journal_audit" ON public.journal_audit FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- PAIEMENTS_CHEQUE
DROP POLICY IF EXISTS "Allow public delete on paiements_cheque" ON public.paiements_cheque;
DROP POLICY IF EXISTS "Allow public insert on paiements_cheque" ON public.paiements_cheque;
DROP POLICY IF EXISTS "Allow public read on paiements_cheque" ON public.paiements_cheque;
DROP POLICY IF EXISTS "Allow public update on paiements_cheque" ON public.paiements_cheque;
CREATE POLICY "Finance can read paiements_cheque" ON public.paiements_cheque FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Finance can insert paiements_cheque" ON public.paiements_cheque FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Finance can update paiements_cheque" ON public.paiements_cheque FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')) WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Admins can delete paiements_cheque" ON public.paiements_cheque FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- PAIEMENTS_ESPECE
DROP POLICY IF EXISTS "Allow public delete on paiements_espece" ON public.paiements_espece;
DROP POLICY IF EXISTS "Allow public insert on paiements_espece" ON public.paiements_espece;
DROP POLICY IF EXISTS "Allow public read on paiements_espece" ON public.paiements_espece;
DROP POLICY IF EXISTS "Allow public update on paiements_espece" ON public.paiements_espece;
CREATE POLICY "Finance can read paiements_espece" ON public.paiements_espece FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Finance can insert paiements_espece" ON public.paiements_espece FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Finance can update paiements_espece" ON public.paiements_espece FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')) WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Admins can delete paiements_espece" ON public.paiements_espece FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- PAIEMENTS_VIREMENT
DROP POLICY IF EXISTS "Authenticated users can manage paiements_virement" ON public.paiements_virement;
CREATE POLICY "Finance can read paiements_virement" ON public.paiements_virement FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Finance can insert paiements_virement" ON public.paiements_virement FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Finance can update paiements_virement" ON public.paiements_virement FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')) WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Admins can delete paiements_virement" ON public.paiements_virement FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- PARAMETRES_FACTURATION
DROP POLICY IF EXISTS "Allow authenticated insert on parametres_facturation" ON public.parametres_facturation;
DROP POLICY IF EXISTS "Allow authenticated update on parametres_facturation" ON public.parametres_facturation;
CREATE POLICY "Admins can insert parametres_facturation" ON public.parametres_facturation FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update parametres_facturation" ON public.parametres_facturation FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- PARAMETRES_SECURITE
DROP POLICY IF EXISTS "Allow authenticated insert on parametres_securite" ON public.parametres_securite;
DROP POLICY IF EXISTS "Allow authenticated read on parametres_securite" ON public.parametres_securite;
DROP POLICY IF EXISTS "Allow authenticated update on parametres_securite" ON public.parametres_securite;

-- POSTES
DROP POLICY IF EXISTS "Allow anon read on postes" ON public.postes;

-- STORAGE policies
DROP POLICY IF EXISTS "Anyone can view contract documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view documents administratifs" ON storage.objects;
DROP POLICY IF EXISTS "Public read certificats etalonnage" ON storage.objects;
DROP POLICY IF EXISTS "Signatures are publicly accessible" ON storage.objects;
CREATE POLICY "Authenticated can view contract documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'contrats');
CREATE POLICY "Authenticated can view documents administratifs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents-administratifs');
CREATE POLICY "Authenticated can view certificats etalonnage" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'certificats-etalonnage');
CREATE POLICY "Authenticated can view signatures" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'signatures');

-- SECURITY DEFINER EXECUTE revocations
REVOKE EXECUTE ON FUNCTION public.audit_parametres_changes() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_taux_tva_changes() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_utilisateurs_changes() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_essai_modifications() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_essai_deletion() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_audit_action(text, text, text, text, uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.restore_essai_field(text, uuid, text, jsonb, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.restore_deleted_essai(uuid) FROM anon;
