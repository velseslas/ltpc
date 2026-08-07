CREATE TABLE public.journal_connexions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  utilisateur_nom text,
  utilisateur_email text,
  connexion_at timestamptz NOT NULL DEFAULT now(),
  deconnexion_at timestamptz,
  duree_secondes integer,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.journal_connexions TO authenticated;
GRANT ALL ON public.journal_connexions TO service_role;

ALTER TABLE public.journal_connexions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own connexions"
ON public.journal_connexions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own connexions"
ON public.journal_connexions FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Read own or admin all connexions"
ON public.journal_connexions FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE INDEX idx_journal_connexions_user ON public.journal_connexions(user_id);
CREATE INDEX idx_journal_connexions_date ON public.journal_connexions(connexion_at DESC);

CREATE TRIGGER trg_journal_connexions_updated_at
BEFORE UPDATE ON public.journal_connexions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();