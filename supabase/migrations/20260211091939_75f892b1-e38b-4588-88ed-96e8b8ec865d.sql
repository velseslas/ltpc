
-- Table pour les paiements par chèque
CREATE TABLE public.paiements_cheque (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  numero_cheque TEXT NOT NULL,
  banque TEXT,
  montant NUMERIC NOT NULL DEFAULT 0,
  date_emission DATE NOT NULL DEFAULT CURRENT_DATE,
  date_echeance DATE,
  statut TEXT NOT NULL DEFAULT 'en_attente',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.paiements_cheque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on paiements_cheque" ON public.paiements_cheque FOR SELECT USING (true);
CREATE POLICY "Allow public insert on paiements_cheque" ON public.paiements_cheque FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on paiements_cheque" ON public.paiements_cheque FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on paiements_cheque" ON public.paiements_cheque FOR DELETE USING (true);

CREATE TRIGGER update_paiements_cheque_updated_at BEFORE UPDATE ON public.paiements_cheque FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table pour les paiements en espèce
CREATE TABLE public.paiements_espece (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  montant NUMERIC NOT NULL DEFAULT 0,
  date_paiement DATE NOT NULL DEFAULT CURRENT_DATE,
  numero_recu TEXT,
  statut TEXT NOT NULL DEFAULT 'recu',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.paiements_espece ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on paiements_espece" ON public.paiements_espece FOR SELECT USING (true);
CREATE POLICY "Allow public insert on paiements_espece" ON public.paiements_espece FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on paiements_espece" ON public.paiements_espece FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on paiements_espece" ON public.paiements_espece FOR DELETE USING (true);

CREATE TRIGGER update_paiements_espece_updated_at BEFORE UPDATE ON public.paiements_espece FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
