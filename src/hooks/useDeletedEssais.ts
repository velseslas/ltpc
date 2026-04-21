import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

export function useDeletedEssais() {
  return useQuery({
    queryKey: ["essais_deleted"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("essais_deleted")
        .select("*")
        .order("deleted_at", { ascending: false });
      if (error) throw error;
      return data as DeletedEssaiEntry[];
    },
  });
}

export function useRestoreDeletedEssai() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await (supabase as any).rpc("restore_deleted_essai", {
        _deleted_id: entryId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["essais_deleted"] });
      qc.invalidateQueries();
      toast.success("Essai restauré avec succès");
    },
    onError: (e: any) => toast.error("Erreur lors de la restauration : " + e.message),
  });
}
