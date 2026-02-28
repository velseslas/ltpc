import { ArrowLeft, Printer, Download, ChevronDown, FileText, Target, Settings, ListOrdered, Calculator } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import jsPDF from "jspdf";

interface NormeData {
  id: string;
  title: string;
  normeNumber: string;
  domaine: string;
  principe: string;
  appareillage: string[];
  modeOperatoire: string[];
  expression: string;
}

const normesData: NormeData[] = [
  {
    id: "carottage",
    title: "Carottage sur Béton",
    normeNumber: "NF EN 12504-1",
    domaine: "Cette norme spécifie une méthode de prélèvement de carottes de béton durci sur des structures existantes et de préparation des éprouvettes pour les essais de résistance à la compression.",
    principe: "Une carotte cylindrique est prélevée dans le béton durci à l'aide d'un carottier équipé d'une couronne diamantée. L'éprouvette obtenue est ensuite préparée et testée en compression.",
    appareillage: [
      "Carottier à couronne diamantée refroidi à l'eau",
      "Diamètres standards : 50, 75, 100, 150 mm",
      "Scie diamantée pour recépage des extrémités",
      "Rectifieuse ou équipement de surfaçage",
      "Comparateur pour vérification de la planéité",
      "Détecteur d'armatures (pachomètre)"
    ],
    modeOperatoire: [
      "Localiser et marquer la zone de prélèvement en évitant les armatures",
      "Fixer solidement le carottier perpendiculairement à la surface",
      "Effectuer le carottage avec refroidissement à l'eau",
      "Extraire la carotte avec précaution",
      "Identifier et orienter la carotte (face coffrée, direction du coulage)",
      "Recéper les extrémités à la scie diamantée",
      "Surfacer ou rectifier les faces d'appui",
      "Vérifier le rapport L/D (entre 1,0 et 2,0)",
      "Conserver les carottes dans les conditions prescrites"
    ],
    expression: "La résistance mesurée sur carotte est corrigée par un coefficient tenant compte du rapport L/D. Pour L/D < 2 : fc,cyl = fc,carotte × k où k varie de 0,87 à 1,0 selon le rapport L/D. La résistance équivalente cube est : fc,cube = fc,cyl / 0,8."
  },
  {
    id: "arrachement",
    title: "Essai d'Arrachement",
    normeNumber: "NF EN 12504-3",
    domaine: "Cette norme décrit une méthode d'essai semi-destructif pour évaluer la résistance du béton in situ par arrachement d'un insert préalablement scellé ou coulé dans le béton.",
    principe: "Un insert métallique est soit scellé dans un trou foré, soit coulé avec le béton. Une force de traction est appliquée sur l'insert jusqu'à arrachement d'un cône de béton. La force maximale est corrélée à la résistance du béton.",
    appareillage: [
      "Inserts d'arrachement normalisés (type Lok-test ou équivalent)",
      "Appareil d'arrachement hydraulique avec manomètre",
      "Foreuse avec couronne diamantée pour inserts post-scellés",
      "Résine de scellement à expansion contrôlée",
      "Bague d'appui (contre-réaction)",
      "Calibreur de force"
    ],
    modeOperatoire: [
      "Choisir l'emplacement de l'essai (éviter armatures et joints)",
      "Pour insert post-scellé : forer un trou de 18 mm de diamètre",
      "Nettoyer le trou à l'air comprimé",
      "Sceller l'insert avec la résine appropriée",
      "Attendre le durcissement complet de la résine (selon fabricant)",
      "Positionner l'appareil d'arrachement et la bague d'appui",
      "Appliquer la force de traction de manière continue",
      "Enregistrer la force maximale à la rupture",
      "Examiner le cône de rupture et mesurer sa profondeur"
    ],
    expression: "La force d'arrachement F (kN) est convertie en résistance équivalente fc par une courbe de corrélation établie pour le type d'insert utilisé. La résistance estimée est : fc = a × F + b où a et b sont les coefficients de corrélation. Réaliser au moins 6 essais par zone."
  },
  {
    id: "petrographique",
    title: "Analyse Pétrographique",
    normeNumber: "NF EN 12407",
    domaine: "Cette norme décrit les méthodes d'examen pétrographique du béton durci pour identifier les constituants, les pathologies et les caractéristiques de la microstructure.",
    principe: "Des échantillons de béton sont prélevés et préparés sous forme de lames minces ou de surfaces polies. L'examen au microscope permet d'identifier les granulats, le ciment, les additions, les fissures, et les produits de réaction.",
    appareillage: [
      "Microscope polarisant (grossissement 25x à 400x)",
      "Équipement de préparation des lames minces (30 µm)",
      "Polisseuse et abrasifs de différentes granulométries",
      "Résine d'imprégnation fluorescente",
      "Microscope électronique à balayage (MEB) optionnel",
      "Analyseur d'images"
    ],
    modeOperatoire: [
      "Prélever des échantillons représentatifs (carottes ou fragments)",
      "Découper les échantillons selon les plans d'observation souhaités",
      "Imprégner sous vide avec une résine fluorescente si nécessaire",
      "Réaliser les lames minces de 30 µm d'épaisseur",
      "Examiner au microscope en lumière naturelle et polarisée",
      "Identifier les phases minérales et les textures",
      "Rechercher les pathologies (alcali-réaction, carbonatation, etc.)",
      "Photographier et documenter les observations",
      "Rédiger le rapport avec interprétation des résultats"
    ],
    expression: "Le rapport d'analyse comprend : identification des granulats (nature, forme, taille), description de la pâte de ciment (porosité, hydratation), présence de fissures et leur origine, identification des pathologies (ettringite différée, alcali-réaction, carbonatation), estimation de la qualité générale du béton."
  }
];

