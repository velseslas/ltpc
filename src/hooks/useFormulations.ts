import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Formulation {
  id: string;
  centrale_id: string;
  nom: string;
  sable_concasse_producteur_id: string | null;
  sable_concasse_produit_id: string | null;
  sable_concasse_quantite: number | null;
  sable_fin_producteur_id: string | null;
  sable_fin_produit_id: string | null;
  sable_fin_quantite: number | null;
  gravillons1_producteur_id: string | null;
  gravillons1_produit_id: string | null;
  gravillons1_quantite: number | null;
  gravier2_producteur_id: string | null;
  gravier2_produit_id: string | null;
  gravier2_quantite: number | null;
  gravier3_producteur_id: string | null;
  gravier3_produit_id: string | null;
  gravier3_quantite: number | null;
  ciment_producteur_id: string | null;
  ciment_produit_id: string | null;
  ciment_quantite: number | null;
  adjuvant_producteur_id: string | null;
  adjuvant_produit_id: string | null;
  adjuvant_quantite: number | null;
  eau_producteur_id: string | null;
  eau_produit_id: string | null;
  eau_quantite: number | null;
  created_at: string;
  updated_at: string;
}

export interface FormulationWithDetails extends Formulation {
  sable_concasse_producteur?: { nom: string } | null;
  sable_concasse_produit?: { nom: string } | null;
  sable_fin_producteur?: { nom: string } | null;
  sable_fin_produit?: { nom: string } | null;
  gravillons1_producteur?: { nom: string } | null;
  gravillons1_produit?: { nom: string } | null;
  gravier2_producteur?: { nom: string } | null;
  gravier2_produit?: { nom: string } | null;
  gravier3_producteur?: { nom: string } | null;
  gravier3_produit?: { nom: string } | null;
  ciment_producteur?: { nom: string } | null;
  ciment_produit?: { nom: string } | null;
  adjuvant_producteur?: { nom: string } | null;
  adjuvant_produit?: { nom: string } | null;
  eau_producteur?: { nom: string } | null;
  eau_produit?: { nom: string } | null;
}

async function fetchProducteurNom(id: string | null, type: string): Promise<string | null> {
  if (!id) return null;
  
  let result: { nom: string } | null = null;
  
  switch (type) {
    case "carriere": {
      const { data } = await supabase.from("carrieres").select("nom").eq("id", id).maybeSingle();
      result = data;
      break;
    }
    case "cimenterie": {
      const { data } = await supabase.from("cimenteries").select("nom").eq("id", id).maybeSingle();
      result = data;
      break;
    }
    case "adjuvant": {
      const { data } = await supabase.from("adjuvants").select("nom").eq("id", id).maybeSingle();
      result = data;
      break;
    }
    case "source_eau": {
      const { data } = await supabase.from("sources_eau").select("nom").eq("id", id).maybeSingle();
      result = data;
      break;
    }
  }
  
  return result?.nom || null;
}

async function fetchProduitNom(id: string | null): Promise<string | null> {
  if (!id) return null;
  const { data } = await supabase.from("produits").select("nom").eq("id", id).maybeSingle();
  return data?.nom || null;
}

export function useAllFormulations() {
  return useQuery({
    queryKey: ["formulations-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formulations")
        .select("id, nom, centrale_id")
        .order("nom", { ascending: true });
      
      if (error) throw error;
      return data as { id: string; nom: string; centrale_id: string }[];
    },
  });
}

