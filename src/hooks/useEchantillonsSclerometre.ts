import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";

export type EchantillonSclerometre = {
  id: string;
  numero: number;
  client_id: string | null;
  chantier_id: string | null;
  operateur_id: string | null;
  ouvrage: string | null;
  partie_ouvrage: string | null;
  orientation: string | null;
  date_essai: string;
  age_beton_jours: number | null;
  classe_resistance: string | null;
  observations: string | null;
  resultats: unknown;
  statut: string;
  created_at: string;
  updated_at: string;
};

export type EchantillonSclerometreInsert = Omit<EchantillonSclerometre, "id" | "numero" | "created_at" | "updated_at">;

export type EchantillonSclerometreWithRelations = EchantillonSclerometre & {
  clients: { id: string; nom: string } | null;
  chantiers: { id: string; nom: string } | null;
};

const SELECT_WITH_RELATIONS = `*, clients(id, nom), chantiers(id, nom)`;

const repo = getRepositoryForTable<EchantillonSclerometreWithRelations>("echantillons_sclerometre", {
  defaultSelect: SELECT_WITH_RELATIONS,
  defaultOrder: { column: "numero", ascending: true },
});

export function useEchantillonsSclerometre() {
  return useQuery({
    queryKey: ["echantillons-sclerometre"],
    queryFn: async () => (await repo.list()).data,
  });
}

export function useEchantillonSclerometre(id: string) {
  return useQuery({
    queryKey: ["echantillons-sclerometre", id],
    queryFn: async () => (await repo.getById(id, SELECT_WITH_RELATIONS)).data,
    enabled: !!id,
  });
}

export function useCreateEchantillonSclerometre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: EchantillonSclerometreInsert) => {
      const { data: result, error } = await repo.insert(data as Partial<EchantillonSclerometreWithRelations>);
      if (error) throw new Error(error);
      return result[0];
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["echantillons-sclerometre"] }); },
  });
}

export function useUpdateEchantillonSclerometre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EchantillonSclerometreInsert> & { id: string }) => {
      const { data, error } = await repo.update(updates as Partial<EchantillonSclerometreWithRelations>, { id });
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["echantillons-sclerometre"] }); },
  });
}

export function useDeleteEchantillonSclerometre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["echantillons-sclerometre"] }); },
  });
}
