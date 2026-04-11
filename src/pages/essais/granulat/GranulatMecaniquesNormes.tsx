import { ArrowLeft, Printer, Download, ChevronDown, FileText, Target, Settings, ListOrdered, Calculator, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import FeuilleEssaiDialog from "@/components/essais/FeuilleEssaiDialog";
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
    id: "los-angeles",
    title: "Essai Los Angeles",
    normeNumber: "NF EN 1097-2",
    domaine: "Cette norme spécifie la méthode de détermination de la résistance à la fragmentation par l'essai Los Angeles. Elle s'applique aux granulats de classes granulaires 10/14 ou 4/6,3 mm.",
    principe: "Un échantillon de granulats est placé dans un tambour rotatif avec des boulets en acier. La rotation provoque des chocs et de l'abrasion. La résistance est mesurée par le pourcentage de passants au tamis 1,6 mm après essai.",
    appareillage: [
      "Tambour Los Angeles (Ø 711 mm, L 508 mm)",
      "11 boulets en acier (masse totale 4690 g ± 25 g)",
      "Tamis 1,6 mm conformes à NF EN 933-2",
      "Balance (précision 1 g)",
      "Étuve ventilée à (110 ± 5)°C",
      "Bacs de récupération",
      "Chronomètre ou compteur de tours"
    ],
    modeOperatoire: [
      "Prélever et sécher l'échantillon à 110°C jusqu'à masse constante",
      "Préparer 5000 g de la classe granulaire 10/14 mm (ou 4/6,3 mm)",
      "Introduire les granulats et les boulets dans le tambour",
      "Fermer le tambour et effectuer 500 rotations à 31-33 tr/min",
      "Récupérer l'ensemble du contenu dans un bac",
      "Tamiser sur tamis 1,6 mm",
      "Peser le refus au tamis 1,6 mm (m)",
      "Nettoyer le tambour entre chaque essai"
    ],
    expression: "Coefficient Los Angeles LA = 100 × (5000 - m) / 5000 où m est la masse retenue au tamis 1,6 mm (g). Classification : LA ≤ 20 très bon, LA 20-30 bon, LA 30-40 moyen, LA > 40 faible. Catégories normalisées : LA15, LA20, LA25, LA30, LA35, LA40, LA50."
  },
  {
    id: "micro-deval",
    title: "Essai Micro-Deval",
    normeNumber: "NF EN 1097-1",
    domaine: "Cette norme spécifie la méthode de détermination de la résistance à l'usure par attrition humide (Micro-Deval). Elle s'applique aux granulats de classes 10/14 ou 4/6,3 mm.",
    principe: "Un échantillon de granulats est soumis à une usure par attrition dans un cylindre rotatif en présence de billes d'acier et d'eau. L'usure est évaluée par le pourcentage de passants au tamis 1,6 mm.",
    appareillage: [
      "Appareil Micro-Deval (4 cylindres Ø 200 mm, L 154 mm)",
      "5 kg de billes d'acier (Ø 10 mm) par cylindre",
      "Tamis 1,6 mm conformes à NF EN 933-2",
      "Balance (précision 1 g)",
      "Étuve ventilée à (110 ± 5)°C",
      "Éprouvette graduée de 2,5 L",
      "Chronomètre ou compteur de tours"
    ],
    modeOperatoire: [
      "Préparer 500 g de la classe granulaire (10/14 ou 4/6,3 mm) séchée",
      "Introduire les granulats, les billes et 2,5 L d'eau dans le cylindre",
      "Effectuer 12 000 rotations à 100 ± 5 tr/min (environ 2h)",
      "Récupérer le contenu et rincer à l'eau sur le tamis 1,6 mm",
      "Sécher le refus à 110°C jusqu'à masse constante",
      "Peser le refus au tamis 1,6 mm (m)",
      "Réaliser l'essai sur au moins 2 échantillons"
    ],
    expression: "Coefficient Micro-Deval MDE = 100 × (500 - m) / 500 où m est la masse sèche du refus au tamis 1,6 mm (g). Moyenne des 2 essais arrondie à l'entier. Classification : MDE ≤ 15 très bon, MDE 15-25 bon, MDE 25-35 moyen. Catégories : MDE10, MDE15, MDE20, MDE25, MDE35."
  },
  {
    id: "friabilite",
    title: "Friabilité des Sables",
    normeNumber: "NF P18-576",
    domaine: "Cette norme spécifie la méthode de détermination du coefficient de friabilité des sables. Elle permet d'évaluer la sensibilité d'un sable à l'attrition mécanique.",
    principe: "Un échantillon de sable est soumis à des chocs et à de l'abrasion dans un cylindre rotatif contenant des billes d'acier. Le coefficient de friabilité mesure l'aptitude du sable à produire des fines sous l'effet de ces sollicitations.",
    appareillage: [
      "Appareil de friabilité (cylindre Ø 200 mm, L 154 mm)",
      "Charge abrasive : 2500 g de billes d'acier Ø 15-16 mm",
      "Tamis 0,1 mm et 0,5 mm",
      "Balance (précision 0,1 g)",
      "Étuve à (105 ± 5)°C",
      "Chronomètre ou compteur de tours"
    ],
    modeOperatoire: [
      "Sécher l'échantillon à 105°C",
      "Prélever 500 g de sable 0/5 mm tamisé (retenir la fraction 0,2-2 mm)",
      "Introduire le sable et les billes dans le cylindre",
      "Effectuer 3000 rotations à 100 tr/min",
      "Récupérer le contenu et tamiser sur 0,1 mm",
      "Peser le passant au tamis 0,1 mm (p)",
      "Répéter l'essai deux fois"
    ],
    expression: "Coefficient de friabilité FS = 100 × p / 500 où p est la masse de passant au tamis 0,1 mm (g). Moyenne des essais à 1% près. Classification : FS ≤ 20 sable dur, FS 20-30 correct, FS 30-40 friable, FS > 40 très friable."
  },
  {
    id: "ecrasement",
    title: "Coefficient d'Écrasement",
    normeNumber: "NF P18-573",
    domaine: "Cette norme spécifie une méthode de détermination du coefficient d'écrasement des granulats. Elle s'applique aux gravillons et permet d'évaluer leur résistance à l'écrasement sous charge.",
    principe: "Un échantillon de granulats est placé dans un moule et soumis à une charge de compression. Le coefficient d'écrasement est le rapport de la masse des fines produites à la masse initiale.",
    appareillage: [
      "Moule cylindrique (Ø 100 mm ou 150 mm selon la taille)",
      "Piston de compression",
      "Presse hydraulique (capacité 400 kN minimum)",
      "Tamis de référence selon la classe granulaire",
      "Balance (précision 1 g)",
      "Étuve à (105 ± 5)°C"
    ],
    modeOperatoire: [
      "Sécher l'échantillon et prélever la classe granulaire requise",
      "Remplir le moule en trois couches avec damage",
      "Araser la surface et peser le contenu (M0)",
      "Placer le piston et appliquer une charge de 400 kN",
      "Maintenir la charge pendant 5 minutes",
      "Démouler et tamiser sur le tamis de référence",
      "Peser le passant au tamis (m)"
    ],
    expression: "Coefficient d'écrasement Ce = 100 × m / M0 où m est la masse du passant (g) et M0 la masse initiale (g). Classification : Ce ≤ 15 très bonne résistance, Ce 15-20 bonne, Ce 20-25 moyenne, Ce > 25 faible résistance à l'écrasement."
  }
];

