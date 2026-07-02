// Client Supabase "détypé" pour les outils qui accèdent à des tables via nom variable.
// Les generics stricts du client généré rejettent .from(<string>) — c'est intentionnel
// et documenté dans notre couche d'outillage AI (tous les noms de tables viennent d'un
// mapping contrôlé DOMAIN_SPECS, jamais d'un input utilisateur brut).
import { supabase } from "@/integrations/supabase/client";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sb = supabase as unknown as any;
