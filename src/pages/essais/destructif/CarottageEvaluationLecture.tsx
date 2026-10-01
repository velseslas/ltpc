/**
 * ─────────────────────────────────────────────────────────────
 * MODE B — Relecture d'une évaluation normative (LECTURE SEULE)
 * ─────────────────────────────────────────────────────────────
 * Cette page n'exécute AUCUN recalcul : elle restitue exclusivement
 * les données archivées au moment du gel (carottes, statistiques,
 * critères, verdict, conclusion, traçabilité).
 * Impression : PrintService + window.print() — HTML/CSS natif, A4.
 */
import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Lock, Printer } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { EntrepriseHeader } from "@/components/print/EntrepriseHeader";
import { PrintService } from "@/lib/print/PrintService";
import { useEchantillonCarottage } from "@/hooks/useEchantillonsCarottage";
import { useEvaluationNormative } from "@/hooks/useEvaluationsNormativesCarottage";
import {
  VERDICT_LABELS,
  STATUT_LABELS,
  type CarotteEvaluee,
  type CritereNormatif,
  type StatutCarotte,
  type VerdictNormatif,
} from "@/lib/essais/normativeCoreEvaluation";

const fmt = (v: unknown, d = 2) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return isFinite(n) ? n.toFixed(d) : "—";
};