const GranulatMecaniquesNormes = () => {
  const navigate = useNavigate();
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [feuilleNorme, setFeuilleNorme] = useState<NormeData | null>(null);

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
            h1 { color: #1a365d; border-bottom: 2px solid #e11d48; padding-bottom: 10px; }
            h2 { color: #be123c; margin-top: 25px; }
            .section { margin: 20px 0; padding: 15px; background: #fff1f2; border-radius: 8px; }
            .section-title { font-weight: bold; color: #2d3748; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
            .section-number { background: #e11d48; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
            ul, ol { margin: 10px 0; padding-left: 25px; }
            li { margin: 8px 0; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .norme-badge { background: #fff1f2; color: #be123c; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
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
    pdf.setTextColor(225, 29, 72);
    pdf.text(norme.title, margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.setTextColor(190, 18, 60);
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
          { label: "Granulat", path: "/essais/granulat" },
          { label: "Mécaniques", path: "/essais/granulat/mecaniques" },
          { label: "Normes" }
        ]} 
      />
      
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/essais/granulat/mecaniques")}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Normes et Feuilles d'essais <span className="text-primary text-glow">Essais Mécaniques</span>
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 ml-14">
          Références normatives et modes opératoires des essais mécaniques sur granulats
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
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-500/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-rose-500" />
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
                    <Button variant="outline" size="sm" onClick={() => setFeuilleNorme(norme)}>
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Feuille d'essai
                    </Button>
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
      <FeuilleEssaiDialog
        open={!!feuilleNorme}
        onOpenChange={(open) => !open && setFeuilleNorme(null)}
        normeTitle={feuilleNorme?.title || ""}
        normeNumber={feuilleNorme?.normeNumber || ""}
      />
    </>
  );
};

export default GranulatMecaniquesNormes;
