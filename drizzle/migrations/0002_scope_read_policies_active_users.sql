-- Replace tautological SELECT policies with the standard active-employee predicate.
-- Keeps read access for every active employee (user's prior decision) while removing USING(true).

DROP POLICY IF EXISTS "Read lettres_engagement" ON public.lettres_engagement;
CREATE POLICY "Read lettres_engagement"
  ON public.lettres_engagement
  FOR SELECT TO authenticated
  USING (public.is_active_app_user() OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "materiel_laboratoire_std_select" ON public.materiel_laboratoire;
CREATE POLICY "materiel_laboratoire_std_select"
  ON public.materiel_laboratoire
  FOR SELECT TO authenticated
  USING (public.is_active_app_user() OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "affectation_materiel_select" ON public.affectation_materiel;
CREATE POLICY "affectation_materiel_select"
  ON public.affectation_materiel
  FOR SELECT TO authenticated
  USING (public.is_active_app_user() OR public.has_role(auth.uid(), 'super_admin'));
