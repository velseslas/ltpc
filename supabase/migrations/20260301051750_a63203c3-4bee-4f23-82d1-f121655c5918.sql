DROP POLICY "Authenticated users can read entreprise" ON public.entreprise;
CREATE POLICY "Anyone can read entreprise" ON public.entreprise FOR SELECT USING (true);