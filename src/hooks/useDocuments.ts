import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DocumentBase {
  id: string;
  client_id: string | null;
  chantier_id: string | null;
  numero: string | null;
  titre: string;
  date_document: string;
  observations: string | null;
  document_url: string | null;
  document_nom: string | null;
  statut: string;
  created_at: string;
  updated_at: string;
}

export interface LettreEngagement extends DocumentBase {
  montant: number | null;
}

export interface OffreService extends DocumentBase {
  description: string | null;
}

export interface OffrePrix extends DocumentBase {
  montant_ht: number | null;
  montant_ttc: number | null;
}

export interface AttestationBonneExecution extends DocumentBase {
  date_debut: string | null;
  date_fin: string | null;
}

type TableName = "lettres_engagement" | "offres_service" | "offres_prix" | "attestations_bonne_execution";

function useDocumentsCRUD<T extends DocumentBase>(tableName: TableName) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [tableName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select("*, clients:client_id(nom), chantiers:chantier_id(nom)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as (T & { clients: { nom: string } | null; chantiers: { nom: string } | null })[];
    },
  });

  const create = useMutation({
    mutationFn: async (doc: Omit<T, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from(tableName)
        .insert(doc as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tableName] });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...rest }: { id: string } & Partial<T>) => {
      const { data, error } = await supabase
        .from(tableName)
        .update(rest as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tableName] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(tableName).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tableName] });
    },
  });

  return { query, create, update, remove };
}

export function useLettresEngagement() {
  const queryClient = useQueryClient();
  const base = useDocumentsCRUD<LettreEngagement>("lettres_engagement");

  const query = useQuery({
    queryKey: ["lettres_engagement"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lettres_engagement")
        .select("*, clients:client_id(nom, representant, adresse, ville), chantiers:chantier_id(nom)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as (LettreEngagement & { clients: { nom: string; representant: string | null; adresse: string | null; ville: string | null } | null; chantiers: { nom: string } | null })[];
    },
  });

  return { ...base, query };
}

export function useOffresService() {
  return useDocumentsCRUD<OffreService>("offres_service");
}

export function useOffresPrix() {
  return useDocumentsCRUD<OffrePrix>("offres_prix");
}

export function useAttestationsBonneExecution() {
  return useDocumentsCRUD<AttestationBonneExecution>("attestations_bonne_execution");
}

export function useDossierAdministratif() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["documents_administratifs_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents_administratifs")
        .select("*, clients:client_id(nom)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((item: any) => ({
        ...item,
        date_document: item.created_at,
        numero: null,
        observations: null,
        statut: "brouillon",
        chantiers: null,
      }));
    },
  });

  const create = useMutation({
    mutationFn: async (doc: any) => {
      const { data, error } = await supabase
        .from("documents_administratifs")
        .insert({
          titre: doc.titre,
          client_id: doc.client_id || null,
          document_url: doc.document_url || null,
          document_nom: doc.document_nom || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents_administratifs_list"] });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...rest }: any) => {
      const { data, error } = await supabase
        .from("documents_administratifs")
        .update({
          titre: rest.titre,
          client_id: rest.client_id || null,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents_administratifs_list"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documents_administratifs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents_administratifs_list"] });
    },
  });

  return { query, create, update, remove };
}

export function useContratsDocuments() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["contrats_documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contrats")
        .select("*, clients:client_id(nom, representant, adresse, ville), chantiers:chantier_id(nom)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((item: any) => ({
        ...item,
        date_document: item.date_signature,
        numero: null,
        observations: null,
        date_debut: item.date_signature,
        date_fin: item.date_expiration,
      }));
    },
  });

  const create = useMutation({
    mutationFn: async (doc: any) => {
      const { data, error } = await supabase
        .from("contrats")
        .insert({
          titre: doc.titre,
          client_id: doc.client_id || null,
          chantier_id: doc.chantier_id || null,
          statut: doc.statut || "brouillon",
          date_signature: doc.date_debut || doc.date_document || null,
          date_expiration: doc.date_fin || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contrats_documents"] });
      queryClient.invalidateQueries({ queryKey: ["contrats"] });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...rest }: any) => {
      const { data, error } = await supabase
        .from("contrats")
        .update({
          titre: rest.titre,
          client_id: rest.client_id || null,
          chantier_id: rest.chantier_id || null,
          statut: rest.statut,
          date_signature: rest.date_debut || rest.date_document || null,
          date_expiration: rest.date_fin || null,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contrats_documents"] });
      queryClient.invalidateQueries({ queryKey: ["contrats"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contrats").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contrats_documents"] });
      queryClient.invalidateQueries({ queryKey: ["contrats"] });
    },
  });

  return { query, create, update, remove };
}
