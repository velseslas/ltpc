// LOT 14.4 — Push serveur des ÉCHÉANCES d'essais de compression (classiques + laboratoires mobiles).
//
// Principes :
//   • La logique métier est la RÉPLIQUE EXACTE de `src/hooks/useNotifications.ts`
//     (même requête, même calcul d'échéance, mêmes titres / messages / liens).
//   • Le périmètre destinataire est la RÉPLIQUE EXACTE de `useCurrentUserChantiers`
//     (technicien/opérateur = ses chantiers uniquement ; autres rôles = périmètre global).
//   • Le Push est un CANAL SUPPLÉMENTAIRE : on ne traite que les utilisateurs qui ont
//     un abonnement Push actif ; les alertes in-app restent calculées côté client et
//     ne sont donc jamais dupliquées dans le centre de notifications.
//   • Idempotence : une échéance (utilisateur + échantillon + type + échéance) n'est
//     poussée qu'une seule fois grâce à `public.echeances_push_log`.
//   • Déclenchement serveur (cron) : ne dépend pas de l'ouverture du navigateur.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import webpush from "npm:web-push@3.6.7";
import { requireAuth, hasAnyRole } from "../_shared/auth-guard.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:contact@ltpc.dz";
const CRON_SECRET = Deno.env.get("ECHEANCES_CRON_SECRET") ?? "";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const CATEGORY = "echeance_compression";
const MS_DAY = 86_400_000;

/** differenceInDays (date-fns) : différence en jours calendaires tronquée. */
function diffInDays(a: Date, b: Date): number {
  return Math.trunc((a.getTime() - b.getTime()) / MS_DAY);
}

interface JourEssai { jour: number; nombre?: number; unite?: string; heures?: number }
interface Resultat { joursEssai?: number; isHeures?: boolean; resistance?: number }

interface Echeance {
  echantillonId: string;
  chantierId: string | null;
  type: "overdue" | "due";
  key: string;
  title: string;
  message: string;
  link: string;
}

/** Réplique exacte du calcul d'échéances de `useNotifications`. */
function buildEcheances(samples: Record<string, unknown>[], mobileLabChantierIds: Set<string>, canValidateMobileLabLink: boolean): Echeance[] {
  const today = new Date();
  const out: Echeance[] = [];

  for (const sample of samples) {
    const isLaboratoireChantier = Boolean(sample.is_laboratoire_chantier);
    const chantierId = (sample.chantier_id as string | null) ?? null;

    if (isLaboratoireChantier && canValidateMobileLabLink && (!chantierId || !mobileLabChantierIds.has(chantierId))) {
      continue;
    }
    if (!sample.date_coulage || !sample.jours_essai) continue;

    const coulageDate = new Date(String(sample.date_coulage));
    const joursEssaiData = (Array.isArray(sample.jours_essai) ? sample.jours_essai : []) as JourEssai[];
    const resultats = (Array.isArray(sample.resultats) ? sample.resultats : []) as Resultat[];

    const clientNom = (sample.clients as { nom?: string } | null)?.nom || "";
    const chantierNom = (sample.chantiers as { nom?: string } | null)?.nom || "";
    const ouvrage = (sample.ouvrage as string | null) || "";
    const detailParts = [clientNom, chantierNom, ouvrage].filter(Boolean).join(" — ");
    const numeroAffiche = isLaboratoireChantier ? (sample.numero_chantier ?? sample.numero) : sample.numero;
    const reference = `EC-${String(numeroAffiche).padStart(3, "0")}`;
    const sampleLink = isLaboratoireChantier && chantierId
      ? `/laboratoires-mobiles/chantier/${chantierId}/echantillon/${sample.id}`
      : `/essais/beton/beton-durci/compression/${sample.id}`;

    const overdueJours: { label: string; daysSince: number }[] = [];
    const dueJours: { label: string; daysUntil: number }[] = [];

    for (const item of joursEssaiData) {
      const isHeures = item.unite === "heures" && typeof item.heures === "number";
      const label = isHeures ? `${item.heures} h` : `${item.jour} J`;

      const done = resultats.filter(
        (r) => !!r.isHeures === isHeures && Number(r.joursEssai) === Number(item.jour) && Number(r.resistance) > 0,
      ).length;
      if (done >= (item.nombre ?? 1)) continue;

      const testDate = isHeures
        ? new Date(coulageDate.getTime() + (item.heures as number) * 3600_000)
        : new Date(coulageDate.getTime() + item.jour * MS_DAY);
      const daysUntilTest = diffInDays(testDate, today);

      if (daysUntilTest < 0) overdueJours.push({ label, daysSince: Math.abs(daysUntilTest) });
      else if (daysUntilTest <= 7) dueJours.push({ label, daysUntil: daysUntilTest });
    }

    if (overdueJours.length > 0) {
      const joursLabel = overdueJours.map((j) => j.label).join(" et ");
      const maxDays = Math.max(...overdueJours.map((j) => j.daysSince));
      out.push({
        echantillonId: String(sample.id),
        chantierId,
        type: "overdue",
        key: joursLabel,
        title: "Échantillon compression en retard",
        message: `${reference} — ${joursLabel} — Échu depuis ${maxDays} jours${detailParts ? `\n${detailParts}` : ""}`,
        link: sampleLink,
      });
    }

    if (dueJours.length > 0) {
      const joursLabel = dueJours.map((j) => j.label).join(" et ");
      const minDays = Math.min(...dueJours.map((j) => j.daysUntil));
      const daysText = minDays === 0 ? "aujourd'hui" : minDays === 1 ? "1 jour" : `${minDays} jours`;
      out.push({
        echantillonId: String(sample.id),
        chantierId,
        type: "due",
        key: joursLabel,
        title: `Échantillon ${joursLabel} — Échéance proche`,
        message: `${reference} — ${joursLabel} — Dans ${daysText}${detailParts ? `\n${detailParts}` : ""}`,
        link: sampleLink,
      });
    }
  }

  return out;
}

