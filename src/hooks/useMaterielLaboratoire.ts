import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";

// ---- Matériel ----
const materielRepo = getRepositoryForTable<any>("materiel_laboratoire", {
  defaultSelect: "*",
  defaultOrder: { column: "nom", ascending: true },
});

export function useMaterielList() {
  return useQuery({
    queryKey: ["materiel-laboratoire"],
    queryFn: async () => {
      const { data } = await materielRepo.list();
      return data;
    },
  });
}

export function useMaterielItem(id: string) {
  return useQuery({
    queryKey: ["materiel-laboratoire", id],
    queryFn: async () => {
      const { data } = await materielRepo.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const res = await materielRepo.insert(item);
      if (res.error) throw new Error(res.error);
      return res.data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materiel-laboratoire"] }),
  });
}

export function useUpdateMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const res = await materielRepo.update(updates, { id });
      if (res.error) throw new Error(res.error);
      return res.data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materiel-laboratoire"] }),
  });
}

export function useDeleteMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await materielRepo.delete({ id });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materiel-laboratoire"] }),
  });
}

// ---- Affectation ----
const affectationRepo = getRepositoryForTable<any>("affectation_materiel", {
  defaultSelect: "*, materiel_laboratoire(id, nom, reference), chantiers(id, nom, client_id, clients(id, nom)), intervenants(id, nom, prenom)",
  defaultOrder: { column: "date_debut", ascending: false },
});
const affectationDetailSelect = "*, materiel_laboratoire(id, nom, reference, marque, modele, numero_serie), chantiers(id, nom), intervenants(id, nom, prenom)";

export function useAffectationMateriel() {
  return useQuery({
    queryKey: ["affectation-materiel"],
    queryFn: async () => (await affectationRepo.list()).data,
  });
}

export function useAffectationMaterielItem(id: string) {
  return useQuery({
    queryKey: ["affectation-materiel", id],
    queryFn: async () => (await affectationRepo.getById(id, affectationDetailSelect)).data,
    enabled: !!id,
  });
}

export function useCreateAffectationMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const res = await affectationRepo.insert(item);
      if (res.error) throw new Error(res.error);
      return res.data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["affectation-materiel"] }),
  });
}

export function useUpdateAffectationMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const res = await affectationRepo.update(updates, { id });
      if (res.error) throw new Error(res.error);
      return res.data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["affectation-materiel"] }),
  });
}

export function useDeleteAffectationMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await affectationRepo.delete({ id });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["affectation-materiel"] }),
  });
}

// ---- Étalonnage ----
const etalonnageRepo = getRepositoryForTable<any>("etalonnage_materiel", {
  defaultSelect: "*, materiel_laboratoire(id, nom, reference)",
  defaultOrder: { column: "date_etalonnage", ascending: false },
});
const etalonnageDetailSelect = "*, materiel_laboratoire(id, nom, reference, marque, modele, numero_serie)";

export function useEtalonnageMateriel() {
  return useQuery({
    queryKey: ["etalonnage-materiel"],
    queryFn: async () => (await etalonnageRepo.list()).data,
  });
}

export function useEtalonnageMaterielItem(id: string) {
  return useQuery({
    queryKey: ["etalonnage-materiel", id],
    queryFn: async () => (await etalonnageRepo.getById(id, etalonnageDetailSelect)).data,
    enabled: !!id,
  });
}

export function useCreateEtalonnageMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const res = await etalonnageRepo.insert(item);
      if (res.error) throw new Error(res.error);
      return res.data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["etalonnage-materiel"] }),
  });
}

export function useUpdateEtalonnageMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const res = await etalonnageRepo.update(updates, { id });
      if (res.error) throw new Error(res.error);
      return res.data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["etalonnage-materiel"] }),
  });
}

export function useDeleteEtalonnageMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await etalonnageRepo.delete({ id });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["etalonnage-materiel"] }),
  });
}

// ---- Maintenance ----
const maintenanceRepo = getRepositoryForTable<any>("maintenance_materiel", {
  defaultSelect: "*, materiel_laboratoire(id, nom, reference)",
  defaultOrder: { column: "date_maintenance", ascending: false },
});
const maintenanceDetailSelect = "*, materiel_laboratoire(id, nom, reference, marque, modele, numero_serie)";

export function useMaintenanceMateriel() {
  return useQuery({
    queryKey: ["maintenance-materiel"],
    queryFn: async () => (await maintenanceRepo.list()).data,
  });
}

export function useMaintenanceMaterielItem(id: string) {
  return useQuery({
    queryKey: ["maintenance-materiel", id],
    queryFn: async () => (await maintenanceRepo.getById(id, maintenanceDetailSelect)).data,
    enabled: !!id,
  });
}

export function useCreateMaintenanceMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const res = await maintenanceRepo.insert(item);
      if (res.error) throw new Error(res.error);
      return res.data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance-materiel"] }),
  });
}

export function useUpdateMaintenanceMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const res = await maintenanceRepo.update(updates, { id });
      if (res.error) throw new Error(res.error);
      return res.data[0];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance-materiel"] }),
  });
}

export function useDeleteMaintenanceMateriel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await maintenanceRepo.delete({ id });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance-materiel"] }),
  });
}
