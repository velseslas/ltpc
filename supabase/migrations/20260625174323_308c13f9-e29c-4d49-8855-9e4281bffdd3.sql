
DROP POLICY IF EXISTS "Staff can read intervenants" ON public.intervenants;
CREATE POLICY "Authenticated can read intervenants"
ON public.intervenants
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);
