-- Attestations
DROP POLICY IF EXISTS "Read attestations" ON public.attestations_bonne_execution;
CREATE POLICY "attestations_select_business" ON public.attestations_bonne_execution
  FOR SELECT TO authenticated USING (public.can_write_business());

-- Bons de commande prestataire
DROP POLICY IF EXISTS "bons_commande_prestataire_select" ON public.bons_commande_prestataire;
CREATE POLICY "bons_commande_prestataire_select" ON public.bons_commande_prestataire
  FOR SELECT TO authenticated USING (public.can_write_business());

-- Articles de contrat
DROP POLICY IF EXISTS "contrat_articles_select" ON public.contrat_articles;
CREATE POLICY "contrat_articles_select" ON public.contrat_articles
  FOR SELECT TO authenticated USING (public.can_write_business());

-- Laboratoires mobiles
DROP POLICY IF EXISTS "laboratoires_mobiles_std_select" ON public.laboratoires_mobiles;
CREATE POLICY "laboratoires_mobiles_std_select" ON public.laboratoires_mobiles
  FOR SELECT TO authenticated USING (public.can_write_business());

-- Lignes bon de commande
DROP POLICY IF EXISTS "Read lignes_bon_commande" ON public.lignes_bon_commande;
CREATE POLICY "lignes_bon_commande_select_business" ON public.lignes_bon_commande
  FOR SELECT TO authenticated USING (public.can_write_business());

-- Lignes devis
DROP POLICY IF EXISTS "Read lignes_devis" ON public.lignes_devis;
CREATE POLICY "lignes_devis_select_business" ON public.lignes_devis
  FOR SELECT TO authenticated USING (public.can_write_business());

-- Lignes facture
DROP POLICY IF EXISTS "Read lignes_facture" ON public.lignes_facture;
CREATE POLICY "lignes_facture_select_business" ON public.lignes_facture
  FOR SELECT TO authenticated USING (public.can_write_business());

-- Offres de prix / offres de service (+ articles)
DROP POLICY IF EXISTS "Read offres_prix" ON public.offres_prix;
CREATE POLICY "offres_prix_select_business" ON public.offres_prix
  FOR SELECT TO authenticated USING (public.can_write_business());

DROP POLICY IF EXISTS "Read offres_service" ON public.offres_service;
CREATE POLICY "offres_service_select_business" ON public.offres_service
  FOR SELECT TO authenticated USING (public.can_write_business());

DROP POLICY IF EXISTS "Authenticated can view offre service articles" ON public.offre_service_articles;
CREATE POLICY "offre_service_articles_select_business" ON public.offre_service_articles
  FOR SELECT TO authenticated USING (public.can_write_business());