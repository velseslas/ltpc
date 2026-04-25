import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Printer, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { EssaiBreadcrumb, BreadcrumbItem } from "@/components/essais/EssaiBreadcrumb";
import { ReportHeader } from "@/components/reports/ReportHeader";
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
      }}
    >
      {children}
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
  if (!tamis.length) return null;

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
            .filter((t: any) => Number(t.refus) > 0 || Number(t.refusCumule) > 0 || Number(t.passant) < 100)
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
    </div>
  );
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
    formulation?.essai_compression_id
  );

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      toast.info("Génération du PDF en cours…");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidthMm = 210;
      const pageHeightMm = 297;
      const pages = reportRef.current.querySelectorAll<HTMLDivElement>(".report-page");
      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: pages[i].scrollWidth,
          windowHeight: pages[i].scrollHeight,
        });
        const imgData = canvas.toDataURL("image/png");
        // Conserver le ratio A4 : on dimensionne sur la largeur et on laisse la hauteur s'adapter,
        // sans dépasser la page.
        const imgHeightMm = (canvas.height * pageWidthMm) / canvas.width;
        const finalHeight = Math.min(imgHeightMm, pageHeightMm);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, pageWidthMm, finalHeight);
      }
      pdf.save(`formulation-${formulation?.nom || id}.pdf`);
      toast.success("PDF téléchargé avec succès");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la génération du PDF");
    }
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
    dens: number | null
  ) => {
    if (qty && qty > 0) compoRows.push({ code, label, producteur, quantite: qty, densite: dens });
  };
  pushIf(
    formulation.gravier3_quantite,
    "GIII",
    gEssais?.gravier3?.produit_nom || "Gravier 3",
    gEssais?.gravier3?.carriere_nom ?? null,
    gEssais?.gravier3?.densite_absolue ?? null
  );
  pushIf(
    formulation.gravier2_quantite,
    "GII",
    gEssais?.gravier2?.produit_nom || "Gravier 2",
    gEssais?.gravier2?.carriere_nom ?? null,
    gEssais?.gravier2?.densite_absolue ?? null
  );
  pushIf(
    formulation.gravillons1_quantite,
    "GI",
    gEssais?.gravillons1?.produit_nom || "Gravillons 1",
    gEssais?.gravillons1?.carriere_nom ?? null,
    gEssais?.gravillons1?.densite_absolue ?? null
  );
  pushIf(
    formulation.sable_concasse_quantite,
    "SI",
    gEssais?.sable_concasse?.produit_nom || "Sable concassé",
    gEssais?.sable_concasse?.carriere_nom ?? null,
    gEssais?.sable_concasse?.densite_absolue ?? null
  );
  pushIf(
    formulation.sable_fin_quantite,
    "SII",
    gEssais?.sable_fin?.produit_nom || "Sable fin",
    gEssais?.sable_fin?.carriere_nom ?? null,
    gEssais?.sable_fin?.densite_absolue ?? null
  );

  const cimentNom = details?.ciment.produit_nom || "Ciment";
  const cimentProducteur = details?.ciment.producteur_nom || null;
  const adjuvantNom = details?.adjuvant.produit_nom || "Adjuvant";
  const adjuvantProducteur = details?.adjuvant.producteur_nom || null;
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
      (x.g.granulometrie ||
        x.g.es_moyen !== null ||
        x.g.valeur_mb !== null ||
        x.g.densite_absolue !== null ||
        x.g.densite_apparente !== null ||
        x.g.coefficient_la !== null)
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
          <div className="flex flex-col h-full" style={{ minHeight: "265mm" }}>
            {/* Header company */}
            <div className="text-center mb-8">
              {entreprise?.logo_url && (
                <img
                  src={entreprise.logo_url}
                  alt="Logo"
                  className="mx-auto mb-4"
                  style={{ maxHeight: "120px", objectFit: "contain" }}
                  crossOrigin="anonymous"
                />
              )}
              <h1 className="text-2xl font-bold text-[#1e5a7a]">
                {entreprise?.nom || "Laboratoire"}
              </h1>
              <p className="text-sm mt-1 text-black">
                Autorisation N° {entreprise?.numero_autorisation || "—"}
                {entreprise?.date_autorisation && (
                  <> du {format(new Date(entreprise.date_autorisation), "dd/MM/yyyy", { locale: fr })}</>
                )}
              </p>
            </div>

            <div className="text-right text-sm mb-12 text-black">
              <p>
                <span className="font-bold">Dossier N° :</span>{" "}
                {format(new Date(formulation.created_at), "MM/yy", { locale: fr })}
              </p>
            </div>

            <div className="text-center my-12">
              <h2 className="text-3xl font-bold text-black mb-4 underline">
                ÉTUDE DE COMPOSITION DE BÉTON
              </h2>
              <h3 className="text-2xl font-bold text-[#1e5a7a]">
                RAPPORT N° {numeroRapport}
              </h3>
            </div>

            <div className="border-2 border-black rounded p-6 mx-auto my-6" style={{ maxWidth: "560px" }}>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="font-bold py-1 text-black w-1/2">Formulation :</td>
                    <td className="py-1 text-black">{formulation.nom}</td>
                  </tr>
                  {ctx?.client_nom && (
                    <tr>
                      <td className="font-bold py-1 text-black">Client :</td>
                      <td className="py-1 text-black">{ctx.client_nom}</td>
                    </tr>
                  )}
                  {ctx?.chantier_nom && (
                    <tr>
                      <td className="font-bold py-1 text-black">Chantier :</td>
                      <td className="py-1 text-black">{ctx.chantier_nom}</td>
                    </tr>
                  )}
                  {ctx?.maitre_ouvrage_nom && (
                    <tr>
                      <td className="font-bold py-1 text-black">Maître d'ouvrage :</td>
                      <td className="py-1 text-black">{ctx.maitre_ouvrage_nom}</td>
                    </tr>
                  )}
                  {ctx?.maitre_oeuvre_nom && (
                    <tr>
                      <td className="font-bold py-1 text-black">Maître d'œuvre :</td>
                      <td className="py-1 text-black">{ctx.maitre_oeuvre_nom}</td>
                    </tr>
                  )}
                  {details?.ciment.produit_nom && (
                    <tr>
                      <td className="font-bold py-1 text-black">Type de ciment :</td>
                      <td className="py-1 text-black">{cimentNom}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="font-bold py-1 text-black">Dosage ciment :</td>
                    <td className="py-1 text-black">{ciment} kg/m³</td>
                  </tr>
                  {formulation.resistance_28j && (
                    <tr>
                      <td className="font-bold py-1 text-black">Résistance visée (28j) :</td>
                      <td className="py-1 text-black">{fmt(formulation.resistance_28j, 1)} MPa</td>
                    </tr>
                  )}
                  {formulation.slump_souhaite && (
                    <tr>
                      <td className="font-bold py-1 text-black">Affaissement souhaité :</td>
                      <td className="py-1 text-black">{fmt(formulation.slump_souhaite, 0)} mm</td>
                    </tr>
                  )}
                  {formulation.classe_exposition && (
                    <tr>
                      <td className="font-bold py-1 text-black">Classe d'exposition :</td>
                      <td className="py-1 text-black">{formulation.classe_exposition}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="font-bold py-1 text-black">Rapport E/C :</td>
                    <td className="py-1 text-black">{ec}</td>
                  </tr>
                  <tr>
                    <td className="font-bold py-1 text-black">Rapport G/S :</td>
                    <td className="py-1 text-black">{gs}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-auto text-sm text-black">
              <p className="mb-1">
                <span className="font-bold">Centrale à béton :</span>{" "}
                {centrale?.nom || "—"}
                {centrale?.ville ? ` — ${centrale.ville}` : ""}
              </p>
              {entreprise?.siege_social && (
                <p className="mb-1">
                  <span className="font-bold">Siège Social :</span> {entreprise.siege_social}
                </p>
              )}
              {entreprise?.annexe && (
                <p className="mb-1">
                  <span className="font-bold">Laboratoire :</span> {entreprise.annexe}
                </p>
              )}
              {entreprise?.telephone && (
                <p className="mb-1">
                  <span className="font-bold">Tél :</span> {entreprise.telephone}
                  {entreprise?.email && (
                    <>
                      {" — "}
                      <span className="font-bold">E-mail :</span> {entreprise.email}
                    </>
                  )}
                </p>
              )}
              <p className="text-center font-bold mt-6 text-base">{dateRapport.toUpperCase()}</p>
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
                {compoRows.map((r) => (
                  <tr key={r.code}>
                    <td className="border border-black px-2 py-1 font-bold text-black">{r.code}</td>
                    <td className="border border-black px-2 py-1 text-black">{r.label}</td>
                    <td className="border border-black px-2 py-1 text-black">{r.producteur || "—"}</td>
                  </tr>
                ))}
                {ciment > 0 && (
                  <tr>
                    <td className="border border-black px-2 py-1 font-bold text-black">C</td>
                    <td className="border border-black px-2 py-1 text-black">{cimentNom}</td>
                    <td className="border border-black px-2 py-1 text-black">{cimentProducteur || "—"}</td>
                  </tr>
                )}
                {adjuvant > 0 && (
                  <tr>
                    <td className="border border-black px-2 py-1 font-bold text-black">Adj</td>
                    <td className="border border-black px-2 py-1 text-black">{adjuvantNom}</td>
                    <td className="border border-black px-2 py-1 text-black">{adjuvantProducteur || "—"}</td>
                  </tr>
                )}
                {eau > 0 && (
                  <tr>
                    <td className="border border-black px-2 py-1 font-bold text-black">E</td>
                    <td className="border border-black px-2 py-1 text-black">{eauNom}</td>
                    <td className="border border-black px-2 py-1 text-black">{eauProducteur || "—"}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="mt-16 pt-8 border-t-2 border-dashed border-gray-300 print:mt-0 print:pt-0 print:border-0" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>
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
                <tr><td className="border border-black px-2 py-0.5 text-black">Friabilité des sables</td><td className="border border-black px-2 py-0.5 text-black">NF P 18-576</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Plasticité au cône d'Abrams (slump)</td><td className="border border-black px-2 py-0.5 text-black">NF EN 12350-2</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Masse volumique du béton frais</td><td className="border border-black px-2 py-0.5 text-black">NF EN 12350-6</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Confection des éprouvettes d'essai</td><td className="border border-black px-2 py-0.5 text-black">NF EN 12390-2</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Résistance à la compression</td><td className="border border-black px-2 py-0.5 text-black">NF EN 12390-3</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Résistance à la traction par fendage</td><td className="border border-black px-2 py-0.5 text-black">NF EN 12390-6</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Propreté superficielle des gravillons</td><td className="border border-black px-2 py-0.5 text-black">NF EN 933-7</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Indice de continuité (forme des granulats)</td><td className="border border-black px-2 py-0.5 text-black">NF EN 933-4</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Analyse chimique du ciment</td><td className="border border-black px-2 py-0.5 text-black">NF EN 196-2</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Résistance mécanique du ciment</td><td className="border border-black px-2 py-0.5 text-black">NF EN 196-1</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Temps de prise et stabilité du ciment</td><td className="border border-black px-2 py-0.5 text-black">NF EN 196-3</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Composition du ciment</td><td className="border border-black px-2 py-0.5 text-black">NF EN 197-1</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Qualité de l'eau de gâchage</td><td className="border border-black px-2 py-0.5 text-black">NF EN 1008</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Adjuvants pour béton — Définitions, exigences</td><td className="border border-black px-2 py-0.5 text-black">NF EN 934-2</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Teneur en air du béton frais</td><td className="border border-black px-2 py-0.5 text-black">NF EN 12350-7</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Température du béton frais</td><td className="border border-black px-2 py-0.5 text-black">NF EN 12350-1</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Conservation et cure des éprouvettes</td><td className="border border-black px-2 py-0.5 text-black">NF EN 12390-2</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Masse volumique du béton durci</td><td className="border border-black px-2 py-0.5 text-black">NF EN 12390-7</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Résistance à la flexion sur éprouvettes</td><td className="border border-black px-2 py-0.5 text-black">NF EN 12390-5</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Profondeur de pénétration d'eau sous pression</td><td className="border border-black px-2 py-0.5 text-black">NF EN 12390-8</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Spécifications, performances, production et conformité du béton</td><td className="border border-black px-2 py-0.5 text-black">NF EN 206/CN</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Granulats pour béton — Spécifications</td><td className="border border-black px-2 py-0.5 text-black">NF EN 12620</td></tr>
                <tr><td className="border border-black px-2 py-0.5 text-black">Formulation Dreux-Gorisse</td><td className="border border-black px-2 py-0.5 text-black">Méthode pratique Dreux-Gorisse</td></tr>
              </tbody>
            </table>

            <p className="text-xs italic mt-4 text-black">
              * La production de ce rapport d'essais n'est autorisée que sous sa forme intégrale.
            </p>
            </div>
          </div>
        </ReportPage>

        {/* ============== PAGE 3 — Granulométries Sables ============== */}
        {sablesList.length > 0 && (
          <ReportPage>
            <ReportHeader
              entreprise={entreprise}
              verificationUrl={verificationUrl}
              title="II — IDENTIFICATIONS DES GRANULATS"
              subtitle="II.1 Sables — Analyses granulométriques"
            />
            {sablesList.map((s, i) => (
              <GranulometrieTable
                key={s.key}
                label={s.label}
                granulat={s.g!}
                numero={i + 1}
              />
            ))}

            {sablesList.some((s) => s.g?.granulometrie?.module_finesse !== null) && (
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
                  </tbody>
                </table>
              </div>
            )}
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

        {/* ============== PAGE 5 — Granulométries Graviers ============== */}
        {graviersList.length > 0 && (
          <ReportPage>
            <ReportHeader
              entreprise={entreprise}
              verificationUrl={verificationUrl}
              title="II — IDENTIFICATIONS DES GRANULATS"
              subtitle="II.2 Gravillons & graviers — Analyses granulométriques"
            />
            {graviersList.map((g, i) => (
              <GranulometrieTable
                key={g.key}
                label={g.label}
                granulat={g.g!}
                numero={i + 1}
              />
            ))}
          </ReportPage>
        )}

        {/* ============== PAGE 6 — Dureté graviers (LA + densité) ============== */}
        {graviersList.length > 0 && (
          <ReportPage>
            <ReportHeader
              entreprise={entreprise}
              verificationUrl={verificationUrl}
              title="II — IDENTIFICATIONS DES GRANULATS"
              subtitle="II.2.4 Dureté & masse volumique des gravillons"
            />

            <div className="text-sm text-black space-y-4">
              <p>
                <strong>Résistance à la fragmentation par chocs (Los-Angeles, LA)</strong> : essai
                qui consiste à mesurer la quantité d'éléments inférieurs à 1,6 mm produits en
                soumettant le matériau aux chocs de boulets d'acier (NF EN 1097-2).
              </p>

              <p className="font-bold">Tableau : Coefficient Los-Angeles</p>
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black px-2 py-1 text-black">Classe granulaire</th>
                    <th className="border border-black px-2 py-1 text-black">LA (%)</th>
                    <th className="border border-black px-2 py-1 text-black">Spécification</th>
                  </tr>
                </thead>
                <tbody>
                  {graviersList.map((g) => (
                    <tr key={g.key}>
                      <td className="border border-black px-2 py-1 text-black">{g.g?.produit_nom || g.label}</td>
                      <td className="border border-black px-2 py-1 text-center text-black">{fmt(g.g?.coefficient_la, 1)}</td>
                      <td className="border border-black px-2 py-1 text-center text-black">LA ≤ 30</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="font-bold mt-4">Tableau : Masse volumique des gravillons</p>
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black px-2 py-1 text-black">Classe granulaire</th>
                    <th className="border border-black px-2 py-1 text-black">Densité absolue (T/m³)</th>
                    <th className="border border-black px-2 py-1 text-black">Densité apparente (T/m³)</th>
                  </tr>
                </thead>
                <tbody>
                  {graviersList.map((g) => (
                    <tr key={g.key}>
                      <td className="border border-black px-2 py-1 text-black">{g.g?.produit_nom || g.label}</td>
                      <td className="border border-black px-2 py-1 text-center text-black">{fmt(g.g?.densite_absolue, 3)}</td>
                      <td className="border border-black px-2 py-1 text-center text-black">{fmt(g.g?.densite_apparente, 3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 className="font-bold underline mt-6">INTERPRÉTATION DES RÉSULTATS</h3>
              <p>
                À la lumière des essais réalisés sur les fractions des agrégats (sables et
                gravillons), les granulats étudiés respectent globalement les spécifications des
                normes en vigueur pour la fabrication d'un béton hydraulique de qualité courante.
                Ils peuvent donc être retenus pour la formulation présentée ci-après.
              </p>
            </div>
          </ReportPage>
        )}

        {/* ============== PAGE 7 — Composition Dreux-Gorisse ============== */}
        <ReportPage>
          <ReportHeader
            entreprise={entreprise}
            verificationUrl={verificationUrl}
            title="III — COMPOSITION DU BÉTON"
            subtitle="Méthode Dreux-Gorisse — Proportions des constituants"
          />

          <div className="text-sm text-black space-y-4">
            {/* Paramètres saisis dans le wizard (étapes 2, 5, 6) */}
            <p className="font-bold">III.0 Paramètres de formulation</p>
            <table className="w-full border-collapse border border-black text-sm">
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

            <p className="font-bold mt-4">III.1 Proportions des différents constituants</p>
            <table className="w-full border-collapse border border-black text-sm">
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
                      <td className="border border-black px-2 py-1 text-center text-black">
                        {fmt(pct, 1)}
                      </td>
                      <td className="border border-black px-2 py-1 text-center text-black">
                        {fmt(r.densite, 2)}
                      </td>
                      <td className="border border-black px-2 py-1 text-center font-medium text-black">
                        {fmtInt(r.quantite)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-50 font-bold">
                  <td className="border border-black px-2 py-1 text-black" colSpan={2}>
                    Total granulats
                  </td>
                  <td className="border border-black px-2 py-1 text-black"></td>
                  <td className="border border-black px-2 py-1 text-center text-black">
                    {fmtInt(totalGranulats)}
                  </td>
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

            <p className="font-bold mt-6">III.2 Caractéristiques du béton frais</p>
            <table className="w-full border-collapse border border-black text-sm">
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

            <p className="text-xs italic mt-4 text-black">
              III.3 Résistance à la compression : les éprouvettes destinées à cet essai sont
              testées à 7 et 28 jours, conservées après démoulage en chambre humide à 20 °C ± 2.
            </p>

            {ctx?.essai_compression && (
              <div className="mt-4 border border-black p-3 bg-gray-50">
                <p className="font-bold text-black">III.4 Essai de convenance associé</p>
                <p className="text-sm text-black mt-1">
                  Numéro essai : <strong>EC-{ctx.essai_compression.numero}</strong>
                  {ctx.essai_compression.classe_resistance && (
                    <> — Classe : <strong>{ctx.essai_compression.classe_resistance}</strong></>
                  )}
                  {ctx.essai_compression.ouvrage && (
                    <> — Ouvrage : <strong>{ctx.essai_compression.ouvrage}</strong></>
                  )}
                  {ctx.essai_compression.date_coulage && (
                    <> — Coulé le : <strong>{format(new Date(ctx.essai_compression.date_coulage), "dd/MM/yyyy", { locale: fr })}</strong></>
                  )}
                </p>
              </div>
            )}
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
                  <td className="border border-black px-2 py-1 font-medium text-black w-1/4">Type et classe de ciment</td>
                  <td className="border border-black px-2 py-1 text-black">{cimentNom}</td>
                  <td className="border border-black px-2 py-1 font-medium text-black w-1/4">Dosage en ciment</td>
                  <td className="border border-black px-2 py-1 text-black">{ciment} kg/m³</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 font-medium text-black">Adjuvant</td>
                  <td className="border border-black px-2 py-1 text-black">{adjuvant > 0 ? adjuvantNom : "—"}</td>
                  <td className="border border-black px-2 py-1 font-medium text-black">Dosage adjuvant</td>
                  <td className="border border-black px-2 py-1 text-black">{adjuvant > 0 ? `${adjuvant} kg/m³` : "—"}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 font-medium text-black">Eau de gâchage</td>
                  <td className="border border-black px-2 py-1 text-black">{eau} l/m³</td>
                  <td className="border border-black px-2 py-1 font-medium text-black">Rapport E/C</td>
                  <td className="border border-black px-2 py-1 font-bold text-black">{ec}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 font-medium text-black">Total granulats</td>
                  <td className="border border-black px-2 py-1 text-black">{fmtInt(totalGranulats)} kg/m³</td>
                  <td className="border border-black px-2 py-1 font-medium text-black">Rapport G/S</td>
                  <td className="border border-black px-2 py-1 font-bold text-black">{gs}</td>
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
        <ReportPage last>
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
      </div>

      <style>{`
        .page-break { page-break-after: always; }
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
