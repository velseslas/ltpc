import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

export function useProactiveAlerts() {
  const [alerts, setAlerts] = useState<AiAlert[]>([]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    const [a, s] = await Promise.all([
      supabase.from("ai_alerts").select("*").eq("status", "open").order("severity", { ascending: true }).order("created_at", { ascending: false }).limit(100),
      supabase.from("ai_daily_summaries").select("*").order("summary_date", { ascending: false }).limit(1).maybeSingle(),
    ]);
    setAlerts((a.data ?? []) as unknown as AiAlert[]);
    setSummary((s.data ?? null) as unknown as DailySummary | null);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runScan = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("ltpc-ai-monitor", { body: { source: "manual" } });
      if (error) throw error;
      toast.success(`Scan terminé — ${(data as { alerts?: number })?.alerts ?? 0} alerte(s).`);
      await load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setRunning(false); }
  };

  const dismiss = async (id: string) => {
    const { error } = await supabase.from("ai_alerts").update({ status: "dismissed", resolved_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };
  const resolve = async (id: string) => {
    const { error } = await supabase.from("ai_alerts").update({ status: "resolved", resolved_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return { alerts, summary, loading, running, runScan, dismiss, resolve, reload: load };
}
