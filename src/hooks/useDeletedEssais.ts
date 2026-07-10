import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { callRpc, getRepositoryForTable } from "@/lib/repositories";
import { toast } from "sonner";

export interface DeletedEssaiEntry {
  id: string;
  table_name: string;
  record_id: string;
  record_data: any;
  numero: number | null;
  essai_label: string | null;
  deleted_by: string | null;
  deleted_by_name: string | null;
  deleted_at: string;
  restored_at: string | null;
  restored_by: string | null;
  restored_by_name: string | null;
}

const deletedRepo = getRepositoryForTable<DeletedEssaiEntry>("essais_deleted", {
  defaultSelect: "*",
  defaultOrder: { column: "deleted_at", ascending: false },
});

export function useDeletedEssais() {
  return useQuery({
    queryKey: ["essais_deleted"],
    queryFn: async () => {
      const { data } = await deletedRepo.list();
      return data;
    },
  });
}

export function useRestoreDeletedEssai() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await callRpc("restore_deleted_essai", { _deleted_id: entryId });
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["essais_deleted"] });
      qc.invalidateQueries();
      toast.success("Essai restauré avec succès");
    },
    onError: (e: any) => toast.error("Erreur lors de la restauration : " + e.message),
  });
}
