
-- Helper functions
CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.has_role(auth.uid(),'super_admin')
      OR public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'manager');
$$;

CREATE OR REPLACE FUNCTION public.is_admin_only()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.has_role(auth.uid(),'super_admin')
      OR public.has_role(auth.uid(),'admin');
$$;

CREATE OR REPLACE FUNCTION public.can_write_business()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.has_role(auth.uid(),'super_admin')
      OR public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'manager')
      OR public.has_role(auth.uid(),'technicien');
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin_or_manager() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_only() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_write_business() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_or_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_only() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_write_business() TO authenticated;

-- ===== essais_modifications_history: block direct INSERT =====
DROP POLICY IF EXISTS "Authenticated can insert history" ON public.essais_modifications_history;

-- ===== parametres_qrcode =====
DROP POLICY IF EXISTS "Allow authenticated insert on parametres_qrcode" ON public.parametres_qrcode;
DROP POLICY IF EXISTS "Allow authenticated update on parametres_qrcode" ON public.parametres_qrcode;
CREATE POLICY "Admins can insert parametres_qrcode" ON public.parametres_qrcode FOR INSERT TO authenticated WITH CHECK (public.is_admin_only());
CREATE POLICY "Admins can update parametres_qrcode" ON public.parametres_qrcode FOR UPDATE TO authenticated USING (public.is_admin_only()) WITH CHECK (public.is_admin_only());

-- ===== parametres_signature =====
DROP POLICY IF EXISTS "Allow authenticated insert on parametres_signature" ON public.parametres_signature;
DROP POLICY IF EXISTS "Allow authenticated update on parametres_signature" ON public.parametres_signature;
CREATE POLICY "Admins can insert parametres_signature" ON public.parametres_signature FOR INSERT TO authenticated WITH CHECK (public.is_admin_only());
CREATE POLICY "Admins can update parametres_signature" ON public.parametres_signature FOR UPDATE TO authenticated USING (public.is_admin_only()) WITH CHECK (public.is_admin_only());

-- ===== parametres_systeme =====
DROP POLICY IF EXISTS "Allow authenticated insert on parametres_systeme" ON public.parametres_systeme;
DROP POLICY IF EXISTS "Allow authenticated update on parametres_systeme" ON public.parametres_systeme;
CREATE POLICY "Admins can insert parametres_systeme" ON public.parametres_systeme FOR INSERT TO authenticated WITH CHECK (public.is_admin_only());
CREATE POLICY "Admins can update parametres_systeme" ON public.parametres_systeme FOR UPDATE TO authenticated USING (public.is_admin_only()) WITH CHECK (public.is_admin_only());

-- ===== postes (HR job positions) =====
DROP POLICY IF EXISTS "Authenticated users can insert postes" ON public.postes;
DROP POLICY IF EXISTS "Authenticated users can update postes" ON public.postes;
DROP POLICY IF EXISTS "Authenticated users can delete postes" ON public.postes;
CREATE POLICY "Admins/managers can insert postes" ON public.postes FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_manager());
CREATE POLICY "Admins/managers can update postes" ON public.postes FOR UPDATE TO authenticated USING (public.is_admin_or_manager()) WITH CHECK (public.is_admin_or_manager());
CREATE POLICY "Admins/managers can delete postes" ON public.postes FOR DELETE TO authenticated USING (public.is_admin_or_manager());

-- ===== prix_essais =====
DROP POLICY IF EXISTS "Authenticated users can manage prix_essais" ON public.prix_essais;
CREATE POLICY "Authenticated can read prix_essais" ON public.prix_essais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins/managers can insert prix_essais" ON public.prix_essais FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_manager());
CREATE POLICY "Admins/managers can update prix_essais" ON public.prix_essais FOR UPDATE TO authenticated USING (public.is_admin_or_manager()) WITH CHECK (public.is_admin_or_manager());
CREATE POLICY "Admins/managers can delete prix_essais" ON public.prix_essais FOR DELETE TO authenticated USING (public.is_admin_or_manager());

-- ===== taux_tva =====
DROP POLICY IF EXISTS "Allow authenticated insert on taux_tva" ON public.taux_tva;
DROP POLICY IF EXISTS "Allow authenticated update on taux_tva" ON public.taux_tva;
DROP POLICY IF EXISTS "Allow authenticated delete on taux_tva" ON public.taux_tva;
CREATE POLICY "Admins can insert taux_tva" ON public.taux_tva FOR INSERT TO authenticated WITH CHECK (public.is_admin_only());
CREATE POLICY "Admins can update taux_tva" ON public.taux_tva FOR UPDATE TO authenticated USING (public.is_admin_only()) WITH CHECK (public.is_admin_only());
CREATE POLICY "Admins can delete taux_tva" ON public.taux_tva FOR DELETE TO authenticated USING (public.is_admin_only());

