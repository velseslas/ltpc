// LTPC AI — Moteur de surveillance proactive.
// Scanne les données récentes, produit des alertes déterministes et un résumé quotidien.
// Déclenchable via pg_cron ou manuellement depuis le client.
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Severity = "info" | "warning" | "critique";
interface Alert {
  code: string; severity: Severity; title: string; message: string;
  source_type?: string; source_id?: string; metadata?: Record<string, unknown>;
}

function classFromLabel(cls: string | null | undefined): number | null {
  if (!cls) return null;
  const m = cls.match(/C(\d+)\s*\/\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}
function extractResistance(r: Record<string, unknown> | null): number | null {
  if (!r) return null;
  for (const k of ["resistance_moyenne", "resistance", "fc_moyenne", "fc", "moyenne"]) {
    const v = r[k];
    if (typeof v === "number") return v;
    if (typeof v === "string" && !isNaN(Number(v))) return Number(v);
  }
  for (const v of Object.values(r)) {
    if (v && typeof v === "object") { const f = extractResistance(v as Record<string, unknown>); if (f != null) return f; }
  }
  return null;
}

async function scanCompression(admin: ReturnType<typeof createClient>): Promise<Alert[]> {
  const since = new Date(Date.now() - 30 * 86400_000).toISOString();
  const { data } = await admin.from("echantillons_compression")
    .select("id, numero, ouvrage, classe_resistance, resultats, chantier_id, date_essai")
    .gte("date_essai", since).limit(500);
  const alerts: Alert[] = [];
  for (const r of (data ?? []) as Array<Record<string, unknown>>) {
    const fc = extractResistance((r.resultats as Record<string, unknown>) ?? null);
    const fck = classFromLabel(r.classe_resistance as string | null);
    if (fc != null && fck != null && fc < fck - 4) {
      alerts.push({
        code: "COMP_UNDER_CLASS", severity: "critique",
        title: `Essai sous classe : ${r.numero ?? r.id}`,
        message: `Résistance ${fc.toFixed(1)} MPa < fck-4 (${fck - 4} MPa) sur ${r.ouvrage ?? "ouvrage inconnu"}.`,
        source_type: "essai_compression", source_id: r.id as string,
        metadata: { fc, fck, ouvrage: r.ouvrage },
      });
    }
  }
  return alerts;
}

async function scanFormulations(admin: ReturnType<typeof createClient>): Promise<Alert[]> {
  const { data } = await admin.from("formulations")
    .select("id, nom, ciment_calcule, ciment_quantite, eau_calculee, eau_quantite")
    .limit(300);
  const alerts: Alert[] = [];
  for (const f of (data ?? []) as Array<Record<string, unknown>>) {
    const eau = (f.eau_calculee ?? f.eau_quantite) as number | null;
    const cim = (f.ciment_calcule ?? f.ciment_quantite) as number | null;
    if (eau && cim) {
      const ec = eau / cim;
      if (ec > 0.65) {
        alerts.push({
          code: "MIX_EC_HIGH", severity: "warning",
          title: `E/C élevé : ${f.nom ?? f.id}`,
          message: `Rapport E/C = ${ec.toFixed(2)} — durabilité et résistance dégradées.`,
          source_type: "formulation", source_id: f.id as string,
          metadata: { rapport_ec: ec },
        });
      }
    }
  }
  return alerts;
}

async function scanEtalonnage(admin: ReturnType<typeof createClient>): Promise<Alert[]> {
  const soon = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await admin.from("etalonnage_materiel")
    .select("id, materiel_id, date_prochain_etalonnage, materiel_laboratoire:materiel_id(nom, reference)")
    .lte("date_prochain_etalonnage", soon).limit(300);
  const alerts: Alert[] = [];
  for (const e of (data ?? []) as Array<Record<string, unknown>>) {
    const d = e.date_prochain_etalonnage as string | null;
    if (!d) continue;
    const mat = e.materiel_laboratoire as Record<string, unknown> | null;
    const isPast = d < today;
    alerts.push({
      code: isPast ? "MAT_ETAL_EXPIRED" : "MAT_ETAL_SOON",
      severity: isPast ? "critique" : "warning",
      title: `Étalonnage ${isPast ? "expiré" : "à renouveler"} : ${mat?.reference ?? mat?.nom ?? e.materiel_id}`,
      message: `Prochain étalonnage prévu le ${d}.`,
      source_type: "materiel", source_id: e.materiel_id as string,
      metadata: { date_prochain: d, isPast },
    });
  }
  return alerts;
}

async function upsertAlerts(admin: ReturnType<typeof createClient>, alerts: Alert[]) {
  if (!alerts.length) return 0;
  const payload = alerts.map((a) => ({
    code: a.code, severity: a.severity, title: a.title, message: a.message,
    source_type: a.source_type ?? null, source_id: a.source_id ?? null,
    metadata: a.metadata ?? {}, status: "open",
  }));
  const { error } = await admin.from("ai_alerts").upsert(payload, { onConflict: "code,source_type,source_id" });
  if (error) throw error;
  return payload.length;
}

async function narrate(apiKey: string, alerts: Alert[], counts: Record<string, number>): Promise<string> {
  const prompt = `Tu es le copilote LTPC AI. Rédige en français un résumé quotidien (150-200 mots) pour un chef de laboratoire, structuré : constat général → points d'attention → recommandations. Utilise UNIQUEMENT les données fournies, sans inventer.\n\nStatistiques : ${JSON.stringify(counts)}\nAlertes (max 20) : ${JSON.stringify(alerts.slice(0, 20), null, 2)}`;
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash", temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) return `Résumé indisponible (${res.status}). ${alerts.length} alerte(s) détectée(s).`;
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "Résumé vide.";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const _rl = await enforceRateLimit(req, { scope: "ltpc-ai-monitor", userLimit: 10, ipLimit: 20, windowSec: 60 });
  if (_rl) return _rl;
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    const supaUrl = Deno.env.get("SUPABASE_URL");
    const svcKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!apiKey || !supaUrl || !svcKey) throw new Error("Secrets manquants");
    const admin = createClient(supaUrl, svcKey);

    const [compAlerts, mixAlerts, etalAlerts] = await Promise.all([
      scanCompression(admin), scanFormulations(admin), scanEtalonnage(admin),
    ]);
    const all = [...compAlerts, ...mixAlerts, ...etalAlerts];
    await upsertAlerts(admin, all);

    // Auto-résolution des alertes dont l'entité n'est plus à risque : ici, simple stratégie —
    // marquer resolved toute alerte "MAT_ETAL_SOON/EXPIRED" dont le materiel n'apparait plus.
    const activeIds = new Set(etalAlerts.map((a) => a.source_id).filter(Boolean));
    if (activeIds.size >= 0) {
      const { data: openMat } = await admin.from("ai_alerts")
        .select("id, source_id, code").in("code", ["MAT_ETAL_SOON", "MAT_ETAL_EXPIRED"]).eq("status", "open");
      const toResolve = ((openMat ?? []) as Array<{ id: string; source_id: string }>)
        .filter((r) => !activeIds.has(r.source_id)).map((r) => r.id);
      if (toResolve.length) {
        await admin.from("ai_alerts").update({ status: "resolved", resolved_at: new Date().toISOString() }).in("id", toResolve);
      }
    }

    const counts = {
      compression: compAlerts.length,
      formulation: mixAlerts.length,
      etalonnage: etalAlerts.length,
      critique: all.filter((a) => a.severity === "critique").length,
      warning: all.filter((a) => a.severity === "warning").length,
    };
    const contenu = await narrate(apiKey, all, counts);
    const today = new Date().toISOString().slice(0, 10);
    await admin.from("ai_daily_summaries").upsert({
      summary_date: today, contenu, stats: counts, alerts_count: all.length,
      generated_at: new Date().toISOString(),
    }, { onConflict: "summary_date" });

    return new Response(JSON.stringify({ alerts: all.length, counts, summary_date: today }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
