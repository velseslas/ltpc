CREATE TABLE public.engagement_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  engagement_id UUID NOT NULL REFERENCES public.lettres_engagement(id) ON DELETE CASCADE,
  article_number INTEGER NOT NULL,
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(engagement_id, article_number)
);

ALTER TABLE public.engagement_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to engagement_articles" ON public.engagement_articles
  FOR ALL USING (true) WITH CHECK (true);