-- ===== Financial documents: factures, devis, bons_commande, lignes_*, lettres_engagement, offres_*, attestations =====
DROP POLICY IF EXISTS "Authenticated users can manage factures" ON public.factures;
CREATE POLICY "Read factures" ON public.factures FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write factures" ON public.factures FOR INSERT TO authenticated WITH CHECK (public.can_write_business());
CREATE POLICY "Update factures" ON public.factures FOR UPDATE TO authenticated USING (public.can_write_business()) WITH CHECK (public.can_write_business());
CREATE POLICY "Delete factures" ON public.factures FOR DELETE TO authenticated USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Authenticated users can manage devis" ON public.devis;
CREATE POLICY "Read devis" ON public.devis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write devis" ON public.devis FOR INSERT TO authenticated WITH CHECK (public.can_write_business());
CREATE POLICY "Update devis" ON public.devis FOR UPDATE TO authenticated USING (public.can_write_business()) WITH CHECK (public.can_write_business());
CREATE POLICY "Delete devis" ON public.devis FOR DELETE TO authenticated USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Authenticated users can manage bons_commande" ON public.bons_commande;
CREATE POLICY "Read bons_commande" ON public.bons_commande FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write bons_commande" ON public.bons_commande FOR INSERT TO authenticated WITH CHECK (public.can_write_business());
CREATE POLICY "Update bons_commande" ON public.bons_commande FOR UPDATE TO authenticated USING (public.can_write_business()) WITH CHECK (public.can_write_business());
CREATE POLICY "Delete bons_commande" ON public.bons_commande FOR DELETE TO authenticated USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Authenticated users can manage lignes_facture" ON public.lignes_facture;
CREATE POLICY "Read lignes_facture" ON public.lignes_facture FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write lignes_facture" ON public.lignes_facture FOR INSERT TO authenticated WITH CHECK (public.can_write_business());
CREATE POLICY "Update lignes_facture" ON public.lignes_facture FOR UPDATE TO authenticated USING (public.can_write_business()) WITH CHECK (public.can_write_business());
CREATE POLICY "Delete lignes_facture" ON public.lignes_facture FOR DELETE TO authenticated USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Authenticated users can manage lignes_devis" ON public.lignes_devis;
CREATE POLICY "Read lignes_devis" ON public.lignes_devis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write lignes_devis" ON public.lignes_devis FOR INSERT TO authenticated WITH CHECK (public.can_write_business());
CREATE POLICY "Update lignes_devis" ON public.lignes_devis FOR UPDATE TO authenticated USING (public.can_write_business()) WITH CHECK (public.can_write_business());
CREATE POLICY "Delete lignes_devis" ON public.lignes_devis FOR DELETE TO authenticated USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Authenticated users can manage lignes_bon_commande" ON public.lignes_bon_commande;
CREATE POLICY "Read lignes_bon_commande" ON public.lignes_bon_commande FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write lignes_bon_commande" ON public.lignes_bon_commande FOR INSERT TO authenticated WITH CHECK (public.can_write_business());
CREATE POLICY "Update lignes_bon_commande" ON public.lignes_bon_commande FOR UPDATE TO authenticated USING (public.can_write_business()) WITH CHECK (public.can_write_business());
CREATE POLICY "Delete lignes_bon_commande" ON public.lignes_bon_commande FOR DELETE TO authenticated USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Authenticated users can manage lettres_engagement" ON public.lettres_engagement;
CREATE POLICY "Read lettres_engagement" ON public.lettres_engagement FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write lettres_engagement" ON public.lettres_engagement FOR INSERT TO authenticated WITH CHECK (public.can_write_business());
CREATE POLICY "Update lettres_engagement" ON public.lettres_engagement FOR UPDATE TO authenticated USING (public.can_write_business()) WITH CHECK (public.can_write_business());
CREATE POLICY "Delete lettres_engagement" ON public.lettres_engagement FOR DELETE TO authenticated USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Authenticated users can manage offres_prix" ON public.offres_prix;
CREATE POLICY "Read offres_prix" ON public.offres_prix FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write offres_prix" ON public.offres_prix FOR INSERT TO authenticated WITH CHECK (public.can_write_business());
CREATE POLICY "Update offres_prix" ON public.offres_prix FOR UPDATE TO authenticated USING (public.can_write_business()) WITH CHECK (public.can_write_business());
CREATE POLICY "Delete offres_prix" ON public.offres_prix FOR DELETE TO authenticated USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Authenticated users can manage offres_service" ON public.offres_service;
CREATE POLICY "Read offres_service" ON public.offres_service FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write offres_service" ON public.offres_service FOR INSERT TO authenticated WITH CHECK (public.can_write_business());
CREATE POLICY "Update offres_service" ON public.offres_service FOR UPDATE TO authenticated USING (public.can_write_business()) WITH CHECK (public.can_write_business());
CREATE POLICY "Delete offres_service" ON public.offres_service FOR DELETE TO authenticated USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Authenticated users can manage attestations_bonne_execution" ON public.attestations_bonne_execution;
CREATE POLICY "Read attestations" ON public.attestations_bonne_execution FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write attestations" ON public.attestations_bonne_execution FOR INSERT TO authenticated WITH CHECK (public.can_write_business());
CREATE POLICY "Update attestations" ON public.attestations_bonne_execution FOR UPDATE TO authenticated USING (public.can_write_business()) WITH CHECK (public.can_write_business());
CREATE POLICY "Delete attestations" ON public.attestations_bonne_execution FOR DELETE TO authenticated USING (public.is_admin_or_manager());

