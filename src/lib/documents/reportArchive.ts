// Archivage natif du rendu d'un rapport d'essai afin d'obtenir un LIEN DIRECT
// vers le document (servi par la fonction publique `document-file`).
//
// Contrainte LTPC : aucun moteur PDF, aucune rasterisation. On archive le HTML
// natif déjà rendu par l'application (texte sélectionnable, mise en page A4).
// Le moteur d'impression, les templates et les données métier sont inchangés.

import { supabase } from "@/integrations/supabase/client";
import { DocumentRepository } from "@/lib/repositories";
import { buildDirectFileUrl } from "@/lib/documents/shareLink";

const REPORT_SELECTOR = '[data-ref="report"]';

/** Concatène les feuilles de style same-origin de la page. */
function collectCss(): string {
  const chunks: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = (sheet as CSSStyleSheet).cssRules;
      if (!rules) continue;
      for (const rule of Array.from(rules)) chunks.push(rule.cssText);
    } catch {
      // feuille cross-origin : ignorée
    }
  }
  return chunks.join("\n");
}

/** Construit un document HTML autonome et imprimable à partir du rapport rendu. */
export function buildStandaloneReportHtml(title: string, landscape = false): string | null {
  const el = document.querySelector(REPORT_SELECTOR) as HTMLElement | null;
  if (!el) return null;

  const css = collectCss();
  const safeTitle = title.replace(/[<>&]/g, "");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${safeTitle}</title>
<style>${css}</style>
<style>
  @page { size: A4 ${landscape ? "landscape" : "portrait"}; margin: 8mm; }
  html, body { background:#f1f5f9; margin:0; padding:0; }
  .ltpc-doc { background:#fff; margin:0 auto; padding:8mm; max-width:${landscape ? "297mm" : "210mm"}; }
  @media print { html, body { background:#fff; } .ltpc-doc { padding:0; max-width:none; } .print\\:hidden { display:none !important; } }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
</style>
</head>
<body>
<div class="ltpc-doc">${el.outerHTML}</div>
</body>
</html>`;
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function randomToken(len = 24): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

export interface EnsureReportArchiveInput {
  documentType: string;
  documentId: string;
  numero?: string | null;
  title: string;
  landscape?: boolean;
}

/**
 * Garantit l'existence d'une archive à jour du rapport affiché et renvoie
 * l'URL DIRECTE du fichier (jamais une route applicative LTPC).
 */
export async function ensureReportArchiveUrl(input: EnsureReportArchiveInput): Promise<string | null> {
  const html = buildStandaloneReportHtml(input.title, input.landscape);
  if (!html) return null;

  const hash = await sha256(html);

  // Archive identique déjà présente → réutilisation du jeton existant.
  const { data: existing } = await supabase
    .from("document_archives")
    .select("qr_token, sha256, version")
    .eq("document_type", input.documentType)
    .eq("document_id", input.documentId)
    .eq("status", "active")
    .order("version", { ascending: false })
    .limit(20);

  const same = (existing ?? []).find(a => a.sha256 === hash);
  if (same?.qr_token) return buildDirectFileUrl(same.qr_token);

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return null;

  const nextVersion = ((existing ?? [])[0]?.version ?? 0) + 1;
  const qrToken = randomToken(24);
  const path = `${input.documentType}/${input.documentId}/v${nextVersion}-${qrToken}.html`;
  const blob = new Blob([html], { type: "text/html; charset=utf-8" });

  await DocumentRepository.uploadOfficiel(path, blob, {
    contentType: "text/html; charset=utf-8",
    upsert: false,
  });

  const { data: userRow } = await supabase.from("utilisateurs").select("nom").eq("user_id", user.id).maybeSingle();

  const { error } = await supabase.from("document_archives").insert({
    document_type: input.documentType,
    document_id: input.documentId,
    numero: input.numero ?? null,
    version: nextVersion,
    pdf_url: path,
    pdf_size: blob.size,
    sha256: hash,
    qr_token: qrToken,
    generated_by: user.id,
    generated_by_nom: userRow?.nom ?? null,
    status: "active",
  } as never);
  if (error) throw error;

  return buildDirectFileUrl(qrToken);
}
