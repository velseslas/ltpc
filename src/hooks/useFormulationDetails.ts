import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FormulationIngredient {
  quantite: number | null;
  produit_nom: string | null;
  producteur_nom: string | null;
}

export interface FormulationDetails {
  nom: string;
  ciment: FormulationIngredient;
  eau: FormulationIngredient;
  adjuvant: FormulationIngredient;
  sable_concasse: FormulationIngredient;
  sable_fin: FormulationIngredient;
  gravillons1: FormulationIngredient;
  gravier2: FormulationIngredient;
  gravier3: FormulationIngredient;
}

export function useFormulationDetails(formulationId: string | null | undefined) {
  return useQuery({
    queryKey: ["formulation-details", formulationId],
    queryFn: async (): Promise<FormulationDetails | null> => {
      if (!formulationId) return null;

      const { data: f, error } = await supabase
        .from("formulations")
        .select(`
          nom,
          ciment_quantite, ciment_produit_id, ciment_producteur_id,
          eau_quantite, eau_produit_id, eau_producteur_id,
          adjuvant_quantite, adjuvant_produit_id, adjuvant_producteur_id,
          sable_concasse_quantite, sable_concasse_produit_id, sable_concasse_producteur_id,
          sable_fin_quantite, sable_fin_produit_id, sable_fin_producteur_id,
          gravillons1_quantite, gravillons1_produit_id, gravillons1_producteur_id,
          gravier2_quantite, gravier2_produit_id, gravier2_producteur_id,
          gravier3_quantite, gravier3_produit_id, gravier3_producteur_id
        `)
        .eq("id", formulationId)
        .maybeSingle();

      if (error || !f) return null;

      // Helper to fetch product name
      const fetchProduitNom = async (id: string | null): Promise<string | null> => {
        if (!id) return null;
        const { data: prod } = await supabase.from("produits").select("nom").eq("id", id).maybeSingle();
        return prod?.nom || null;
      };

      // Helper to fetch producer name by type
      const fetchProducteurNom = async (id: string | null, type: string): Promise<string | null> => {
        if (!id) return null;
        let result: { nom: string } | null = null;
        switch (type) {
          case "cimenterie": {
            const { data } = await supabase.from("cimenteries").select("nom").eq("id", id).maybeSingle();
            result = data;
            break;
          }
          case "source_eau": {
            const { data } = await supabase.from("sources_eau").select("nom").eq("id", id).maybeSingle();
            result = data;
            break;
          }
          case "adjuvant": {
            const { data } = await supabase.from("adjuvants").select("nom").eq("id", id).maybeSingle();
            result = data;
            break;
          }
          default: {
            const { data } = await supabase.from("carrieres").select("nom").eq("id", id).maybeSingle();
            result = data;
            break;
          }
        }
        return result?.nom || null;
      };

      // Fetch all names in parallel
      const [
        ciment_produit, ciment_producteur,
        eau_produit, eau_producteur,
        adjuvant_produit, adjuvant_producteur,
        sable_concasse_produit, sable_concasse_producteur,
        sable_fin_produit, sable_fin_producteur,
        gravillons1_produit, gravillons1_producteur,
        gravier2_produit, gravier2_producteur,
        gravier3_produit, gravier3_producteur,
      ] = await Promise.all([
        fetchProduitNom(f.ciment_produit_id),
        fetchProducteurNom(f.ciment_producteur_id, "cimenterie"),
        fetchProduitNom(f.eau_produit_id),
        fetchProducteurNom(f.eau_producteur_id, "source_eau"),
        fetchProduitNom(f.adjuvant_produit_id),
        fetchProducteurNom(f.adjuvant_producteur_id, "adjuvant"),
        fetchProduitNom(f.sable_concasse_produit_id),
        fetchProducteurNom(f.sable_concasse_producteur_id, "carriere"),
        fetchProduitNom(f.sable_fin_produit_id),
        fetchProducteurNom(f.sable_fin_producteur_id, "carriere"),
        fetchProduitNom(f.gravillons1_produit_id),
        fetchProducteurNom(f.gravillons1_producteur_id, "carriere"),
        fetchProduitNom(f.gravier2_produit_id),
        fetchProducteurNom(f.gravier2_producteur_id, "carriere"),
        fetchProduitNom(f.gravier3_produit_id),
        fetchProducteurNom(f.gravier3_producteur_id, "carriere"),
      ]);

      return {
        nom: f.nom || "-",
        ciment: { quantite: f.ciment_quantite, produit_nom: ciment_produit, producteur_nom: ciment_producteur },
        eau: { quantite: f.eau_quantite, produit_nom: eau_produit, producteur_nom: eau_producteur },
        adjuvant: { quantite: f.adjuvant_quantite, produit_nom: adjuvant_produit, producteur_nom: adjuvant_producteur },
        sable_concasse: { quantite: f.sable_concasse_quantite, produit_nom: sable_concasse_produit, producteur_nom: sable_concasse_producteur },
        sable_fin: { quantite: f.sable_fin_quantite, produit_nom: sable_fin_produit, producteur_nom: sable_fin_producteur },
        gravillons1: { quantite: f.gravillons1_quantite, produit_nom: gravillons1_produit, producteur_nom: gravillons1_producteur },
        gravier2: { quantite: f.gravier2_quantite, produit_nom: gravier2_produit, producteur_nom: gravier2_producteur },
        gravier3: { quantite: f.gravier3_quantite, produit_nom: gravier3_produit, producteur_nom: gravier3_producteur },
      };
    },
    enabled: !!formulationId,
  });
}