export function useFormulations(centraleId: string) {
  return useQuery({
    queryKey: ["formulations", centraleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formulations")
        .select("*")
        .eq("centrale_id", centraleId)
        .order("nom", { ascending: true });
      
      if (error) throw error;
      
      // Fetch all produit names in parallel
      const formulations = data as Formulation[];
      const enrichedFormulations: FormulationWithDetails[] = await Promise.all(
        formulations.map(async (f) => {
          const [
            sable_concasse_producteur,
            sable_concasse_produit,
            sable_fin_producteur,
            sable_fin_produit,
            gravillons1_producteur,
            gravillons1_produit,
            gravier2_producteur,
            gravier2_produit,
            gravier3_producteur,
            gravier3_produit,
            ciment_producteur,
            ciment_produit,
            adjuvant_producteur,
            adjuvant_produit,
            eau_producteur,
            eau_produit,
          ] = await Promise.all([
            fetchProducteurNom(f.sable_concasse_producteur_id, "carriere"),
            fetchProduitNom(f.sable_concasse_produit_id),
            fetchProducteurNom(f.sable_fin_producteur_id, "carriere"),
            fetchProduitNom(f.sable_fin_produit_id),
            fetchProducteurNom(f.gravillons1_producteur_id, "carriere"),
            fetchProduitNom(f.gravillons1_produit_id),
            fetchProducteurNom(f.gravier2_producteur_id, "carriere"),
            fetchProduitNom(f.gravier2_produit_id),
            fetchProducteurNom(f.gravier3_producteur_id, "carriere"),
            fetchProduitNom(f.gravier3_produit_id),
            fetchProducteurNom(f.ciment_producteur_id, "cimenterie"),
            fetchProduitNom(f.ciment_produit_id),
            fetchProducteurNom(f.adjuvant_producteur_id, "adjuvant"),
            fetchProduitNom(f.adjuvant_produit_id),
            fetchProducteurNom(f.eau_producteur_id, "source_eau"),
            fetchProduitNom(f.eau_produit_id),
          ]);

          return {
            ...f,
            sable_concasse_producteur: sable_concasse_producteur ? { nom: sable_concasse_producteur } : null,
            sable_concasse_produit: sable_concasse_produit ? { nom: sable_concasse_produit } : null,
            sable_fin_producteur: sable_fin_producteur ? { nom: sable_fin_producteur } : null,
            sable_fin_produit: sable_fin_produit ? { nom: sable_fin_produit } : null,
            gravillons1_producteur: gravillons1_producteur ? { nom: gravillons1_producteur } : null,
            gravillons1_produit: gravillons1_produit ? { nom: gravillons1_produit } : null,
            gravier2_producteur: gravier2_producteur ? { nom: gravier2_producteur } : null,
            gravier2_produit: gravier2_produit ? { nom: gravier2_produit } : null,
            gravier3_producteur: gravier3_producteur ? { nom: gravier3_producteur } : null,
            gravier3_produit: gravier3_produit ? { nom: gravier3_produit } : null,
            ciment_producteur: ciment_producteur ? { nom: ciment_producteur } : null,
            ciment_produit: ciment_produit ? { nom: ciment_produit } : null,
            adjuvant_producteur: adjuvant_producteur ? { nom: adjuvant_producteur } : null,
            adjuvant_produit: adjuvant_produit ? { nom: adjuvant_produit } : null,
            eau_producteur: eau_producteur ? { nom: eau_producteur } : null,
            eau_produit: eau_produit ? { nom: eau_produit } : null,
          };
        })
      );
      
      return enrichedFormulations;
    },
    enabled: !!centraleId,
  });
}

export function useFormulation(id: string) {
  return useQuery({
    queryKey: ["formulation", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formulations")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Formulation | null;
    },
    enabled: !!id,
  });
}

export function useCreateFormulation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formulation: Omit<Formulation, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("formulations")
        .insert(formulation)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["formulations", variables.centrale_id] });
    },
  });
}

export function useUpdateFormulation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...formulation }: Partial<Formulation> & { id: string }) => {
      const { data, error } = await supabase
        .from("formulations")
        .update(formulation)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["formulations", data.centrale_id] });
      queryClient.invalidateQueries({ queryKey: ["formulation", data.id] });
    },
  });
}

export function useDeleteFormulation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, centraleId }: { id: string; centraleId: string }) => {
      const { error } = await supabase
        .from("formulations")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["formulations", variables.centraleId] });
    },
  });
}
