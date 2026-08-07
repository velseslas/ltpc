import { useQuery } from "@tanstack/react-query";
import { callRpc } from "@/lib/repositories/registry";

export interface DatabaseTableStat {
  nom: string;
  enregistrements: number;
  taille_bytes: number;
  index: number;
  rls: boolean;
  policies: number;
  seq_scan: number;
  idx_scan: number;
  last_autovacuum: string | null;
}

export interface DatabaseStats {
  version: string;
  database_size_bytes: number;
  started_at: string;
  now: string;
  connections_active: number;
  connections_max: number;
  cache_hit_ratio: number;
  index_usage_ratio: number;
  transactions_committed: number;
  transactions_rolled_back: number;
  deadlocks: number;
  tables: DatabaseTableStat[];
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return "0 o";
  const units = ["o", "Ko", "Mo", "Go", "To"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function useDatabaseStats() {
  return useQuery({
    queryKey: ["database_stats"],
    queryFn: async (): Promise<DatabaseStats> => {
      const { data, error } = await callRpc<DatabaseStats>("get_database_stats");
      if (error) throw new Error(error);
      if (!data) throw new Error("Aucune donnée renvoyée par la base");
      return data;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
