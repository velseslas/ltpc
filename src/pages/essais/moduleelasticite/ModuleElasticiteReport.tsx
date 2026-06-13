import { useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Printer, Download, Loader2 } from "lucide-react";
import ShareButton from "@/components/reports/ShareButton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { downloadReportAsPDF } from "@/lib/pdf";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useFormulationDetails } from "@/hooks/useFormulationDetails";
import { useEchantillonModuleElasticiteById } from "@/hooks/useEchantillonsModuleElasticite";

interface EprouvetteData {
  id: number;
  jour: number;
  dateEssai: string;
  poids: string;
  densite: string;
  moduleElasticite: string;
}

const ModuleElasticiteReport = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const reportRef = useRef<HTMLDivElement>(null);
  const { data: echantillon, isLoading } = useEchantillonModuleElasticiteById(id);
  const { data: entreprise } = useEntreprise();
  const { data: formulation } = useFormulationDetails(echantillon?.formulation_id);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    try {
      downloadReportAsPDF(`rapport-ME-${echantillon?.numero}`);
      toast.success("PDF téléchargé avec succès");
    } catch {
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!echantillon) {
    return <div className="text-center py-8 text-muted-foreground">Échantillon non trouvé</div>;
  }

  const resultats = echantillon.resultats as unknown as { eprouvettes: EprouvetteData[]; moyennes: Array<{ jour: number; moyenne: string | null }> } | null;
  const verificationUrl = `${window.location.origin}/verify/module-elasticite/${id}`;
  const sortedEprouvettes = resultats?.eprouvettes ? [...resultats.eprouvettes].sort((a, b) => a.jour - b.jour) : [];
  
  const groups: { jour: number; dateEssai: string; items: EprouvetteData[] }[] = [];
  sortedEprouvettes.forEach((ep) => {
    const existing = groups.find(g => g.jour === ep.jour);
    if (existing) existing.items.push(ep);
    else groups.push({ jour: ep.jour, dateEssai: ep.dateEssai, items: [ep] });
  });

  const totalRows = sortedEprouvettes.length;

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb items={[
        { label: "Béton", path: "/essais/beton" },
        { label: "Béton Durci", path: "/essais/beton/beton-durci" },
        { label: "Module d'Élasticité", path: "/essais/beton/beton-durci/module-elasticite" },
        { label: <><span className="text-primary">ME</span>-{String(echantillon.numero).padStart(3, "0")}</>, path: `/essais/beton/beton-durci/module-elasticite/${id}` },
        { label: "Rapport" }
      ]} />

      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50" onClick={() => navigate(`/essais/beton/beton-durci/module-elasticite/${id}`)}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-3xl font-display font-bold">Rapport - <span className="text-primary">ME-{String(echantillon.numero).padStart(3, "0")}</span></h1>
            <p className="text-muted-foreground mt-1">Module d'Élasticité</p>
          </div>
        </div>
        <div className="flex gap-2">
          <ShareButton />
          <Button variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Imprimer</Button>
          <Button onClick={handleDownloadPDF} className="gradient-primary text-primary-foreground"><Download className="h-4 w-4 mr-2" />Télécharger PDF</Button>
        </div>
      </div>

      <div ref={reportRef} data-ref="report" className="report-table bg-white p-8 rounded-lg border max-w-4xl mx-auto print:border-0 print:shadow-none print:p-0">
        <ReportHeader entreprise={entreprise} verificationUrl={verificationUrl} title="RAPPORT D'ESSAI DE MODULE D'ÉLASTICITÉ" subtitle="Détermination du module d'élasticité en compression - Norme NF EN 12390-13" />

        <div className="mb-6 mt-6">
          <h3 className="font-bold text-sm mb-2 underline text-black">Identification de l'échantillon</h3>
          <table className="identification-table w-full border-collapse border border-black text-sm">
            <tbody>
              <tr><td className="border border-black px-3 py-1.5 font-medium w-1/3 text-black">N° Échantillon</td><td className="border border-black px-3 py-1.5 text-black">ME-{String(echantillon.numero).padStart(3, "0")}</td></tr>
              <tr><td className="border border-black px-3 py-1.5 font-medium text-black">Client</td><td className="border border-black px-3 py-1.5 text-black">{echantillon.clients?.nom || "-"}</td></tr>
              <tr><td className="border border-black px-3 py-1.5 font-medium text-black">Chantier</td><td className="border border-black px-3 py-1.5 text-black">{echantillon.chantiers?.nom || "-"}</td></tr>
              {echantillon.essai_convenance ? (
                <tr><td className="border border-black px-3 py-1.5 font-medium text-black">Essai de convenance</td><td className="border border-black px-3 py-1.5 text-black">{echantillon.essai_convenance_details || "-"}</td></tr>
              ) : (<>
                <tr><td className="border border-black px-3 py-1.5 font-medium text-black">Ouvrage</td><td className="border border-black px-3 py-1.5 text-black">{echantillon.ouvrage || "-"}</td></tr>
                <tr><td className="border border-black px-3 py-1.5 font-medium text-black">Partie de l'ouvrage</td><td className="border border-black px-3 py-1.5 text-black">{echantillon.destination_beton || "-"}</td></tr>
              </>)}
              <tr><td className="border border-black px-3 py-1.5 font-medium text-black">Mode de conservation</td><td className="border border-black px-3 py-1.5 text-black">{echantillon.condition_cure || "-"}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="mb-6">
          <h3 className="font-bold text-sm mb-2 underline text-black">Formulation de béton</h3>
          <div className="mb-2 text-sm text-black">
            <span className="font-medium">Centrale à béton : </span>{echantillon.centrales_beton?.nom || "-"}
            <span className="mx-4">|</span>
            <span className="font-medium">Formulation : </span>{formulation?.nom || echantillon.formulations?.nom || "-"}
          </div>
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr>
                {["Ciment", "Eau", "Adjuvant", "Sable 1", "Sable 2", "Gravier 1", "Gravier 2", "Gravier 3"].map(h => (
                  <th key={h} className="border border-black px-2 py-1 text-center font-medium text-xs text-black">{h}</th>
                ))}
              </tr>
              <tr>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.ciment.producteur_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.eau.producteur_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.adjuvant.producteur_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.sable_concasse.producteur_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.sable_fin.producteur_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.gravillons1.producteur_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.gravier2.producteur_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.gravier3.producteur_nom || "-"}</th>
              </tr>
              <tr>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.ciment.produit_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.eau.produit_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.adjuvant.produit_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.sable_concasse.produit_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.sable_fin.produit_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.gravillons1.produit_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.gravier2.produit_nom || "-"}</th>
                <th className="border border-black px-2 py-1 text-center text-xs text-black font-normal">{formulation?.gravier3.produit_nom || "-"}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{formulation?.ciment.quantite ?? 0}</td>
                <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{formulation?.eau.quantite ?? 0}</td>
                <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{formulation?.adjuvant.quantite ?? 0}</td>
                <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{formulation?.sable_concasse.quantite ?? 0}</td>
                <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{formulation?.sable_fin.quantite ?? 0}</td>
                <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{formulation?.gravillons1.quantite ?? 0}</td>
                <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{formulation?.gravier2.quantite ?? 0}</td>
                <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{formulation?.gravier3.quantite ?? 0}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-6">
          <h3 className="font-bold text-sm mb-2 underline text-black">Résultats des essais</h3>
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr>
                <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">Date coulage</th>
                <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">Date d'essai</th>
                <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">Âge (jours)</th>
                <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">Poids (g)</th>
                <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">Densité (t/m³)</th>
                <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">Ec (GPa)</th>
                <th className="border border-black px-2 py-2 text-center font-medium text-sm text-black">Moy. Ec (GPa)</th>
              </tr>
            </thead>
            <tbody>
              {sortedEprouvettes.length > 0 ? (() => {
                let globalRowIndex = 0;
                return groups.map((group) => {
                  const modules = group.items.map(ep => parseFloat(ep.moduleElasticite)).filter(m => !isNaN(m) && m > 0);
                  const moyenneEc = modules.length > 0 ? (modules.reduce((a, b) => a + b, 0) / modules.length).toFixed(1) : "—";
                  return group.items.map((ep, idx) => {
                    const isFirst = globalRowIndex === 0;
                    globalRowIndex++;
                    return (
                      <tr key={`${group.jour}-${ep.id}`}>
                        {isFirst && <td rowSpan={totalRows} className="border border-black px-2 py-2 text-center text-sm align-middle text-black">{echantillon.date_coulage ? format(new Date(echantillon.date_coulage), "dd/MM/yyyy", { locale: fr }) : "—"}</td>}
                        {idx === 0 && (<>
                          <td rowSpan={group.items.length} className="border border-black px-2 py-2 text-center text-sm align-middle text-black">{format(new Date(group.dateEssai), "dd/MM/yyyy", { locale: fr })}</td>
                          <td rowSpan={group.items.length} className="border border-black px-2 py-2 text-center text-sm font-medium align-middle text-black">{group.jour}</td>
                        </>)}
                        <td className="border border-black px-2 py-2 text-center text-sm text-black">{ep.poids || "—"}</td>
                        <td className="border border-black px-2 py-2 text-center text-sm text-black">{ep.densite || "—"}</td>
                        <td className="border border-black px-2 py-2 text-center text-sm font-medium text-black">{ep.moduleElasticite || "—"}</td>
                        {idx === 0 && <td rowSpan={group.items.length} className="border border-black px-2 py-2 text-center text-sm font-bold align-middle text-black">{moyenneEc}</td>}
                      </tr>
                    );
                  });
                });
              })() : <tr><td colSpan={7} className="border border-black px-2 py-4 text-center text-sm text-black">Aucune donnée saisie</td></tr>}
            </tbody>
          </table>
        </div>

        {echantillon.observations && (
          <div className="mb-6"><h3 className="font-bold text-sm mb-2 underline text-black">Observations</h3><div className="border border-black px-3 py-2 text-sm text-black">{echantillon.observations}</div></div>
        )}

        <div className="mt-8 pt-4 border-t border-gray-300">
          <div className="flex justify-between items-end">
            <div className="text-sm text-black"><p>Le Technicien: {echantillon.intervenants ? `${echantillon.intervenants.prenom} ${echantillon.intervenants.nom}` : "_________________"}</p></div>
            <div className="text-center"><div className="min-h-16 flex flex-col items-center justify-end">{entreprise?.cachet_url ? <img src={entreprise.cachet_url} alt="Cachet" className="max-h-20 object-contain mb-1" /> : <p className="text-sm font-medium text-black">Signature et cachet</p>}</div></div>
          </div>
        </div>
      </div>

      <style>{`@media print { body * { visibility: hidden; } .print\\:hidden { display: none !important; } #root { padding: 0 !important; } }`}</style>
    </div>
  );
};

export default ModuleElasticiteReport;
