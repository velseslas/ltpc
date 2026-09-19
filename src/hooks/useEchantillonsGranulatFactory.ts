import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface EchantillonGranulatBase {
  id: string;
  numero: number;
  carriere_id: string | null;
  client_id: string | null;
  chantier_id: string | null;
  produit: string;
  date_reception: string;
  date_essai: string | null;
  statut: "termine" | "en-cours" | "a-faire";
  resultats: Json | null;
  observations: string | null;
  operateur_id: string | null;
  created_at: string;
  updated_at: string;
  carrieres?: {
    id: string;
    nom: string;
    ville: string | null;
  } | null;
  clients?: {
    id: string;
    nom: string;
  } | null;
  chantiers?: {
    id: string;
    nom: string;
  } | null;
  intervenants?: {
    id: string;
    nom: string;
    prenom: string;
    signature_url?: string | null;
  } | null;
}

// Map essai types to table names
const essaiTypeToTable: Record<string, string> = {
  "equivalent-sable": "echantillons_equivalent_sable",
  "bleu-methylene": "echantillons_bleu_methylene",
  "matiere-organique": "echantillons_matiere_organique",
  "granulometrie": "echantillons_granulometrie",
  "masse-volumique": "echantillons_masse_volumique",
  "forme-granulats": "echantillons_forme_granulats",
  "teneur-eau": "echantillons_teneur_eau",
  "los-angeles": "echantillons_los_angeles",
  "micro-deval": "echantillons_micro_deval",
  "ecrasement": "echantillons_ecrasement",
  "friabilite": "echantillons_friabilite",
};

// Map essai types to prefixes for numbering
const essaiTypeToPrefix: Record<string, string> = {
  "equivalent-sable": "ES",
  "bleu-methylene": "BM",
  "matiere-organique": "MO",
  "granulometrie": "GR",
  "masse-volumique": "MV",
  "forme-granulats": "FG",
  "teneur-eau": "TE",
  "los-angeles": "LA",
  "micro-deval": "MD",
  "ecrasement": "EC",
  "friabilite": "FR",
};

export function getTableName(essaiType: string): string {
  return essaiTypeToTable[essaiType] || "echantillons_granulat";
}

export function getPrefix(essaiType: string): string {
  return essaiTypeToPrefix[essaiType] || "ECH";
}

// Format numero with prefix and leading zeros (minimum 3 digits)
export function formatNumero(numero: number, essaiType?: string): string {
  const numStr = String(numero).padStart(3, "0");
  if (essaiType) {
    const prefix = getPrefix(essaiType);
    return `${prefix}-${numStr}`;
  }
  return numStr;
}

export function useEchantillonsGranulatByType(essaiType: string) {
  const tableName = getTableName(essaiType);
  
  return useQuery({
    queryKey: ["echantillons", tableName],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from(tableName)
        .select(`
          *,
          carrieres (
            id,
            nom,
            ville
          ),
          clients (
            id,
            nom
          ),
          chantiers (
            id,
            nom
          ),
          intervenants (
            id,
            nom,
            prenom
          )
        `)
        .order("numero", { ascending: true });

      if (error) throw error;
      return data as EchantillonGranulatBase[];
    },
  });
}

export function useEchantillonGranulatById(essaiType: string, id: string | undefined) {
  const tableName = getTableName(essaiType);
  
  return useQuery({
    queryKey: ["echantillon", tableName, id],
    queryFn: async () => {
      const runQuery = async () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from(tableName)
          .select(`
            *,
            carrieres ( id, nom, ville ),
            clients ( id, nom ),
            chantiers ( id, nom ),
            intervenants ( id, nom, prenom, signature_url )
          `)
          .eq("id", id!)
          .maybeSingle();

      let { data, error } = await runQuery();

      // If JWT expired, force-refresh the session and retry once
      if (error && (error.code === "PGRST303" || /jwt/i.test(error.message || ""))) {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError) {
          ({ data, error } = await runQuery());
        }
      }

      if (error) throw error;
      return data as EchantillonGranulatBase | null;
    },
    enabled: !!id,
    retry: (failureCount, err: unknown) => {
      const e = err as { code?: string; message?: string } | null;
      if (e?.code === "PGRST303" || (e?.message && /jwt/i.test(e.message))) {
        return failureCount < 2;
      }
      return failureCount < 1;
    },
  });
}


export function useCreateEchantillonGranulatByType(essaiType: string) {
  const queryClient = useQueryClient();
  const tableName = getTableName(essaiType);

  return useMutation({
    mutationFn: async (echantillon: {
      carriere_id?: string;
      client_id?: string | null;
      chantier_id?: string | null;
      produit: string;
      date_reception: string;
      statut?: string;
      observations?: string;
      operateur_id?: string;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from(tableName)
        .insert(echantillon)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["echantillons", tableName] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUpdateEchantillonGranulatByType(essaiType: string) {
  const queryClient = useQueryClient();
  const tableName = getTableName(essaiType);

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      carriere_id?: string;
      client_id?: string | null;
      chantier_id?: string | null;
      produit?: string;
      date_reception?: string;
      statut?: string;
      observations?: string;
      operateur_id?: string;
      resultats?: Json;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from(tableName)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["echantillons", tableName] });
      queryClient.invalidateQueries({ queryKey: ["echantillon", tableName, variables.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteEchantillonGranulatByType(essaiType: string) {
  const queryClient = useQueryClient();
  const tableName = getTableName(essaiType);

  return useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from(tableName)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["echantillons", tableName] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
