// Phase 3-ter — Migré vers BaseRepository (via getRepositoryForTable).
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories/registry";

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

export interface LettreEngagement extends DocumentBase { montant: number | null }
export interface OffreService extends DocumentBase { description: string | null }
export interface OffrePrix extends DocumentBase { montant_ht: number | null; montant_ttc: number | null }
export interface AttestationBonneExecution extends DocumentBase { date_debut: string | null; date_fin: string | null }

type TableName = "lettres_engagement" | "offres_service" | "offres_prix" | "attestations_bonne_execution";

const STANDARD_SELECT = "*, clients:client_id(nom, representant, adresse, ville), chantiers:chantier_id(nom)";

function repoFor<T>(table: string, select = STANDARD_SELECT) {
  return getRepositoryForTable<T>(table, {
    defaultSelect: select,
    defaultOrder: { column: "created_at", ascending: false },
  });
}

function useDocumentsCRUD<T extends DocumentBase>(tableName: TableName) {
  const queryClient = useQueryClient();
  const repo = repoFor<T & { clients: { nom: string } | null; chantiers: { nom: string } | null }>(tableName);

  const query = useQuery({
    queryKey: [tableName],
    queryFn: async () => (await repo.list()).data,
  });

  const create = useMutation({
    mutationFn: async (doc: Omit<T, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await repo.insert(doc as Partial<T & { clients: null; chantiers: null }>);
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [tableName] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...rest }: { id: string } & Partial<T>) => {
      const { data, error } = await repo.update(rest as Partial<T & { clients: null; chantiers: null }>, { id });
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [tableName] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [tableName] }),
  });

  return { query, create, update, remove };
}

export function useLettresEngagement() {
  return useDocumentsCRUD<LettreEngagement>("lettres_engagement");
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
  const repo = repoFor<Record<string, unknown>>("documents_administratifs", "*, clients:client_id(nom)");

  const query = useQuery({
    queryKey: ["documents_administratifs_list"],
    queryFn: async () => {
      const { data } = await repo.list();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any[]).map((item: any) => ({
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
    mutationFn: async (doc: { titre: string; client_id?: string | null; document_url?: string | null; document_nom?: string | null }) => {
      const { data, error } = await repo.insert({
        titre: doc.titre,
        client_id: doc.client_id || null,
        document_url: doc.document_url || null,
        document_nom: doc.document_nom || null,
      });
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents_administratifs_list"] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...rest }: { id: string; titre: string; client_id?: string | null }) => {
      const { data, error } = await repo.update({
        titre: rest.titre,
        client_id: rest.client_id || null,
      }, { id });
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents_administratifs_list"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents_administratifs_list"] }),
  });

  return { query, create, update, remove };
}

export function useContratsDocuments() {
  const queryClient = useQueryClient();
  const repo = repoFor<Record<string, unknown>>("contrats");

  const query = useQuery({
    queryKey: ["contrats_documents"],
    queryFn: async () => {
      const { data } = await repo.list();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any[]).map((item: any) => ({
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
    mutationFn: async (doc: { titre: string; client_id?: string | null; chantier_id?: string | null; statut?: string; date_debut?: string | null; date_document?: string | null; date_fin?: string | null }) => {
      const { data, error } = await repo.insert({
        titre: doc.titre,
        client_id: doc.client_id || null,
        chantier_id: doc.chantier_id || null,
        statut: doc.statut || "brouillon",
        date_signature: doc.date_debut || doc.date_document || null,
        date_expiration: doc.date_fin || null,
      });
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contrats_documents"] });
      queryClient.invalidateQueries({ queryKey: ["contrats"] });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...rest }: { id: string; titre?: string; client_id?: string | null; chantier_id?: string | null; statut?: string; date_debut?: string | null; date_document?: string | null; date_fin?: string | null }) => {
      const { data, error } = await repo.update({
        titre: rest.titre,
        client_id: rest.client_id || null,
        chantier_id: rest.chantier_id || null,
        statut: rest.statut,
        date_signature: rest.date_debut || rest.date_document || null,
        date_expiration: rest.date_fin || null,
      }, { id });
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contrats_documents"] });
      queryClient.invalidateQueries({ queryKey: ["contrats"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contrats_documents"] });
      queryClient.invalidateQueries({ queryKey: ["contrats"] });
    },
  });

  return { query, create, update, remove };
}
