// LOT 14.2 — Envoi des notifications LTPC : persistance + Push Web (VAPID).
//
// Sécurité :
//   • L'appelant doit être authentifié (JWT valide).
//   • L'appelant ne fournit JAMAIS le contenu de la notification : uniquement
//     un type d'événement connu + l'identifiant de la ressource. Le titre, le
//     message, le lien et les destinataires sont reconstruits côté serveur.
//   • La clé privée VAPID reste dans les secrets serveur.
//   • Les abonnements invalides (404/410) sont désactivés automatiquement.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import webpush from "npm:web-push@3.6.7";
import { requireAuth } from "../_shared/auth-guard.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:contact@ltpc.dz";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const ALLOWED_EVENTS = [
  "affectation_creee",
  "rapport_valide",
  "rapport_a_valider",
  "echantillon_cree",
] as const;
type AllowedEvent = (typeof ALLOWED_EVENTS)[number];

interface BuiltNotification {
  recipients: string[]; // auth user ids
  type: string;
  category: string;
  priority: string;
  title: string;
  message: string;
  link: string;
}

/** Résout les user_id auth à partir d'un intervenant. */
async function userIdsForIntervenant(intervenantId: string | null): Promise<string[]> {
  if (!intervenantId) return [];
  const { data } = await admin.from("utilisateurs")
    .select("user_id").eq("intervenant_id", intervenantId).eq("statut", "actif");
  return (data ?? []).map((u: { user_id: string | null }) => u.user_id).filter((v): v is string => !!v);
}

/** Résout les user_id auth ayant l'un des rôles donnés. */
async function userIdsForRoles(roles: string[]): Promise<string[]> {
  const { data } = await admin.from("user_roles").select("user_id").in("role", roles);
  return Array.from(new Set((data ?? []).map((r: { user_id: string }) => r.user_id)));
}

async function buildNotification(event: AllowedEvent, resourceId: string): Promise<BuiltNotification | null> {
  if (event === "affectation_creee") {
    const { data: aff } = await admin.from("affectations")
      .select("id, intervenant_id, chantier_id, date_debut, chantiers:chantier_id(nom), intervenants:intervenant_id(nom, prenom)")
      .eq("id", resourceId).maybeSingle();
    if (!aff) return null;
    const chantierNom = (aff.chantiers as { nom?: string } | null)?.nom ?? "un chantier";
    const recipients = await userIdsForIntervenant(aff.intervenant_id as string | null);
    return {
      recipients,
      type: "affectation_creee",
      category: "intervenants",
      priority: "info",
      title: "Nouvelle affectation",
      message: `Vous êtes affecté au chantier ${chantierNom}${aff.date_debut ? ` à partir du ${aff.date_debut}` : ""}.`,
      link: aff.chantier_id ? `/intervenant/chantiers/${aff.chantier_id}` : "/rh/affectations",
    };
  }

  if (event === "rapport_valide" || event === "rapport_a_valider") {
    const { data: rap } = await admin.from("rapports_techniques")
      .select("id, numero, titre, statut, technicien_id, created_by").eq("id", resourceId).maybeSingle();
    if (!rap) return null;
    const label = rap.numero ?? rap.titre ?? "Rapport technique";

    if (event === "rapport_valide") {
      const recipients = Array.from(new Set(
        [rap.technicien_id, rap.created_by].filter((v): v is string => !!v)
      ));
      return {
        recipients,
        type: "rapport_valide",
        category: "rapports",
        priority: "success",
        title: "Rapport validé",
        message: `${label} vient d'être validé.`,
        link: `/essais/rapports-techniques/${rap.id}`,
      };
    }

    const recipients = await userIdsForRoles(["super_admin", "admin", "manager", "ingenieur"]);
    return {
      recipients,
      type: "rapport_a_valider",
      category: "rapports",
      priority: "warning",
      title: "Rapport à valider",
      message: `${label} est en attente de validation.`,
      link: `/essais/rapports-techniques/${rap.id}`,
    };
  }

  return null;
}

/** Envoie le Push à tous les abonnements actifs d'un utilisateur. */
async function pushToUser(userId: string, payload: Record<string, unknown>): Promise<{ sent: number; pruned: number }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return { sent: 0, pruned: 0 };
  const { data: subs } = await admin.from("push_subscriptions")
    .select("id, endpoint, p256dh, auth").eq("user_id", userId).eq("is_active", true);
  let sent = 0, pruned = 0;
  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      );
      sent++;
      await admin.from("push_subscriptions")
        .update({ last_used_at: new Date().toISOString() }).eq("id", s.id);
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await admin.from("push_subscriptions").update({ is_active: false }).eq("id", s.id);
        pruned++;
      } else {
        // Journalisation non sensible : ni endpoint complet, ni clés, ni VAPID.
        console.warn("[push-dispatch] envoi échoué", { status: status ?? "unknown" });
      }
    }
  }
  return { sent, pruned };
}

/** Respecte les préférences utilisateur (canaux, catégories, heures calmes). */
function pushAllowed(prefs: Record<string, unknown> | null, category: string): { inapp: boolean; push: boolean } {
  if (!prefs) return { inapp: true, push: true };
  const disabled = (prefs.disabled_categories as string[] | null) ?? [];
  if (disabled.includes(category)) return { inapp: false, push: false };
  let push = Boolean(prefs.push_enabled);
  const qs = prefs.quiet_hours_start as string | null;
  const qe = prefs.quiet_hours_end as string | null;
  if (push && qs && qe) {
    const now = new Date().toISOString().slice(11, 16);
    const inQuiet = qs <= qe ? now >= qs && now < qe : now >= qs || now < qe;
    if (inQuiet) push = false;
  }
  return { inapp: prefs.inapp_enabled !== false, push };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json().catch(() => ({}));
    const event = body?.event as string;
    const resourceId = body?.resource_id as string;

    if (!ALLOWED_EVENTS.includes(event as AllowedEvent) || typeof resourceId !== "string" || resourceId.length < 10) {
      return new Response(JSON.stringify({ error: "Requête invalide" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    }

    const built = await buildNotification(event as AllowedEvent, resourceId);
    if (!built) {
      return new Response(JSON.stringify({ error: "Ressource introuvable" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let created = 0, pushSent = 0, pruned = 0;
    for (const uid of built.recipients) {
      const { data: prefs } = await admin.from("notification_preferences")
        .select("*").eq("user_id", uid).maybeSingle();
      const allow = pushAllowed(prefs as Record<string, unknown> | null, built.category);
      if (!allow.inapp && !allow.push) continue;

      const { data: notif } = await admin.from("notifications").insert({
        user_id: uid,
        type: built.type,
        category: built.category,
        priority: built.priority,
        title: built.title,
        message: built.message,
        link: built.link,
        data: { resource_id: resourceId, event },
        source: "workflow",
      }).select("id").single();
      created++;

      if (allow.push) {
        const r = await pushToUser(uid, {
          title: built.title,
          body: built.message,
          notification_id: notif?.id ?? null,
          target_url: built.link,
          icon: "/icon-192.png",
          badge: "/icon-96.png",
        });
        pushSent += r.sent;
        pruned += r.pruned;
      }
    }

    console.log("[push-dispatch]", { event, recipients: built.recipients.length, created, pushSent, pruned });

    return new Response(JSON.stringify({ ok: true, created, push_sent: pushSent, pruned }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[push-dispatch] erreur", e instanceof Error ? e.message : String(e));
    return new Response(JSON.stringify({ error: "Erreur interne" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