/** Réplique exacte de `useCurrentUserChantiers` : chantiers visibles par un intervenant. */
async function chantierIdsForUser(userId: string): Promise<string[]> {
  const { data: users } = await admin.from("utilisateurs").select("intervenant_id").eq("user_id", userId).limit(1);
  const intervenantId = users?.[0]?.intervenant_id as string | null | undefined;
  if (!intervenantId) return [];

  const set = new Set<string>();
  const { data: labos } = await admin.from("laboratoires_mobiles").select("chantier_id").eq("responsable_id", intervenantId);
  for (const l of labos ?? []) if (l.chantier_id) set.add(l.chantier_id as string);

  const { data: affs } = await admin.from("affectations")
    .select("chantier_id, statut, date_fin").eq("intervenant_id", intervenantId);
  for (const a of affs ?? []) {
    const statut = String(a.statut ?? "").toLowerCase();
    if (statut === "inactif" || statut === "termine" || statut === "terminé") continue;
    if (a.date_fin && new Date(a.date_fin as string) < new Date()) continue;
    if (a.chantier_id) set.add(a.chantier_id as string);
  }
  return Array.from(set);
}

/** Préférences utilisateur : mêmes règles que `push-dispatch`. */
function pushAllowed(prefs: Record<string, unknown> | null, category: string): boolean {
  if (!prefs) return true;
  const disabled = (prefs.disabled_categories as string[] | null) ?? [];
  if (disabled.includes(category)) return false;
  if (!prefs.push_enabled) return false;
  const qs = prefs.quiet_hours_start as string | null;
  const qe = prefs.quiet_hours_end as string | null;
  if (qs && qe) {
    const now = new Date().toISOString().slice(11, 16);
    const inQuiet = qs <= qe ? now >= qs && now < qe : now >= qs || now < qe;
    if (inQuiet) return false;
  }
  return true;
}

