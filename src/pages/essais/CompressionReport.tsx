import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Printer, Loader2 } from "lucide-react";
import ShareButton from "@/components/reports/ShareButton";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { ReportHeader } from "@/components/reports/ReportHeader";

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
}

const CompressionReport = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
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
          mention_info_client: (data as any).mention_info_client || false,
          mention_eprouvette_client: (data as any).mention_eprouvette_client || false,
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

    const moyenne = resistances.reduce((a, b) => a + b, 0) / resistances.length;
    const variance = resistances.reduce((sum, r) => sum + Math.pow(r - moyenne, 2), 0) / resistances.length;
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    
    const canvas = await html2canvas(reportRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`rapport-compression-EC-${String(echantillon?.numero).padStart(3, "0")}.pdf`);
  };

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
      {/* Header avec actions - Caché à l'impression */}
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
          <h1 className="text-xl font-semibold text-foreground">Rapport de compression</h1>
        </div>
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
      </div>

      {/* Rapport */}
      <div 
        ref={reportRef}
        className="report-table bg-white text-black p-8 rounded-lg shadow-lg max-w-4xl mx-auto print:shadow-none print:p-4"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
          <ReportHeader
            entreprise={entreprise}
            verificationUrl={verificationUrl}
            title="RAPPORT D'ESSAI DE COMPRESSION"
            subtitle="Résistance à la compression du béton - Norme NF EN 12390-3"
          />

          {/* Identification de l'échantillon */}
          {/* Identification de l'échantillon */}
          <div className="mb-6">
            <h3 className="font-bold text-sm mb-2 underline text-black">Identification de l'échantillon</h3>
            <table className="w-full border-collapse border border-black text-sm">
              <tbody>
                <tr>
                  <td className="border border-black px-3 py-1.5 font-medium w-1/3 text-black">N° Échantillon</td>
                  <td className="border border-black px-3 py-1.5 text-black">EC-{String(echantillon.numero).padStart(3, "0")}</td>
                </tr>
                <tr>
                  <td className="border border-black px-3 py-1.5 font-medium text-black">Client</td>
                  <td className="border border-black px-3 py-1.5 text-black">{echantillon.client_nom}</td>
                </tr>
                <tr>
                  <td className="border border-black px-3 py-1.5 font-medium text-black">Chantier</td>
                  <td className="border border-black px-3 py-1.5 text-black">{echantillon.chantier_nom}</td>
                </tr>
                {echantillon.essai_convenance && (
                  <tr>
                    <td className="border border-black px-3 py-1.5 font-medium text-black">Essai de convenance</td>
                    <td className="border border-black px-3 py-1.5 text-black">
                      {echantillon.essai_convenance_details || "-"}
                    </td>
                  </tr>
                )}
                {!echantillon.essai_convenance && (
                  <>
                    <tr>
                      <td className="border border-black px-3 py-1.5 font-medium text-black">Ouvrage</td>
                      <td className="border border-black px-3 py-1.5 text-black">{echantillon.ouvrage}</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 py-1.5 font-medium text-black">Partie de l'ouvrage</td>
                      <td className="border border-black px-3 py-1.5 text-black">{echantillon.destination_beton}</td>
                    </tr>
                  </>
                )}
                <tr>
                  <td className="border border-black px-3 py-1.5 font-medium text-black">Mode de conservation</td>
                  <td className="border border-black px-3 py-1.5 text-black">{echantillon.condition_cure}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Formulation de béton */}
          <div className="mb-6">
            <h3 className="font-bold text-sm mb-2 underline text-black">Formulation de béton</h3>
            <div className="mb-2 text-sm text-black">
              <span className="font-medium">Centrale à béton : </span>{echantillon.centrale_nom}
              <span className="mx-4">|</span>
              <span className="font-medium">Formulation : </span>{echantillon.formulation?.nom || "-"}
            </div>
            <table className="w-full border-collapse border border-black">
              <thead>
                <tr>
                  <th className="border border-black px-2 py-1 text-center font-medium text-xs text-black">
                    Ciment
                  </th>
                  <th className="border border-black px-2 py-1 text-center font-medium text-xs text-black">
                    Eau
                  </th>
                  <th className="border border-black px-2 py-1 text-center font-medium text-xs text-black">
                    Adjuvant
                  </th>
                  <th className="border border-black px-2 py-1 text-center font-medium text-xs text-black">
                    Sable 1
                  </th>
                  <th className="border border-black px-2 py-1 text-center font-medium text-xs text-black">
                    Sable 2
                  </th>
                  <th className="border border-black px-2 py-1 text-center font-medium text-xs text-black">
                    Gravier 1
                  </th>
                  <th className="border border-black px-2 py-1 text-center font-medium text-xs text-black">
                    Gravier 2
                  </th>
                  <th className="border border-black px-2 py-1 text-center font-medium text-xs text-black">
                    Gravier 3
                  </th>
                </tr>
                <tr>
                  <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">
                    {echantillon.formulation?.ciment.producteur_nom || "-"}
                  </th>
                  <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">
                    {echantillon.formulation?.eau.producteur_nom || "-"}
                  </th>
                  <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">
                    {echantillon.formulation?.adjuvant.producteur_nom || "-"}
                  </th>
                  <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">
                    {echantillon.formulation?.sable_concasse.producteur_nom || "-"}
                  </th>
                  <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">
                    {echantillon.formulation?.sable_fin.producteur_nom || "-"}
                  </th>
                  <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">
                    {echantillon.formulation?.gravillons1.producteur_nom || "-"}
                  </th>
                  <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">
                    {echantillon.formulation?.gravier2.producteur_nom || "-"}
                  </th>
                  <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">
                    {echantillon.formulation?.gravier3.producteur_nom || "-"}
                  </th>
                </tr>
                <tr>
                  <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{echantillon.formulation?.ciment.produit_nom || "-"}</th>
                  <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{echantillon.formulation?.eau.produit_nom || "-"}</th>
                  <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{echantillon.formulation?.adjuvant.produit_nom || "-"}</th>
                  <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{echantillon.formulation?.sable_concasse.produit_nom || "-"}</th>
                  <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{echantillon.formulation?.sable_fin.produit_nom || "-"}</th>
                  <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{echantillon.formulation?.gravillons1.produit_nom || "-"}</th>
                  <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{echantillon.formulation?.gravier2.produit_nom || "-"}</th>
                  <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{echantillon.formulation?.gravier3.produit_nom || "-"}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{echantillon.formulation?.ciment.quantite ?? 0}</td>
                  <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{echantillon.formulation?.eau.quantite ?? 0}</td>
                  <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{echantillon.formulation?.adjuvant.quantite ?? 0}</td>
                  <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{echantillon.formulation?.sable_concasse.quantite ?? 0}</td>
                  <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{echantillon.formulation?.sable_fin.quantite ?? 0}</td>
                  <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{echantillon.formulation?.gravillons1.quantite ?? 0}</td>
                  <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{echantillon.formulation?.gravier2.quantite ?? 0}</td>
                  <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{echantillon.formulation?.gravier3.quantite ?? 0}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Caractéristiques techniques */}
          <div className="mb-6">
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr>
                  <th className="border border-black px-3 py-1.5 text-center font-medium text-black">Classe de Résistance</th>
                  <th className="border border-black px-3 py-1.5 text-center font-medium text-black">Classe de consistance</th>
                  <th className="border border-black px-3 py-1.5 text-center font-medium text-black">Type Moule</th>
                  <th className="border border-black px-3 py-1.5 text-center font-medium text-black">T°C béton</th>
                  <th className="border border-black px-3 py-1.5 text-center font-medium text-black">T°C Air</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black px-3 py-1.5 text-center text-black">{echantillon.classe_resistance || "—"}</td>
                  <td className="border border-black px-3 py-1.5 text-center text-black">{echantillon.classe_consistance || "—"}</td>
                  <td className="border border-black px-3 py-1.5 text-center text-black">{echantillon.type_eprouvette} {echantillon.dimension_eprouvette}</td>
                  <td className="border border-black px-3 py-1.5 text-center text-black">{echantillon.temperature_beton ? `${echantillon.temperature_beton}°C` : "—"}</td>
                  <td className="border border-black px-3 py-1.5 text-center text-black">{echantillon.temperature_air ? `${echantillon.temperature_air}°C` : "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Résultats des essais */}
          <div className="mb-6">
            <h3 className="font-bold text-sm mb-2 underline text-black">Résultats des essais</h3>
            <table className="w-full border-collapse border border-black">
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


          {/* Pied de page */}
          <div className="mt-8 pt-4 border-t border-gray-300">
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
      {/* Styles d'impression */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          #root {
            padding: 0 !important;
          }
          [data-ref="report"], [data-ref="report"] * {
            visibility: visible;
          }
        }
      `}</style>
    </div>
  );
};

export default CompressionReport;
