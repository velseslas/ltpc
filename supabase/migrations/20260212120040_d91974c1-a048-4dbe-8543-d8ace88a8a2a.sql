
-- Add mot_de_passe column to utilisateurs
ALTER TABLE public.utilisateurs ADD COLUMN IF NOT EXISTS mot_de_passe text;

-- Add public/anon SELECT policy on utilisateurs for login page
CREATE POLICY "Allow anon read on utilisateurs"
ON public.utilisateurs
FOR SELECT
TO anon
USING (true);

-- Add public/anon SELECT policy on postes for login page form
CREATE POLICY "Allow anon read on postes"
ON public.postes
FOR SELECT
TO anon
USING (true);

-- Add public/anon SELECT policy on intervenants for login page form
CREATE POLICY "Allow anon read on intervenants"
ON public.intervenants
FOR SELECT
TO anon
USING (true);
