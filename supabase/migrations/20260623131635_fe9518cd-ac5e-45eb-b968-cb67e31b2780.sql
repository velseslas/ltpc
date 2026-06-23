
-- ============ PUBLIC TABLES ============

-- affectations
DROP POLICY IF EXISTS "Allow public read on affectations" ON public.affectations;
DROP POLICY IF EXISTS "Allow public insert on affectations" ON public.affectations;
DROP POLICY IF EXISTS "Allow public update on affectations" ON public.affectations;
DROP POLICY IF EXISTS "Allow public delete on affectations" ON public.affectations;
CREATE POLICY "affectations_select" ON public.affectations FOR SELECT TO authenticated USING (true);
CREATE POLICY "affectations_insert" ON public.affectations FOR INSERT TO authenticated WITH CHECK (public.can_write_business());
CREATE POLICY "affectations_update" ON public.affectations FOR UPDATE TO authenticated USING (public.can_write_business()) WITH CHECK (public.can_write_business());
CREATE POLICY "affectations_delete" ON public.affectations FOR DELETE TO authenticated USING (public.is_admin_or_manager());

-- affectation_materiel
DROP POLICY IF EXISTS "Allow public read on affectation_materiel" ON public.affectation_materiel;
DROP POLICY IF EXISTS "Allow public insert on affectation_materiel" ON public.affectation_materiel;
DROP POLICY IF EXISTS "Allow public update on affectation_materiel" ON public.affectation_materiel;
DROP POLICY IF EXISTS "Allow public delete on affectation_materiel" ON public.affectation_materiel;
CREATE POLICY "affectation_materiel_select" ON public.affectation_materiel FOR SELECT TO authenticated USING (true);
CREATE POLICY "affectation_materiel_insert" ON public.affectation_materiel FOR INSERT TO authenticated WITH CHECK (public.can_write_business());
CREATE POLICY "affectation_materiel_update" ON public.affectation_materiel FOR UPDATE TO authenticated USING (public.can_write_business()) WITH CHECK (public.can_write_business());
CREATE POLICY "affectation_materiel_delete" ON public.affectation_materiel FOR DELETE TO authenticated USING (public.is_admin_or_manager());

-- etalonnage_materiel
DROP POLICY IF EXISTS "Allow public read on etalonnage_materiel" ON public.etalonnage_materiel;
DROP POLICY IF EXISTS "Allow public insert on etalonnage_materiel" ON public.etalonnage_materiel;
DROP POLICY IF EXISTS "Allow public update on etalonnage_materiel" ON public.etalonnage_materiel;
DROP POLICY IF EXISTS "Allow public delete on etalonnage_materiel" ON public.etalonnage_materiel;
CREATE POLICY "etalonnage_materiel_select" ON public.etalonnage_materiel FOR SELECT TO authenticated USING (true);
CREATE POLICY "etalonnage_materiel_insert" ON public.etalonnage_materiel FOR INSERT TO authenticated WITH CHECK (public.can_write_business());
CREATE POLICY "etalonnage_materiel_update" ON public.etalonnage_materiel FOR UPDATE TO authenticated USING (public.can_write_business()) WITH CHECK (public.can_write_business());
CREATE POLICY "etalonnage_materiel_delete" ON public.etalonnage_materiel FOR DELETE TO authenticated USING (public.is_admin_or_manager());

-- bons_commande_prestataire
DROP POLICY IF EXISTS "Authenticated users can view bons_commande_prestataire" ON public.bons_commande_prestataire;
DROP POLICY IF EXISTS "Authenticated users can insert bons_commande_prestataire" ON public.bons_commande_prestataire;
DROP POLICY IF EXISTS "Authenticated users can update bons_commande_prestataire" ON public.bons_commande_prestataire;
DROP POLICY IF EXISTS "Authenticated users can delete bons_commande_prestataire" ON public.bons_commande_prestataire;
CREATE POLICY "bons_commande_prestataire_select" ON public.bons_commande_prestataire FOR SELECT TO authenticated USING (true);
CREATE POLICY "bons_commande_prestataire_insert" ON public.bons_commande_prestataire FOR INSERT TO authenticated WITH CHECK (public.can_write_business());
CREATE POLICY "bons_commande_prestataire_update" ON public.bons_commande_prestataire FOR UPDATE TO authenticated USING (public.can_write_business()) WITH CHECK (public.can_write_business());
CREATE POLICY "bons_commande_prestataire_delete" ON public.bons_commande_prestataire FOR DELETE TO authenticated USING (public.is_admin_or_manager());

-- contrat_articles (lié à contrats)
DROP POLICY IF EXISTS "Allow all access to contrat_articles" ON public.contrat_articles;
CREATE POLICY "contrat_articles_select" ON public.contrat_articles FOR SELECT TO authenticated USING (true);
CREATE POLICY "contrat_articles_insert" ON public.contrat_articles FOR INSERT TO authenticated
  WITH CHECK (public.can_write_business() AND EXISTS (SELECT 1 FROM public.contrats c WHERE c.id = contrat_id));
CREATE POLICY "contrat_articles_update" ON public.contrat_articles FOR UPDATE TO authenticated
  USING (public.can_write_business()) WITH CHECK (public.can_write_business());
CREATE POLICY "contrat_articles_delete" ON public.contrat_articles FOR DELETE TO authenticated
  USING (public.is_admin_or_manager());