const DestructifNormes = () => {
  const navigate = useNavigate();
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handlePrint = (norme: NormeData) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${norme.title} - ${norme.normeNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
            h1 { color: #1a365d; border-bottom: 2px solid #e53e3e; padding-bottom: 10px; }
            h2 { color: #c53030; margin-top: 25px; }
            .section { margin: 20px 0; padding: 15px; background: #fff5f5; border-radius: 8px; }
            .section-title { font-weight: bold; color: #2d3748; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
            .section-number { background: #e53e3e; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
            ul, ol { margin: 10px 0; padding-left: 25px; }
            li { margin: 8px 0; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .norme-badge { background: #fff5f5; color: #c53030; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${norme.title}</h1>
            <span class="norme-badge">${norme.normeNumber}</span>
          </div>
          
          <div class="section">
            <div class="section-title"><span class="section-number">1</span> Domaine d'application</div>
            <p>${norme.domaine}</p>
          </div>
          
          <div class="section">
            <div class="section-title"><span class="section-number">2</span> Principe de l'essai</div>
            <p>${norme.principe}</p>
          </div>
          
          <div class="section">
            <div class="section-title"><span class="section-number">3</span> Appareillage</div>
            <ul>
              ${norme.appareillage.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>
          
          <div class="section">
            <div class="section-title"><span class="section-number">4</span> Mode opératoire</div>
            <ol>
              ${norme.modeOperatoire.map(step => `<li>${step}</li>`).join('')}
            </ol>
          </div>
          
          <div class="section">
            <div class="section-title"><span class="section-number">5</span> Expression des résultats</div>
            <p>${norme.expression}</p>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadPDF = (norme: NormeData) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = 20;

    pdf.setFontSize(18);
    pdf.setTextColor(229, 62, 62);
    pdf.text(norme.title, margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.setTextColor(197, 48, 48);
    pdf.text(norme.normeNumber, margin, yPosition);
    yPosition += 15;

    const addSection = (number: string, title: string, content: string | string[], isList: boolean = false) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(12);
      pdf.setTextColor(45, 55, 72);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${number}. ${title}`, margin, yPosition);
      yPosition += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(74, 85, 104);

      if (isList && Array.isArray(content)) {
        content.forEach((item, index) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          const lines = pdf.splitTextToSize(`${index + 1}. ${item}`, maxWidth - 10);
          pdf.text(lines, margin + 5, yPosition);
          yPosition += lines.length * 5 + 3;
        });
      } else {
        const lines = pdf.splitTextToSize(content as string, maxWidth);
        lines.forEach((line: string) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, margin, yPosition);
          yPosition += 6;
        });
      }
      yPosition += 8;
    };

    addSection("1", "Domaine d'application", norme.domaine);
    addSection("2", "Principe de l'essai", norme.principe);
    addSection("3", "Appareillage", norme.appareillage, true);
    addSection("4", "Mode opératoire", norme.modeOperatoire, true);
    addSection("5", "Expression des résultats", norme.expression);

    pdf.save(`${norme.normeNumber.replace(/\s/g, '_')}_${norme.id}.pdf`);
  };

  return (
    <>
      <EssaiBreadcrumb 
        items={[
          { label: "Béton", path: "/essais/beton" },
          { label: "Destructif", path: "/essais/beton/destructif" },
          { label: "Normes" }
        ]} 
      />
      
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/essais/beton/destructif")}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Normes <span className="text-primary text-glow">Essais Destructifs</span>
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 ml-14">
          Références normatives et modes opératoires des essais destructifs
        </p>
      </div>

      <div className="space-y-4">
        {normesData.map((norme) => (
          <Collapsible
            key={norme.id}
            open={openItems.includes(norme.id)}
            onOpenChange={() => toggleItem(norme.id)}
          >
            <div className="border border-border/50 rounded-xl bg-card overflow-hidden">
              <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">{norme.title}</h3>
                    <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {norme.normeNumber}
                    </span>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${openItems.includes(norme.id) ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="px-6 pb-6 space-y-6 border-t border-border/50 pt-6">
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" size="sm" onClick={() => handlePrint(norme)}>
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimer
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(norme)}>
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger PDF
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">1</span>
                        <Target className="h-4 w-4 text-primary" />
                        <span className="font-semibold">Domaine d'application</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{norme.domaine}</p>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">2</span>
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-semibold">Principe de l'essai</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{norme.principe}</p>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">3</span>
                        <Settings className="h-4 w-4 text-primary" />
                        <span className="font-semibold">Appareillage</span>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                        {norme.appareillage.map((item, idx) => (
                          <li key={idx} className="list-disc">{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">4</span>
                        <ListOrdered className="h-4 w-4 text-primary" />
                        <span className="font-semibold">Mode opératoire</span>
                      </div>
                      <ol className="text-sm text-muted-foreground space-y-2 ml-4">
                        {norme.modeOperatoire.map((step, idx) => (
                          <li key={idx} className="list-decimal">{step}</li>
                        ))}
                      </ol>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">5</span>
                        <Calculator className="h-4 w-4 text-primary" />
                        <span className="font-semibold">Expression des résultats</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{norme.expression}</p>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>
    </>
  );
};

export default DestructifNormes;
