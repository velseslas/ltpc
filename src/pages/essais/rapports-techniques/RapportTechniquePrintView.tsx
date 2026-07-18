/**
 * RapportTechniquePrintView — Vue A4 imprimable des rapports techniques.
 *
 * LOT 1 — Print Engine V2 : ce composant est la source de vérité PDF
 * pour la famille "Rapports techniques". Il est rendu sur une route
 * dédiée sans chrome applicatif et imprimé via PrintService, ce qui
 * produit un PDF strictement identique via Microsoft Print to PDF ou
 * Enregistrer en PDF (aucune rasterisation, aucun html2canvas).
 *
 * Aucune donnée métier n'est modifiée : contenu, calculs, QR, SHA-256
 * et archives immuables restent inchangés.
 */

import { useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRapportTechnique, STATUT_LABELS } from "@/hooks/useRapportsTechniques";
import { useEntreprise } from "@/hooks/useEntreprise";
import { renderTemplate } from "@/lib/rapports/templateEngine";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { PrintService } from "@/lib/print/PrintService";
import type { AIRapportContenu } from "@/lib/ai/aiProvider";
import { sanitizeHtml, escapeHtml } from "@/lib/sanitize";

function contenuToHtml(c: AIRapportContenu | null): string {
  if (!c) return "";
  const s = c.sections ?? ({} as Partial<NonNullable<AIRapportContenu["sections"]>>);
  const sections: Array<[string, string | undefined]> = [
    ["Objet", s.objet], ["Contexte", s.contexte], ["Constatations", s.constatations],
    ["Analyse technique", s.analyse_technique], ["Conséquences", s.consequences],
    ["Recommandations", s.recommandations], ["Conclusion", s.conclusion],
  ];
  const body = sections
    .filter(([, b]) => b && b.trim().length > 0)
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

  const contenu = (r?.contenu_rapport ?? null) as unknown as AIRapportContenu | null;

  const bodyHtml = useMemo(() => {
    if (!r) return "";
    const html = r.editor_html && r.editor_html.trim().length > 0 ? r.editor_html : contenuToHtml(contenu);
    return renderTemplate(html, {
      chantier: (r as unknown as { chantiers?: { nom?: string } }).chantiers?.nom ?? null,
      client: (r as unknown as { clients?: { nom?: string } }).clients?.nom ?? null,
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
    const t = window.setTimeout(() => {
      PrintService.print({ title: `Rapport technique — ${r.numero ?? r.titre ?? id}` });
    }, 400);
    return () => window.clearTimeout(t);
  }, [auto, isLoading, r, id]);

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Chargement du rapport…</div>;
  }
  if (!r) {
    return <div className="p-8 text-sm text-muted-foreground">Rapport introuvable.</div>;
  }

  const chantierNom = (r as unknown as { chantiers?: { nom?: string } }).chantiers?.nom ?? "—";
  const clientNom = (r as unknown as { clients?: { nom?: string } }).clients?.nom ?? "—";
  const categorieNom = (r as unknown as { rapport_categories?: { nom?: string } }).rapport_categories?.nom ?? "—";
  const graviteLabels: Record<string, string> = {
    faible: "Faible", moderee: "Modérée", elevee: "Élevée", critique: "Critique",
  };
  const verificationUrl = typeof window !== "undefined"
    ? `${window.location.origin}/verification/${r.qr_token ?? id}`
    : "";
  const dateEdition = r.valide_at ?? r.updated_at ?? r.created_at;
  const representant = (entreprise as { representant?: string | null } | null)?.representant ?? null;
  const cachetUrl = (entreprise as { cachet_url?: string | null } | null)?.cachet_url ?? null;

  return (
    <div data-print-root className="rt-print-root bg-white text-black">
      <ReportHeader
        entreprise={entreprise}
        verificationUrl={verificationUrl}
        title="RAPPORT TECHNIQUE"
        subtitle={r.numero ?? undefined}
      />

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
      <section
        className="rt-body prose-print"
        dangerouslySetInnerHTML={{ __html: bodyHtml ? sanitizeHtml(bodyHtml) : "<p><em>Rapport en cours de rédaction.</em></p>" }}
      />

      {/* Signature & cachet — insécable */}
      <section className="rt-signature" data-print-keep-together>
        <div className="rt-signature-inner">
          <div className="rt-signature-date">
            Validé le {r.valide_at ? format(new Date(r.valide_at), "dd/MM/yyyy", { locale: fr }) : "—"}
          </div>
          <div className="rt-signature-visuals">
            {cachetUrl && (
              <img src={cachetUrl} alt="Cachet" className="rt-cachet" />
            )}
          </div>
          <div className="rt-signature-name">{representant ?? "—"}</div>
          <div className="rt-signature-role">Ingénieur validateur</div>
        </div>
      </section>
    </div>
  );
}
