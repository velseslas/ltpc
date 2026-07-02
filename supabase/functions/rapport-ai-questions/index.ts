import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getDefaultProvider } from "../_shared/ai-provider.ts";
import { SYSTEM_INGENIEUR_LABO, promptQuestionsIntelligentes } from "../_shared/ai-prompts.ts";
import { logAICall, getUserIdFromReq } from "../_shared/ai-log.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { rapport_id } = await req.json();
    if (!rapport_id) return new Response(JSON.stringify({ error: "rapport_id requis" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, key);

    const { data: r } = await admin.from("rapports_techniques").select("*, rapport_categories(nom)").eq("id", rapport_id).maybeSingle();
    if (!r) return new Response(JSON.stringify({ error: "Rapport introuvable" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const analyse = (r.analyse_ia ?? {}) as { informationsManquantes?: string[] };
    const manquantes = analyse.informationsManquantes ?? [];
    if (!manquantes.length) {
      return new Response(JSON.stringify({ questions: [], message: "Aucune information manquante détectée" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userPrompt = promptQuestionsIntelligentes({
      description: r.description_probleme,
      informationsManquantes: manquantes,
      categorie: (r as { rapport_categories?: { nom?: string } | null }).rapport_categories?.nom ?? null,
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

      const parsed = (result.parsed ?? {}) as { questions?: Array<{ question: string; importance?: string; categorie?: string }> };
      const questions = parsed.questions ?? [];

      // Replace existing unanswered
      await admin.from("rapport_questions_ia").delete().eq("rapport_id", rapport_id).is("reponse_utilisateur", null);
      if (questions.length) {
        const rows = questions.map((q, i) => ({
          rapport_id,
          question: q.question,
          ordre: i + 1,
          meta: { importance: q.importance, categorie: q.categorie } as never,
        }));
        await admin.from("rapport_questions_ia").insert(rows as never);
      }

      await logAICall({ rapport_id, operation: "questions", provider: provider.name, model: result.model, prompt_system: SYSTEM_INGENIEUR_LABO, prompt_user: userPrompt, raw_response: result.raw, parsed_json: result.parsed, duration_ms: result.durationMs, tokens_input: result.tokensInput, tokens_output: result.tokensOutput, tokens_total: result.tokensTotal, created_by: userId });

      return new Response(JSON.stringify({ questions }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await logAICall({ rapport_id, operation: "questions", provider: "lovable-ai", model: "google/gemini-2.5-flash", prompt_user: userPrompt, status: "error", error: msg, created_by: userId });
      const status = msg.startsWith("AI_RATE_LIMIT") ? 429 : msg.startsWith("AI_CREDITS_EXHAUSTED") ? 402 : 500;
      return new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
