
-- Table Maîtres de l'ouvrage (MOA)
CREATE TABLE public.maitres_ouvrage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  contact TEXT,
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  ville TEXT,
  secteur TEXT,
  statut TEXT NOT NULL DEFAULT 'actif',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table Maîtres d'œuvre (MOE)
CREATE TABLE public.maitres_oeuvre (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  contact TEXT,
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  ville TEXT,
  specialite TEXT,
  statut TEXT NOT NULL DEFAULT 'actif',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maitres_ouvrage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maitres_oeuvre ENABLE ROW LEVEL SECURITY;

-- RLS policies for maitres_ouvrage
CREATE POLICY "Authenticated users can view maitres_ouvrage" ON public.maitres_ouvrage FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert maitres_ouvrage" ON public.maitres_ouvrage FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update maitres_ouvrage" ON public.maitres_ouvrage FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete maitres_ouvrage" ON public.maitres_ouvrage FOR DELETE TO authenticated USING (true);

-- RLS policies for maitres_oeuvre
CREATE POLICY "Authenticated users can view maitres_oeuvre" ON public.maitres_oeuvre FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert maitres_oeuvre" ON public.maitres_oeuvre FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update maitres_oeuvre" ON public.maitres_oeuvre FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete maitres_oeuvre" ON public.maitres_oeuvre FOR DELETE TO authenticated USING (true);