-- engagement_articles (lié à lettres_engagement)
DROP POLICY IF EXISTS "Allow all access to engagement_articles" ON public.engagement_articles;
CREATE POLICY "engagement_articles_select" ON public.engagement_articles FOR SELECT TO authenticated USING (true);
CREATE POLICY "engagement_articles_insert" ON public.engagement_articles FOR INSERT TO authenticated
  WITH CHECK (public.can_write_business() AND EXISTS (SELECT 1 FROM public.lettres_engagement l WHERE l.id = engagement_id));
CREATE POLICY "engagement_articles_update" ON public.engagement_articles FOR UPDATE TO authenticated
  USING (public.can_write_business()) WITH CHECK (public.can_write_business());
CREATE POLICY "engagement_articles_delete" ON public.engagement_articles FOR DELETE TO authenticated
  USING (public.is_admin_or_manager());

-- parametres_notifications (admin only writes)
DROP POLICY IF EXISTS "Allow authenticated read on parametres_notifications" ON public.parametres_notifications;
DROP POLICY IF EXISTS "Allow authenticated insert on parametres_notifications" ON public.parametres_notifications;
DROP POLICY IF EXISTS "Allow authenticated update on parametres_notifications" ON public.parametres_notifications;
CREATE POLICY "parametres_notifications_select" ON public.parametres_notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "parametres_notifications_insert" ON public.parametres_notifications FOR INSERT TO authenticated WITH CHECK (public.is_admin_only());
CREATE POLICY "parametres_notifications_update" ON public.parametres_notifications FOR UPDATE TO authenticated USING (public.is_admin_only()) WITH CHECK (public.is_admin_only());
CREATE POLICY "parametres_notifications_delete" ON public.parametres_notifications FOR DELETE TO authenticated USING (public.is_admin_only());

-- historique_echantillons_compression (lecture seule pour le client; écriture via triggers SECURITY DEFINER)
DROP POLICY IF EXISTS "Allow public read on historique_echantillons_compression" ON public.historique_echantillons_compression;
DROP POLICY IF EXISTS "Allow public insert on historique_echantillons_compression" ON public.historique_echantillons_compression;
DROP POLICY IF EXISTS "Allow public delete on historique_echantillons_compression" ON public.historique_echantillons_compression;
CREATE POLICY "historique_echantillons_compression_select" ON public.historique_echantillons_compression FOR SELECT TO authenticated USING (true);
CREATE POLICY "historique_echantillons_compression_delete_admin" ON public.historique_echantillons_compression FOR DELETE TO authenticated USING (public.is_admin_only());

-- ============ STORAGE: buckets privés ============

-- contrats
DROP POLICY IF EXISTS "Authenticated can view contract documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload contract documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update contract documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete contract documents" ON storage.objects;
CREATE POLICY "contrats_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'contrats');
CREATE POLICY "contrats_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'contrats' AND public.can_write_business() AND owner = auth.uid());
CREATE POLICY "contrats_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'contrats' AND (owner = auth.uid() OR public.is_admin_or_manager())) WITH CHECK (bucket_id = 'contrats');
CREATE POLICY "contrats_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'contrats' AND (owner = auth.uid() OR public.is_admin_or_manager()));

-- documents-administratifs
DROP POLICY IF EXISTS "Authenticated can view documents administratifs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents administratifs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents administratifs" ON storage.objects;
CREATE POLICY "documents_administratifs_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents-administratifs');
CREATE POLICY "documents_administratifs_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents-administratifs' AND public.can_write_business() AND owner = auth.uid());
CREATE POLICY "documents_administratifs_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'documents-administratifs' AND (owner = auth.uid() OR public.is_admin_or_manager())) WITH CHECK (bucket_id = 'documents-administratifs');
CREATE POLICY "documents_administratifs_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents-administratifs' AND (owner = auth.uid() OR public.is_admin_or_manager()));

-- certificats-etalonnage
DROP POLICY IF EXISTS "Authenticated can view certificats etalonnage" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can insert certificats etalonnage" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update certificats etalonnage" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete certificats etalonnage" ON storage.objects;
CREATE POLICY "certificats_etalonnage_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'certificats-etalonnage');
CREATE POLICY "certificats_etalonnage_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'certificats-etalonnage' AND public.can_write_business() AND owner = auth.uid());
CREATE POLICY "certificats_etalonnage_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'certificats-etalonnage' AND (owner = auth.uid() OR public.is_admin_or_manager())) WITH CHECK (bucket_id = 'certificats-etalonnage');
CREATE POLICY "certificats_etalonnage_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'certificats-etalonnage' AND (owner = auth.uid() OR public.is_admin_or_manager()));

-- signatures (RH: admin/manager seulement)
DROP POLICY IF EXISTS "Authenticated can view signatures" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload signatures" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update signatures" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete signatures" ON storage.objects;
CREATE POLICY "signatures_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'signatures');
CREATE POLICY "signatures_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'signatures' AND public.is_admin_or_manager() AND owner = auth.uid());
CREATE POLICY "signatures_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'signatures' AND public.is_admin_or_manager()) WITH CHECK (bucket_id = 'signatures' AND public.is_admin_or_manager());
CREATE POLICY "signatures_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'signatures' AND public.is_admin_or_manager());
