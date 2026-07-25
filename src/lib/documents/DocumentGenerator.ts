// Moteur générique de génération documentaire — PIPELINE 100 % NATIF.
//
// CONTRAINTE LTPC (P0/6) : aucun Canva, aucun <canvas>, aucun html2canvas,
// aucune capture d'écran, aucune image contenant du texte, aucun PDF rasterisé.
// Le document officiel archivé est un document HTML/CSS natif prêt pour
// l'impression A4 (Microsoft Print to PDF / Enregistrer en PDF) : le texte et
// les tableaux restent sélectionnables et recherchables.
//
// ⚠️ Aucun composant/module métier ne doit générer un document autrement.

import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { DocumentRepository } from "@/lib/repositories";
import { renderTemplate } from "@/lib/rapports/templateEngine";
import { sanitizeHtml, escapeHtml } from "@/lib/sanitize";
import type {
  DocumentGenerationInput,
  DocumentGenerationResult,
  DocumentTemplate,
  DocumentVariables,
} from "./types";

/** SHA-256 hex d'un Blob. */
async function sha256Blob(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function randomToken(len = 32): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

/** Applique toutes les variables du contexte à un HTML. */
export function applyVariables(html: string, vars: DocumentVariables): string {
  return renderTemplate(html || "", {
    chantier: vars.chantier ?? null,
    client: vars.client ?? null,
    entreprise: vars.entreprise ?? null,
    projet: vars.projet ?? null,
    ingenieur: vars.ingenieur ?? null,
    numero_rapport: vars.numero_rapport ?? null,
    titre: vars.objet ?? null,
    date: vars.date ?? null,
  }).replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_m, k: string) => {
    const v = vars[k];
    return (v ?? "").toString();
  });
}

/** QR code en SVG inline (vectoriel, aucun canvas, aucune rasterisation). */
function renderQrSvg(url: string, size = 96): string {
  return renderToStaticMarkup(
    createElement(QRCodeSVG, { value: url, size, level: "M", includeMargin: true }),
  );
}

function defaultHeader(_t: DocumentTemplate, v: DocumentVariables): string {
  return `
    <div class="doc-lab">${escapeHtml(v.laboratoire ?? "Laboratoire")}</div>
    <div class="doc-objet">${escapeHtml(v.objet ?? "")}</div>
    <div class="doc-ref">${v.numero_rapport ? `N° ${escapeHtml(v.numero_rapport)}` : ""}${v.date ? ` — ${new Date(v.date).toLocaleDateString("fr-FR")}` : ""}</div>`;
}

function defaultFooter(v: DocumentVariables): string {
  return `${escapeHtml(v.laboratoire ?? "")} — ${escapeHtml(v.numero_rapport ?? "")} — ${v.date ? new Date(v.date).toLocaleDateString("fr-FR") : ""}`;
}

/**
 * Construit le document HTML natif complet (autonome, imprimable A4).
 * En-tête, bloc d'identification, corps, signature du validateur réel,
 * annexes, pied de page, QR de vérification.
 */
