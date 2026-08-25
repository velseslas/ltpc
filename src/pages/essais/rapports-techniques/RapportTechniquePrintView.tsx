/**
 * RapportTechniquePrintView — Vue A4 imprimable des rapports techniques.
 *
 * Print Engine V2 : source de vérité d'impression pour la famille
 * "Rapports techniques". HTML/CSS natif, imprimé via PrintService +
 * window.print() (Microsoft Print to PDF / Enregistrer en PDF).
 * Aucune rasterisation, aucun html2canvas, aucun canvas, texte et tableaux
 * sélectionnables.
 *
 * P0/4 — La signature et le cachet officiels n'apparaissent QUE sur un rapport
 *        validé ou archivé, et nomment le validateur réel (`ingenieur_id`).
 * P0/5 — Le QR pointe sur le jeton de l'archive officielle réellement
 *        enregistrée (`document_archives`), jamais sur `rapports_techniques.qr_token`.
 */

import { useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  useRapportTechnique,
  useRapportValidateur,
  useRapportVerification,
  STATUT_LABELS,
} from "@/hooks/useRapportsTechniques";
import { useEntreprise } from "@/hooks/useEntreprise";
import { renderTemplate } from "@/lib/rapports/templateEngine";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { PrintService } from "@/lib/print/PrintService";
import type { AIRapportContenu } from "@/lib/ai/aiProvider";
import { sanitizeHtml, escapeHtml } from "@/lib/sanitize";

const PLACEHOLDER = "information non disponible.";

/** Vrai si la section porte une information réelle (et non le libellé de repli de l'IA). */
function hasContent(v?: string | null): boolean {
  const t = (v ?? "").trim();
  return t.length > 0 && t.toLowerCase() !== PLACEHOLDER;
}

/**
 * Retire les sections « Information non disponible. » d'un HTML enregistré :
 * d'anciens rapports ont figé un squelette de sections vides, qui s'imprimait
 * comme un rapport intégralement vide.
 */
function stripPlaceholderSections(html: string): string {
  const cleaned = html.replace(
    /<h([2-3])[^>]*>[\s\S]*?<\/h\1>\s*<p[^>]*>\s*Information non disponible\.?\s*<\/p>/gi,
    "",
  );
  const text = cleaned.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").trim();
  // Seul un titre résiduel (ex. « Rapport technique ») ne constitue pas un contenu.
  return text.length > 0 ? cleaned : "";
}

function contenuToHtml(c: AIRapportContenu | null): string {
  if (!c) return "";
  const s = c.sections ?? ({} as Partial<NonNullable<AIRapportContenu["sections"]>>);
  const sections: Array<[string, string | undefined]> = [
    ["Objet", s.objet], ["Contexte", s.contexte], ["Constatations", s.constatations],
    ["Analyse technique", s.analyse_technique], ["Conséquences", s.consequences],
    ["Recommandations", s.recommandations], ["Conclusion", s.conclusion],
  ];
  const body = sections
    .filter(([, b]) => hasContent(b))
    .map(([t, b]) => `<h2>${escapeHtml(t)}</h2><p>${escapeHtml(b || "").replace(/\n/g, "<br/>")}</p>`)
    .join("");
  const list = (title: string, items?: string[]) =>
    items?.length ? `<h3>${escapeHtml(title)}</h3><ul>${items.map(f => `<li>${escapeHtml(f)}</li>`).join("")}</ul>` : "";
  return `${body}${list("Faits", c.faits)}${list("Hypothèses", c.hypotheses)}${list("Recommandations (synthèse)", c.recommandations_synthese)}`;
}


PrintService.registerTemplate({
  id: "rapport-technique",
  title: "Rapport technique",
  orientation: "portrait",
});

