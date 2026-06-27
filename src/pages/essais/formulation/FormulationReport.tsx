import { useRef, useEffect } from "react";
import { downloadReportAsPDF } from "@/lib/pdf";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Printer, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EssaiBreadcrumb, BreadcrumbItem } from "@/components/essais/EssaiBreadcrumb";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { DocumentPageHeader } from "@/components/documents/DocumentPageHeader";
import ShareButton from "@/components/reports/ShareButton";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useFormulation } from "@/hooks/useFormulations";
import { useFormulationDetails } from "@/hooks/useFormulationDetails";
import { useCentraleBeton } from "@/hooks/useCentralesBeton";
import {
  useFormulationGranulatsEssais,
  GranulatEssais,
} from "@/hooks/useFormulationGranulatsEssais";
import { useFormulationContext } from "@/hooks/useFormulationContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ---------- Helpers ----------
const fmt = (v: number | null | undefined, digits = 2) =>
  v === null || v === undefined || Number.isNaN(v) ? "—" : Number(v).toFixed(digits);

const fmtInt = (v: number | null | undefined) =>
  v === null || v === undefined || Number.isNaN(v) ? "—" : Math.round(Number(v)).toString();

// Standard tamis used in the model
const TAMIS_STD = [40, 31.5, 25, 20, 16, 12.5, 10, 8, 6.3, 5, 4, 2, 1, 0.5, 0.25, 0.125, 0.063];

function getPassant(granulo: any, ouverture: number): number | null {
  if (!granulo?.tamis) return null;
  const t = granulo.tamis.find((x: any) => Number(x.ouverture) === ouverture);
  return t?.passant ?? null;
}

// MF category
function mfCategory(mf: number | null): string {
  if (mf === null || mf === undefined) return "—";
  if (mf >= 2.4 && mf <= 4) return "CF (Sable grossier)";
  if (mf >= 1.5 && mf < 2.8) return "MF (Sable moyen)";
  if (mf >= 0.6 && mf < 2.1) return "FF (Sable fin)";
  return "Hors catégorie";
}

