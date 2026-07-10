import { useEffect, useState } from "react";
import { callEdgeFunction, getRepositoryForTable } from "@/lib/repositories";
import { toast } from "sonner";

export interface AiAlert {
  id: string;
  code: string;
  severity: "info" | "warning" | "critique";
  title: string;
  message: string;
  source_type: string | null;
  source_id: string | null;
  metadata: Record<string, unknown>;
  status: "open" | "dismissed" | "resolved";
  created_at: string;
  resolved_at: string | null;
}

export interface DailySummary {
  id: string;
  summary_date: string;
  contenu: string;
  stats: Record<string, number>;
  alerts_count: number;
  generated_at: string;
}

const alertsRepo = getRepositoryForTable<AiAlert>("ai_alerts", {
  defaultSelect: "*",
});
const summariesRepo = getRepositoryForTable<DailySummary>("ai_daily_summaries", {
  defaultSelect: "*",
  defaultOrder: { column: "summary_date", ascending: false },
});

export function useProactiveAlerts() {
  const [alerts, setAlerts] = useState<AiAlert[]>([]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    const [a, s] = await Promise.all([
      alertsRepo.list({
        filters: { status: "open" },
        order: { column: "severity", ascending: true },
        limit: 100,
      }),
      summariesRepo.list({ limit: 1 }),
    ]);
    setAlerts(a.data);
    setSummary(s.data[0] ?? null);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runScan = async () => {
    setRunning(true);
    try {
      const { data, error } = await callEdgeFunction<{ alerts?: number }>("ltpc-ai-monitor", { source: "manual" });
      if (error) throw new Error(error);
      toast.success(`Scan terminé — ${data?.alerts ?? 0} alerte(s).`);
      await load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setRunning(false); }
  };

  const dismiss = async (id: string) => {
    const res = await alertsRepo.update({ status: "dismissed", resolved_at: new Date().toISOString() } as any, { id });
    if (res.error) { toast.error(res.error); return; }
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };
  const resolve = async (id: string) => {
    const res = await alertsRepo.update({ status: "resolved", resolved_at: new Date().toISOString() } as any, { id });
    if (res.error) { toast.error(res.error); return; }
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return { alerts, summary, loading, running, runScan, dismiss, resolve, reload: load };
}