-- ===== Business records: contrats, formulations, materiel, laboratoires_mobiles =====
DROP POLICY IF EXISTS "Allow public insert on contrats" ON public.contrats;
DROP POLICY IF EXISTS "Allow public update on contrats" ON public.contrats;
DROP POLICY IF EXISTS "Allow public delete on contrats" ON public.contrats;
CREATE POLICY "Write contrats" ON public.contrats FOR INSERT TO authenticated WITH CHECK (public.can_write_business());
CREATE POLICY "Update contrats" ON public.contrats FOR UPDATE TO authenticated USING (public.can_write_business()) WITH CHECK (public.can_write_business());
CREATE POLICY "Delete contrats" ON public.contrats FOR DELETE TO authenticated USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Allow authenticated insert on formulations" ON public.formulations;
DROP POLICY IF EXISTS "Allow authenticated update on formulations" ON public.formulations;
DROP POLICY IF EXISTS "Allow authenticated delete on formulations" ON public.formulations;
CREATE POLICY "Write formulations" ON public.formulations FOR INSERT TO authenticated WITH CHECK (public.can_write_business());
CREATE POLICY "Update formulations" ON public.formulations FOR UPDATE TO authenticated USING (public.can_write_business()) WITH CHECK (public.can_write_business());
CREATE POLICY "Delete formulations" ON public.formulations FOR DELETE TO authenticated USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Allow public insert on materiel" ON public.materiel;
DROP POLICY IF EXISTS "Allow public update on materiel" ON public.materiel;
DROP POLICY IF EXISTS "Allow public delete on materiel" ON public.materiel;
CREATE POLICY "Write materiel" ON public.materiel FOR INSERT TO authenticated WITH CHECK (public.can_write_business());
CREATE POLICY "Update materiel" ON public.materiel FOR UPDATE TO authenticated USING (public.can_write_business()) WITH CHECK (public.can_write_business());
CREATE POLICY "Delete materiel" ON public.materiel FOR DELETE TO authenticated USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Allow public insert on laboratoires_mobiles" ON public.laboratoires_mobiles;
DROP POLICY IF EXISTS "Allow public update on laboratoires_mobiles" ON public.laboratoires_mobiles;
DROP POLICY IF EXISTS "Allow public delete on laboratoires_mobiles" ON public.laboratoires_mobiles;
CREATE POLICY "Write laboratoires_mobiles" ON public.laboratoires_mobiles FOR INSERT TO authenticated WITH CHECK (public.can_write_business());
CREATE POLICY "Update laboratoires_mobiles" ON public.laboratoires_mobiles FOR UPDATE TO authenticated USING (public.can_write_business()) WITH CHECK (public.can_write_business());
CREATE POLICY "Delete laboratoires_mobiles" ON public.laboratoires_mobiles FOR DELETE TO authenticated USING (public.is_admin_or_manager());

-- ===== Storage: prevent public listing of logos bucket =====
DROP POLICY IF EXISTS "Logo images are publicly accessible" ON storage.objects;
CREATE POLICY "Authenticated can list logos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'logos');
