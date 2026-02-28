-- Add classe_resistance column to all béton frais tables
ALTER TABLE public.echantillons_affaissement ADD COLUMN classe_resistance text;
ALTER TABLE public.echantillons_temperature ADD COLUMN classe_resistance text;
ALTER TABLE public.echantillons_temps_prise ADD COLUMN classe_resistance text;
ALTER TABLE public.echantillons_teneur_air ADD COLUMN classe_resistance text;