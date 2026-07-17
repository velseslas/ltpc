import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Printer, Loader2 } from "lucide-react";
import ShareButton from "@/components/reports/ShareButton";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { DocumentPageHeader } from "@/components/documents/DocumentPageHeader";

const sectionStyle = { fontFamily: "'Times New Roman', Georgia, serif" } as const;

interface EprouvetteData {
  numero: number;
  joursEssai: number;
  dateEssai: string;
  poids: number;
  densite: number;
  charge: number;
  resistance: number;
}

interface FormulationIngredient {
  quantite: number | null;
  produit_nom: string | null;
  producteur_nom: string | null;
}

interface FormulationData {
  nom: string;
  ciment: FormulationIngredient;
  eau: FormulationIngredient;
  adjuvant: FormulationIngredient;
  sable_concasse: FormulationIngredient;
  sable_fin: FormulationIngredient;
  gravillons1: FormulationIngredient;
  gravier2: FormulationIngredient;
  gravier3: FormulationIngredient;
}

interface EchantillonData {
  id: string;
  numero: number;
  client_nom: string;
  chantier_nom: string;
  ouvrage: string;
  destination_beton: string;
  condition_cure: string;
  type_eprouvette: string;
  dimension_eprouvette: string;
  operateur_nom: string;
  operateur_signature_url: string | null;
  date_coulage: string;
  nombre_eprouvettes: number;
  centrale_nom: string;
  formulation: FormulationData | null;
  jours_essai: { jour: number; nombre: number }[];
  resultats: EprouvetteData[];
  temperature_beton: number | null;
  temperature_air: number | null;
  classe_consistance: string | null;
  classe_resistance: string | null;
  essai_convenance: boolean;
  essai_convenance_details: string | null;
  mention_info_client: boolean;
  mention_eprouvette_client: boolean;
  date_essai: string | null;
  etuvage: string | null;
}

