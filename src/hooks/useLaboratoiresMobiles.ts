import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { getRepository, getRepositoryForTable } from "@/lib/repositories";

export type LaboratoireMobile = Tables<"laboratoires_mobiles">;
export type LaboratoireMobileInsert = TablesInsert<"laboratoires_mobiles">;
export type LaboratoireMobileUpdate = TablesUpdate<"laboratoires_mobiles">;

export type LaboratoireMobileWithRelations = LaboratoireMobile & {
  intervenants: Tables<"intervenants"> | null;
  clients: { id: string; nom: string } | null;
  chantiers: { id: string; nom: string; ville: string | null } | null;
};

const DETAIL_SELECT = `*, intervenants(*), clients(id, nom), chantiers(id, nom, ville)`;
const detailRepo = getRepositoryForTable<LaboratoireMobileWithRelations>("laboratoires_mobiles", {
  defaultSelect: DETAIL_SELECT,
});
const crudRepo = getRepositoryForTable<LaboratoireMobile>("laboratoires_mobiles");
const statsRepo = getRepositoryForTable<{ statut: string }>("laboratoires_mobiles", { defaultSelect: "statut" });
const chantiersRepo = getRepositoryForTable<{ chantier_id: string | null }>("laboratoires_mobiles", { defaultSelect: "chantier_id" });

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
    queryFn: async () => (await detailRepo.getById(id, DETAIL_SELECT)).data,
    enabled: !!id,
  });
}

export function useCreateLaboratoireMobile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (labo: LaboratoireMobileInsert) => {
      const { data, error } = await crudRepo.insert(labo as Partial<LaboratoireMobile>);
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["laboratoires-mobiles"] }),
  });
}

export function useUpdateLaboratoireMobile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: LaboratoireMobileUpdate & { id: string }) => {
      const { data, error } = await crudRepo.update(updates as Partial<LaboratoireMobile>, { id });
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["laboratoires-mobiles"] }),
  });
}

export function useDeleteLaboratoireMobile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await crudRepo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["laboratoires-mobiles"] }),
  });
}

export function useLaboratoiresMobilesStats() {
  return useQuery({
    queryKey: ["laboratoires-mobiles-stats"],
    queryFn: async () => {
      const { data } = await statsRepo.list();
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
      const { data } = await chantiersRepo.list();
      return new Set(data.filter(r => r.chantier_id).map(r => r.chantier_id as string));
    },
  });
}

