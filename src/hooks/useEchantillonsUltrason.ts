import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";

export type EchantillonUltrason = {
  id: string;
  numero: number;
  client_id: string | null;
  chantier_id: string | null;
  operateur_id: string | null;
  ouvrage: string | null;
  partie_ouvrage: string | null;
  mode_transmission: string | null;
  frequence_khz: number | null;
  date_essai: string;
  age_beton_jours: number | null;
  classe_resistance: string | null;
  observations: string | null;
  resultats: unknown;
  statut: string;
  created_at: string;
  updated_at: string;
};

export type EchantillonUltrasonInsert = Omit<EchantillonUltrason, "id" | "numero" | "created_at" | "updated_at">;

export type EchantillonUltrasonWithRelations = EchantillonUltrason & {
  clients: { id: string; nom: string } | null;
  chantiers: { id: string; nom: string } | null;
};

const SELECT_WITH_RELATIONS = `*, clients(id, nom), chantiers(id, nom)`;

const repo = getRepositoryForTable<EchantillonUltrasonWithRelations>("echantillons_ultrason", {
  defaultSelect: SELECT_WITH_RELATIONS,
  defaultOrder: { column: "numero", ascending: true },
});

export function useEchantillonsUltrason() {
  return useQuery({
    queryKey: ["echantillons-ultrason"],
    queryFn: async () => (await repo.list()).data,
  });
}

export function useEchantillonUltrason(id: string) {
  return useQuery({
    queryKey: ["echantillons-ultrason", id],
    queryFn: async () => (await repo.getById(id, SELECT_WITH_RELATIONS)).data,
    enabled: !!id,
  });
}

export function useCreateEchantillonUltrason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: EchantillonUltrasonInsert) => {
      const { data: result, error } = await repo.insert(data as Partial<EchantillonUltrasonWithRelations>);
      if (error) throw new Error(error);
      return result[0];
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["echantillons-ultrason"] }); },
  });
}

export function useUpdateEchantillonUltrason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EchantillonUltrasonInsert> & { id: string }) => {
      const { data, error } = await repo.update(updates as Partial<EchantillonUltrasonWithRelations>, { id });
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["echantillons-ultrason"] }); },
  });
}

export function useDeleteEchantillonUltrason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["echantillons-ultrason"] }); },
  });
}
