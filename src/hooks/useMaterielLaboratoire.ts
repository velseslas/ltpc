import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ---- Matériel ----
export function useMaterielList() {
  return useQuery({
    queryKey: ["materiel-laboratoire"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materiel_laboratoire")
        .select("*")
        .order("nom", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useMaterielItem(id: string) {
  return useQuery({
    queryKey: ["materiel-laboratoire", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materiel_laboratoire")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase.from("materiel_laboratoire").insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materiel-laboratoire"] }),
  });
}

export function useUpdateMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from("materiel_laboratoire").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materiel-laboratoire"] }),
  });
}

export function useDeleteMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("materiel_laboratoire").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materiel-laboratoire"] }),
  });
}

// ---- Affectation ----
export function useAffectationMateriel() {
  return useQuery({
    queryKey: ["affectation-materiel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affectation_materiel")
        .select("*, materiel_laboratoire(id, nom, reference), chantiers(id, nom, client_id, clients(id, nom)), intervenants(id, nom, prenom)")
        .order("date_debut", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAffectationMaterielItem(id: string) {
  return useQuery({
    queryKey: ["affectation-materiel", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affectation_materiel")
        .select("*, materiel_laboratoire(id, nom, reference, marque, modele, numero_serie), chantiers(id, nom), intervenants(id, nom, prenom)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateAffectationMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase.from("affectation_materiel").insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["affectation-materiel"] }),
  });
}

export function useUpdateAffectationMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from("affectation_materiel").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["affectation-materiel"] }),
  });
}

export function useDeleteAffectationMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("affectation_materiel").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["affectation-materiel"] }),
  });
}

// ---- Étalonnage ----
export function useEtalonnageMateriel() {
  return useQuery({
    queryKey: ["etalonnage-materiel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("etalonnage_materiel")
        .select("*, materiel_laboratoire(id, nom, reference)")
        .order("date_etalonnage", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useEtalonnageMaterielItem(id: string) {
  return useQuery({
    queryKey: ["etalonnage-materiel", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("etalonnage_materiel")
        .select("*, materiel_laboratoire(id, nom, reference, marque, modele, numero_serie)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateEtalonnageMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase.from("etalonnage_materiel").insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["etalonnage-materiel"] }),
  });
}

export function useUpdateEtalonnageMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from("etalonnage_materiel").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["etalonnage-materiel"] }),
  });
}

export function useDeleteEtalonnageMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("etalonnage_materiel").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["etalonnage-materiel"] }),
  });
}

// ---- Maintenance ----
export function useMaintenanceMateriel() {
  return useQuery({
    queryKey: ["maintenance-materiel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_materiel")
        .select("*, materiel_laboratoire(id, nom, reference)")
        .order("date_maintenance", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useMaintenanceMaterielItem(id: string) {
  return useQuery({
    queryKey: ["maintenance-materiel", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_materiel")
        .select("*, materiel_laboratoire(id, nom, reference, marque, modele, numero_serie)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateMaintenanceMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase.from("maintenance_materiel").insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance-materiel"] }),
  });
}

export function useUpdateMaintenanceMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from("maintenance_materiel").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance-materiel"] }),
  });
}

export function useDeleteMaintenanceMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("maintenance_materiel").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance-materiel"] }),
  });
}
