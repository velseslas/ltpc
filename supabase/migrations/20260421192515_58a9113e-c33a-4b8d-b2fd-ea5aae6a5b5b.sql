CREATE TABLE public.offre_service_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offre_service_id UUID NOT NULL REFERENCES public.offres_service(id) ON DELETE CASCADE,
  article_number INTEGER NOT NULL,
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (offre_service_id, article_number)
);

ALTER TABLE public.offre_service_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view offre service articles"
ON public.offre_service_articles FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Admins can insert offre service articles"
ON public.offre_service_articles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can update offre service articles"
ON public.offre_service_articles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can delete offre service articles"
ON public.offre_service_articles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_offre_service_articles_updated_at
BEFORE UPDATE ON public.offre_service_articles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_offre_service_articles_offre_id ON public.offre_service_articles(offre_service_id);