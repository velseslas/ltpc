// Moteur générique de génération documentaire.
// ⚠️ Aucun composant/module métier ne doit générer un PDF autrement.
// Toute future intégration (rapports, NC, audits, courriers…) DOIT appeler ce service.

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { supabase } from "@/integrations/supabase/client";
import { renderTemplate } from "@/lib/rapports/templateEngine";
import type {
  DocumentGenerationInput,
  DocumentGenerationResult,
  DocumentTemplate,
  DocumentVariables,
} from "./types";

const BUCKET = "documents-officiels";

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

/** Construit le HTML complet (en-tête, corps, signature, annexes, pied). */
function buildDocumentHtml(input: DocumentGenerationInput, qrDataUrl: string): string {
  const t = input.template;
  const v = input.variables;
  const primary = t.couleur_primaire || "#1e5a7a";
  const secondary = t.couleur_secondaire || "#d4e5f7";
  const font = t.police || "Times New Roman, Georgia, serif";
  const marg = t.marge_mm ?? { top: 15, right: 15, bottom: 20, left: 15 };

  const headerHtml = applyVariables(t.entete_html || defaultHeader(t, v), v);
  const footerHtml = applyVariables(t.pied_html || defaultFooter(v), v);
  const body = applyVariables(input.body_html || "", v);

  const sig = input.signature;
  const signatureBlock = sig ? `
    <div style="margin-top:32px; page-break-inside:avoid; display:flex; justify-content:flex-end;">
      <div style="text-align:center; min-width:220px;">
        <div style="font-size:11px; color:#555;">Validé le ${sig.date_validation ? new Date(sig.date_validation).toLocaleDateString("fr-FR") : "—"}</div>
        <div style="height:60px; display:flex; align-items:center; justify-content:center;">
          ${sig.signature_url ? `<img src="${sig.signature_url}" crossorigin="anonymous" style="max-height:60px; max-width:180px;"/>` : ""}
          ${sig.cachet_url ? `<img src="${sig.cachet_url}" crossorigin="anonymous" style="max-height:80px; max-width:120px; margin-left:12px; opacity:0.85;"/>` : ""}
        </div>
        <div style="border-top:1px solid #333; padding-top:4px; font-size:12px; font-weight:bold;">
          ${sig.ingenieur_nom ?? "—"}
        </div>
        <div style="font-size:11px; color:#333;">${sig.ingenieur_fonction ?? "Ingénieur validateur"}</div>
      </div>
    </div>` : "";

  const annexes = (input.annexes ?? []).length ? `
    <div style="margin-top:32px; page-break-before:always;">
      <h2 style="color:${primary}; border-bottom:2px solid ${primary}; padding-bottom:4px;">Annexes</h2>
      ${(input.annexes ?? []).map(a => `
        <div style="margin:16px 0; page-break-inside:avoid;">
          <div style="font-weight:bold; color:${primary};">${a.ref} — ${a.titre}</div>
          ${a.contenu_html ? `<div>${a.contenu_html}</div>` : ""}
          ${a.type === "image" && a.url ? `<img src="${a.url}" crossorigin="anonymous" style="max-width:100%; margin-top:8px;"/>` : ""}
          ${a.type !== "image" && a.url ? `<div style="font-size:11px; color:#555; margin-top:4px;">Pièce jointe : ${a.url}</div>` : ""}
        </div>
      `).join("")}
    </div>` : "";

  return `
    <div style="font-family:${font}; color:#111; padding:${marg.top}mm ${marg.right}mm ${marg.bottom}mm ${marg.left}mm; background:#fff; box-sizing:border-box;">
      <style>
        h1{color:${primary}; font-size:${(t.taille_titre ?? 18)}pt; margin:0 0 8px;}
        h2{color:${primary}; font-size:14pt; margin:16px 0 6px;}
        h3{color:${primary}; font-size:12pt; margin:12px 0 4px;}
        p,li,td,th{font-size:${(t.taille_corps ?? 11)}pt; line-height:1.5;}
        table{border-collapse:collapse; width:100%; margin:8px 0;}
        th,td{border:1px solid #ccc; padding:4px 6px;}
        th{background:${secondary};}
      </style>
      <div style="display:flex; justify-content:space-between; align-items:flex-start; border:1px solid #000; border-radius:6px; padding:10px; margin-bottom:12px;">
        <div style="width:80px; height:80px; border:1px solid #ccc; display:flex; align-items:center; justify-content:center; background:${secondary};">
          ${t.logo_url ? `<img src="${t.logo_url}" crossorigin="anonymous" style="max-width:100%; max-height:100%;"/>` : "LOGO"}
        </div>
        <div style="flex:1; text-align:center; padding:0 8px;">${headerHtml}</div>
        <div style="width:80px; height:80px;"><img src="${qrDataUrl}" style="width:80px; height:80px;"/></div>
      </div>
      <div style="border-top:2px solid ${primary}; margin-bottom:10px;"></div>
      <div>${body}</div>
      ${signatureBlock}
      ${annexes}
      <div style="position:fixed; bottom:${marg.bottom / 2}mm; left:${marg.left}mm; right:${marg.right}mm; font-size:9pt; color:#666; border-top:1px solid #ccc; padding-top:2px;">
        ${footerHtml}
      </div>
    </div>`;
}

