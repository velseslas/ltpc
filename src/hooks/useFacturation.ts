import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ---- Factures ----
export function useFactures() {
  return useQuery({
    queryKey: ["factures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("factures")
        .select("*, clients(id, nom), chantiers(id, nom)")
        .order("date_emission", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useFacture(id: string | undefined) {
  return useQuery({
    queryKey: ["factures", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("factures")
        .select("*, clients(id, nom), chantiers(id, nom), lignes_facture(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateFacture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase.from("factures").insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["factures"] }),
  });
}

export function useUpdateFacture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...item }: any) => {
      const { data, error } = await supabase.from("factures").update(item).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["factures"] }),
  });
}

export function useDeleteFacture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("factures").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["factures"] }),
  });
}

// ---- Lignes Facture ----
export function useCreateLigneFacture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase.from("lignes_facture").insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["factures"] }),
  });
}

export function useDeleteLigneFacture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lignes_facture").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["factures"] }),
  });
}

// ---- Devis ----
export function useDevis() {
  return useQuery({
    queryKey: ["devis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("devis")
        .select("*, clients(id, nom), chantiers(id, nom)")
        .order("date_emission", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateDevis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase.from("devis").insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devis"] }),
  });
}

export function useUpdateDevis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...item }: any) => {
      const { data, error } = await supabase.from("devis").update(item).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devis"] }),
  });
}

export function useDeleteDevis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("devis").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devis"] }),
  });
}

// ---- Bons de Commande ----
export function useBonsCommande() {
  return useQuery({
    queryKey: ["bons-commande"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bons_commande")
        .select("*, clients(id, nom), chantiers(id, nom)")
        .order("date_commande", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateBonCommande() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase.from("bons_commande").insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bons-commande"] }),
  });
}

export function useDeleteBonCommande() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bons_commande").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bons-commande"] }),
  });
}

// ---- Paiements Espèce ----
export function usePaiementsEspece() {
  return useQuery({
    queryKey: ["paiements-espece"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paiements_espece")
        .select("*, clients(id, nom)")
        .order("date_paiement", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePaiementEspece() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase.from("paiements_espece").insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paiements-espece"] }),
  });
}

export function useDeletePaiementEspece() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("paiements_espece").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paiements-espece"] }),
  });
}

// ---- Paiements Virement ----
export function usePaiementsVirement() {
  return useQuery({
    queryKey: ["paiements-virement"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paiements_virement")
        .select("*, clients(id, nom), factures(id, numero)")
        .order("date_virement", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePaiementVirement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase.from("paiements_virement").insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paiements-virement"] }),
  });
}

export function useDeletePaiementVirement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("paiements_virement").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paiements-virement"] }),
  });
}

// ---- Stats agrégées ----
export function useFacturationStats() {
  const { data: factures } = useFactures();
  const { data: devis } = useDevis();
  const { data: bonsCommande } = useBonsCommande();
  const { data: especes } = usePaiementsEspece();
  const { data: virements } = usePaiementsVirement();

  const totalCA = factures?.reduce((sum: number, f: any) => sum + (Number(f.montant_ttc) || 0), 0) || 0;
  const totalPaye = (especes?.reduce((s: number, e: any) => s + (Number(e.montant) || 0), 0) || 0)
    + (virements?.reduce((s: number, v: any) => s + (Number(v.montant) || 0), 0) || 0);
  const totalImpayes = totalCA - totalPaye;
  const facturesEnCours = factures?.filter((f: any) => f.statut === 'envoyee' || f.statut === 'en_attente').length || 0;

  return {
    totalCA,
    totalPaye,
    totalImpayes: totalImpayes > 0 ? totalImpayes : 0,
    nbFactures: factures?.length || 0,
    nbDevis: devis?.length || 0,
    nbBonsCommande: bonsCommande?.length || 0,
    facturesEnCours,
    nbPaiements: (especes?.length || 0) + (virements?.length || 0),
  };
}
