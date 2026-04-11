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
    id: "equivalent-sable",
    title: "Équivalent de Sable",
    normeNumber: "NF EN 933-8",
    domaine: "Cette norme spécifie une méthode de référence pour la détermination de l'équivalent de sable. Elle s'applique aux sables et aux fractions 0/2 mm des granulats.",
    principe: "Un échantillon de sable est agité dans une solution floculante. Après repos, les éléments argileux et fins restent en suspension tandis que le sable se dépose. Le rapport des hauteurs de sable et de floculat donne l'équivalent de sable.",
    appareillage: [
      "Éprouvettes cylindriques transparentes graduées (Ø 32 mm, H 430 mm)",
      "Tube laveur avec embout perforé",
      "Machine d'agitation (90 cycles en 30 secondes)",
      "Réservoir de solution lavante à niveau constant",
      "Piston taré à tête conique",
      "Règle graduée ou dispositif de lecture",
      "Entonnoir, spatule, chronomètre"
    ],
    modeOperatoire: [
      "Préparer la solution lavante (eau + chlorure de calcium + glycérine + formaldéhyde)",
      "Remplir l'éprouvette de solution lavante jusqu'au trait inférieur",
      "Verser l'échantillon de sable (120 g) à l'aide de l'entonnoir",
      "Laisser reposer 10 minutes pour humidification",
      "Boucher et agiter (90 cycles en 30 ± 1 s mécaniquement ou manuellement)",
      "Rincer les parois et remplir jusqu'au trait supérieur avec le tube laveur",
      "Laisser reposer exactement 20 minutes",
      "Mesurer h1 (hauteur totale) et h2 (hauteur du sable avec piston)"
    ],
    expression: "Équivalent de sable ES = 100 × h2 / h1 (%). ES visuel = 100 × h'2 / h1 où h'2 est la hauteur lue visuellement. Classification : ES > 80 = sable propre, 70-80 = légèrement argileux, 60-70 = argileux (béton normal), < 60 = très argileux."
  },
  {
    id: "bleu-methylene",
    title: "Bleu de Méthylène",
    normeNumber: "NF EN 933-9",
    domaine: "Cette norme spécifie la méthode de détermination de la valeur au bleu de méthylène des fines et du sable. Elle permet d'évaluer la nocivité des fines argileuses.",
    principe: "La valeur au bleu de méthylène représente la quantité de bleu de méthylène adsorbée par les surfaces des particules fines. Les argiles actives adsorbent plus de bleu que les fines inertes.",
    appareillage: [
      "Burette graduée (50 ou 100 ml)",
      "Solution de bleu de méthylène à 10 g/l ± 0,1 g/l",
      "Agitateur à ailettes (400-600 tr/min)",
      "Papier filtre sans cendres (vitesse filtration moyenne)",
      "Baguette de verre",
      "Chronomètre",
      "Balance (précision 0,1 g)"
    ],
    modeOperatoire: [
      "Prélever une masse d'échantillon selon la teneur en fines estimée",
      "Introduire l'échantillon dans le bécher avec 500 ml d'eau",
      "Mettre en agitation à vitesse constante",
      "Ajouter successivement des doses de 5 ml de solution de bleu",
      "Après chaque ajout, déposer une goutte sur le papier filtre",
      "Observer la formation ou non d'une auréole bleu clair",
      "Continuer jusqu'à apparition persistante de l'auréole (5 min)",
      "Noter le volume total V de solution utilisé"
    ],
    expression: "MB = V × 0,01 / M0 où MB est la valeur de bleu (g/kg), V le volume de solution (ml), M0 la masse sèche d'échantillon (g). MBf (valeur de bleu des fines) = MB / teneur en fines. Limites : MB ≤ 2 g/kg acceptable, MBf ≤ 10 g/kg pour fines non nocives."
  },
  {
    id: "matiere-organique",
    title: "Matière Organique",
    normeNumber: "NF EN 1744-1",
    domaine: "Cette norme décrit la méthode colorimétrique pour évaluer la présence de matière organique dans les sables. Elle permet de détecter les impuretés organiques potentiellement nocives.",
    principe: "Le sable est mis en contact avec une solution de soude caustique. Les matières organiques colorent la solution en jaune à brun. La couleur obtenue est comparée à une solution étalon.",
    appareillage: [
      "Éprouvettes en verre de 250 ml avec bouchon",
      "Solution de soude NaOH à 3%",
      "Solution étalon d'acide tannique",
      "Comparateur de couleurs Gardner ou visuel",
      "Balance (précision 0,1 g)",
      "Étuve à 105°C"
    ],
    modeOperatoire: [
      "Sécher l'échantillon à 105°C jusqu'à masse constante",
      "Remplir l'éprouvette de sable jusqu'au trait 130 ml",
      "Ajouter la solution de soude jusqu'au trait 200 ml",
      "Boucher hermétiquement et agiter vigoureusement",
      "Laisser reposer 24 heures à l'abri de la lumière",
      "Agiter de nouveau et laisser décanter",
      "Comparer la couleur du surnageant à la solution étalon"
    ],
    expression: "La couleur est classée de 0 (incolore) à 4 (brun foncé). Classe 0-1 : sable acceptable. Classe 2 : usage sous réserve d'essais complémentaires. Classe 3-4 : sable impropre aux bétons de structure. Alternative : essai sur mortier pour confirmer l'effet sur les résistances."
  }
];

const GranulatPropreteNormes = () => {
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
            h1 { color: #1a365d; border-bottom: 2px solid #0284c7; padding-bottom: 10px; }
            h2 { color: #0369a1; margin-top: 25px; }
            .section { margin: 20px 0; padding: 15px; background: #f0f9ff; border-radius: 8px; }
            .section-title { font-weight: bold; color: #2d3748; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
            .section-number { background: #0284c7; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
            ul, ol { margin: 10px 0; padding-left: 25px; }
            li { margin: 8px 0; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .norme-badge { background: #f0f9ff; color: #0369a1; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
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
    pdf.setTextColor(2, 132, 199);
    pdf.text(norme.title, margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.setTextColor(3, 105, 161);
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
          { label: "Propreté", path: "/essais/granulat/proprete" },
          { label: "Normes et Feuilles d'essais" }
        ]} 
      />
      
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/essais/granulat/proprete")}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Normes et Feuilles d'essais <span className="text-primary text-glow">Essais de Propreté</span>
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 ml-14">
          Références normatives et modes opératoires des essais de propreté sur granulats
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
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-sky-500" />
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

export default GranulatPropreteNormes;