function defaultHeader(_t: DocumentTemplate, v: DocumentVariables): string {
  return `
    <div style="font-weight:bold; font-size:14pt; color:#1e5a7a;">${v.laboratoire ?? "Laboratoire"}</div>
    <div style="font-size:10pt;">${v.objet ?? ""}</div>
    <div style="font-size:10pt;">${v.numero_rapport ? `N° ${v.numero_rapport}` : ""} ${v.date ? ` — ${new Date(v.date).toLocaleDateString("fr-FR")}` : ""}</div>`;
}

function defaultFooter(v: DocumentVariables): string {
  return `${v.laboratoire ?? ""} — ${v.numero_rapport ?? ""} — ${v.date ? new Date(v.date).toLocaleDateString("fr-FR") : ""}`;
}

/** Génère un PNG QR contenant l'URL de vérification publique. */
async function makeQrDataUrl(url: string, size = 320): Promise<string> {
  // Utilise l'API globale QRCode via qrcode.react serait complexe hors DOM.
  // On construit un <canvas> via une lib légère : ici on utilise google chart API? Non — offline uniquement.
  // Fallback : dessine avec qrcode.react en montant un composant offscreen.
  const { QRCodeCanvas } = await import("qrcode.react");
  const React = await import("react");
  const { createRoot } = await import("react-dom/client");

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-99999px";
  document.body.appendChild(host);
  try {
    const root = createRoot(host);
    root.render(React.createElement(QRCodeCanvas, { value: url, size, level: "M", includeMargin: true }));
    await new Promise(r => setTimeout(r, 60));
    const canvas = host.querySelector("canvas") as HTMLCanvasElement | null;
    const dataUrl = canvas?.toDataURL("image/png") ?? "";
    root.unmount();
    return dataUrl;
  } finally {
    host.remove();
  }
}

/** Ajoute la pagination "Page X / Y" + méta sur chaque page du PDF. */
function addPagination(pdf: jsPDF, meta: { numero?: string | null; date?: string | null; laboratoire?: string | null }) {
  const total = pdf.getNumberOfPages();
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(120);
    pdf.text(`${meta.laboratoire ?? ""}  ·  ${meta.numero ?? ""}  ·  ${meta.date ? new Date(meta.date).toLocaleDateString("fr-FR") : ""}`, 8, h - 4);
    pdf.text(`Page ${i} / ${total}`, w - 22, h - 4);
  }
}

/** Rendu HTML → jsPDF multipage via html2canvas. */
async function htmlToPdf(html: string, orientation: "portrait" | "paysage" = "portrait"): Promise<jsPDF> {
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-99999px";
  host.style.top = "0";
  host.style.width = orientation === "portrait" ? "794px" : "1123px";
  // Neutralise l'héritage des variables CSS (oklch de Tailwind casse html2canvas)
  host.style.color = "#111111";
  host.style.backgroundColor = "#ffffff";
  host.style.fontFamily = "Times New Roman, Georgia, serif";
  host.innerHTML = html;
  document.body.appendChild(host);
  try {
    const canvas = await html2canvas(host, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 8000,
      onclone: (doc) => {
        // Force les couleurs en sRGB pour éviter les fonctions oklch/oklab non supportées par html2canvas
        const style = doc.createElement("style");
        style.textContent = `
          *, *::before, *::after {
            box-shadow: none !important;
            text-shadow: none !important;
            filter: none !important;
          }
        `;
        doc.head.appendChild(style);
      },
    });
    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    const pdf = new jsPDF({ orientation: orientation === "paysage" ? "l" : "p", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let y = 0;
    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
    } else {
      let remaining = imgHeight;
      while (remaining > 0) {
        pdf.addImage(imgData, "JPEG", 0, y, imgWidth, imgHeight);
        remaining -= pageHeight;
        if (remaining > 0) { pdf.addPage(); y -= pageHeight; }
      }
    }
    return pdf;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Échec du rendu PDF (html2canvas): ${msg}`);
  } finally {
    host.remove();
  }
}

/** Génère un PDF officiel, l'upload, crée l'archive immuable et renvoie les identifiants. */
export async function generateOfficialDocument(input: DocumentGenerationInput): Promise<DocumentGenerationResult> {
  const qrToken = randomToken(24);
  const baseUrl = input.qr_verification_base_url || `${window.location.origin}/verification`;
  const verifyUrl = `${baseUrl}/${qrToken}`;

  const qrDataUrl = await makeQrDataUrl(verifyUrl, 320);
  const html = buildDocumentHtml(input, qrDataUrl);
  const pdf = await htmlToPdf(html, input.template.orientation ?? "portrait");
  addPagination(pdf, {
    numero: input.numero ?? input.variables.numero_rapport ?? null,
    date: input.variables.date ?? new Date().toISOString(),
    laboratoire: input.variables.laboratoire ?? input.variables.entreprise ?? null,
  });

  const blob = pdf.output("blob");
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

  const path = `${input.document_type}/${input.document_id}/v${nextVersion}-${qrToken}.pdf`;
  const up = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: "application/pdf",
    upsert: false,
  });
  if (up.error) throw up.error;

  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);

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
      contenu_snapshot: { body_html: input.body_html, annexes: input.annexes ?? [] } as never,
      generated_by: user.id,
      generated_by_nom: userRow?.nom ?? null,
      status: "active",
    })
    .select()
    .single();
  if (aerr) throw aerr;

  return {
    archive_id: archive.id,
    version: nextVersion,
    pdf_url: path,
    public_url: signed?.signedUrl ?? "",
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
