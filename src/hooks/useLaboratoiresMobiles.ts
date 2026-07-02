import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type LaboratoireMobile = Tables<"laboratoires_mobiles">;
export type LaboratoireMobileInsert = TablesInsert<"laboratoires_mobiles">;
export type LaboratoireMobileUpdate = TablesUpdate<"laboratoires_mobiles">;

export type LaboratoireMobileWithRelations = LaboratoireMobile & {
  intervenants: Tables<"intervenants"> | null;
  clients: { id: string; nom: string } | null;
  chantiers: { id: string; nom: string; ville: string | null } | null;
};

import { getRepository } from "@/lib/repositories";

// Utilise la couche Repository partagée avec LTPC AI.
export function useLaboratoiresMobiles() {
  return useQuery({
    queryKey: ["laboratoires-mobiles"],
    queryFn: async () => {
      const { data } = await getRepository("laboratoires_mobiles").list();
      return data as unknown as LaboratoireMobileWithRelations[];
    },
  });
}

export function useLaboratoireMobile(id: string) {
  return useQuery({
    queryKey: ["laboratoires-mobiles", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("laboratoires_mobiles")
        .select(`
          *,
          intervenants(*),
          clients(id, nom),
          chantiers(id, nom, ville)
        `)
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data as LaboratoireMobileWithRelations | null;
    },
    enabled: !!id,
  });
}

export function useCreateLaboratoireMobile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (labo: LaboratoireMobileInsert) => {
      const { data, error } = await supabase
        .from("laboratoires_mobiles")
        .insert(labo)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laboratoires-mobiles"] });
    },
  });
}

export function useUpdateLaboratoireMobile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: LaboratoireMobileUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("laboratoires_mobiles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laboratoires-mobiles"] });
    },
  });
}

export function useDeleteLaboratoireMobile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("laboratoires_mobiles")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laboratoires-mobiles"] });
    },
  });
}

export function useLaboratoiresMobilesStats() {
  return useQuery({
    queryKey: ["laboratoires-mobiles-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("laboratoires_mobiles")
        .select("statut");
      
      if (error) throw error;
      
      return {
        total: data.length,
        disponible: data.filter(l => l.statut === "disponible").length,
        deploye: data.filter(l => l.statut === "deploye").length,
        maintenance: data.filter(l => l.statut === "maintenance").length,
      };
    },
  });
}

// Hook to get chantiers already used in laboratoires mobiles
export function useLaboMobileChantiers() {
  return useQuery({
    queryKey: ["laboratoires-mobiles-chantiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("laboratoires_mobiles")
        .select("chantier_id")
        .not("chantier_id", "is", null);
      
      if (error) throw error;
      return new Set(data.map(l => l.chantier_id as string));
    },
  });
}