const dt = (v: string | null | undefined, withTime = true) =>
  v ? format(new Date(v), withTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy", { locale: fr }) : "—";

const CRITERE_ETAT: Record<string, { emoji: string; label: string }> = {
  ok: { emoji: "🟢", label: "SATISFAIT" },
  ko: { emoji: "🔴", label: "NON SATISFAIT" },
  na: { emoji: "⚪", label: "NON APPLICABLE" },
};

const TEMPLATE = "carottage-evaluation-lecture";

const CarottageEvaluationLecture = () => {
  const { id, evaluationId } = useParams();
  const navigate = useNavigate();
  const basePath = "/essais/beton/destructif/carottage";
  const { data: echantillon } = useEchantillonCarottage(id || "");
  const { data: evaluation, isLoading } = useEvaluationNormative(evaluationId || "");

  const carottes = useMemo(
    () => ((Array.isArray(evaluation?.carottes) ? evaluation?.carottes : []) as unknown as CarotteEvaluee[]) ?? [],
    [evaluation],
  );
  const criteres = useMemo(
    () => ((Array.isArray(evaluation?.criteres) ? evaluation?.criteres : []) as unknown as CritereNormatif[]) ?? [],
    [evaluation],
  );
  const stats = (evaluation?.statistiques ?? {}) as Record<string, unknown>;

  const groupes: { code: StatutCarotte; titre: string }[] = [
    { code: "valide", titre: "Carottes retenues dans le calcul" },
    { code: "exclue", titre: "Carottes exclues" },
    { code: "hors_domaine", titre: "Carottes hors domaine d'application" },
    { code: "a_examiner", titre: "Carottes à examiner (non intégrées au calcul)" },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!evaluation) {
    return <div className="text-center py-12 text-muted-foreground">Évaluation normative introuvable</div>;
  }

  const ref = evaluation.reference || (echantillon ? `CR-${String(echantillon.numero).padStart(3, "0")}` : "—");
  const verdictInfo = VERDICT_LABELS[(evaluation.verdict as VerdictNormatif) || "non_concluant"];
  const typeAnalyse = String(stats.type_analyse ?? "") === "estimation" ? "Estimation de la résistance in situ" : "Conformité à une classe spécifiée";
  const avertissements = (Array.isArray(stats.avertissements) ? stats.avertissements : []) as string[];
  const donneesManquantes = (Array.isArray(stats.donnees_manquantes) ? stats.donnees_manquantes : []) as string[];

  const Table = ({ items }: { items: CarotteEvaluee[] }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="text-left p-2">ID permanent</th>
            <th className="text-left p-2">Réf.</th>
            <th className="text-right p-2">Ø (mm)</th>
            <th className="text-right p-2">L (mm)</th>
            <th className="text-right p-2">L/D</th>
            <th className="text-right p-2">Charge (kN)</th>
            <th className="text-right p-2">Section (mm²)</th>
            <th className="text-right p-2">fcore (MPa)</th>
            <th className="text-right p-2">K</th>
            <th className="text-left p-2">Méthode K</th>
            <th className="text-right p-2">fcorr (MPa)</th>
            <th className="text-right p-2">ρ (kg/m³)</th>
            <th className="text-left p-2">Date d'essai</th>
            <th className="text-left p-2">Statut</th>
            <th className="text-left p-2">Motif / justification</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id} className="border-b border-border/50">
              <td className="p-2 font-mono text-[10px]">{c.id}</td>
              <td className="p-2 font-medium">{c.reference}</td>
              <td className="p-2 text-right">{fmt(c.diametre, 0)}</td>
              <td className="p-2 text-right">{fmt(c.longueur, 0)}</td>
              <td className="p-2 text-right">{fmt(c.ld, 3)}</td>
              <td className="p-2 text-right">{fmt(c.charge, 2)}</td>
              <td className="p-2 text-right">{fmt(c.section, 0)}</td>
              <td className="p-2 text-right">{fmt(c.fcore)}</td>
              <td className="p-2 text-right">{fmt(c.k, 3)}</td>
              <td className="p-2">{c.k_methode || "—"}{c.k_methode_version ? ` (${c.k_methode_version})` : ""}</td>
              <td className="p-2 text-right font-semibold">{fmt(c.fcorr)}</td>
              <td className="p-2 text-right">{fmt(c.masse_volumique, 0)}</td>
              <td className="p-2">{dt(c.date_essai, false)}</td>
              <td className="p-2">{STATUT_LABELS[c.statut]?.emoji} {STATUT_LABELS[c.statut]?.label ?? c.statut}</td>
              <td className="p-2">{c.motif_exclusion || (c.motifs_domaine?.length ? c.motifs_domaine.join(" ; ") : "—")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <EssaiBreadcrumb
          items={[
            { label: "Béton", path: "/essais/beton" },
            { label: "Destructif", path: "/essais/beton/destructif" },
            { label: "Carottage", path: basePath },
            { label: ref, path: `${basePath}/${id}` },
            { label: "Évaluation normative — lecture seule" },
          ]}
        />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between print:hidden">
        <div className="flex items-start gap-3 sm:gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(`${basePath}/${id}`)}
            title="Retour au détail du carottage"
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50 shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">
              Évaluation normative — <span className="text-primary">Lecture seule</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {ref} • {evaluation.norme_code} version {evaluation.norme_version} • {evaluation.figee ? "évaluation figée" : "brouillon"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => PrintService.print({ title: `Evaluation-normative-${ref}`, orientation: "portrait" })}
          className="w-full sm:w-auto"
        >
          <Printer className="h-4 w-4 mr-2" />
          Imprimer / PDF
        </Button>
      </div>

      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm print:hidden flex items-center gap-2">
        <Lock className="h-4 w-4 text-amber-500 shrink-0" />
        {evaluation.figee
          ? "Cette évaluation est figée et présentée en lecture seule. Les valeurs affichées sont les données archivées au moment de sa validation — aucun recalcul n'est effectué."
          : "Ce brouillon d'évaluation est présenté en lecture seule. Les valeurs affichées sont les données archivées lors du dernier enregistrement — aucun recalcul n'est effectué."}
      </div>


      <div
        className="rounded-xl border border-border bg-card p-6 space-y-6 print:rounded-none print:border-0 print:bg-white print:text-black print:p-0"
        data-ref="report"
        data-print-root
        data-print-template={TEMPLATE}
      >
        <div className="hidden print:block">
          <EntrepriseHeader
            title="Évaluation normative de la résistance du béton"
            subtitle={`Carottage ${ref} — ${evaluation.norme_code} version ${evaluation.norme_version ?? ""} — document figé`}
          />
        </div>

        {/* 1 — IDENTIFICATION */}
        <section>
          <h3 className="font-semibold mb-2">1 — Identification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <p><span className="text-muted-foreground">Client : </span>{echantillon?.clients?.nom || "—"}</p>
            <p><span className="text-muted-foreground">Chantier / projet : </span>{echantillon?.chantiers?.nom || "—"}</p>
            <p><span className="text-muted-foreground">Ouvrage : </span>{echantillon?.ouvrage || "—"}</p>
            <p><span className="text-muted-foreground">Partie d'ouvrage : </span>{echantillon?.partie_ouvrage || "—"}</p>
            <p><span className="text-muted-foreground">Zone / emplacement : </span>{echantillon?.localisation || "—"}</p>
            <p><span className="text-muted-foreground">Référence de l'essai : </span>{ref}</p>
            <p><span className="text-muted-foreground">Date de prélèvement : </span>{dt(echantillon?.date_prelevement, false)}</p>
            <p><span className="text-muted-foreground">Date de l'évaluation : </span>{dt(evaluation.created_at)}</p>
          </div>
        </section>

        {/* 2 — OBJECTIF */}
        <section>
          <h3 className="font-semibold mb-2">2 — Objectif de l'évaluation</h3>
          <div className="text-sm space-y-1">
            <p><span className="text-muted-foreground">Objectif : </span>{evaluation.objectif} — {evaluation.objectif_label || "—"}</p>
            <p><span className="text-muted-foreground">Nature de l'analyse : </span>{typeAnalyse}{stats.estimation_seule === true && " (aucun verdict de conformité)"}</p>
          </div>
        </section>

        {/* 3 — RÉFÉRENTIEL */}
        <section>
          <h3 className="font-semibold mb-2">3 — Référentiel normatif</h3>
          <div className="text-sm space-y-1">
            <p><span className="text-muted-foreground">Norme : </span>{evaluation.norme_nom || evaluation.norme_code}</p>
            <p><span className="text-muted-foreground">Version / date : </span>{evaluation.norme_version || "—"} / {evaluation.norme_date || "—"}</p>
            <p><span className="text-muted-foreground">Procédure et clause : </span>{evaluation.procedure_label || evaluation.procedure_code || "—"}</p>
            <p><span className="text-muted-foreground">Formule d'estimation appliquée : </span>{String(stats.fck_is_detail ?? "—")}</p>
            <p><span className="text-muted-foreground">Seuil de conformité : </span>{String(stats.seuil_85_detail ?? "—")}</p>
          </div>
        </section>

        {/* 4 — CONTEXTE */}
        <section>
          <h3 className="font-semibold mb-2">4 — Données de contexte</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <p><span className="text-muted-foreground">Classe de béton spécifiée : </span>{evaluation.classe_beton || "non renseignée"}</p>
            <p><span className="text-muted-foreground">fck cylindre / cube : </span>{fmt(evaluation.fck_cyl, 0)} / {fmt(evaluation.fck_cube, 0)} MPa</p>
            <p><span className="text-muted-foreground">Dmax granulat : </span>{evaluation.dmax != null ? `${evaluation.dmax} mm` : "non renseigné"}</p>
            <p><span className="text-muted-foreground">Source du Dmax : </span>{evaluation.dmax_source || "—"}</p>
          </div>
          {avertissements.length > 0 && (
            <div className="mt-3 text-sm">
              <p className="font-semibold">Avertissements et hypothèses archivés</p>
              <ul className="list-disc pl-5">{avertissements.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </div>
          )}
          {donneesManquantes.length > 0 && (
            <div className="mt-3 text-sm">
              <p className="font-semibold">Données manquantes signalées lors de l'évaluation</p>
              <ul className="list-disc pl-5">{donneesManquantes.map((d, i) => <li key={i}>{d}</li>)}</ul>
            </div>
          )}
        </section>

        {/* 5 — CAROTTES */}
        <section className="space-y-4">
          <h3 className="font-semibold">5 — Carottes de la campagne</h3>
          {groupes.map((g) => {
            const items = carottes.filter((c) => c.statut === g.code);
            if (items.length === 0) return null;
            return (
              <div key={g.code} className="space-y-1">
                <p className="text-sm font-medium">{g.titre} ({items.length})</p>
                <Table items={items} />
              </div>
            );
          })}
          {carottes.length === 0 && <p className="text-sm text-muted-foreground">Aucune carotte archivée.</p>}
        </section>

        {/* 6 — STATISTIQUES */}
        <section>
          <h3 className="font-semibold mb-2">6 — Statistiques utilisées pour l'évaluation</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-2">Grandeur</th>
                  <th className="text-right p-2">Valeur</th>
                  <th className="text-left p-2">Unité</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50"><td className="p-2">n (carottes retenues)</td><td className="p-2 text-right">{fmt(stats.n, 0)}</td><td className="p-2">—</td></tr>
                <tr className="border-b border-border/50"><td className="p-2">Moyenne fm(n),is</td><td className="p-2 text-right">{fmt(stats.moyenne)}</td><td className="p-2">MPa</td></tr>
                <tr className="border-b border-border/50"><td className="p-2">Minimum fis,lowest</td><td className="p-2 text-right">{fmt(stats.min)}</td><td className="p-2">MPa</td></tr>
                <tr className="border-b border-border/50"><td className="p-2">Maximum</td><td className="p-2 text-right">{fmt(stats.max)}</td><td className="p-2">MPa</td></tr>
                <tr className="border-b border-border/50"><td className="p-2">Médiane</td><td className="p-2 text-right">{fmt(stats.mediane)}</td><td className="p-2">MPa</td></tr>
                <tr className="border-b border-border/50"><td className="p-2">Écart-type s</td><td className="p-2 text-right">{fmt(stats.ecartType)}</td><td className="p-2">MPa</td></tr>
                <tr className="border-b border-border/50"><td className="p-2">Coefficient de variation CV</td><td className="p-2 text-right">{fmt(stats.coefVariation, 1)}</td><td className="p-2">%</td></tr>
                <tr className="border-b border-border/50"><td className="p-2">Étendue</td><td className="p-2 text-right">{fmt(stats.etendue)}</td><td className="p-2">MPa</td></tr>
                <tr className="border-b border-border/50"><td className="p-2 font-semibold">fck,is</td><td className="p-2 text-right font-semibold">{fmt(stats.fck_is)}</td><td className="p-2">MPa</td></tr>
                <tr className="border-b border-border/50"><td className="p-2">Seuil de conformité appliqué</td><td className="p-2 text-right">{fmt(stats.seuil_85)}</td><td className="p-2">MPa</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Affichage arrondi — les valeurs archivées conservent la précision interne du calcul.
          </p>
        </section>

        {/* 7 — CRITÈRES */}
        <section>
          <h3 className="font-semibold mb-2">7 — Critères normatifs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-2">Critère</th>
                  <th className="text-left p-2">Formule</th>
                  <th className="text-right p-2">Valeur obtenue</th>
                  <th className="text-right p-2">Seuil exigé</th>
                  <th className="text-left p-2">Norme / version / clause</th>
                  <th className="text-left p-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {criteres.map((c, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="p-2">{c.libelle}</td>
                    <td className="p-2 text-xs">{c.formule}</td>
                    <td className="p-2 text-right">{fmt(c.valeurCalculee)} {c.unite}</td>
                    <td className="p-2 text-right">{c.valeurExigee === null || c.valeurExigee === undefined ? "—" : `${c.valeurExigee.toFixed(2)} ${c.unite}`}</td>
                    <td className="p-2 text-xs text-muted-foreground">{c.norme}:{c.version} {c.clause}</td>
                    <td className="p-2">{CRITERE_ETAT[c.resultat]?.emoji} {CRITERE_ETAT[c.resultat]?.label ?? "—"}</td>
                  </tr>
                ))}
                {criteres.length === 0 && (
                  <tr><td className="p-2 text-muted-foreground" colSpan={6}>Aucun critère archivé — 🟠 NON CONCLUANT</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 8 — VERDICT */}
        <section>
          <h3 className="font-semibold mb-2">8 — Verdict normatif enregistré</h3>
          <Badge variant="outline" className={`text-sm px-3 py-1 ${verdictInfo?.className ?? ""}`}>
            {verdictInfo?.emoji} {verdictInfo?.label}
          </Badge>
          <p className="text-[11px] text-muted-foreground mt-2">
            Verdict tel qu'enregistré lors de la validation — aucune règle actuelle n'est réappliquée à cette évaluation.
          </p>
        </section>

        {/* 9 — CONCLUSION */}
        <section>
          <h3 className="font-semibold mb-2">9 — Conclusion</h3>
          <p className="text-sm">{evaluation.conclusion || "—"}</p>
        </section>

        {/* 10 — VALIDATION / TRAÇABILITÉ */}
        <section>
          <h3 className="font-semibold mb-2">10 — Validation et traçabilité</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <p><span className="text-muted-foreground">Créée par : </span>{evaluation.created_by_nom || "—"}</p>
            <p><span className="text-muted-foreground">Date de création : </span>{dt(evaluation.created_at)}</p>
            <p><span className="text-muted-foreground">Validée par : </span>{evaluation.validee_par_nom || "—"}</p>
            <p><span className="text-muted-foreground">Date de validation : </span>{dt(evaluation.validee_at)}</p>
            <p><span className="text-muted-foreground">Statut : </span>{evaluation.figee ? "FIGÉE (lecture seule)" : "BROUILLON"}</p>
            <p className="font-mono text-[11px]"><span className="text-muted-foreground font-sans">Identifiant : </span>{evaluation.id}</p>
          </div>
          <p className="text-sm mt-2 font-medium">
            Cette évaluation est figée et présentée en lecture seule.
          </p>
        </section>
      </div>

      {/* Impression native A4 — HTML/CSS, texte et tableaux sélectionnables (aucune image de contenu) */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm 12mm 14mm 12mm; }
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          #root { padding: 0 !important; }
          [data-print-template="${TEMPLATE}"],
          [data-print-template="${TEMPLATE}"] * { visibility: visible; }
          [data-print-template="${TEMPLATE}"] {
            position: absolute; top: 0; left: 0; width: 100%;
            color: #000; background: #fff; font-size: 10pt;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          [data-print-template="${TEMPLATE}"] h2,
          [data-print-template="${TEMPLATE}"] h3 { break-after: avoid; page-break-after: avoid; }
          [data-print-template="${TEMPLATE}"] section { break-inside: avoid; page-break-inside: avoid; }
          [data-print-template="${TEMPLATE}"] table { width: 100%; border-collapse: collapse; break-inside: auto; font-size: 8pt; }
          [data-print-template="${TEMPLATE}"] thead { display: table-header-group; }
          [data-print-template="${TEMPLATE}"] tr { break-inside: avoid; page-break-inside: avoid; }
          [data-print-template="${TEMPLATE}"] th,
          [data-print-template="${TEMPLATE}"] td { border: 1px solid #000; padding: 2px 4px; }
          [data-print-template="${TEMPLATE}"] p { orphans: 3; widows: 3; }
        }
      `}</style>
    </div>
  );
};

export default CarottageEvaluationLecture;
