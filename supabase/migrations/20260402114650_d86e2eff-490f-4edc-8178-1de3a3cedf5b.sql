CREATE TABLE public.contrat_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contrat_id UUID REFERENCES public.contrats(id) ON DELETE CASCADE NOT NULL,
  article_number INTEGER NOT NULL,
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contrat_id, article_number)
);

ALTER TABLE public.contrat_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to contrat_articles" ON public.contrat_articles FOR ALL USING (true) WITH CHECK (true);