export function buildOfficialHtml(input: DocumentGenerationInput, verifyUrl: string): string {
  const t = input.template;
  const v = input.variables;
  const primary = t.couleur_primaire || "#1e5a7a";
  const secondary = t.couleur_secondaire || "#d4e5f7";
  const font = t.police || "Times New Roman, Georgia, serif";
  const marg = t.marge_mm ?? { top: 15, right: 15, bottom: 20, left: 15 };
  const landscape = t.orientation === "paysage";

  const headerHtml = sanitizeHtml(applyVariables(t.entete_html || defaultHeader(t, v), v));
  const footerHtml = sanitizeHtml(applyVariables(t.pied_html || defaultFooter(v), v));
  const body = sanitizeHtml(applyVariables(input.body_html || "", v));
  const qrSvg = renderQrSvg(verifyUrl, 96);

  const sig = input.signature;
  // P0/4 — le bloc signature n'est produit que si le workflow fournit un signataire réel.
  const signatureBlock = sig?.ingenieur_nom ? `
    <section class="doc-signature">
      <div class="doc-signature-inner">
        <div class="doc-signature-date">Validé le ${sig.date_validation ? new Date(sig.date_validation).toLocaleDateString("fr-FR") : "—"}</div>
        <div class="doc-signature-visuals">
          ${sig.signature_url ? `<img src="${escapeHtml(sig.signature_url)}" alt="Signature du validateur" class="doc-sign-img"/>` : ""}
          ${sig.cachet_url ? `<img src="${escapeHtml(sig.cachet_url)}" alt="Cachet du laboratoire" class="doc-cachet-img"/>` : ""}
        </div>
        <div class="doc-signature-name">${escapeHtml(sig.ingenieur_nom)}</div>
        <div class="doc-signature-role">${escapeHtml(sig.ingenieur_fonction ?? "Ingénieur validateur")}</div>
      </div>
    </section>` : "";

  const annexes = (input.annexes ?? []).length ? `
    <section class="doc-annexes">
      <h2>Annexes</h2>
      ${(input.annexes ?? []).map(a => `
        <div class="doc-annexe">
          <div class="doc-annexe-title">${escapeHtml(a.ref)} — ${escapeHtml(a.titre)}</div>
          ${a.contenu_html ? `<div>${sanitizeHtml(a.contenu_html)}</div>` : ""}
          ${a.type === "image" && a.url ? `<img src="${escapeHtml(a.url)}" alt="${escapeHtml(a.titre)}" class="doc-annexe-img"/>` : ""}
          ${a.type !== "image" && a.url ? `<div class="doc-annexe-ref">Pièce jointe : ${escapeHtml(a.url)}</div>` : ""}
        </div>
      `).join("")}
    </section>` : "";

  const idRows: Array<[string, string | null | undefined]> = [
    ["N° document", v.numero_rapport],
    ["Date", v.date ? new Date(v.date).toLocaleDateString("fr-FR") : null],
    ["Client", v.client],
    ["Chantier", v.chantier],
    ["Entreprise", v.entreprise],
    ["Projet", v.projet],
    ["Catégorie", v.categorie],
    ["Statut officiel", v.statut_officiel],
  ];

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(v.numero_rapport ?? v.objet ?? "Document officiel")}</title>
<style>
  @page { size: A4 ${landscape ? "landscape" : "portrait"}; margin: ${marg.top}mm ${marg.right}mm ${marg.bottom}mm ${marg.left}mm; }
  html, body { background:#fff; color:#111; margin:0; padding:0; }
  body { font-family:${font}; font-size:${t.taille_corps ?? 11}pt; line-height:1.5; }
  .doc-page { max-width: ${landscape ? "277mm" : "180mm"}; margin: 0 auto; padding: ${marg.top}mm ${marg.right}mm; }
  @media print { .doc-page { padding: 0; max-width: none; } }
  h1 { color:${primary}; font-size:${t.taille_titre ?? 18}pt; margin:0 0 8px; }
  h2 { color:${primary}; font-size:14pt; margin:14px 0 6px; page-break-after: avoid; }
  h3 { color:${primary}; font-size:12pt; margin:10px 0 4px; page-break-after: avoid; }
  p, li, td, th { font-size:${t.taille_corps ?? 11}pt; }
  table { border-collapse: collapse; width:100%; margin:8px 0; }
  th, td { border:1px solid #999; padding:3px 5px; vertical-align: top; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  .doc-header { display:flex; justify-content:space-between; align-items:flex-start; gap:8px;
    border:1px solid #000; border-radius:4px; padding:8px; margin-bottom:10px; }
  .doc-header-center { flex:1; text-align:center; }
  .doc-lab { font-weight:bold; font-size:14pt; color:${primary}; }
  .doc-logo img { max-width:80px; max-height:80px; }
  .doc-qr { width:96px; }
  .doc-qr-caption { font-size:7pt; color:#555; text-align:center; }
  .doc-id-table th { background:${secondary}; width:22%; text-align:left; }
  .doc-signature { margin-top:10mm; display:flex; justify-content:flex-end; page-break-inside: avoid; }
  .doc-signature-inner { text-align:center; min-width:60mm; }
  .doc-signature-date { font-size:9pt; color:#555; }
  .doc-signature-visuals { min-height:18mm; display:flex; align-items:center; justify-content:center; gap:4mm; }
  .doc-sign-img { max-height:18mm; }
  .doc-cachet-img { max-height:24mm; opacity:.9; }
  .doc-signature-name { border-top:1px solid #333; padding-top:2px; font-weight:bold; }
  .doc-signature-role { font-size:9pt; }
  .doc-annexes { page-break-before: always; }
  .doc-annexe { margin:6mm 0; page-break-inside: avoid; }
  .doc-annexe-title { font-weight:bold; color:${primary}; }
  .doc-annexe-img { max-width:100%; }
  .doc-footer { margin-top:8mm; border-top:1px solid #ccc; padding-top:2px; font-size:9pt; color:#555; }
  .doc-verify { font-size:8pt; color:#555; margin-top:2mm; word-break:break-all; }
</style>
</head>
<body>
<div class="doc-page">
  <header class="doc-header">
    <div class="doc-logo">${t.logo_url ? `<img src="${escapeHtml(t.logo_url)}" alt="Logo du laboratoire"/>` : ""}</div>
    <div class="doc-header-center">${headerHtml}</div>
    <div class="doc-qr">${qrSvg}<div class="doc-qr-caption">Vérification</div></div>
  </header>

  <table class="doc-id-table">
    <tbody>
      ${idRows.filter(([, val]) => val).map(([k, val]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(String(val))}</td></tr>`).join("")}
    </tbody>
  </table>

  ${v.objet ? `<h1>${escapeHtml(v.objet)}</h1>` : ""}

  <main class="doc-body">${body}</main>

  ${signatureBlock}
  ${annexes}

  <footer class="doc-footer">
    ${footerHtml}
    <div class="doc-verify">Vérification d'authenticité : ${escapeHtml(verifyUrl)}</div>
  </footer>
</div>
</body>
</html>`;
}

/**
 * Génère le document officiel natif, l'archive de façon immuable et renvoie
 * les identifiants de vérification. Le jeton QR est unique, aléatoire et
 * n'est jamais réutilisé : il est stocké dans `document_archives`, seule
 * source de vérité de la vérification publique.
 */
export async function generateOfficialDocument(input: DocumentGenerationInput): Promise<DocumentGenerationResult> {
  const qrToken = randomToken(24);
  const baseUrl = input.qr_verification_base_url || `${window.location.origin}/verification`;
  const verifyUrl = `${baseUrl}/${qrToken}`;

  const html = buildOfficialHtml(input, verifyUrl);
  const blob = new Blob([html], { type: "text/html; charset=utf-8" });
  const sha256 = await sha256Blob(blob);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  // Version = max(existante)+1 pour ce document
  const { data: last } = await supabase
    .from("document_archives")
    .select("version")
    .eq("document_type", input.document_type)
    .eq("document_id", input.document_id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextVersion = (last?.version ?? 0) + 1;

  const path = `${input.document_type}/${input.document_id}/v${nextVersion}-${qrToken}.html`;
  await DocumentRepository.uploadOfficiel(path, blob, {
    contentType: "text/html; charset=utf-8",
    upsert: false,
  });

  const { data: userRow } = await supabase.from("utilisateurs").select("nom").eq("user_id", user.id).maybeSingle();

  const { data: archive, error: aerr } = await supabase
    .from("document_archives")
    .insert({
      document_type: input.document_type,
      document_id: input.document_id,
      numero: input.numero ?? input.variables.numero_rapport ?? null,
      version: nextVersion,
      template_id: input.template.id || null,
      pdf_url: path,
      pdf_size: blob.size,
      sha256,
      qr_token: qrToken,
      variables: input.variables as never,
      contenu_snapshot: {
        format: "html-native",
        body_html: input.body_html,
        annexes: input.annexes ?? [],
        signature: input.signature ?? null,
        template_nom: input.template.nom,
        generated_at: new Date().toISOString(),
      } as never,
      generated_by: user.id,
      generated_by_nom: userRow?.nom ?? null,
      status: "active",
    })
    .select()
    .single();
  if (aerr) throw aerr;

  const signedUrl = await DocumentRepository.signedArchiveUrl(path, 3600);

  return {
    archive_id: archive.id,
    version: nextVersion,
    pdf_url: path,
    public_url: signedUrl ?? "",
    qr_token: qrToken,
    sha256,
    pdf_size: blob.size,
  };
}

/** Récupère une archive par token (pour la page publique /verification/:token). */
export async function fetchArchiveByToken(token: string) {
  const { data, error } = await supabase
    .from("document_archives")
    .select("*")
    .eq("qr_token", token)
    .maybeSingle();
  if (error) throw error;
  return data;
}
