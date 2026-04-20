import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ModificationEntry {
  id: string;
  table_name: string;
  record_id: string;
  field_name: string;
  old_value: any;
  new_value: any;
  modified_by: string | null;
  modified_by_name: string | null;
  modified_at: string;
}

export function useModificationsHistory(tableName: string, recordId?: string) {
  return useQuery({
    queryKey: ["modifications_history", tableName, recordId],
    enabled: !!recordId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("essais_modifications_history")
        .select("*")
        .eq("table_name", tableName)
        .eq("record_id", recordId!)
        .order("modified_at", { ascending: false });
      if (error) throw error;
      return data as ModificationEntry[];
    },
  });
}

export function useRestoreField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: ModificationEntry) => {
      // Restaurer la valeur ancienne sur le champ
      const updatePayload: Record<string, any> = {
        [entry.field_name]: entry.old_value,
      };
      const { error } = await (supabase as any)
        .from(entry.table_name)
        .update(updatePayload)
        .eq("id", entry.record_id);
      if (error) throw error;

      // Supprimer l'entrée d'historique restaurée pour éviter le doublon
      await supabase
        .from("essais_modifications_history")
        .delete()
        .eq("id", entry.id);
    },
    onSuccess: (_d, entry) => {
      qc.invalidateQueries({ queryKey: ["modifications_history", entry.table_name, entry.record_id] });
      qc.invalidateQueries();
      toast.success(`Champ "${entry.field_name}" restauré`);
    },
    onError: (e: any) => toast.error("Erreur lors de la restauration : " + e.message),
  });
}
