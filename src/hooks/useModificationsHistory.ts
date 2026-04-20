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
  restored_at: string | null;
  restored_by: string | null;
  restored_by_name: string | null;
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
      const { error } = await (supabase as any).rpc("restore_essai_field", {
        _table_name: entry.table_name,
        _record_id: entry.record_id,
        _field_name: entry.field_name,
        _old_value: entry.old_value,
        _history_id: entry.id,
      });
      if (error) throw error;
    },
    onSuccess: (_d, entry) => {
      qc.invalidateQueries({ queryKey: ["modifications_history", entry.table_name, entry.record_id] });
      qc.invalidateQueries();
      toast.success(`Champ "${entry.field_name}" restauré`);
    },
    onError: (e: any) => toast.error("Erreur lors de la restauration : " + e.message),
  });
}
