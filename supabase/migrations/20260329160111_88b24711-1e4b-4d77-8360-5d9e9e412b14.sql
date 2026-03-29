
-- Junction table: client <-> maître d'ouvrage
CREATE TABLE public.client_maitres_ouvrage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  maitre_ouvrage_id UUID NOT NULL REFERENCES public.maitres_ouvrage(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, maitre_ouvrage_id)
);

-- Junction table: client <-> maître d'œuvre
CREATE TABLE public.client_maitres_oeuvre (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  maitre_oeuvre_id UUID NOT NULL REFERENCES public.maitres_oeuvre(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, maitre_oeuvre_id)
);

-- RLS
ALTER TABLE public.client_maitres_ouvrage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_maitres_oeuvre ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON public.client_maitres_ouvrage FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.client_maitres_oeuvre FOR ALL TO authenticated USING (true) WITH CHECK (true);