const CompressionReport = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isPrintRoute = typeof window !== "undefined" && window.location.pathname.includes("/print");
  const embed = searchParams.get("embed") === "1" || isPrintRoute;
  const autoPrint = searchParams.get("autoprint") === "1" || isPrintRoute;
  const reportRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [echantillon, setEchantillon] = useState<EchantillonData | null>(null);
  const { data: entreprise } = useEntreprise();

  useEffect(() => {
    const fetchEchantillon = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from("echantillons_compression")
          .select(`
            *,
            clients:client_id(nom),
            chantiers:chantier_id(nom),
            intervenants:operateur_id(nom, prenom, signature_url),
            centrales_beton:centrale_id(nom),
            formulations:formulation_id(
              nom,
              ciment_quantite, ciment_produit_id, ciment_producteur_id,
              eau_quantite, eau_produit_id, eau_producteur_id,
              adjuvant_quantite, adjuvant_produit_id, adjuvant_producteur_id,
              sable_concasse_quantite, sable_concasse_produit_id, sable_concasse_producteur_id,
              sable_fin_quantite, sable_fin_produit_id, sable_fin_producteur_id,
              gravillons1_quantite, gravillons1_produit_id, gravillons1_producteur_id,
              gravier2_quantite, gravier2_produit_id, gravier2_producteur_id,
              gravier3_quantite, gravier3_produit_id, gravier3_producteur_id
            )
          `)
          .eq("id", id)
          .single();

        if (error) throw error;

        const joursEssai = (Array.isArray(data.jours_essai) ? data.jours_essai : []) as { jour: number; nombre: number }[];
        const resultats = (Array.isArray(data.resultats) ? data.resultats : []) as unknown as EprouvetteData[];

        // Fetch product and producer names if formulation exists
        let formulationData: FormulationData | null = null;
        if (data.formulations) {
          const f = data.formulations;
          
          // Helper to fetch product name
          const fetchProduitNom = async (id: string | null): Promise<string | null> => {
            if (!id) return null;
            const { data: prod } = await supabase.from("produits").select("nom").eq("id", id).maybeSingle();
            return prod?.nom || null;
          };
          
          // Helper to fetch producer name by type
          const fetchProducteurNom = async (id: string | null, type: string): Promise<string | null> => {
            if (!id) return null;
            let result: { nom: string } | null = null;
            switch (type) {
              case "cimenterie": {
                const { data } = await supabase.from("cimenteries").select("nom").eq("id", id).maybeSingle();
                result = data;
                break;
              }
              case "source_eau": {
                const { data } = await supabase.from("sources_eau").select("nom").eq("id", id).maybeSingle();
                result = data;
                break;
              }
              case "adjuvant": {
                const { data } = await supabase.from("adjuvants").select("nom").eq("id", id).maybeSingle();
                result = data;
                break;
              }
              default: {
                const { data } = await supabase.from("carrieres").select("nom").eq("id", id).maybeSingle();
                result = data;
                break;
              }
            }
            return result?.nom || null;
          };

          // Fetch all names in parallel
          const [
            ciment_produit, ciment_producteur,
            eau_produit, eau_producteur,
            adjuvant_produit, adjuvant_producteur,
            sable_concasse_produit, sable_concasse_producteur,
            sable_fin_produit, sable_fin_producteur,
            gravillons1_produit, gravillons1_producteur,
            gravier2_produit, gravier2_producteur,
            gravier3_produit, gravier3_producteur,
          ] = await Promise.all([
            fetchProduitNom(f.ciment_produit_id),
            fetchProducteurNom(f.ciment_producteur_id, "cimenterie"),
            fetchProduitNom(f.eau_produit_id),
            fetchProducteurNom(f.eau_producteur_id, "source_eau"),
            fetchProduitNom(f.adjuvant_produit_id),
            fetchProducteurNom(f.adjuvant_producteur_id, "adjuvant"),
            fetchProduitNom(f.sable_concasse_produit_id),
            fetchProducteurNom(f.sable_concasse_producteur_id, "carriere"),
            fetchProduitNom(f.sable_fin_produit_id),
            fetchProducteurNom(f.sable_fin_producteur_id, "carriere"),
            fetchProduitNom(f.gravillons1_produit_id),
            fetchProducteurNom(f.gravillons1_producteur_id, "carriere"),
            fetchProduitNom(f.gravier2_produit_id),
            fetchProducteurNom(f.gravier2_producteur_id, "carriere"),
            fetchProduitNom(f.gravier3_produit_id),
            fetchProducteurNom(f.gravier3_producteur_id, "carriere"),
          ]);

          formulationData = {
            nom: f.nom || "-",
            ciment: { quantite: f.ciment_quantite, produit_nom: ciment_produit, producteur_nom: ciment_producteur },
            eau: { quantite: f.eau_quantite, produit_nom: eau_produit, producteur_nom: eau_producteur },
            adjuvant: { quantite: f.adjuvant_quantite, produit_nom: adjuvant_produit, producteur_nom: adjuvant_producteur },
            sable_concasse: { quantite: f.sable_concasse_quantite, produit_nom: sable_concasse_produit, producteur_nom: sable_concasse_producteur },
            sable_fin: { quantite: f.sable_fin_quantite, produit_nom: sable_fin_produit, producteur_nom: sable_fin_producteur },
            gravillons1: { quantite: f.gravillons1_quantite, produit_nom: gravillons1_produit, producteur_nom: gravillons1_producteur },
            gravier2: { quantite: f.gravier2_quantite, produit_nom: gravier2_produit, producteur_nom: gravier2_producteur },
            gravier3: { quantite: f.gravier3_quantite, produit_nom: gravier3_produit, producteur_nom: gravier3_producteur },
          };
        }

        const extendedData = data as typeof data & {
          mention_info_client?: boolean | null;
          mention_eprouvette_client?: boolean | null;
          etuvage?: string | null;
        };

        setEchantillon({
          id: data.id,
          numero: data.numero,
          client_nom: data.clients?.nom || "-",
          chantier_nom: data.chantiers?.nom || "-",
          ouvrage: data.ouvrage || "-",
          destination_beton: data.destination_beton || "-",
          condition_cure: data.condition_cure || "-",
          type_eprouvette: data.type_eprouvette || "cube",
          dimension_eprouvette: data.dimension_eprouvette || "150x150x150",
          operateur_nom: data.intervenants 
            ? `${data.intervenants.prenom} ${data.intervenants.nom}`
            : "-",
          operateur_signature_url: data.intervenants?.signature_url || null,
          date_coulage: data.date_coulage 
            ? format(new Date(data.date_coulage), "dd/MM/yyyy", { locale: fr })
            : "-",
          nombre_eprouvettes: data.nombre_eprouvettes || 0,
          centrale_nom: data.centrales_beton?.nom || "-",
          formulation: formulationData,
          jours_essai: joursEssai,
          resultats: resultats,
          temperature_beton: data.temperature_beton,
          temperature_air: data.temperature_air,
          classe_consistance: data.classe_consistance,
          classe_resistance: (data as { classe_resistance?: string }).classe_resistance || null,
          essai_convenance: data.essai_convenance || false,
          essai_convenance_details: data.essai_convenance_details || null,
          mention_info_client: extendedData.mention_info_client || false,
          mention_eprouvette_client: extendedData.mention_eprouvette_client || false,
          date_essai: data.date_essai || null,
          etuvage: extendedData.etuvage || null,
        });
      } catch (error) {
        console.error("Error fetching echantillon:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEchantillon();
  }, [id]);

  const calculateResults = () => {
    if (!echantillon?.resultats || echantillon.resultats.length === 0) {
      return { moyenne: 0, caracteristique: 0, classe: "--" };
    }

    const resistances = echantillon.resultats
      .map(e => e.resistance)
      .filter(r => r > 0);

    if (resistances.length === 0) {
      return { moyenne: 0, caracteristique: 0, classe: "--" };
    }

    const moyenne = resistances.length > 0 ? resistances.reduce((a, b) => a + b, 0) / resistances.length : 0;
    const variance = resistances.length > 0 ? resistances.reduce((sum, r) => sum + Math.pow(r - moyenne, 2), 0) / resistances.length : 0;
    const ecartType = Math.sqrt(variance);
    const caracteristique = moyenne - 1.48 * ecartType;

    let classe = "--";
    const fcmRef = [
      { classe: "C12/15", fcm: 20 },
      { classe: "C16/20", fcm: 24 },
      { classe: "C20/25", fcm: 28 },
      { classe: "C25/30", fcm: 33 },
      { classe: "C30/37", fcm: 38 },
      { classe: "C35/45", fcm: 43 },
      { classe: "C40/50", fcm: 48 },
      { classe: "C45/55", fcm: 53 },
      { classe: "C50/60", fcm: 58 },
    ];

    for (const ref of fcmRef) {
      if (moyenne >= ref.fcm) {
        classe = ref.classe;
      }
    }

    return {
      moyenne: parseFloat(moyenne.toFixed(2)),
      caracteristique: parseFloat(Math.max(0, caracteristique).toFixed(2)),
      classe,
    };
  };

  const waitForReportAssets = async (root: HTMLElement) => {
    await document.fonts?.ready;
    await Promise.all(
      Array.from(root.querySelectorAll("img")).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      })
    );
  };

  const handlePrint = async () => {
    if (reportRef.current) {
      await waitForReportAssets(reportRef.current);
    }
    requestAnimationFrame(() => window.print());
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    await waitForReportAssets(reportRef.current);
    const { downloadReportAsPDF } = await import("@/lib/pdf");
    downloadReportAsPDF(`rapport-compression-${String(echantillon?.numero ?? "").padStart(3, "0")}`);
  };

  // Auto-print lorsqu'on est sur la route /print
  useEffect(() => {
    if (!autoPrint || isLoading || !echantillon) return;
    const t = setTimeout(() => {
      if (reportRef.current) {
        waitForReportAssets(reportRef.current).then(() => window.print());
      } else {
        window.print();
      }
    }, 400);
    return () => clearTimeout(t);
  }, [autoPrint, isLoading, echantillon]);


  const results = calculateResults();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!echantillon) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Échantillon non trouvé
      </div>
    );
  }

  const verificationUrl = `${window.location.origin}/essais/beton/beton-durci/compression/${id}/rapport`;

  // Pre-calculate groups and total rows for the results table
  const sortedResults = [...echantillon.resultats].sort((a, b) => a.joursEssai - b.joursEssai);
  const groups: { joursEssai: number; dateEssai: string; items: EprouvetteData[] }[] = [];
  
  sortedResults.forEach((ep) => {
    const existingGroup = groups.find(g => g.joursEssai === ep.joursEssai);
    if (existingGroup) {
      existingGroup.items.push(ep);
    } else {
      groups.push({ joursEssai: ep.joursEssai, dateEssai: ep.dateEssai, items: [ep] });
    }
  });

  const totalRows = sortedResults.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {!embed && (
        <>
          <div className="print:hidden">
            <EssaiBreadcrumb 
              items={[
                { label: "Béton", path: "/essais/beton" },
                { label: "Béton Durci", path: "/essais/beton/beton-durci" },
                { label: "Compression", path: "/essais/beton/beton-durci/compression" },
                { label: <><span className="text-primary">EC</span>-{String(echantillon.numero).padStart(3, "0")}</>, path: `/essais/beton/beton-durci/compression/${id}` },
                { label: "Rapport" }
              ]} 
            />
          </div>
          
          <div className="flex items-center justify-between print:hidden">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(`/essais/beton/beton-durci/compression/${id}`)}
                className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold text-foreground">
                Rapport de compression — <span className="text-primary">EC</span>-{String(echantillon.numero).padStart(3, "0")}
              </h1>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-3">
                <ShareButton />
                <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  Imprimer
                </Button>
                <Button onClick={handleDownloadPDF} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Télécharger PDF
                </Button>
              </div>
              <p className="text-xs text-muted-foreground print:hidden">
                Conseil : désactivez les en-têtes dans les paramètres d'impression du navigateur
              </p>
            </div>
          </div>
        </>
      )}

      {/* Rapport */}
      <div 
        ref={reportRef}
        data-ref="report"
        className="report-table mx-auto w-[210mm] max-w-full overflow-x-auto print:overflow-visible bg-white"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        {/* ============ RAPPORT DÉTAILLÉ ============ */}
        <div
          data-pdf-page
          className="bg-white text-black p-4 rounded-lg shadow-lg print:shadow-none print:rounded-none"
        >
          <div data-pdf-content>
            <ReportHeader
              entreprise={entreprise}
              verificationUrl={verificationUrl}
              title="RAPPORT D'ESSAI DE COMPRESSION"
              subtitle="Résistance à la compression du béton - Norme NF EN 12390-3"
            />


          {/* Identification de l'échantillon */}
          <div className="mb-6">
            <table className="identification-table w-full border-collapse text-sm" style={{ borderSpacing: 0 }}>
              <tbody>
                <tr>
                  <td colSpan={2} className="border border-black px-3 py-1.5 font-medium text-black text-left align-middle">N° Échantillon</td>
                  <td colSpan={2} className="border border-black px-3 py-1.5 text-black text-left align-middle">EC-{String(echantillon.numero).padStart(3, "0")}</td>
                </tr>
                <tr>
                  <td colSpan={2} className="border border-black px-3 py-1.5 font-medium text-black text-left align-middle">Client</td>
                  <td colSpan={2} className="border border-black px-3 py-1.5 text-black text-left align-middle">{echantillon.client_nom}</td>
                </tr>
                <tr>
                  <td colSpan={2} className="border border-black px-3 py-1.5 font-medium text-black text-left align-middle">Chantier</td>
                  <td colSpan={2} className="border border-black px-3 py-1.5 text-black text-left align-middle">{echantillon.chantier_nom}</td>
                </tr>
                {echantillon.essai_convenance && (
                  <tr>
                    <td colSpan={2} className="border border-black px-3 py-1.5 font-medium text-black text-left align-middle">Essai de convenance</td>
                    <td colSpan={2} className="border border-black px-3 py-1.5 text-black text-left align-middle">
                      {echantillon.essai_convenance_details || "-"}
                    </td>
                  </tr>
                )}
                {!echantillon.essai_convenance && (
                  <>
                    <tr>
                      <td colSpan={2} className="border border-black px-3 py-1.5 font-medium text-black text-left align-middle">Ouvrage</td>
                      <td colSpan={2} className="border border-black px-3 py-1.5 text-black text-left align-middle">{echantillon.ouvrage}</td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="border border-black px-3 py-1.5 font-medium text-black text-left align-middle">Partie de l'ouvrage</td>
                      <td colSpan={2} className="border border-black px-3 py-1.5 text-black text-left align-middle">{echantillon.destination_beton}</td>
                    </tr>
                  </>
                )}
                <tr>
                  <td colSpan={2} className="border border-black px-3 py-1.5 font-medium text-black text-left align-middle">Mode de conservation</td>
                  <td colSpan={2} className="border border-black px-3 py-1.5 text-black text-left align-middle">{echantillon.condition_cure}</td>
                </tr>
                <tr>
                  <td colSpan={2} className="border border-black px-3 py-1.5 font-medium text-black text-left align-middle">Étuvage</td>
                  <td colSpan={2} className="border border-black px-3 py-1.5 text-black text-left align-middle">{echantillon.etuvage === "oui" ? "Oui" : "Non"}</td>
                </tr>
                <tr>
                  <td className="border border-black px-3 py-1.5 font-medium text-black text-left align-middle w-1/4">Type d'éprouvette</td>
                  <td className="border border-black px-3 py-1.5 text-black text-left align-middle w-1/4">{echantillon.type_eprouvette || "—"}</td>
                  <td className="border border-black px-3 py-1.5 font-medium text-black text-left align-middle w-1/4">Dimension</td>
                  <td className="border border-black px-3 py-1.5 text-black text-left align-middle w-1/4">{echantillon.dimension_eprouvette || "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Formulation de béton */}
          <div className="mb-6">
            <div className="mb-2 text-sm text-black">
              <span className="font-medium">Centrale à béton : </span>{echantillon.centrale_nom}
              <span className="mx-4">|</span>
              <span className="font-medium">Classe de béton : </span>{echantillon.classe_resistance || "-"}
              <span className="mx-2">-</span>
              {echantillon.classe_consistance || "-"}
            </div>
            <table className="w-full border-collapse formulation-table" style={{ borderSpacing: 0, tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "10%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "14%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="border border-black px-1 py-0.5 text-center font-medium text-[8px] text-black whitespace-nowrap">Ciment</th>
                  <th className="border border-black px-1 py-0.5 text-center font-medium text-[8px] text-black whitespace-nowrap">Eau</th>
                  <th className="border border-black px-1 py-0.5 text-center font-medium text-[8px] text-black whitespace-nowrap">Adjuvant</th>
                  <th className="border border-black px-1 py-0.5 text-center font-medium text-[8px] text-black whitespace-nowrap">Sable 1</th>
                  <th className="border border-black px-1 py-0.5 text-center font-medium text-[8px] text-black whitespace-nowrap">Sable 2</th>
                  <th className="border border-black px-1 py-0.5 text-center font-medium text-[8px] text-black whitespace-nowrap">Gravier 1</th>
                  <th className="border border-black px-1 py-0.5 text-center font-medium text-[8px] text-black whitespace-nowrap">Gravier 2</th>
                  <th className="border border-black px-1 py-0.5 text-center font-medium text-[8px] text-black whitespace-nowrap">Gravier 3</th>
                </tr>
                <tr>
                  <th className="border border-black px-1 py-0.5 text-center text-[8px] text-black font-normal">{echantillon.formulation?.ciment.producteur_nom || "-"}</th>
                  <th className="border border-black px-1 py-0.5 text-center text-[8px] text-black font-normal">{echantillon.formulation?.eau.producteur_nom || "-"}</th>
                  <th className="border border-black px-1 py-0.5 text-center text-[8px] text-black font-normal">{echantillon.formulation?.adjuvant.producteur_nom || "-"}</th>
                  <th className="border border-black px-1 py-0.5 text-center text-[8px] text-black font-normal">{echantillon.formulation?.sable_concasse.producteur_nom || "-"}</th>
                  <th className="border border-black px-1 py-0.5 text-center text-[8px] text-black font-normal">{echantillon.formulation?.sable_fin.producteur_nom || "-"}</th>
                  <th className="border border-black px-1 py-0.5 text-center text-[8px] text-black font-normal">{echantillon.formulation?.gravillons1.producteur_nom || "-"}</th>
                  <th className="border border-black px-1 py-0.5 text-center text-[8px] text-black font-normal">{echantillon.formulation?.gravier2.producteur_nom || "-"}</th>
                  <th className="border border-black px-1 py-0.5 text-center text-[8px] text-black font-normal">{echantillon.formulation?.gravier3.producteur_nom || "-"}</th>
                </tr>
                <tr>
                  <th className="border border-black px-1 py-0.5 text-center text-[8px] text-black font-normal">{echantillon.formulation?.ciment.produit_nom || "-"}</th>
                  <th className="border border-black px-1 py-0.5 text-center text-[8px] text-black font-normal">{echantillon.formulation?.eau.produit_nom || "-"}</th>
                  <th className="border border-black px-1 py-0.5 text-center text-[8px] text-black font-normal">{echantillon.formulation?.adjuvant.produit_nom || "-"}</th>
                  <th className="border border-black px-1 py-0.5 text-center text-[8px] text-black font-normal">{echantillon.formulation?.sable_concasse.produit_nom || "-"}</th>
                  <th className="border border-black px-1 py-0.5 text-center text-[8px] text-black font-normal">{echantillon.formulation?.sable_fin.produit_nom || "-"}</th>
                  <th className="border border-black px-1 py-0.5 text-center text-[8px] text-black font-normal">{echantillon.formulation?.gravillons1.produit_nom || "-"}</th>
                  <th className="border border-black px-1 py-0.5 text-center text-[8px] text-black font-normal">{echantillon.formulation?.gravier2.produit_nom || "-"}</th>
                  <th className="border border-black px-1 py-0.5 text-center text-[8px] text-black font-normal">{echantillon.formulation?.gravier3.produit_nom || "-"}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black px-1 py-1 text-center text-[8px] font-medium text-black">{echantillon.formulation?.ciment.quantite ?? 0} kg</td>
                  <td className="border border-black px-1 py-1 text-center text-[8px] font-medium text-black">{echantillon.formulation?.eau.quantite ?? 0} L</td>
                  <td className="border border-black px-1 py-1 text-center text-[8px] font-medium text-black">{echantillon.formulation?.adjuvant.quantite ?? 0} kg</td>
                  <td className="border border-black px-1 py-1 text-center text-[8px] font-medium text-black">{echantillon.formulation?.sable_concasse.quantite ?? 0} kg</td>
                  <td className="border border-black px-1 py-1 text-center text-[8px] font-medium text-black">{echantillon.formulation?.sable_fin.quantite ?? 0} kg</td>
                  <td className="border border-black px-1 py-1 text-center text-[8px] font-medium text-black">{echantillon.formulation?.gravillons1.quantite ?? 0} kg</td>
                  <td className="border border-black px-1 py-1 text-center text-[8px] font-medium text-black">{echantillon.formulation?.gravier2.quantite ?? 0} kg</td>
                  <td className="border border-black px-1 py-1 text-center text-[8px] font-medium text-black">{echantillon.formulation?.gravier3.quantite ?? 0} kg</td>
                </tr>
              </tbody>
            </table>
          </div>


          {/* Résultats des essais */}
          <div className="mb-6" data-report-fill>
            <table data-results-table data-rows={totalRows} className="w-full border-collapse results-table" style={{ borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">Date coulage</th>
                  <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">Date d'essai</th>
                  <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">Âge (jours)</th>
                  <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">Poids (g)</th>
                  <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">Densité (kg/m³)</th>
                  <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">Charge (kN)</th>
                  <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">Rc (MPa)</th>
                  <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">Moy. Rc (MPa)</th>
                </tr>
              </thead>
              <tbody>
                {echantillon.resultats.length > 0 ? (() => {
                  let globalRowIndex = 0;

                  return groups.map((group) => {
                    // Calculate average resistance for the group
                    const resistances = group.items.map(ep => ep.resistance).filter(r => r > 0);
                    const moyenneRc = resistances.length > 0 
                      ? (resistances.reduce((a, b) => a + b, 0) / resistances.length).toFixed(2)
                      : "—";

                    return group.items.map((ep, idx) => {
                      const isVeryFirstRow = globalRowIndex === 0;
                      globalRowIndex++;

                      return (
                        <tr key={`${group.joursEssai}-${ep.numero}`}>
                          {isVeryFirstRow && (
                            <td 
                              rowSpan={totalRows} 
                              className="border border-black px-2 py-2 text-center text-sm align-middle text-black"
                            >
                              {echantillon.date_coulage || "—"}
                            </td>
                          )}
                          {idx === 0 && (
                            <>
                              <td 
                                rowSpan={group.items.length} 
                                className="border border-black px-2 py-2 text-center text-sm align-middle text-black"
                              >
                                {group.dateEssai || "—"}
                              </td>
                              <td 
                                rowSpan={group.items.length} 
                                className="border border-black px-2 py-2 text-center text-sm font-medium align-middle text-black"
                              >
                                {group.joursEssai}
                              </td>
                            </>
                          )}
                          <td className="border border-black px-2 py-2 text-center text-sm text-black">{ep.poids || "—"}</td>
                          <td className="border border-black px-2 py-2 text-center text-sm text-black">{ep.densite || "—"}</td>
                          <td className="border border-black px-2 py-2 text-center text-sm text-black">{ep.charge || "—"}</td>
                          <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{ep.resistance || "—"}</td>
                          {idx === 0 && (
                            <td 
                              rowSpan={group.items.length} 
                              className="border border-black px-2 py-2 text-center text-sm font-bold align-middle text-black"
                            >
                              {moyenneRc}
                            </td>
                          )}
                        </tr>
                      );
                    });
                  });
                })() : (
                  <tr>
                    <td colSpan={8} className="border border-black px-2 py-4 text-center text-sm text-black">
                      Aucune donnée saisie
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>


          {/* Remarques / Mentions */}
          {(echantillon.mention_info_client || echantillon.mention_eprouvette_client) && (
            <div className="mt-4 pt-3 border-t border-gray-300">
              <p className="font-bold text-sm underline text-black mb-2">Remarques</p>
              <ul className="list-disc list-inside text-sm text-black space-y-1">
                {echantillon.mention_info_client && (
                  <li>Informations fournies par le client</li>
                )}
                {echantillon.mention_eprouvette_client && (
                  <li>Éprouvette confectionnée par le client</li>
                )}
              </ul>
            </div>
          )}

          {/* Pied de page */}
          <div data-report-footer className="mt-8 pt-4">
            <div className="flex justify-between items-end">
              <div className="text-sm text-black">
                <p>Le Technicien: {echantillon.operateur_nom}</p>
                {echantillon.operateur_signature_url && (
                  <div className="mt-2">
                    <img 
                      src={echantillon.operateur_signature_url} 
                      alt="Signature technicien" 
                      className="max-h-16 object-contain"
                    />
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="min-h-16 flex flex-col items-center justify-end">
                  {entreprise?.cachet_url ? (
                    <img 
                      src={entreprise.cachet_url} 
                      alt="Cachet entreprise" 
                      className="max-h-20 object-contain mb-1"
                    />
                  ) : (
                    <p className="text-sm font-medium text-black">Signature et cachet</p>
                  )}
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
        {/* Fin page 2+ */}
      </div>
      {/* ===================================================================
          MISE EN PAGE A4 — SOURCE DE VÉRITÉ UNIQUE
          Appliquée à l'écran (aperçu), à window.print() et au PDF téléchargé.
          Le conteneur [data-pdf-page] est un vrai gabarit 210×297mm en
          flex-column. Le bloc [data-report-fill] absorbe l'espace vertical
          restant ; le pied de page reste collé en bas via margin-top:auto.
          Résultat : rendu strictement identique sur les 3 sorties.
         =================================================================== */}
      <style>{`
        /* -----------------------------------------------------------------
           Variables communes — pilotent toute la typographie et la densité
           ----------------------------------------------------------------- */
        [data-ref="report"] {
          --a4-w: 210mm;
          --a4-h: 297mm;
          --a4-pad: 8mm;
          --tbl-fs: 9.5pt;
          --tbl-py: 3px;
          --tbl-px: 6px;
          --tbl-border: #000;
          --tbl-line: 1.25;
          --section-gap: 3.5mm;
          --title-color: #1e5a7a;
          /* densité résultats : ajustée dynamiquement selon data-rows */
          --res-py: 4px;
          --res-line: 1.3;
        }

        /* -----------------------------------------------------------------
           GABARIT A4 (aperçu écran ET impression)
           ----------------------------------------------------------------- */
        [data-ref="report"] [data-pdf-page] {
          width: var(--a4-w);
          height: var(--a4-h);
          box-sizing: border-box;
          padding: var(--a4-pad) !important;
          margin: 0 auto;
          background: #ffffff;
          overflow: hidden;
          display: block;
        }
        [data-ref="report"] [data-pdf-content] {
          height: 100%;
          display: flex !important;
          flex-direction: column;
          gap: var(--section-gap);
        }
        [data-ref="report"] [data-pdf-content] > * { margin: 0 !important; }
        [data-ref="report"] [data-report-fill] {
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        [data-ref="report"] [data-report-fill] > table {
          flex: 1 1 auto;
          height: 100%;
        }
        [data-ref="report"] [data-report-footer] {
          margin-top: auto !important;
          padding-top: 3mm !important;
        }

        /* -----------------------------------------------------------------
           EN-TÊTE — compact (hauteur réduite ~3mm)
           ----------------------------------------------------------------- */
        [data-ref="report"] [data-report-header] {
          padding: 3px 8px !important;
          margin-bottom: 0 !important;
        }
        [data-ref="report"] [data-report-header] > div { align-items: center !important; }
        [data-ref="report"] [data-report-header] .w-24 {
          width: 17mm !important;
          height: 17mm !important;
        }
        [data-ref="report"] [data-report-header] h1 {
          font-size: 11.5pt !important;
          line-height: 1.1 !important;
          margin: 0 0 1px 0 !important;
        }
        [data-ref="report"] [data-report-header] p {
          font-size: 8pt !important;
          line-height: 1.2 !important;
          margin: 0 !important;
        }
        [data-ref="report"] [data-report-header] + .border-t-2 { margin: 0.5mm 0 0.2mm 0 !important; }
        [data-ref="report"] [data-report-header] ~ .text-center h2 {
          font-size: 13pt !important;
          margin: 0 0 0.5mm 0 !important;
        }
        [data-ref="report"] [data-report-header] ~ .text-center p { font-size: 8.5pt !important; margin: 0 !important; }

        /* -----------------------------------------------------------------
           TABLEAUX — cellules strictement uniformes
           ----------------------------------------------------------------- */
        [data-ref="report"] table {
          width: 100% !important;
          border-collapse: collapse !important;
          border-spacing: 0 !important;
          table-layout: fixed !important;
        }
        [data-ref="report"] th,
        [data-ref="report"] td {
          border: 1px solid var(--tbl-border) !important;
          padding: var(--tbl-py) var(--tbl-px) !important;
          font-size: var(--tbl-fs) !important;
          line-height: var(--tbl-line) !important;
          vertical-align: middle !important;
          word-wrap: break-word;
          overflow-wrap: anywhere;
          box-sizing: border-box;
        }
        [data-ref="report"] th {
          background: #f1f5f9 !important;
          font-weight: 600 !important;
          text-align: center !important;
        }
        [data-ref="report"] h3 {
          font-size: 10pt !important;
          font-weight: 700 !important;
          margin: 0 0 1.5mm 0 !important;
          color: var(--title-color) !important;
        }

        /* Table formulation — plus compacte, cellules uniformes */
        [data-ref="report"] .formulation-table th,
        [data-ref="report"] .formulation-table td {
          font-size: 7.5pt !important;
          padding: 2px 3px !important;
          line-height: 1.15 !important;
        }
        [data-ref="report"] .formulation-table th { text-align: center !important; }

        /* Table résultats — densité pilotée par data-rows.
           Seuls le padding vertical et la line-height varient. */
        [data-ref="report"] .results-table th,
        [data-ref="report"] .results-table td {
          padding-top: var(--res-py) !important;
          padding-bottom: var(--res-py) !important;
          line-height: var(--res-line) !important;
        }
        [data-ref="report"] .results-table[data-rows="7"],
        [data-ref="report"] .results-table[data-rows="8"],
        [data-ref="report"] .results-table[data-rows="9"] {
          --res-py: 3px;
          --res-line: 1.2;
        }
        [data-ref="report"] .results-table[data-rows="10"],
        [data-ref="report"] .results-table[data-rows="11"],
        [data-ref="report"] .results-table[data-rows="12"],
        [data-ref="report"] .results-table[data-rows="13"] {
          --res-py: 2px;
          --res-line: 1.1;
        }
        [data-ref="report"] .results-table tbody tr { height: auto; }
        /* Supprime le double trait entre les groupes d'âges (7j / 28j) :
           la bordure haute des cellules rowSpan qui débutent un nouveau bloc
           est retirée ; il reste uniquement la bordure basse du bloc précédent. */
        #root [data-ref="report"] .results-table tbody tr:not(:first-child) td[rowspan] {
          border-top: 0 !important;
        }

        /* Pied de page — signatures serrées, cachet contenu */
        [data-ref="report"] [data-report-footer] img { max-height: 16mm !important; }

        /* -----------------------------------------------------------------
           APERÇU ÉCRAN — affiche la feuille A4 comme le PDF final
           ----------------------------------------------------------------- */
        @media screen {
          [data-ref="report"] {
            width: var(--a4-w) !important;
            max-width: 100% !important;
          }
          [data-ref="report"] [data-pdf-page] {
            box-shadow: 0 0 12px rgba(0,0,0,0.15);
            border-radius: 4px;
          }
        }
        ${isPrintRoute ? `
          html, body, #root {
            margin: 0 !important;
            padding: 0 !important;
            background: #e5e7eb;
          }
          body { display: flex; justify-content: center; padding: 8mm 0; }
        ` : ""}

        /* -----------------------------------------------------------------
           IMPRESSION / EXPORT PDF — rendu strictement identique à l'aperçu
           ----------------------------------------------------------------- */
        @media print {
          @page { size: A4 portrait; margin: 0; }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          body > iframe,
          body > [data-lovable-badge] { display: none !important; }
          #root, #root > div, #root main {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff !important;
            box-shadow: none !important;
          }
          [data-ref="report"], [data-ref="report"] * { visibility: visible; }
          [data-ref="report"] {
            position: static !important;
            width: var(--a4-w) !important;
            max-width: var(--a4-w) !important;
            margin: 0 auto !important;
            padding: 0 !important;
            overflow: visible !important;
            background: #ffffff !important;
          }
          [data-ref="report"] [data-pdf-page] {
            width: var(--a4-w) !important;
            height: var(--a4-h) !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          [data-ref="report"] table,
          [data-ref="report"] tr,
          [data-ref="report"] thead,
          [data-ref="report"] tbody {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

    </div>
  );
};

export default CompressionReport;
