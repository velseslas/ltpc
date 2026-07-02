import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getDefaultProvider } from "../_shared/ai-provider.ts";
import { SYSTEM_INGENIEUR_LABO, promptGenerationRapport } from "../_shared/ai-prompts.ts";
import { logAICall, getUserIdFromReq } from "../_shared/ai-log.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { rapport_id } = await req.json();
    if (!rapport_id) return new Response(JSON.stringify({ error: "rapport_id requis" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, key);

    const { data: r } = await admin.from("rapports_techniques").select("*, clients(nom), chantiers(nom)").eq("id", rapport_id).maybeSingle();
    if (!r) return new Response(JSON.stringify({ error: "Rapport introuvable" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: questions } = await admin.from("rapport_questions_ia").select("question, reponse_utilisateur").eq("rapport_id", rapport_id);
    const reponsesQuestions = (questions ?? []).filter(q => q.reponse_utilisateur).map(q => ({ question: q.question, reponse: q.reponse_utilisateur as string }));
    const ctx = (r.contexte_auto ?? {}) as Record<string, unknown>;

    const userPrompt = promptGenerationRapport({
      description: r.description_probleme,
      analyse: (r.analyse_ia ?? null) as Record<string, unknown> | null,
      contexte: {
        client: (r as { clients?: { nom?: string } | null }).clients?.nom ?? null,
        entreprise: r.entreprise,
        chantier: (r as { chantiers?: { nom?: string } | null }).chantiers?.nom ?? null,
        projet: r.projet,
        materiaux: (ctx.materiaux as string[]) ?? [],
      },
      reponsesQuestions,
    });

    const provider = getDefaultProvider();
    const userId = getUserIdFromReq(req);
    try {
      const result = await provider.call({
        messages: [
          { role: "system", content: SYSTEM_INGENIEUR_LABO },
          { role: "user", content: userPrompt },
        ],
        responseFormat: "json",
        temperature: 0.4,
      });

      const parsed = (result.parsed ?? {}) as { titre?: string };
      await admin.from("rapports_techniques").update({
        contenu_rapport: result.parsed as never,
        titre: parsed.titre ?? r.titre ?? "Rapport technique",
        statut: r.statut === "brouillon" ? "en_cours" : r.statut,
      }).eq("id", rapport_id);

      await logAICall({ rapport_id, operation: "generer", provider: provider.name, model: result.model, prompt_system: SYSTEM_INGENIEUR_LABO, prompt_user: userPrompt, raw_response: result.raw, parsed_json: result.parsed, duration_ms: result.durationMs, tokens_input: result.tokensInput, tokens_output: result.tokensOutput, tokens_total: result.tokensTotal, created_by: userId });

      return new Response(JSON.stringify({ contenu: result.parsed, meta: { model: result.model, durationMs: result.durationMs, tokensTotal: result.tokensTotal } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await logAICall({ rapport_id, operation: "generer", provider: "lovable-ai", model: "google/gemini-2.5-flash", prompt_user: userPrompt, status: "error", error: msg, created_by: userId });
      const status = msg.startsWith("AI_RATE_LIMIT") ? 429 : msg.startsWith("AI_CREDITS_EXHAUSTED") ? 402 : 500;
      return new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
