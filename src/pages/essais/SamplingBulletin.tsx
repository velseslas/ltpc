import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Printer, Loader2 } from "lucide-react";
import ShareButton from "@/components/reports/ShareButton";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

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
  operateur_poste: string;
  date_coulage: string;
  heure_coulage: string;
  nombre_eprouvettes: number;
  centrale_nom: string;
  formulation_nom: string;
  formulation: FormulationData | null;
  temperature_beton: number | null;
  temperature_air: number | null;
  classe_consistance: string | null;
  classe_resistance: string | null;
  mode_coulage: string | null;
}

const SamplingBulletin = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const bulletinRef = useRef<HTMLDivElement>(null);
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
            intervenants:operateur_id(nom, prenom, postes:poste_id(nom)),
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

        // Fetch product and producer names if formulation exists
        let formulationData: FormulationData | null = null;
        if (data.formulations) {
          const f = data.formulations;
          
          // Helper to fetch product name
          const fetchProduitNom = async (prodId: string | null): Promise<string | null> => {
            if (!prodId) return null;
            const { data: prod } = await supabase.from("produits").select("nom").eq("id", prodId).maybeSingle();
            return prod?.nom || null;
          };
          
          // Helper to fetch producer name by type
          const fetchProducteurNom = async (prodId: string | null, type: string): Promise<string | null> => {
            if (!prodId) return null;
            let result: { nom: string } | null = null;
            switch (type) {
              case "cimenterie": {
                const { data: cim } = await supabase.from("cimenteries").select("nom").eq("id", prodId).maybeSingle();
                result = cim;
                break;
              }
              case "source_eau": {
                const { data: eau } = await supabase.from("sources_eau").select("nom").eq("id", prodId).maybeSingle();
                result = eau;
                break;
              }
              case "adjuvant": {
                const { data: adj } = await supabase.from("adjuvants").select("nom").eq("id", prodId).maybeSingle();
                result = adj;
                break;
              }
              default: {
                const { data: car } = await supabase.from("carrieres").select("nom").eq("id", prodId).maybeSingle();
                result = car;
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
          client_nom: data.clients?.nom || "",
          chantier_nom: data.chantiers?.nom || "",
          ouvrage: data.ouvrage || "",
          destination_beton: data.destination_beton || "",
          condition_cure: data.condition_cure || "",
          type_eprouvette: data.type_eprouvette || "cube",
          dimension_eprouvette: data.dimension_eprouvette || "",
          operateur_nom: data.intervenants 
            ? `${data.intervenants.prenom} ${data.intervenants.nom}`
            : "",
          operateur_poste: data.intervenants?.postes?.nom || "",
          date_coulage: data.date_coulage 
            ? format(new Date(data.date_coulage), "dd/MM/yyyy", { locale: fr })
            : "",
          heure_coulage: data.date_coulage
            ? format(new Date(data.date_coulage), "HH:mm", { locale: fr })
            : "",
          nombre_eprouvettes: data.nombre_eprouvettes || 0,
          centrale_nom: data.centrales_beton?.nom || "",
          formulation_nom: data.formulations?.nom || "",
          formulation: formulationData,
          temperature_beton: data.temperature_beton,
          temperature_air: data.temperature_air,
          classe_consistance: data.classe_consistance,
          classe_resistance: (data as { classe_resistance?: string }).classe_resistance || null,
          mode_coulage: data.mode_coulage,
        });
      } catch (error) {
        console.error("Error fetching echantillon:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEchantillon();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const generatePdfBlob = async (): Promise<Blob | null> => {
    if (!bulletinRef.current) return null;

    const canvas = await html2canvas(bulletinRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    return pdf.output("blob");
  };

  const handleDownloadPDF = async () => {
    const { downloadReportAsPDF } = await import("@/lib/pdf");
    await downloadReportAsPDF(
      bulletinRef.current,
      `bulletin-echantillonnage-EC-${String(echantillon?.numero).padStart(3, "0")}`
    );
  };

  const getModeCoulageDisplay = (mode: string | null) => {
    switch (mode) {
      case "pompe": return "Pompe";
      case "benne": return "Benne";
      case "autre": return "Autre";
      default: return "";
    }
  };

  const getAffaissementClass = (classe: string | null) => {
    switch (classe) {
      case "S1": return { ferme: true, plastique: false, tresPlas: false, fluide: false };
      case "S2": return { ferme: false, plastique: true, tresPlas: false, fluide: false };
      case "S3": return { ferme: false, plastique: false, tresPlas: true, fluide: false };
      case "S4": return { ferme: false, plastique: false, tresPlas: false, fluide: true };
      case "S5": return { ferme: false, plastique: false, tresPlas: false, fluide: true };
      default: return { ferme: false, plastique: false, tresPlas: false, fluide: false };
    }
  };

  const getConservationDisplay = (condition: string) => {
    switch (condition) {
      case "standard": return { ambient: false, eau20: true, humide: false };
      case "acceleree": return { ambient: true, eau20: false, humide: false };
      case "chantier": return { ambient: false, eau20: false, humide: true };
      default: return { ambient: false, eau20: false, humide: false };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!echantillon) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Échantillon non trouvé</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate("/essais/beton/beton-durci/compression")}
        >
          Retour à la liste
        </Button>
      </div>
    );
  }

  const affaissement = getAffaissementClass(echantillon.classe_consistance);
  const conservation = getConservationDisplay(echantillon.condition_cure);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="print:hidden">
        <EssaiBreadcrumb 
          items={[
            { label: "Béton", path: "/essais/beton" },
            { label: "Béton Durci", path: "/essais/beton/beton-durci" },
            { label: "Compression", path: "/essais/beton/beton-durci/compression" },
            { label: <><span className="text-primary">EC</span>-{String(echantillon.numero).padStart(3, "0")}</>, path: `/essais/beton/beton-durci/compression/${id}` },
            { label: "Bulletin" }
          ]} 
        />
      </div>
      
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/essais/beton/beton-durci/compression/${id}`)}
            className="h-10 w-10 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Bulletin d'échantillonnage
            </h1>
            <p className="text-muted-foreground">
              Échantillon N° <span className="text-primary">EC</span>-{String(echantillon.numero).padStart(3, "0")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ShareButton onGeneratePdf={generatePdfBlob} fileName={`bulletin-echantillonnage-EC-${String(echantillon?.numero).padStart(3, "0")}.pdf`} />
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
          <Button onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger PDF
          </Button>
        </div>
      </div>

      {/* Bulletin Content */}
      <div className="flex justify-center">
        <div 
          ref={bulletinRef}
          data-ref="report"
          className="bg-white p-6 w-[210mm] min-h-[297mm] text-black print:p-0 print:shadow-none shadow-lg"
          style={{ fontFamily: "Arial, sans-serif", fontSize: "11px" }}
        >
            {/* Title in bordered box */}
            <div className="border border-black mb-3">
              <div className="text-center py-2">
                <h1 className="text-lg font-bold uppercase tracking-wide">
                  Bulletin d'échantillonnage
                </h1>
                <p className="text-xs uppercase">
                  (Prélèvement éprouvette béton pour essai à la compression)
                </p>
              </div>
            </div>

            {/* Identification Section */}
            <div className="border border-black mb-3 text-xs">
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1 font-bold w-24">Chantier</td>
                    <td className="px-2 py-1">{echantillon.chantier_nom}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1 font-bold">Ouvrage</td>
                    <td className="px-2 py-1">{echantillon.ouvrage}</td>
                  </tr>
                  <tr>
                    <td className="border-r border-black px-2 py-1 font-bold">Partie Ouvrage</td>
                    <td className="px-2 py-1">{echantillon.destination_beton}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Date/Heure/Température Row */}
            <div className="flex border border-black mb-3 text-xs">
              <div className="flex-1 border-r border-black px-2 py-1">
                <span className="font-bold">Date :</span> {echantillon.date_coulage}
              </div>
              <div className="flex-1 border-r border-black px-2 py-1">
                <span className="font-bold">Heure :</span> {echantillon.heure_coulage}
              </div>
              <div className="flex-1 px-2 py-1">
                <span className="font-bold">Température Ambiante :</span> {echantillon.temperature_air ? `${echantillon.temperature_air}°C` : "......°C"}
              </div>
            </div>

            {/* Quantity/Mode/Number/Codification Row */}
            <div className="flex border border-black mb-3 text-xs">
              <div className="border-r border-black px-2 py-1" style={{ width: "25%" }}>
                <div className="font-bold mb-1">Quantité de Béton Coulé</div>
                <div className="border-t border-black pt-1">
                  M³
                </div>
              </div>
              <div className="border-r border-black px-2 py-1" style={{ width: "25%" }}>
                <div className="font-bold mb-1">Mode de coulage</div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1">
                    <span className={`inline-block w-3 h-3 border border-black ${echantillon.mode_coulage === "benne" ? "bg-black" : ""}`}></span>
                    <span>Benne</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`inline-block w-3 h-3 border border-black ${echantillon.mode_coulage === "pompe" ? "bg-black" : ""}`}></span>
                    <span>Pompe</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`inline-block w-3 h-3 border border-black ${echantillon.mode_coulage === "autre" ? "bg-black" : ""}`}></span>
                    <span>Autre</span>
                  </div>
                </div>
              </div>
              <div className="border-r border-black px-2 py-1" style={{ width: "25%" }}>
                <div className="font-bold mb-1">Nombre d'Éprouvettes</div>
                <div className="text-center text-lg font-bold">{echantillon.nombre_eprouvettes}</div>
              </div>
              <div className="px-2 py-1 bg-gray-100" style={{ width: "25%" }}>
                <div className="font-bold mb-1 text-center">CODIFICATION ÉCHANTILLON</div>
                <div className="text-center text-lg font-bold">EC-{String(echantillon.numero).padStart(3, "0")}</div>
              </div>
            </div>

            {/* Dosage Béton & Essai d'Affaissement */}
            <div className="border border-black mb-3">
              <div className="bg-gray-100 px-2 py-1 text-center font-bold text-xs border-b border-black">
                Dosage Béton & Essai d'Affaissement
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-black">
                    <th className="border-r border-black px-2 py-1 text-left"></th>
                    <th className="border-r border-black px-2 py-1">Classe</th>
                    <th className="border-r border-black px-2 py-1">Quantité</th>
                    <th className="px-2 py-1">Provenance/Fonction pour adjuvant</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1 font-bold">Ciment</td>
                    <td className="border-r border-black px-2 py-1 text-center">{echantillon.formulation?.ciment.produit_nom || ""}</td>
                    <td className="border-r border-black px-2 py-1 text-center">{echantillon.formulation?.ciment.quantite || ""}</td>
                    <td className="px-2 py-1">{echantillon.formulation?.ciment.producteur_nom || ""}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1 font-bold">Eau</td>
                    <td className="border-r border-black px-2 py-1 text-center">{echantillon.formulation?.eau.produit_nom || ""}</td>
                    <td className="border-r border-black px-2 py-1 text-center">{echantillon.formulation?.eau.quantite || ""}</td>
                    <td className="px-2 py-1">{echantillon.formulation?.eau.producteur_nom || ""}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1 font-bold">Adjuvant</td>
                    <td className="border-r border-black px-2 py-1 text-center">{echantillon.formulation?.adjuvant.produit_nom || ""}</td>
                    <td className="border-r border-black px-2 py-1 text-center">{echantillon.formulation?.adjuvant.quantite || ""}</td>
                    <td className="px-2 py-1">{echantillon.formulation?.adjuvant.producteur_nom || ""}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1 font-bold">Sable 1</td>
                    <td className="border-r border-black px-2 py-1 text-center">{echantillon.formulation?.sable_concasse.produit_nom || ""}</td>
                    <td className="border-r border-black px-2 py-1 text-center">{echantillon.formulation?.sable_concasse.quantite || ""}</td>
                    <td className="px-2 py-1">{echantillon.formulation?.sable_concasse.producteur_nom || ""}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1 font-bold">Sable 2</td>
                    <td className="border-r border-black px-2 py-1 text-center">{echantillon.formulation?.sable_fin.produit_nom || ""}</td>
                    <td className="border-r border-black px-2 py-1 text-center">{echantillon.formulation?.sable_fin.quantite || ""}</td>
                    <td className="px-2 py-1">{echantillon.formulation?.sable_fin.producteur_nom || ""}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1 font-bold">Gravier 1</td>
                    <td className="border-r border-black px-2 py-1 text-center">{echantillon.formulation?.gravillons1.produit_nom || ""}</td>
                    <td className="border-r border-black px-2 py-1 text-center">{echantillon.formulation?.gravillons1.quantite || ""}</td>
                    <td className="px-2 py-1">{echantillon.formulation?.gravillons1.producteur_nom || ""}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1 font-bold">Gravier 2</td>
                    <td className="border-r border-black px-2 py-1 text-center">{echantillon.formulation?.gravier2.produit_nom || ""}</td>
                    <td className="border-r border-black px-2 py-1 text-center">{echantillon.formulation?.gravier2.quantite || ""}</td>
                    <td className="px-2 py-1">{echantillon.formulation?.gravier2.producteur_nom || ""}</td>
                  </tr>
                  <tr>
                    <td className="border-r border-black px-2 py-1 font-bold">Gravier 3</td>
                    <td className="border-r border-black px-2 py-1 text-center">{echantillon.formulation?.gravier3.produit_nom || ""}</td>
                    <td className="border-r border-black px-2 py-1 text-center">{echantillon.formulation?.gravier3.quantite || ""}</td>
                    <td className="px-2 py-1">{echantillon.formulation?.gravier3.producteur_nom || ""}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Affaissement (ouvrabilité) */}
            <div className="border border-black mb-3">
              <div className="flex text-xs">
                <div className="border-r border-black px-2 py-1 font-bold" style={{ width: "40%" }}>
                  Affaissement (ouvrabilité) en cm
                </div>
                <div className={`border-r border-black px-2 py-1 text-center ${affaissement.ferme ? "bg-gray-300" : ""}`} style={{ width: "15%" }}>
                  <div className="flex items-center justify-center gap-1">
                    <span className={`inline-block w-3 h-3 border border-black ${affaissement.ferme ? "bg-black" : ""}`}></span>
                    <span className="font-bold">Ferme</span>
                  </div>
                  <div>0 à 4</div>
                </div>
                <div className={`border-r border-black px-2 py-1 text-center ${affaissement.plastique ? "bg-gray-300" : ""}`} style={{ width: "15%" }}>
                  <div className="flex items-center justify-center gap-1">
                    <span className={`inline-block w-3 h-3 border border-black ${affaissement.plastique ? "bg-black" : ""}`}></span>
                    <span className="font-bold">Plastique</span>
                  </div>
                  <div>5 à 9</div>
                </div>
                <div className={`border-r border-black px-2 py-1 text-center ${affaissement.tresPlas ? "bg-gray-300" : ""}`} style={{ width: "15%" }}>
                  <div className="flex items-center justify-center gap-1">
                    <span className={`inline-block w-3 h-3 border border-black ${affaissement.tresPlas ? "bg-black" : ""}`}></span>
                    <span className="font-bold">Très Plas.</span>
                  </div>
                  <div>10 à 15</div>
                </div>
                <div className={`px-2 py-1 text-center ${affaissement.fluide ? "bg-gray-300" : ""}`} style={{ width: "15%" }}>
                  <div className="flex items-center justify-center gap-1">
                    <span className={`inline-block w-3 h-3 border border-black ${affaissement.fluide ? "bg-black" : ""}`}></span>
                    <span className="font-bold">Fluide</span>
                  </div>
                  <div>≥ 16</div>
                </div>
              </div>
            </div>

            {/* Éprouvettes confectionnées par */}
            <div className="border border-black mb-3 text-xs">
              <div className="px-2 py-2">
                <span className="font-bold">Éprouvettes confectionnées par (Nom) & qualification :</span>
                <span className="ml-2">
                  {echantillon.operateur_nom}
                  {echantillon.operateur_poste && ` - ${echantillon.operateur_poste}`}
                </span>
              </div>
            </div>

            {/* Conservation des éprouvettes */}
            <div className="border border-black mb-3">
              <div className="bg-gray-100 px-2 py-1 text-center font-bold text-xs border-b border-black">
                Conservation des éprouvettes avant remise au LABORATOIRE
              </div>
              <div className="flex text-xs">
                <div className={`flex-1 border-r border-black px-2 py-2 text-center ${conservation.ambient ? "bg-gray-300" : ""}`}>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`inline-block w-3 h-3 border border-black ${conservation.ambient ? "bg-black" : ""}`}></span>
                    <span>À température Ambiante</span>
                  </div>
                </div>
                <div className={`flex-1 border-r border-black px-2 py-2 text-center ${conservation.eau20 ? "bg-gray-300" : ""}`}>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`inline-block w-3 h-3 border border-black ${conservation.eau20 ? "bg-black" : ""}`}></span>
                    <span>Sous eau à 20°C</span>
                  </div>
                </div>
                <div className={`flex-1 px-2 py-2 text-center ${conservation.humide ? "bg-gray-300" : ""}`}>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`inline-block w-3 h-3 border border-black ${conservation.humide ? "bg-black" : ""}`}></span>
                    <span>Sous couverture Humide</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Échantillonnage et Prélèvement reconnu EXACT */}
            <div className="border border-black mb-3">
              <div className="bg-gray-100 px-2 py-1 text-center font-bold text-xs border-b border-black">
                Échantillonnage et Prélèvement reconnu EXACT
              </div>
              <div className="flex text-xs">
                <div className="flex-1 border-r border-black p-3">
                  <div className="font-bold mb-2">L'Entrepreneur</div>
                  <div className="text-gray-600">Nom, Cachet et Signature</div>
                  <div className="h-16"></div>
                </div>
                <div className="flex-1 p-3">
                  <div className="font-bold mb-2">Le Bureau d'études Chargé du suivi</div>
                  <div className="text-gray-600">Nom, Cachet et Signature</div>
                  <div className="h-16"></div>
                </div>
              </div>
            </div>

            {/* Remis au LABORATOIRE */}
            <div className="border border-black mb-4 text-xs">
              <div className="flex items-center px-2 py-2">
                <span className="font-bold">Remis au LABORATOIRE</span>
                <span className="flex-1 border-b border-black mx-4"></span>
                <span className="font-bold">Par</span>
                <span className="flex-1 border-b border-black mx-4"></span>
                <span className="font-bold">Le</span>
                <span className="w-24 border-b border-black ml-4"></span>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-black pt-2 text-center">
              <p className="text-xs italic">
                Le P.V. d'écrasement du LABORATOIRE doit obligatoirement se référer et mentionner la codification
              </p>
              <p className="text-xs italic font-bold">
                Et la reconnaître dans son P.V. d'essai
              </p>
            </div>

            {/* VERSO marker */}
            <div className="text-right text-xs mt-4 text-gray-500">
              VERSO
            </div>
          </div>
        </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #bulletin-content, #bulletin-content * {
            visibility: visible;
          }
          #bulletin-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
          }
        }
      `}</style>
    </div>
  );
};

export default SamplingBulletin;