async function pushToUser(userId: string, payload: Record<string, unknown>): Promise<number> {
  const { data: subs } = await admin.from("push_subscriptions")
    .select("id, endpoint, p256dh, auth").eq("user_id", userId).eq("is_active", true);
  let sent = 0;
  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      );
      sent++;
      await admin.from("push_subscriptions").update({ last_used_at: new Date().toISOString() }).eq("id", s.id);
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await admin.from("push_subscriptions").update({ is_active: false }).eq("id", s.id);
      } else {
        console.warn("[echeances-dispatch] envoi échoué", { status: status ?? "unknown" });
      }
    }
  }
  return sent;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Accès : soit le cron (jeton interne, non exposé au client), soit un administrateur authentifié.
  const cronHeader = req.headers.get("x-cron-secret") ?? "";
  let authorized = CRON_SECRET.length > 0 && cronHeader === CRON_SECRET;
  if (!authorized && cronHeader.length >= 16) {
    const { data: tok } = await admin.from("cron_tokens").select("token").eq("name", "echeances").maybeSingle();
    authorized = !!tok?.token && tok.token === cronHeader;
  }
  if (!authorized) {
    const guard = await requireAuth(req);
    if (!guard.ok) return guard.response;
    authorized = await hasAnyRole(guard.userId, ["super_admin", "admin"]);
    if (!authorized) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    }
    const dryRun = new URL(req.url).searchParams.get("dry_run") === "1";

    // 1. Source métier : identique à `useNotifications`.
    const { data: mobileLabos, error: mobileLabosError } = await admin
      .from("laboratoires_mobiles").select("chantier_id").not("chantier_id", "is", null);
    const mobileLabChantierIds = new Set(
      (mobileLabos ?? []).map((l: { chantier_id: string | null }) => l.chantier_id).filter((v): v is string => !!v),
    );

    const { data: samples } = await admin.from("echantillons_compression")
      .select("id, numero, numero_chantier, statut, date_coulage, jours_essai, resultats, ouvrage, chantier_id, is_laboratoire_chantier, clients:client_id(nom), chantiers:chantier_id(nom)")
      .in("statut", ["a-faire", "en-cours"]);

    const echeances = buildEcheances((samples ?? []) as Record<string, unknown>[], mobileLabChantierIds, !mobileLabosError);

    // 2. Le Push est un canal supplémentaire : seuls les utilisateurs abonnés sont traités.
    const { data: subs } = await admin.from("push_subscriptions").select("user_id").eq("is_active", true);
    const subscribedUsers = Array.from(new Set((subs ?? []).map((s: { user_id: string }) => s.user_id)));

    let evaluated = 0, created = 0, pushSent = 0, skippedDuplicate = 0, skippedPrefs = 0;

    for (const uid of subscribedUsers) {
      const { data: roleRows } = await admin.from("user_roles").select("role").eq("user_id", uid);
      const roles = new Set((roleRows ?? []).map((r: { role: string }) => r.role));
      const isTechnicien = roles.has("technicien") || roles.has("operateur");

      // 3. Périmètre : identique au centre de notifications LTPC.
      let visible = echeances;
      if (isTechnicien) {
        const allowed = new Set(await chantierIdsForUser(uid));
        visible = allowed.size === 0 ? [] : echeances.filter((e) => e.chantierId && allowed.has(e.chantierId));
      }
      evaluated += visible.length;
      if (visible.length === 0) continue;

      const { data: prefs } = await admin.from("notification_preferences").select("*").eq("user_id", uid).maybeSingle();
      if (!pushAllowed(prefs as Record<string, unknown> | null, CATEGORY)) {
        skippedPrefs += visible.length;
        continue;
      }

      for (const e of visible) {
        // 4. Idempotence : l'insertion unique fait office de verrou.
        //    En test à blanc on ne consomme PAS la clé d'idempotence : on se contente
        //    de vérifier si l'échéance a déjà été poussée.
        if (dryRun) {
          const { data: exists } = await admin.from("echeances_push_log").select("id")
            .eq("user_id", uid).eq("echantillon_id", e.echantillonId)
            .eq("echeance_type", e.type).eq("echeance_key", e.key).maybeSingle();
          if (exists) skippedDuplicate++;
          continue;
        }

        const { data: logRow, error: logError } = await admin.from("echeances_push_log").insert({
          user_id: uid,
          echantillon_id: e.echantillonId,
          echeance_type: e.type,
          echeance_key: e.key,
        }).select("id").maybeSingle();

        if (logError || !logRow) { skippedDuplicate++; continue; }

        const { data: notif } = await admin.from("notifications").insert({
          user_id: uid,
          type: e.type === "overdue" ? "overdue_test" : "pending_test",
          category: CATEGORY,
          priority: e.type === "overdue" ? "urgent" : "info",
          title: e.title,
          message: e.message,
          link: e.link,
          data: { echantillon_id: e.echantillonId, echeance: e.key, echeance_type: e.type },
          source: "scheduler",
          // LOT 15.8 — notification metier unique : visible dans la cloche
          // ET diffusee en Push ci-dessous (pas de seconde ligne creee).
          channel: "inapp",
        }).select("id").maybeSingle();
        created++;

        const sent = await pushToUser(uid, {
          title: e.title,
          body: e.message,
          notification_id: notif?.id ?? null,
          target_url: e.link,
          icon: "/icon-192.png",
          badge: "/icon-96.png",
        });
        pushSent += sent;
        await admin.from("echeances_push_log")
          .update({ notification_id: notif?.id ?? null, push_sent: sent }).eq("id", logRow.id);
      }
    }

    const summary = {
      ok: true,
      dry_run: dryRun,
      echeances: echeances.length,
      subscribed_users: subscribedUsers.length,
      evaluated,
      created,
      push_sent: pushSent,
      skipped_duplicate: skippedDuplicate,
      skipped_prefs: skippedPrefs,
    };
    console.log("[echeances-dispatch]", summary);
    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[echeances-dispatch] erreur", e instanceof Error ? e.message : String(e));
    return new Response(JSON.stringify({ error: "Erreur interne" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