// ---------- Page wrapper ----------
function ReportPage({ children, last = false }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div
      className={`report-page bg-white p-8 ${!last ? "page-break" : ""}`}
      style={{
        width: "210mm",
        height: "297mm",
        boxSizing: "border-box",
        margin: "0 auto 8mm auto",
        fontFamily: "'Times New Roman', Georgia, serif",
        color: "#000",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div style={{ height: "calc(100% - 10mm)", overflow: "hidden" }}>{children}</div>
      <div
        className="report-page-footer"
        style={{
          position: "absolute",
          bottom: "6mm",
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: "10px",
          color: "#555",
          fontFamily: "'Times New Roman', Georgia, serif",
        }}
      />
    </div>
  );
}

interface GranuloRowProps {
  label: string;
  granulat: GranulatEssais | null;
  numero?: number;
}

function GranulometrieTable({ label, granulat, numero }: GranuloRowProps) {
  const tamis = granulat?.granulometrie?.tamis || [];
  if (!tamis.length) {
    return (
      <div className="mb-4">
        <p className="text-sm font-bold mb-1 text-black">
          {numero ? `Tableau ${numero}: ` : ""}Analyse granulométrique de {label}
          {granulat?.produit_nom ? ` : ${granulat.produit_nom}` : ""}
          {granulat?.carriere_nom ? ` (${granulat.carriere_nom})` : ""}
        </p>
        <p className="text-xs italic text-black">Aucune analyse granulométrique disponible.</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <p className="text-sm font-bold mb-1 text-black">
        {numero ? `Tableau ${numero}: ` : ""}Analyse granulométrique de {label}
        {granulat?.produit_nom ? ` : ${granulat.produit_nom}` : ""}
        {granulat?.carriere_nom ? ` (${granulat.carriere_nom})` : ""}
      </p>
      <table className="w-full border-collapse border border-black text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th rowSpan={2} className="border border-black px-1 py-1 text-black">
              Ouverture<br />tamis (mm)
            </th>
            <th colSpan={2} className="border border-black px-1 py-1 text-black">
              Poids [gr]
            </th>
            <th colSpan={2} className="border border-black px-1 py-1 text-black">
              Poids [%]
            </th>
          </tr>
          <tr className="bg-gray-100">
            <th className="border border-black px-1 py-1 text-black">Refus partiels</th>
            <th className="border border-black px-1 py-1 text-black">Refus Cumulés</th>
            <th className="border border-black px-1 py-1 text-black">% Refus Cum.</th>
            <th className="border border-black px-1 py-1 text-black">% Passants</th>
          </tr>
        </thead>
        <tbody>
          {tamis
            .filter((t: any) => t?.ouverture !== undefined && t?.ouverture !== null)
            .map((t: any, i: number) => (
              <tr key={i}>
                <td className="border border-black px-1 py-0.5 text-center text-black">{t.ouverture}</td>
                <td className="border border-black px-1 py-0.5 text-center text-black">{fmt(t.refus, 1)}</td>
                <td className="border border-black px-1 py-0.5 text-center text-black">{fmt(t.refusCumule, 1)}</td>
                <td className="border border-black px-1 py-0.5 text-center text-black">{fmt(t.pourcentageRefusCumule, 1)}</td>
                <td className="border border-black px-1 py-0.5 text-center font-medium text-black">{fmt(t.passant, 1)}</td>
              </tr>
            ))}
        </tbody>
      </table>
      {granulat?.granulometrie?.module_finesse !== null &&
        granulat?.granulometrie?.module_finesse !== undefined && (
          <p className="text-xs mt-1 text-black">
            <span className="font-medium">Module de finesse :</span>{" "}
            {fmt(granulat.granulometrie.module_finesse, 2)}
            {" — "}
            <span className="font-medium">Teneur en fines (f) :</span>{" "}
            {fmt(granulat.granulometrie.teneur_fines_f, 2)} %
          </p>
        )}
      <GranulometrieCourbe label={label} tamis={tamis} />
    </div>
  );
}

function GranulometrieCourbe({ label, tamis }: { label: string; tamis: any[] }) {
  const data = (tamis || [])
    .filter((t: any) => t?.ouverture !== undefined && t?.ouverture !== null && t?.passant !== undefined && t?.passant !== null)
    .map((t: any) => ({ ouverture: Number(t.ouverture), passant: Number(t.passant) }))
    .sort((a, b) => a.ouverture - b.ouverture);
  if (data.length < 2) return null;
  const ouvs = data.map((d) => d.ouverture);
  const minO = Math.min(...ouvs, 0.063);
  const maxO = Math.max(...ouvs, 1);
  return (
    <div className="mt-2 mb-2 avoid-break" style={{ width: "100%", height: "220px", background: "#fff" }}>
      <p className="text-xs italic text-black mb-1">Courbe granulométrique — {label}</p>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 25 }}>
          <CartesianGrid stroke="#cbd5e1" strokeDasharray="3 3" />
          <XAxis
            dataKey="ouverture"
            type="number"
            scale="log"
            domain={[minO, maxO]}
            ticks={TAMIS_STD.filter((v) => v >= minO && v <= maxO)}
            tick={{ fill: "#000", fontSize: 9 }}
            label={{ value: "Ouverture des tamis (mm) — log", position: "insideBottom", offset: -8, fill: "#000", fontSize: 10 }}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
            tick={{ fill: "#000", fontSize: 9 }}
            label={{ value: "Passants (%)", angle: -90, position: "insideLeft", fill: "#000", fontSize: 10 }}
          />
          <Tooltip />
          <Line type="monotone" dataKey="passant" name={label} stroke="#1e40af" strokeWidth={2} dot={{ r: 2.5, fill: "#1e40af" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function applyUniformReportTableStyles(root: HTMLElement) {
  const tables = root.querySelectorAll<HTMLTableElement>("table");
  tables.forEach((table) => {
    table.style.setProperty("border-collapse", "collapse", "important");
    table.style.setProperty("border-spacing", "0", "important");
    table.style.setProperty("width", "100%", "important");
    table.style.setProperty("border", "1px solid #000000", "important");
    table.style.setProperty("box-sizing", "border-box", "important");

    table.querySelectorAll<HTMLTableCellElement>("th, td").forEach((cell) => {
      cell.style.setProperty("border", "1px solid #000000", "important");
      cell.style.setProperty("vertical-align", "middle", "important");
      cell.style.setProperty("text-align", "center", "important");
      cell.style.setProperty("padding", "4px 6px", "important");
      cell.style.setProperty("box-sizing", "border-box", "important");
      cell.style.setProperty("line-height", "1.25", "important");
      cell.style.setProperty("color", "#000000", "important");
    });
  });
}

export default function FormulationReport() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const reportRef = useRef<HTMLDivElement>(null);

  const { data: formulation, isLoading } = useFormulation(id || "");
  const { data: details } = useFormulationDetails(id);
  const { data: entreprise } = useEntreprise();
  const { data: centrale } = useCentraleBeton(formulation?.centrale_id || "");
  const { data: gEssais } = useFormulationGranulatsEssais(id);
  const { data: ctx } = useFormulationContext(
    formulation?.client_id,
    formulation?.chantier_id,
    formulation?.maitre_ouvrage_id,
    formulation?.maitre_oeuvre_id,
    formulation?.essai_compression_id,
    formulation?.centrale_id
  );

  // Charge l'essai de convenance complet (Étape 8) pour l'intégrer au rapport.
  // Fallback automatique : si la formulation n'a pas d'essai_compression_id explicite,
  // on prend le premier échantillon de compression marqué comme essai de convenance
  // lié à cette formulation, afin que la page apparaisse toujours dans le rapport.
  const SELECT_COLS = `
    id, numero, ouvrage, date_coulage, date_essai, classe_resistance, classe_consistance,
    dimension_eprouvette, type_eprouvette, condition_cure, etuvage, nombre_eprouvettes,
    essai_convenance, essai_convenance_details, resultats, jours_essai,
    temperature_air, temperature_beton,
    clients(nom), chantiers(nom),
    intervenants:operateur_id(nom, prenom)
  `;
  const { data: convenance } = useQuery({
    queryKey: [
      "formulation-convenance-full",
      formulation?.id,
      formulation?.essai_compression_id,
    ],
    enabled: !!formulation?.id,
    queryFn: async () => {
      // 1) Essai explicitement lié
      if (formulation?.essai_compression_id) {
        const { data, error } = await supabase
          .from("echantillons_compression")
          .select(SELECT_COLS)
          .eq("id", formulation.essai_compression_id)
          .maybeSingle();
        if (error) throw error;
        if (data) return data;
      }
      // 2) Fallback : premier essai de convenance lié à la formulation
      const { data, error } = await supabase
        .from("echantillons_compression")
        .select(SELECT_COLS)
        .eq("formulation_id", formulation!.id)
        .eq("essai_convenance", true)
        .order("numero", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const handlePrint = () => window.print();

  // Numérotation des pages : "Page X / Y" injecté dans chaque .report-page-footer
  useEffect(() => {
    if (!reportRef.current) return;
    let scheduled = false;
    let updating = false;
    const update = () => {
      scheduled = false;
      const root = reportRef.current;
      if (!root) return;
      updating = true;
      applyUniformReportTableStyles(root);
      const footers = root.querySelectorAll<HTMLDivElement>(".report-page-footer");
      const total = footers.length;
      footers.forEach((f, i) => {
        const next = `Page ${i + 1} / ${total}`;
        if (f.textContent !== next) f.textContent = next;
      });
      // Laisse les mutations déclenchées par nous-mêmes se vider avant de réécouter
      requestAnimationFrame(() => { updating = false; });
    };
    const schedule = () => {
      if (scheduled || updating) return;
      scheduled = true;
      requestAnimationFrame(update);
    };
    update();
    const obs = new MutationObserver((mutations) => {
      if (updating) return;
      // Ignore les mutations qui ne concernent que les footers (notre propre écriture)
      const relevant = mutations.some(
        (m) => !(m.target as HTMLElement)?.classList?.contains("report-page-footer")
      );
      if (relevant) schedule();
    });
    obs.observe(reportRef.current, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);


  const handleDownloadPDF = async () => {
    downloadReportAsPDF("document");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!formulation) {
    return <div className="text-center py-8 text-muted-foreground">Formulation non trouvée</div>;
  }

  // ---------- Calculations ----------
  const sables = (formulation.sable_concasse_quantite || 0) + (formulation.sable_fin_quantite || 0);
  const graviers =
    (formulation.gravillons1_quantite || 0) +
    (formulation.gravier2_quantite || 0) +
    (formulation.gravier3_quantite || 0);
  const eau = formulation.eau_quantite || 0;
  const ciment = formulation.ciment_quantite || 0;
  const adjuvant = formulation.adjuvant_quantite || 0;
  const totalGranulats = sables + graviers;
  const total = totalGranulats + ciment + adjuvant + eau;

  const gs = sables > 0 ? (graviers / sables).toFixed(2) : "—";
  const ec = ciment > 0 ? (eau / ciment).toFixed(2) : "—";

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Béton", path: "/essais/beton" },
    { label: "Formulation", path: "/essais/beton/formulation" },
    { label: formulation.nom },
    { label: "Rapport" },
  ];

  const verificationUrl = `${window.location.origin}/essais/beton/formulation/${id}/rapport`;
  const dateRapport = format(new Date(formulation.updated_at), "dd MMMM yyyy", { locale: fr });
  const numeroRapport = `F-${formulation.nom}/${new Date(formulation.created_at).getFullYear()}`;

  // Build composition rows (granulats + binders) with densities
  type CompoRow = {
    code: string;
    label: string;
    producteur: string | null;
    quantite: number;
    densite: number | null;
    isLiquid?: boolean;
  };

  const compoRows: CompoRow[] = [];
  const pushIf = (
    qty: number | null | undefined,
    code: string,
    label: string,
    producteur: string | null,
    dens: number | null,
    forceShow = false
  ) => {
    if (forceShow || (qty && qty > 0)) {
      compoRows.push({ code, label, producteur, quantite: qty || 0, densite: dens });
    }
  };
  // Force show if granulat is configured (produit_nom present), even if quantite = 0
  pushIf(
    formulation.gravier3_quantite,
    "GIII",
    gEssais?.gravier3?.produit_nom || "Gravier 3",
    gEssais?.gravier3?.carriere_nom ?? null,
    gEssais?.gravier3?.densite_absolue ?? null,
    !!gEssais?.gravier3?.produit_nom
  );
  pushIf(
    formulation.gravier2_quantite,
    "GII",
    gEssais?.gravier2?.produit_nom || "Gravier 2",
    gEssais?.gravier2?.carriere_nom ?? null,
    gEssais?.gravier2?.densite_absolue ?? null,
    !!gEssais?.gravier2?.produit_nom
  );
  pushIf(
    formulation.gravillons1_quantite,
    "GI",
    gEssais?.gravillons1?.produit_nom || "Gravillons 1",
    gEssais?.gravillons1?.carriere_nom ?? null,
    gEssais?.gravillons1?.densite_absolue ?? null,
    !!gEssais?.gravillons1?.produit_nom
  );
  pushIf(
    formulation.sable_concasse_quantite,
    "SI",
    gEssais?.sable_concasse?.produit_nom || "Sable concassé",
    gEssais?.sable_concasse?.carriere_nom ?? null,
    gEssais?.sable_concasse?.densite_absolue ?? null,
    !!gEssais?.sable_concasse?.produit_nom
  );
  pushIf(
    formulation.sable_fin_quantite,
    "SII",
    gEssais?.sable_fin?.produit_nom || "Sable fin",
    gEssais?.sable_fin?.carriere_nom ?? null,
    gEssais?.sable_fin?.densite_absolue ?? null,
    !!gEssais?.sable_fin?.produit_nom
  );

  const cimentNom = details?.ciment.produit_nom || "Ciment";
  const cimentProducteur = details?.ciment.producteur_nom || null;
  const adjuvantNom = details?.adjuvant.produit_nom || "Adjuvant";
  const adjuvantProducteur = details?.adjuvant.producteur_nom || null;
  const hasAdjuvant = !!details?.adjuvant.produit_nom || !!details?.adjuvant.producteur_nom || (formulation.adjuvant_quantite || 0) > 0;
  const eauNom = details?.eau.produit_nom || "Eau";
  const eauProducteur = details?.eau.producteur_nom || null;

  // Granulats array for granulométrie + tableaux
  const granulatsList = [
    { key: "sable_concasse", label: "Sable", g: gEssais?.sable_concasse },
    { key: "sable_fin", label: "Sable fin", g: gEssais?.sable_fin },
    { key: "gravillons1", label: "Gravillon", g: gEssais?.gravillons1 },
    { key: "gravier2", label: "Gravier", g: gEssais?.gravier2 },
    { key: "gravier3", label: "Gravier", g: gEssais?.gravier3 },
  ].filter(
    (x) =>
      x.g &&
      (x.g.produit_nom ||
        x.g.granulometrie ||
        x.g.es_moyen !== null ||
        x.g.valeur_mb !== null ||
        x.g.densite_absolue !== null ||
        x.g.densite_apparente !== null ||
        x.g.coefficient_la !== null ||
        x.g.coefficient_mde !== null)
  );

  // Sables only
  const sablesList = granulatsList.filter((x) => x.key.startsWith("sable"));
  const graviersList = granulatsList.filter((x) => !x.key.startsWith("sable"));

  // ----- Données pour la courbe granulométrique du mélange -----
  const getQty = (key: string) => {
    switch (key) {
      case "sable_concasse": return formulation.sable_concasse_quantite || 0;
      case "sable_fin": return formulation.sable_fin_quantite || 0;
      case "gravillons1": return formulation.gravillons1_quantite || 0;
      case "gravier2": return formulation.gravier2_quantite || 0;
      case "gravier3": return formulation.gravier3_quantite || 0;
      default: return 0;
    }
  };

  const courbeData = TAMIS_STD.slice().sort((a, b) => a - b).map((ouv) => {
    const row: any = { ouverture: ouv, label: String(ouv) };
    let melange = 0;
    let totalPct = 0;
    granulatsList.forEach((g) => {
      const pct = totalGranulats > 0 ? (getQty(g.key) / totalGranulats) * 100 : 0;
      const passant = getPassant(g.g?.granulometrie, ouv);
      if (passant !== null) {
        row[g.key] = passant;
        melange += (passant * pct) / 100;
        totalPct += pct;
      }
    });
    row.melange = totalPct > 0 ? Number(melange.toFixed(1)) : null;
    return row;
  });

  const colors = ["#1e5a7a", "#d97706", "#16a34a", "#dc2626", "#7c3aed"];

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb items={breadcrumbItems} />

      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Rapport - <span className="text-primary">{formulation.nom}</span>
            </h1>
            <p className="text-muted-foreground mt-1">Étude de composition de béton</p>
          </div>
        </div>

        <div className="flex gap-2">
          <ShareButton />
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
          <Button onClick={handleDownloadPDF} className="gradient-primary text-primary-foreground">
            <Download className="h-4 w-4 mr-2" />
            Télécharger PDF
          </Button>
        </div>
      </div>

      <div
        ref={reportRef}
        data-ref="report"
        className="report-table mx-auto print:p-0"
        style={{ width: "210mm" }}
      >
        {/* ============== PAGE 1 — Page de garde ============== */}
        <ReportPage>
          <div className="flex flex-col h-full" style={{ minHeight: "265mm", fontFamily: "'Times New Roman', Georgia, serif" }}>
            {/* En-tête style document */}
            <DocumentPageHeader
              entreprise={entreprise as any}
              qrData={verificationUrl}
              title="ÉTUDE DE COMPOSITION DE BÉTON"
              subtitle={`Rapport N° ${numeroRapport}`}
            />

            {/* Dossier N° à droite */}
            <div className="text-right text-sm text-black mb-6">
              <p>
                <span className="font-bold">Dossier N° :</span>{" "}
                {format(new Date(formulation.created_at), "MM/yy", { locale: fr })}
              </p>
            </div>

            {/* Bloc d'information principal — style document (encadré, bordure gauche colorée) */}
            <div
              style={{
                margin: "20px auto 32px auto",
                padding: "20px 24px",
                border: "1px solid #ccc",
                borderLeft: "4px solid #1a5276",
                background: "#f8fafc",
                maxWidth: "560px",
                width: "100%",
              }}
            >
              <p style={{ fontSize: "13px", marginBottom: "10px", lineHeight: 1.6 }}>
                <strong style={{ textDecoration: "underline" }}>Formulation</strong> : <strong>{formulation.nom}</strong>
              </p>
              <p style={{ fontSize: "13px", marginBottom: "10px", lineHeight: 1.6 }}>
                <strong style={{ textDecoration: "underline" }}>Entreprise</strong> : <strong>{ctx?.client_nom || "—"}</strong>
              </p>
              <p style={{ fontSize: "13px", marginBottom: "10px", lineHeight: 1.6 }}>
                <strong style={{ textDecoration: "underline" }}>Chantier</strong> : <strong>{ctx?.chantier_nom || "—"}</strong>
              </p>
              <p style={{ fontSize: "13px", marginBottom: "10px", lineHeight: 1.6 }}>
                <strong style={{ textDecoration: "underline" }}>Maître d'ouvrage</strong> : <strong>{ctx?.maitre_ouvrage_nom || "—"}</strong>
              </p>
              <p style={{ fontSize: "13px", marginBottom: "10px", lineHeight: 1.6 }}>
                <strong style={{ textDecoration: "underline" }}>Maître d'œuvre</strong> : <strong>{ctx?.maitre_oeuvre_nom || "—"}</strong>
              </p>
              <p style={{ fontSize: "13px", marginBottom: "10px", lineHeight: 1.6 }}>
                <strong style={{ textDecoration: "underline" }}>Centrale à béton</strong> : <strong>{centrale?.nom || "—"}</strong>
                {centrale?.ville ? ` — ${centrale.ville}` : ""}
              </p>
            </div>

            {/* Date à droite — style document */}
            <div className="mt-auto" style={{ textAlign: "right" }}>
              <p style={{ fontSize: "11px", color: "#666" }}>
                Fait le {dateRapport}
              </p>
            </div>
          </div>
        </ReportPage>

        {/* ============== PAGE 2 — Introduction ============== */}
        <ReportPage>
          <ReportHeader
            entreprise={entreprise}
            verificationUrl={verificationUrl}
            title="ÉTUDE DE COMPOSITION DE BÉTON"
            subtitle={`Rapport N° ${numeroRapport}`}
          />

          <div className="text-sm text-black space-y-4" style={{ lineHeight: 1.6 }}>
            {/* Bloc identification du projet supprimé */}

            <h3 className="text-base font-bold underline">I — INTRODUCTION</h3>
            <p>
              Le {entreprise?.nom || "Laboratoire"} a procédé à des analyses spécifiques sur des
              échantillons de granulats courants de différentes classes granulaires. Ces matériaux
              ont été prélevés en vue de leur utilisation pour la fabrication du béton hydraulique
              {ctx?.chantier_nom ? <> destiné au chantier&nbsp;: <strong>{ctx.chantier_nom}</strong></> : <> destiné à la centrale&nbsp;: <strong>{centrale?.nom || "—"}</strong></>}
              {ctx?.client_nom && <> — Client&nbsp;: <strong>{ctx.client_nom}</strong></>}.
            </p>
            <p>
              Le présent rapport a pour objet de déterminer les caractéristiques de ces matériaux
              et de vérifier leurs conformités aux spécifications des normes en vigueur, et de
              formuler le mélange selon la méthode <strong>Dreux-Gorisse</strong>
              {formulation.resistance_28j && (
                <> pour atteindre une résistance caractéristique à 28 jours de <strong>{fmt(formulation.resistance_28j, 1)} MPa</strong></>
              )}
              {formulation.classe_exposition && (
                <> en classe d'exposition <strong>{formulation.classe_exposition}</strong></>
              )}.
            </p>

            <h3 className="text-base font-bold underline mt-6">PROVENANCE DES MATÉRIAUX</h3>
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black px-2 py-1 text-left text-black">Code</th>
                  <th className="border border-black px-2 py-1 text-left text-black">Constituant</th>
                  <th className="border border-black px-2 py-1 text-left text-black">Producteur / Carrière</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black px-2 py-1 font-bold text-black">C</td>
                  <td className="border border-black px-2 py-1 text-black">{cimentNom}</td>
                  <td className="border border-black px-2 py-1 text-black">{cimentProducteur || "—"}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 font-bold text-black">E</td>
                  <td className="border border-black px-2 py-1 text-black">{eauNom}</td>
                  <td className="border border-black px-2 py-1 text-black">{eauProducteur || "—"}</td>
                </tr>
                {hasAdjuvant && (
                  <tr>
                    <td className="border border-black px-2 py-1 font-bold text-black">Adj</td>
                    <td className="border border-black px-2 py-1 text-black">{adjuvantNom}</td>
                    <td className="border border-black px-2 py-1 text-black">{adjuvantProducteur || "—"}</td>
                  </tr>
                )}
                {compoRows.map((r) => (
                  <tr key={r.code}>
                    <td className="border border-black px-2 py-1 font-bold text-black">{r.code}</td>
                    <td className="border border-black px-2 py-1 text-black">{r.label}</td>
                    <td className="border border-black px-2 py-1 text-black">{r.producteur || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        </ReportPage>

        {/* ============== PAGE 3 — Essais réalisés ============== */}
        <ReportPage>
          <ReportHeader
            entreprise={entreprise}
            verificationUrl={verificationUrl}
            title="ÉTUDE DE COMPOSITION DE BÉTON"
            subtitle={`Rapport N° ${numeroRapport}`}
          />

          <div className="text-sm text-black space-y-4" style={{ lineHeight: 1.6 }}>
            <h3 className="text-base font-bold underline">ESSAIS RÉALISÉS SUR GRANULATS ET BÉTON</h3>
            <table className="w-full border-collapse border border-black text-xs mt-2" style={{ pageBreakInside: 'auto' }}>
              <thead style={{ display: 'table-header-group' }}>
                <tr className="bg-gray-100">
                  <th className="border border-black px-2 py-0.5 text-left text-black">Essais</th>
                  <th className="border border-black px-2 py-0.5 text-left text-black">Norme de référence</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border border-black px-2 py-0.5 text-black">Analyse granulométrique, teneur en fines</td><td className="border border-black px-2 py-0.5 text-black">NF EN 933-1</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Module de finesse des sables</td><td className="border border-black px-2 py-0.5 text-black">NF EN 12620 / NF P 18-545</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Équivalent de sable (SE)</td><td className="border border-black px-2 py-0.5 text-black">NF EN 933-8 / NF P 18-597</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Bleu de méthylène (MB)</td><td className="border border-black px-2 py-0.5 text-black">NF EN 933-9</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Coefficient d'aplatissement</td><td className="border border-black px-2 py-0.5 text-black">NF EN 933-3</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Los-Angeles (LA)</td><td className="border border-black px-2 py-0.5 text-black">NF EN 1097-2</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Micro-Deval (MDE)</td><td className="border border-black px-2 py-0.5 text-black">NF EN 1097-1</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Masse volumique réelle et absorption</td><td className="border border-black px-2 py-0.5 text-black">NF EN 1097-6</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Masse volumique apparente (vrac)</td><td className="border border-black px-2 py-0.5 text-black">NF EN 1097-3</td></tr>
                
                <tr><td className="border border-black px-2 py-0.5 text-black">Plasticité au cône d'Abrams (slump)</td><td className="border border-black px-2 py-0.5 text-black">NF EN 12350-2</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Masse volumique du béton frais</td><td className="border border-black px-2 py-0.5 text-black">NF EN 12350-6</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Confection des éprouvettes d'essai</td><td className="border border-black px-2 py-0.5 text-black">NF EN 12390-2</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Résistance à la compression</td><td className="border border-black px-2 py-0.5 text-black">NF EN 12390-3</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Propreté superficielle des gravillons</td><td className="border border-black px-2 py-0.5 text-black">NF EN 933-7</td></tr>
                
                <tr><td className="border border-black px-2 py-0.5 text-black">Température du béton frais</td><td className="border border-black px-2 py-0.5 text-black">NF EN 12350-1</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Conservation et cure des éprouvettes</td><td className="border border-black px-2 py-0.5 text-black">NF EN 12390-2</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Masse volumique du béton durci</td><td className="border border-black px-2 py-0.5 text-black">NF EN 12390-7</td></tr>
                
                <tr><td className="border border-black px-2 py-0.5 text-black">Spécifications, performances, production et conformité du béton</td><td className="border border-black px-2 py-0.5 text-black">NF EN 206/CN</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Granulats pour béton — Spécifications</td><td className="border border-black px-2 py-0.5 text-black">NF EN 12620</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Formulation Dreux-Gorisse</td><td className="border border-black px-2 py-0.5 text-black">Méthode pratique Dreux-Gorisse</td></tr>
              </tbody>
            </table>

            <p className="text-xs italic mt-4 text-black">
              * La production de ce rapport d'essais n'est autorisée que sous sa forme intégrale.
            </p>
          </div>
        </ReportPage>

        {/* ============== PAGE — Granulométries Sables (1 sable / page) ============== */}
        {sablesList.map((s, i) => (
          <ReportPage key={`gran-sable-${s.key}`}>
            <ReportHeader
              entreprise={entreprise}
              verificationUrl={verificationUrl}
              title="II — IDENTIFICATIONS DES GRANULATS"
              subtitle={`II.1 Sables — Analyse granulométrique (${i + 1}/${sablesList.length})`}
            />
            <GranulometrieTable
              label={s.label}
              granulat={s.g!}
              numero={i + 1}
            />
          </ReportPage>
        ))}

        {/* ============== Module de finesse (sables) ============== */}
        {sablesList.length > 0 && sablesList.some((s) => s.g?.granulometrie?.module_finesse !== null) && (
          <ReportPage>
            <ReportHeader
              entreprise={entreprise}
              verificationUrl={verificationUrl}
              title="II — IDENTIFICATIONS DES GRANULATS"
              subtitle="II.1.2 Module de finesse des sables"
            />
            <div className="mb-4 mt-4">
              <p className="text-sm font-bold mb-1 text-black">Tableau : Module de finesse</p>
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black px-2 py-1 text-black">Classe granulaire</th>
                    <th className="border border-black px-2 py-1 text-black">Module de finesse FM</th>
                    <th className="border border-black px-2 py-1 text-black">Catégorie</th>
                  </tr>
                </thead>
                <tbody>
                  {sablesList.map((s) => (
                    <tr key={s.key}>
                      <td className="border border-black px-2 py-1 text-black">{s.g?.produit_nom || s.label}</td>
                      <td className="border border-black px-2 py-1 text-center text-black">
                        {fmt(s.g?.granulometrie?.module_finesse, 2)}
                      </td>
                      <td className="border border-black px-2 py-1 text-center text-black">
                        {mfCategory(s.g?.granulometrie?.module_finesse ?? null)}
                      </td>
                    </tr>
                  ))}
                  {(() => {
                    let totalQty = 0;
                    let weighted = 0;
                    sablesList.forEach((s) => {
                      const qty = getQty(s.key);
                      const mf = s.g?.granulometrie?.module_finesse;
                      if (qty > 0 && mf !== null && mf !== undefined) {
                        weighted += mf * qty;
                        totalQty += qty;
                      }
                    });
                    const mfMix = totalQty > 0 ? weighted / totalQty : null;
                    return (
                      <tr className="bg-yellow-50 font-bold">
                        <td className="border border-black px-2 py-1 text-black">MF Mélange (sables pondérés)</td>
                        <td className="border border-black px-2 py-1 text-center text-black">
                          {fmt(mfMix, 2)}
                        </td>
                        <td className="border border-black px-2 py-1 text-center text-black">
                          {mfCategory(mfMix)}
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </ReportPage>
        )}

        {/* ============== PAGE 4 — Propreté des sables (ES + MB) ============== */}
        {sablesList.length > 0 && (
          <ReportPage>
            <ReportHeader
              entreprise={entreprise}
              verificationUrl={verificationUrl}
              title="II — IDENTIFICATIONS DES GRANULATS"
              subtitle="II.1.3 Propreté des sables (ES & MB)"
            />

            <div className="text-sm text-black space-y-4">
              <p>
                La conformité des sables est acceptée si les valeurs spécifiées <strong>SE</strong>{" "}
                ou <strong>MB</strong> sont respectées (NF EN 12620 & XP P 18-545).
              </p>

              <p className="font-bold">Tableau : Équivalent de sable (SE)</p>
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black px-2 py-1 text-black">Classe granulaire</th>
                    <th className="border border-black px-2 py-1 text-black">SE moyen (%)</th>
                    <th className="border border-black px-2 py-1 text-black">SE visuel (%)</th>
                    <th className="border border-black px-2 py-1 text-black">Spécification</th>
                  </tr>
                </thead>
                <tbody>
                  {sablesList.map((s) => (
                    <tr key={s.key}>
                      <td className="border border-black px-2 py-1 text-black">{s.g?.produit_nom || s.label}</td>
                      <td className="border border-black px-2 py-1 text-center text-black">{fmt(s.g?.es_moyen, 1)}</td>
                      <td className="border border-black px-2 py-1 text-center text-black">{fmt(s.g?.esv_moyen, 1)}</td>
                      <td className="border border-black px-2 py-1 text-center text-black">SE ≥ 60</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="font-bold mt-4">Tableau : Valeur de bleu (MB)</p>
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black px-2 py-1 text-black">Classe granulaire</th>
                    <th className="border border-black px-2 py-1 text-black">MB (g/kg)</th>
                    <th className="border border-black px-2 py-1 text-black">Spécification</th>
                  </tr>
                </thead>
                <tbody>
                  {sablesList.map((s) => (
                    <tr key={s.key}>
                      <td className="border border-black px-2 py-1 text-black">{s.g?.produit_nom || s.label}</td>
                      <td className="border border-black px-2 py-1 text-center text-black">{fmt(s.g?.valeur_mb, 2)}</td>
                      <td className="border border-black px-2 py-1 text-center text-black">MB ≤ 1,5</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="font-bold mt-4">Tableau : Masse volumique des sables</p>
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black px-2 py-1 text-black">Classe granulaire</th>
                    <th className="border border-black px-2 py-1 text-black">Densité absolue (T/m³)</th>
                    <th className="border border-black px-2 py-1 text-black">Densité apparente (T/m³)</th>
                  </tr>
                </thead>
                <tbody>
                  {sablesList.map((s) => (
                    <tr key={s.key}>
                      <td className="border border-black px-2 py-1 text-black">{s.g?.produit_nom || s.label}</td>
                      <td className="border border-black px-2 py-1 text-center text-black">{fmt(s.g?.densite_absolue, 3)}</td>
                      <td className="border border-black px-2 py-1 text-center text-black">{fmt(s.g?.densite_apparente, 3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ReportPage>
        )}

        {/* ============== PAGE — Granulométries Graviers (1 gravier / page) ============== */}
        {graviersList.map((g, i) => (
          <ReportPage key={`gran-grav-${g.key}`}>
            <ReportHeader
              entreprise={entreprise}
              verificationUrl={verificationUrl}
              title="II — IDENTIFICATIONS DES GRANULATS"
              subtitle={`II.2 Gravillons & graviers — Analyse granulométrique (${i + 1}/${graviersList.length})`}
            />
            <GranulometrieTable
              label={g.label}
              granulat={g.g!}
              numero={i + 1}
            />
          </ReportPage>
        ))}

        {/* ============== PAGE 6 — Dureté graviers + Composition Dreux-Gorisse (fusionnée) ============== */}
        <ReportPage>
          <ReportHeader
            entreprise={entreprise}
            verificationUrl={verificationUrl}
            title="II — DURETÉ GRAVIERS  /  III — COMPOSITION DU BÉTON"
            subtitle="LA & MDE — Méthode Dreux-Gorisse"
          />

          <div className="text-sm text-black space-y-3">
            {graviersList.length > 0 && (
              <>
                <p className="font-bold">Coefficient Los-Angeles, Micro-Deval & masse volumique des gravillons</p>
                <table className="w-full border-collapse border border-black text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black px-2 py-1 text-black">Classe granulaire</th>
                      <th className="border border-black px-2 py-1 text-black">LA (%)</th>
                      <th className="border border-black px-2 py-1 text-black">MDE (%)</th>
                      <th className="border border-black px-2 py-1 text-black">Densité absolue (T/m³)</th>
                      <th className="border border-black px-2 py-1 text-black">Densité apparente (T/m³)</th>
                      <th className="border border-black px-2 py-1 text-black">Spécification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {graviersList.map((g) => (
                      <tr key={g.key}>
                        <td className="border border-black px-2 py-1 text-black">{g.g?.produit_nom || g.label}</td>
                        <td className="border border-black px-2 py-1 text-center text-black">{fmt(g.g?.coefficient_la, 1)}</td>
                        <td className="border border-black px-2 py-1 text-center text-black">{fmt(g.g?.coefficient_mde, 1)}</td>
                        <td className="border border-black px-2 py-1 text-center text-black">{fmt(g.g?.densite_absolue, 3)}</td>
                        <td className="border border-black px-2 py-1 text-center text-black">{fmt(g.g?.densite_apparente, 3)}</td>
                        <td className="border border-black px-2 py-1 text-center text-black">LA ≤ 30 ; MDE ≤ 25</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            <p className="font-bold mt-3">III.0 Paramètres de formulation</p>
            <table className="w-full border-collapse border border-black text-xs">
              <tbody>
                <tr>
                  <td className="border border-black px-2 py-1 font-medium text-black w-1/4">Résistance visée à 28j</td>
                  <td className="border border-black px-2 py-1 text-black">{formulation.resistance_28j ? `${fmt(formulation.resistance_28j, 1)} MPa` : "—"}</td>
                  <td className="border border-black px-2 py-1 font-medium text-black w-1/4">Affaissement souhaité</td>
                  <td className="border border-black px-2 py-1 text-black">{formulation.slump_souhaite ? `${fmt(formulation.slump_souhaite, 0)} mm` : "—"}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 font-medium text-black">Classe d'exposition</td>
                  <td className="border border-black px-2 py-1 text-black">{formulation.classe_exposition || "—"}</td>
                  <td className="border border-black px-2 py-1 font-medium text-black">Dmax granulats</td>
                  <td className="border border-black px-2 py-1 text-black">{formulation.dmax_utilisateur ? `${fmt(formulation.dmax_utilisateur, 1)} mm` : "—"}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 font-medium text-black">Coef. granulaire (G)</td>
                  <td className="border border-black px-2 py-1 text-black">{fmt(formulation.coefficient_granulaire, 2)}</td>
                  <td className="border border-black px-2 py-1 font-medium text-black">Coef. compacité (γ)</td>
                  <td className="border border-black px-2 py-1 text-black">{fmt(formulation.coefficient_compacite, 3)}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 font-medium text-black">Type de vibration</td>
                  <td className="border border-black px-2 py-1 text-black">{formulation.vibration_ae || "—"}</td>
                  <td className="border border-black px-2 py-1 font-medium text-black">Forme des granulats</td>
                  <td className="border border-black px-2 py-1 text-black">{formulation.forme_ae || "—"}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 font-medium text-black">Coefficient Kp</td>
                  <td className="border border-black px-2 py-1 text-black">{fmt(formulation.kp_ae, 2)}</td>
                  <td className="border border-black px-2 py-1 font-medium text-black">Module de finesse idéal</td>
                  <td className="border border-black px-2 py-1 text-black">{fmt(formulation.mf_ideal, 2)}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 font-medium text-black">Eau calculée (E)</td>
                  <td className="border border-black px-2 py-1 text-black">{formulation.eau_calculee ? `${fmt(formulation.eau_calculee, 1)} l/m³` : "—"}</td>
                  <td className="border border-black px-2 py-1 font-medium text-black">Ciment calculé (C)</td>
                  <td className="border border-black px-2 py-1 text-black">{formulation.ciment_calcule ? `${fmt(formulation.ciment_calcule, 1)} kg/m³` : "—"}</td>
                </tr>
              </tbody>
            </table>

            <p className="font-bold mt-3">III.1 Proportions des différents constituants</p>
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black px-2 py-1 text-black">Composant</th>
                  <th className="border border-black px-2 py-1 text-black">% du mélange granulaire</th>
                  <th className="border border-black px-2 py-1 text-black">Densité (T/m³)</th>
                  <th className="border border-black px-2 py-1 text-black">Poids (Kg/m³)</th>
                </tr>
              </thead>
              <tbody>
                {compoRows.map((r) => {
                  const pct = totalGranulats > 0 ? ((r.quantite / totalGranulats) * 100) : 0;
                  return (
                    <tr key={r.code}>
                      <td className="border border-black px-2 py-1 text-black">
                        <strong>{r.code} :</strong> {r.label}
                      </td>
                      <td className="border border-black px-2 py-1 text-center text-black">{fmt(pct, 1)}</td>
                      <td className="border border-black px-2 py-1 text-center text-black">{fmt(r.densite, 2)}</td>
                      <td className="border border-black px-2 py-1 text-center font-medium text-black">{fmtInt(r.quantite)}</td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-50 font-bold">
                  <td className="border border-black px-2 py-1 text-black" colSpan={2}>Total granulats</td>
                  <td className="border border-black px-2 py-1 text-black"></td>
                  <td className="border border-black px-2 py-1 text-center text-black">{fmtInt(totalGranulats)}</td>
                </tr>
                {ciment > 0 && (
                  <tr>
                    <td className="border border-black px-2 py-1 text-black"><strong>C :</strong> {cimentNom}</td>
                    <td className="border border-black px-2 py-1 text-black"></td>
                    <td className="border border-black px-2 py-1 text-center text-black">3,10</td>
                    <td className="border border-black px-2 py-1 text-center font-medium text-black">{fmtInt(ciment)}</td>
                  </tr>
                )}
                {eau > 0 && (
                  <tr>
                    <td className="border border-black px-2 py-1 text-black"><strong>E :</strong> Eau</td>
                    <td className="border border-black px-2 py-1 text-black"></td>
                    <td className="border border-black px-2 py-1 text-center text-black">1,00</td>
                    <td className="border border-black px-2 py-1 text-center font-medium text-black">{fmtInt(eau)}</td>
                  </tr>
                )}
                {adjuvant > 0 && (
                  <tr>
                    <td className="border border-black px-2 py-1 text-black"><strong>Adj :</strong> {adjuvantNom}</td>
                    <td className="border border-black px-2 py-1 text-black"></td>
                    <td className="border border-black px-2 py-1 text-center text-black">1,15</td>
                    <td className="border border-black px-2 py-1 text-center font-medium text-black">{fmt(adjuvant, 2)}</td>
                  </tr>
                )}
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-black px-2 py-1 text-black" colSpan={3}>TOTAL (1 m³)</td>
                  <td className="border border-black px-2 py-1 text-center text-black">{fmtInt(total)}</td>
                </tr>
              </tbody>
            </table>

            <p className="font-bold mt-3">III.2 Caractéristiques du béton frais</p>
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black px-2 py-1 text-black">Granulats (Kg/m³)</th>
                  <th className="border border-black px-2 py-1 text-black">Ciment (Kg/m³)</th>
                  <th className="border border-black px-2 py-1 text-black">Eau (l/m³)</th>
                  <th className="border border-black px-2 py-1 text-black">E/C</th>
                  <th className="border border-black px-2 py-1 text-black">G/S</th>
                  <th className="border border-black px-2 py-1 text-black">Mise en place</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black px-2 py-1 text-center text-black">{fmtInt(totalGranulats)}</td>
                  <td className="border border-black px-2 py-1 text-center text-black">{fmtInt(ciment)}</td>
                  <td className="border border-black px-2 py-1 text-center text-black">{fmtInt(eau)}</td>
                  <td className="border border-black px-2 py-1 text-center font-bold text-black">{ec}</td>
                  <td className="border border-black px-2 py-1 text-center font-bold text-black">{gs}</td>
                  <td className="border border-black px-2 py-1 text-center text-black">{formulation.vibration_ae || "Vibration"}</td>
                </tr>
              </tbody>
            </table>

            {ctx?.essai_compression && (
              <div className="mt-2 border border-black p-2 bg-gray-50">
                <p className="font-bold text-black text-xs">III.3 Essai de convenance associé</p>
                <p className="text-xs text-black mt-1">
                  Numéro essai : <strong>EC-{ctx.essai_compression.numero}</strong>
                  {ctx.essai_compression.classe_resistance && (<> — Classe : <strong>{ctx.essai_compression.classe_resistance}</strong></>)}
                  {ctx.essai_compression.ouvrage && (<> — Ouvrage : <strong>{ctx.essai_compression.ouvrage}</strong></>)}
                  {ctx.essai_compression.date_coulage && (<> — Coulé le : <strong>{format(new Date(ctx.essai_compression.date_coulage), "dd/MM/yyyy", { locale: fr })}</strong></>)}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-8 text-black text-sm">
            <div className="text-center">
              <p className="font-medium mb-10">Le Technicien Formulateur</p>
              <p>_________________</p>
            </div>
            <div className="text-center">
              <p className="font-medium mb-10">L'Ingénieur d'Études</p>
              <p>{entreprise?.representant || "_________________"}</p>
            </div>
          </div>
        </ReportPage>

        {/* ============== PAGE 8 — Fiche Technique ============== */}
        <ReportPage>
          <ReportHeader
            entreprise={entreprise}
            verificationUrl={verificationUrl}
            title="FICHE TECHNIQUE DE LA COMPOSITION DU BÉTON"
            subtitle={`Méthode Dreux-Gorisse — Réf : Rapport N° ${numeroRapport}`}
          />

          <div className="text-sm text-black space-y-4">
            <p className="font-bold underline">I — Données de base</p>
            <table className="w-full border-collapse border border-black text-sm">
              <tbody>
                <tr>
                  <td className="border border-black px-2 py-1 font-medium text-black w-1/4">Ciment</td>
                  <td className="border border-black px-2 py-1 text-black">
                    {cimentNom}{cimentProducteur ? ` — ${cimentProducteur}` : ""}
                  </td>
                  <td className="border border-black px-2 py-1 font-medium text-black w-1/4">Dosage en ciment</td>
                  <td className="border border-black px-2 py-1 text-black">{ciment > 0 ? `${fmtInt(ciment)} kg/m³` : "—"}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 font-medium text-black">Adjuvant</td>
                  <td className="border border-black px-2 py-1 text-black">
                    {hasAdjuvant ? `${adjuvantNom}${adjuvantProducteur ? ` — ${adjuvantProducteur}` : ""}` : "—"}
                  </td>
                  <td className="border border-black px-2 py-1 font-medium text-black">Dosage adjuvant</td>
                  <td className="border border-black px-2 py-1 text-black">{adjuvant > 0 ? `${fmt(adjuvant, 2)} kg/m³` : "—"}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 font-medium text-black">Eau de gâchage</td>
                  <td className="border border-black px-2 py-1 text-black">
                    {eauNom}{eauProducteur ? ` — ${eauProducteur}` : ""}
                  </td>
                  <td className="border border-black px-2 py-1 font-medium text-black">Dosage eau</td>
                  <td className="border border-black px-2 py-1 text-black">{eau > 0 ? `${fmtInt(eau)} l/m³` : "—"}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 font-medium text-black">Rapport E/C</td>
                  <td className="border border-black px-2 py-1 font-bold text-black">{ec}</td>
                  <td className="border border-black px-2 py-1 font-medium text-black">Rapport G/S</td>
                  <td className="border border-black px-2 py-1 font-bold text-black">{gs}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 font-medium text-black">Total granulats</td>
                  <td className="border border-black px-2 py-1 text-black">{fmtInt(totalGranulats)} kg/m³</td>
                  <td className="border border-black px-2 py-1 font-medium text-black">Masse volumique théorique</td>
                  <td className="border border-black px-2 py-1 text-black">{fmtInt(total)} kg/m³</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 font-medium text-black">Résistance visée à 28j</td>
                  <td className="border border-black px-2 py-1 text-black">{formulation.resistance_28j ? `${fmt(formulation.resistance_28j, 1)} MPa` : "—"}</td>
                  <td className="border border-black px-2 py-1 font-medium text-black">Affaissement souhaité</td>
                  <td className="border border-black px-2 py-1 text-black">{formulation.slump_souhaite ? `${fmt(formulation.slump_souhaite, 0)} mm` : "—"}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 font-medium text-black">Classe d'exposition</td>
                  <td className="border border-black px-2 py-1 text-black">{formulation.classe_exposition || "—"}</td>
                  <td className="border border-black px-2 py-1 font-medium text-black">Dmax granulats</td>
                  <td className="border border-black px-2 py-1 text-black">{formulation.dmax_utilisateur ? `${fmt(formulation.dmax_utilisateur, 1)} mm` : "—"}</td>
                </tr>
              </tbody>
            </table>

            <p className="font-bold underline mt-4">II — Composition pour 1 m³</p>
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black px-2 py-1 text-black">Constituant</th>
                  <th className="border border-black px-2 py-1 text-black">Producteur / Carrière</th>
                  <th className="border border-black px-2 py-1 text-black">Quantité</th>
                  <th className="border border-black px-2 py-1 text-black">Unité</th>
                </tr>
              </thead>
              <tbody>
                {compoRows.map((r) => (
                  <tr key={r.code}>
                    <td className="border border-black px-2 py-1 text-black">
                      <strong>{r.code}</strong> — {r.label}
                    </td>
                    <td className="border border-black px-2 py-1 text-black">{r.producteur || "—"}</td>
                    <td className="border border-black px-2 py-1 text-center font-medium text-black">{fmtInt(r.quantite)}</td>
                    <td className="border border-black px-2 py-1 text-center text-black">kg</td>
                  </tr>
                ))}
                {ciment > 0 && (
                  <tr>
                    <td className="border border-black px-2 py-1 text-black"><strong>C</strong> — {cimentNom}</td>
                    <td className="border border-black px-2 py-1 text-black">{details?.ciment.producteur_nom || "—"}</td>
                    <td className="border border-black px-2 py-1 text-center font-medium text-black">{fmtInt(ciment)}</td>
                    <td className="border border-black px-2 py-1 text-center text-black">kg</td>
                  </tr>
                )}
                {eau > 0 && (
                  <tr>
                    <td className="border border-black px-2 py-1 text-black"><strong>E</strong> — Eau</td>
                    <td className="border border-black px-2 py-1 text-black">{details?.eau.producteur_nom || "—"}</td>
                    <td className="border border-black px-2 py-1 text-center font-medium text-black">{fmtInt(eau)}</td>
                    <td className="border border-black px-2 py-1 text-center text-black">L</td>
                  </tr>
                )}
                {adjuvant > 0 && (
                  <tr>
                    <td className="border border-black px-2 py-1 text-black"><strong>Adj</strong> — {adjuvantNom}</td>
                    <td className="border border-black px-2 py-1 text-black">{details?.adjuvant.producteur_nom || "—"}</td>
                    <td className="border border-black px-2 py-1 text-center font-medium text-black">{fmt(adjuvant, 2)}</td>
                    <td className="border border-black px-2 py-1 text-center text-black">kg</td>
                  </tr>
                )}
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-black px-2 py-1 text-black" colSpan={2}>TOTAL</td>
                  <td className="border border-black px-2 py-1 text-center text-black">{fmtInt(total)}</td>
                  <td className="border border-black px-2 py-1 text-center text-black">kg</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-8 text-black text-sm">
            <div className="text-center">
              <p className="font-medium mb-12">Le Technicien Formulateur</p>
              <p>_________________</p>
            </div>
            <div className="text-center">
              <p className="font-medium mb-12">Établi le {format(new Date(formulation.updated_at), "dd/MM/yyyy", { locale: fr })}</p>
              <p>{entreprise?.representant || "_________________"}</p>
            </div>
          </div>
        </ReportPage>

        {/* ============== PAGE 9 — Courbe granulométrique du mélange ============== */}
        <ReportPage>
          <ReportHeader
            entreprise={entreprise}
            verificationUrl={verificationUrl}
            title="COURBE GRANULOMÉTRIQUE DU MÉLANGE"
            subtitle={`Méthode Dreux-Gorisse — Réf : Rapport N° ${numeroRapport}`}
          />

          <div className="text-sm text-black space-y-3">
            <p>
              Représentation graphique des courbes de passants des constituants granulaires et de
              la <strong>courbe résultante du mélange</strong> (calculée selon les proportions
              massiques de la formulation).
            </p>

            <div style={{ width: "100%", height: "400px", background: "#fff" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={courbeData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                  <CartesianGrid stroke="#cbd5e1" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="ouverture"
                    type="number"
                    scale="log"
                    domain={[0.063, 40]}
                    ticks={[0.063, 0.125, 0.25, 0.5, 1, 2, 4, 5, 8, 10, 12.5, 16, 20, 25, 31.5, 40]}
                    tick={{ fill: "#000", fontSize: 10 }}
                    label={{ value: "Ouverture des tamis (mm) — échelle log", position: "insideBottom", offset: -10, fill: "#000", fontSize: 11 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                    tick={{ fill: "#000", fontSize: 10 }}
                    label={{ value: "Passants (%)", angle: -90, position: "insideLeft", fill: "#000", fontSize: 11 }}
                  />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {granulatsList.map((g, idx) => (
                    <Line
                      key={g.key}
                      type="monotone"
                      dataKey={g.key}
                      name={g.g?.produit_nom || g.label}
                      stroke={colors[idx % colors.length]}
                      strokeWidth={1.5}
                      dot={{ r: 2 }}
                      connectNulls
                    />
                  ))}
                  <Line
                    type="monotone"
                    dataKey="melange"
                    name="Mélange (résultante)"
                    stroke="#000"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#000" }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <p className="text-xs italic mt-2 text-black">
              La courbe « Mélange » est obtenue par pondération massique des passants de chaque
              constituant selon les proportions de la formulation.
            </p>
          </div>
        </ReportPage>

        {/* ============== PAGE 10 — Tableau des passants ============== */}
        <ReportPage last={!convenance}>
          <ReportHeader
            entreprise={entreprise}
            verificationUrl={verificationUrl}
            title="COURBE GRANULOMÉTRIQUE DU MÉLANGE"
            subtitle={`Tableau des passants — Réf : Rapport N° ${numeroRapport}`}
          />

          <div className="text-sm text-black space-y-4">
            <p className="font-bold">Tableau : Passants (%) par tamis</p>
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th rowSpan={2} className="border border-black px-1 py-1 text-black">Tamis<br />(mm)</th>
                  {granulatsList.map((g) => (
                    <th key={g.key} className="border border-black px-1 py-1 text-black">
                      {g.g?.produit_nom || g.label}
                    </th>
                  ))}
                  <th className="border border-black px-1 py-1 text-black bg-yellow-50">Mélange</th>
                </tr>
                <tr className="bg-gray-100">
                  {granulatsList.map((g) => (
                    <th key={g.key + "p"} className="border border-black px-1 py-1 text-black">Passant %</th>
                  ))}
                  <th className="border border-black px-1 py-1 text-black bg-yellow-50">Passant %</th>
                </tr>
              </thead>
              <tbody>
                {TAMIS_STD.map((ouv) => {
                  // mélange = somme(passant_i × pct_i / 100)
                  let melange = 0;
                  let totalPct = 0;
                  granulatsList.forEach((g) => {
                    const qty =
                      g.key === "sable_concasse" ? formulation.sable_concasse_quantite || 0 :
                      g.key === "sable_fin" ? formulation.sable_fin_quantite || 0 :
                      g.key === "gravillons1" ? formulation.gravillons1_quantite || 0 :
                      g.key === "gravier2" ? formulation.gravier2_quantite || 0 :
                      g.key === "gravier3" ? formulation.gravier3_quantite || 0 : 0;
                    const pct = totalGranulats > 0 ? (qty / totalGranulats) * 100 : 0;
                    const passant = getPassant(g.g?.granulometrie, ouv);
                    if (passant !== null) {
                      melange += (passant * pct) / 100;
                      totalPct += pct;
                    }
                  });
                  return (
                    <tr key={ouv}>
                      <td className="border border-black px-1 py-0.5 text-center font-medium text-black">{ouv}</td>
                      {granulatsList.map((g) => {
                        const p = getPassant(g.g?.granulometrie, ouv);
                        return (
                          <td key={g.key + ouv} className="border border-black px-1 py-0.5 text-center text-black">
                            {p === null ? "—" : fmt(p, 1)}
                          </td>
                        );
                      })}
                      <td className="border border-black px-1 py-0.5 text-center font-bold text-black bg-yellow-50">
                        {totalPct === 0 ? "—" : fmt(melange, 1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <p className="text-xs italic mt-4 text-black">
              La reproduction de ce rapport n'est autorisée que sous sa forme intégrale. Les
              résultats ne se rapportent qu'aux échantillons soumis aux essais.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-8 text-black text-sm">
            <div className="text-center">
              <p className="font-medium mb-12">Le Technicien Formulateur</p>
              <p>_________________</p>
            </div>
            <div className="text-center">
              <p className="font-medium mb-12">L'Ingénieur d'Études</p>
              <p>{entreprise?.representant || "_________________"}</p>
            </div>
          </div>
        </ReportPage>

        {/* ============== PAGE 11 — Essai de convenance (Étape 8) ============== */}
        {convenance && (() => {
          const resultats = (Array.isArray((convenance as any).resultats)
            ? (convenance as any).resultats
            : []) as Array<{
              numero: number; joursEssai: number; dateEssai: string;
              poids: number; densite: number; charge: number; resistance: number;
            }>;
          const sorted = [...resultats].sort((a, b) => a.joursEssai - b.joursEssai);
          const groups: Record<number, typeof sorted> = {};
          sorted.forEach((r) => {
            (groups[r.joursEssai] = groups[r.joursEssai] || []).push(r);
          });
          const moyennes = Object.entries(groups).map(([j, items]) => {
            const valid = items.map((i) => i.resistance).filter((v) => v > 0);
            const moy = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
            return { jours: Number(j), moyenne: moy };
          });
          const tech = (convenance as any).intervenants
            ? `${(convenance as any).intervenants.prenom || ""} ${(convenance as any).intervenants.nom || ""}`.trim()
            : "—";

          return (
            <ReportPage last>
              <ReportHeader
                entreprise={entreprise}
                verificationUrl={verificationUrl}
                title="ESSAI DE CONVENANCE"
                subtitle={`Résistance à la compression — Réf : EC-${String((convenance as any).numero).padStart(3, "0")}`}
              />

              {/* Identification */}
              <div className="mb-4">
                <h3 className="font-bold text-sm mb-2 underline text-black">Identification de l'essai</h3>
                <table className="w-full border-collapse border border-black text-sm">
                  <tbody>
                    <tr>
                      <td className="border border-black px-3 py-1 font-medium w-1/3 text-black">N° Échantillon</td>
                      <td className="border border-black px-3 py-1 text-black">EC-{String((convenance as any).numero).padStart(3, "0")}</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-1 font-medium text-black">Client</td>
                      <td className="border border-black px-3 py-1 text-black">{(convenance as any).clients?.nom || "—"}</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-1 font-medium text-black">Chantier</td>
                      <td className="border border-black px-3 py-1 text-black">{(convenance as any).chantiers?.nom || "—"}</td>
                    </tr>
                    {(convenance as any).essai_convenance_details && (
                      <tr>
                        <td className="border border-black px-3 py-1 font-medium text-black">Désignation</td>
                        <td className="border border-black px-3 py-1 text-black">{(convenance as any).essai_convenance_details}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="border border-black px-3 py-1 font-medium text-black">Date de coulage</td>
                      <td className="border border-black px-3 py-1 text-black">
                        {(convenance as any).date_coulage
                          ? format(new Date((convenance as any).date_coulage), "dd/MM/yyyy", { locale: fr })
                          : "—"}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-1 font-medium text-black">Classe de résistance</td>
                      <td className="border border-black px-3 py-1 text-black">{(convenance as any).classe_resistance || "—"}</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-1 font-medium text-black">Type / Dimension éprouvette</td>
                      <td className="border border-black px-3 py-1 text-black">
                        {(convenance as any).type_eprouvette || "—"} — {(convenance as any).dimension_eprouvette || "—"}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-1 font-medium text-black">Cure / Étuvage</td>
                      <td className="border border-black px-3 py-1 text-black">
                        {(convenance as any).condition_cure || "—"}
                        {(convenance as any).etuvage ? ` — Étuvage : ${(convenance as any).etuvage}` : ""}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Résultats */}
              <div className="mb-4">
                <h3 className="font-bold text-sm mb-2 underline text-black">Résultats des essais de compression</h3>
                <table className="w-full border-collapse border border-black text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black px-2 py-1 text-black">N°</th>
                      <th className="border border-black px-2 py-1 text-black">Échéance (j)</th>
                      <th className="border border-black px-2 py-1 text-black">Date d'essai</th>
                      <th className="border border-black px-2 py-1 text-black">Poids (kg)</th>
                      <th className="border border-black px-2 py-1 text-black">Densité (kg/m³)</th>
                      <th className="border border-black px-2 py-1 text-black">Charge (kN)</th>
                      <th className="border border-black px-2 py-1 text-black">Rc (MPa)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="border border-black px-2 py-3 text-center text-black">
                          Aucun résultat saisi
                        </td>
                      </tr>
                    ) : (
                      sorted.map((r, i) => (
                        <tr key={i}>
                          <td className="border border-black px-2 py-1 text-center text-black">{r.numero}</td>
                          <td className="border border-black px-2 py-1 text-center text-black">{r.joursEssai}</td>
                          <td className="border border-black px-2 py-1 text-center text-black">
                            {(() => {
                              if (!r.dateEssai) return "—";
                              // Si déjà au format dd/MM/yyyy, afficher tel quel
                              if (typeof r.dateEssai === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(r.dateEssai)) {
                                return r.dateEssai;
                              }
                              const d = new Date(r.dateEssai);
                              return isNaN(d.getTime()) ? String(r.dateEssai) : format(d, "dd/MM/yyyy", { locale: fr });
                            })()}
                          </td>
                          <td className="border border-black px-2 py-1 text-center text-black">{fmt(r.poids, 3)}</td>
                          <td className="border border-black px-2 py-1 text-center text-black">{fmtInt(r.densite)}</td>
                          <td className="border border-black px-2 py-1 text-center text-black">{fmt(r.charge, 1)}</td>
                          <td className="border border-black px-2 py-1 text-center font-bold text-black">{fmt(r.resistance, 2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Synthèse moyennes par échéance */}
              {moyennes.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-bold text-sm mb-2 underline text-black">Synthèse — Résistance moyenne par échéance</h3>
                  <table className="w-full border-collapse border border-black text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black px-3 py-1 text-black">Échéance</th>
                        <th className="border border-black px-3 py-1 text-black">Rc moyenne (MPa)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {moyennes.map((m) => (
                        <tr key={m.jours}>
                          <td className="border border-black px-3 py-1 text-center text-black">{m.jours} jours</td>
                          <td className="border border-black px-3 py-1 text-center font-bold text-black">{fmt(m.moyenne, 2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="text-xs italic mt-4 text-black">
                Cet essai de convenance valide la formulation au regard des performances mécaniques attendues.
              </p>

              <div className="mt-10 grid grid-cols-2 gap-8 text-black text-sm">
                <div className="text-center">
                  <p className="font-medium mb-12">Le Technicien</p>
                  <p>{tech || "_________________"}</p>
                </div>
                <div className="text-center">
                  <p className="font-medium mb-12">L'Ingénieur d'Études</p>
                  <p>{entreprise?.representant || "_________________"}</p>
                </div>
              </div>
            </ReportPage>
          );
        })()}
      </div>

      <style>{`
        .page-break { page-break-after: always; }

        /* Mise en forme uniforme des tableaux du rapport (écran + PDF + impression) */
        .report-page table {
          border-collapse: collapse !important;
          border-spacing: 0 !important;
          width: 100%;
          border: 1px solid #000000 !important;
          box-sizing: border-box !important;
        }
        .report-page table,
        .report-page table th,
        .report-page table td {
          border: 1px solid #000000 !important;
        }
        .report-page table th,
        .report-page table td {
          vertical-align: middle !important;
          text-align: center !important;
          padding: 4px 6px;
          color: #000000;
          box-sizing: border-box !important;
          line-height: 1.25 !important;
        }

        @media print {
          body * { visibility: hidden; }
          [data-ref="report"], [data-ref="report"] * { visibility: visible; }
          [data-ref="report"] { position: absolute; left: 0; top: 0; }
          .print\\:hidden { display: none !important; }
          .report-page { box-shadow: none !important; border: none !important; }
        }
      `}</style>
    </div>
  );
}