export default function RapportTechniquePrintView() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const auto = params.get("auto") === "1";
  const { data: r, isLoading } = useRapportTechnique(id);
  const { data: entreprise } = useEntreprise();
  const { data: validateur } = useRapportValidateur(id, r?.statut);
  const { data: verification } = useRapportVerification(id);

  const contenu = (r?.contenu_rapport ?? null) as unknown as AIRapportContenu | null;
  const isOfficiel = r?.statut === "valide" || r?.statut === "archive";

  const bodyHtml = useMemo(() => {
    if (!r) return "";
    const stored = stripPlaceholderSections(r.editor_html ?? "");
    const html = stored.trim().length > 0 ? stored : contenuToHtml(contenu);
    if (!html.trim()) return "";
    return renderTemplate(html, {
      chantier: r.chantiers?.nom ?? null,
      client: r.clients?.nom ?? null,
      entreprise: r.entreprise ?? null,
      projet: r.projet ?? null,
      numero_rapport: r.numero ?? null,
      titre: r.titre ?? null,
      date: r.valide_at ?? r.created_at ?? null,
    });
  }, [r, contenu]);


  useEffect(() => {
    document.title = r?.numero
      ? `Rapport technique — ${r.numero}`
      : "Rapport technique";
  }, [r?.numero]);

  useEffect(() => {
    if (!auto || isLoading || !r) return;
    let cancelled = false;
    // Attend le chargement des images (logo/cachet) avant d'imprimer.
    const run = async () => {
      const imgs = Array.from(document.images);
      await Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise<void>(res => {
        img.addEventListener("load", () => res(), { once: true });
        img.addEventListener("error", () => res(), { once: true });
      })));
      if (cancelled) return;
      PrintService.print({ title: `Rapport technique — ${r.numero ?? r.titre ?? id}` });
    };
    const t = window.setTimeout(() => { void run(); }, 300);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, [auto, isLoading, r, id]);

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Chargement du rapport…</div>;
  }
  if (!r) {
    return <div className="p-8 text-sm text-muted-foreground">Rapport introuvable.</div>;
  }

  const chantierNom = r.chantiers?.nom ?? "—";
  const clientNom = r.clients?.nom ?? "—";
  const categorieNom = r.rapport_categories?.nom ?? "—";
  const graviteLabels: Record<string, string> = {
    faible: "Faible", moderee: "Modérée", elevee: "Élevée", critique: "Critique",
  };
  // P0/5 — QR uniquement si une archive officielle vérifiable existe.
  const verificationUrl = verification?.qr_token && typeof window !== "undefined"
    ? `${window.location.origin}/verification/${verification.qr_token}`
    : "";
  const dateEdition = r.valide_at ?? r.updated_at ?? r.created_at;
  const cachetUrl = (entreprise as { cachet_url?: string | null } | null)?.cachet_url ?? null;

  return (
    <div data-print-root className="rt-print-root bg-white text-black">
      <ReportHeader
        entreprise={entreprise}
        verificationUrl={verificationUrl}
        title="RAPPORT TECHNIQUE"
        subtitle={r.numero ?? undefined}
      />

      {!isOfficiel && (
        <section className="rt-draft-banner" data-print-keep-together>
          DOCUMENT DE TRAVAIL — {STATUT_LABELS[r.statut].toUpperCase()} — SANS VALEUR OFFICIELLE.
          Ni signature, ni cachet, ni vérification d'authenticité.
        </section>
      )}

      {/* Bloc identification — 2 colonnes équilibrées */}
      <section className="rt-identification" data-print-keep-together>
        <table className="rt-info-table">
          <colgroup>
            <col style={{ width: "18%" }} />
            <col style={{ width: "32%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "32%" }} />
          </colgroup>
          <tbody>
            <tr>
              <th>N° Rapport</th><td>{r.numero ?? "—"}</td>
              <th>Date</th><td>{dateEdition ? format(new Date(dateEdition), "dd/MM/yyyy", { locale: fr }) : "—"}</td>
            </tr>
            <tr>
              <th>Client</th><td>{clientNom}</td>
              <th>Chantier</th><td>{chantierNom}</td>
            </tr>
            <tr>
              <th>Entreprise</th><td>{r.entreprise ?? "—"}</td>
              <th>Projet</th><td>{r.projet ?? "—"}</td>
            </tr>
            <tr>
              <th>Catégorie</th><td>{categorieNom}</td>
              <th>Gravité</th><td>{r.gravite ? graviteLabels[r.gravite] : "—"}</td>
            </tr>
            <tr>
              <th>Matériau</th><td>{r.materiau ?? "—"}</td>
              <th>Statut</th><td>{STATUT_LABELS[r.statut]}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Titre du rapport (objet) */}
      {r.titre && (
        <section className="rt-title-block" data-print-keep-together>
          <h2>{r.titre}</h2>
        </section>
      )}

      {/* Corps du rapport */}
      {bodyHtml ? (
        <section className="rt-body prose-print" dangerouslySetInnerHTML={{ __html: sanitizeHtml(bodyHtml) }} />
      ) : (
        <section className="rt-body prose-print" data-print-keep-together>
          <p><em>Aucun contenu rédigé pour ce rapport.</em></p>
          <p><em>Ouvrir le rapport dans l'éditeur, générer le contenu avec l'IA ou le saisir manuellement, puis enregistrer une version avant impression.</em></p>
        </section>
      )}


      {/* Signature & cachet — uniquement pour un document officiel, validateur réel */}
      {isOfficiel && (
        <section className="rt-signature" data-print-keep-together>
          <div className="rt-signature-inner">
            <div className="rt-signature-date">
              Validé le {r.valide_at ? format(new Date(r.valide_at), "dd/MM/yyyy", { locale: fr }) : "—"}
            </div>
            <div className="rt-signature-visuals">
              {cachetUrl && (
                <img src={cachetUrl} alt="Cachet officiel du laboratoire" className="rt-cachet" />
              )}
            </div>
            <div className="rt-signature-name">{validateur?.nom ?? "Validateur non identifié"}</div>
            <div className="rt-signature-role">{validateur?.fonction ?? "Ingénieur validateur"}</div>
          </div>
        </section>
      )}

      {/* Pied de page répété à l'impression */}
      <div className="rt-print-footer">
        {(entreprise?.nom ?? "")} · {r.numero ?? "Document de travail"} · {STATUT_LABELS[r.statut]}
        {verification ? ` · Archive officielle v${verification.version}` : ""}
      </div>
    </div>
  );
}
