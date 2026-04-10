import { ArrowLeft, Printer, Download, ChevronDown, FileText, Target, Settings, ListOrdered, Calculator, ClipboardList } from "lucide-react";
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
    id: "limites-atterberg",
    title: "Limites d'Atterberg",
    normeNumber: "NF P 94-051",
    domaine: "Cette norme définit les méthodes de détermination des limites de liquidité et de plasticité des sols fins. Elle s'applique aux sols dont les éléments passent au tamis de 400 µm.",
    principe: "Les limites d'Atterberg définissent les teneurs en eau correspondant aux changements d'état du sol. La limite de liquidité (WL) est déterminée à la coupelle de Casagrande ou au cône de pénétration. La limite de plasticité (WP) est la teneur en eau pour laquelle un rouleau de sol de 3 mm se fissure.",
    appareillage: [
      "Appareil de Casagrande avec coupelle normalisée",
      "Cône de pénétration (80 g, angle 30°) avec support",
      "Plaque de marbre ou verre dépoli",
      "Outil à rainurer (outil de Casagrande)",
      "Spatule, couteau",
      "Capsules de pesée, étuve à 105°C",
      "Balance de précision (0,01 g)"
    ],
    modeOperatoire: [
      "Préparer la pâte de sol en la malaxant avec de l'eau distillée",
      "Limite de liquidité (Casagrande) : placer la pâte dans la coupelle, tracer une rainure",
      "Effectuer des chocs à raison de 2 coups/seconde jusqu'à fermeture de la rainure sur 1 cm",
      "Noter le nombre de coups N et la teneur en eau correspondante",
      "Répéter pour 4 points entre 15 et 35 coups",
      "Limite de plasticité : rouler une boulette de sol sur la plaque de marbre",
      "Former un rouleau de 3 mm de diamètre ; noter la teneur en eau quand il se fissure",
      "Calculer l'indice de plasticité IP = WL - WP"
    ],
    expression: "WL = teneur en eau à 25 coups (Casagrande) ou à 17 mm de pénétration (cône). WP = teneur en eau au rouleau de 3 mm. IP = WL - WP. Classification : IP < 7 faiblement plastique, 7-17 moyennement plastique, > 17 très plastique."
  },
  {
    id: "granulometrie-sol",
    title: "Analyse Granulométrique des Sols",
    normeNumber: "NF P 94-056 / NF P 94-057",
    domaine: "Ces normes définissent les méthodes d'analyse granulométrique des sols par tamisage (> 80 µm) et par sédimentométrie (< 80 µm). Elles permettent de tracer la courbe granulométrique complète.",
    principe: "Le tamisage sépare les particules selon leur taille à travers une série de tamis normalisés. La sédimentométrie utilise la loi de Stokes pour déterminer la distribution des particules fines par mesure de la densité d'une suspension.",
    appareillage: [
      "Série de tamis normalisés (80 mm à 0,08 mm)",
      "Tamiseuse mécanique",
      "Hydromètre (densimètre) gradué",
      "Éprouvette de sédimentation de 1000 ml",
      "Défloculant (hexamétaphosphate de sodium)",
      "Étuve à 105°C, balance de précision",
      "Chronomètre, thermomètre"
    ],
    modeOperatoire: [
      "Sécher l'échantillon et peser la masse totale",
      "Tamiser par voie humide au tamis de 80 µm",
      "Sécher le refus et tamiser sur la colonne de tamis",
      "Peser les refus cumulés sur chaque tamis",
      "Pour la fraction fine : préparer une suspension avec défloculant",
      "Effectuer les lectures au densimètre à 0.5, 1, 2, 5, 10, 20, 40, 80, 240 min",
      "Calculer les pourcentages de passants et tracer la courbe",
      "Déterminer les coefficients Cu et Cc"
    ],
    expression: "Pourcentage de passants = (masse passant / masse totale) × 100. Cu = D60/D10 (coefficient d'uniformité). Cc = D30²/(D60 × D10) (coefficient de courbure). Sol bien gradué si Cu > 4 (graviers) ou Cu > 6 (sables) et 1 < Cc < 3."
  },
  {
    id: "teneur-eau-sol",
    title: "Teneur en Eau des Sols",
    normeNumber: "NF P 94-050",
    domaine: "Cette norme définit la méthode de détermination de la teneur en eau pondérale des sols par étuvage. Elle s'applique à tous les types de sols naturels ou reconstitués.",
    principe: "La teneur en eau est le rapport de la masse d'eau contenue dans un échantillon de sol à la masse de l'échantillon sec. Elle est déterminée par pesée avant et après passage à l'étuve à 105°C.",
    appareillage: [
      "Étuve ventilée réglée à 105 ± 5°C",
      "Balance de précision (0,01 g pour masses < 100 g)",
      "Capsules de pesée avec couvercle",
      "Dessiccateur avec gel de silice",
      "Spatule"
    ],
    modeOperatoire: [
      "Peser la capsule vide (Mc)",
      "Placer l'échantillon humide dans la capsule et peser (Mh)",
      "Placer la capsule ouverte dans l'étuve à 105°C",
      "Sécher jusqu'à masse constante (24h minimum)",
      "Sortir et placer dans le dessiccateur jusqu'à refroidissement",
      "Peser la capsule avec sol sec (Ms)"
    ],
    expression: "w = [(Mh - Ms) / (Ms - Mc)] × 100 (%). La teneur en eau est exprimée en pourcentage. Précision : ± 0,1% pour les sols fins, ± 0,5% pour les sols grossiers. Masse minimale d'échantillon : 50 g pour sols fins, 500 g pour sols grossiers."
  },
  {
    id: "classification-sol",
    title: "Classification des Sols",
    normeNumber: "NF P 11-300 (GTR)",
    domaine: "Cette norme définit la classification des matériaux utilisables dans la construction de remblais et de couches de forme. Elle s'applique aux sols naturels et aux matériaux rocheux.",
    principe: "La classification GTR est basée sur la nature des sols (granulométrie, argilosité) et leur état hydrique. Les sols sont classés en catégories (A, B, C, D, R) puis sous-catégories selon leurs propriétés.",
    appareillage: [
      "Ensemble de tamis normalisés",
      "Appareil de Casagrande ou cône de pénétration",
      "Appareillage pour essai au bleu de méthylène",
      "Étuve, balances de précision",
      "Appareillage pour essai Proctor Normal",
      "Appareillage pour essai CBR immédiat"
    ],
    modeOperatoire: [
      "Déterminer la granulométrie complète du sol",
      "Mesurer le Dmax et le pourcentage de passant à 80 µm et 2 mm",
      "Déterminer les limites d'Atterberg (WL, IP) ou la VBS",
      "Classer selon la nature : A (sols fins), B (sols sableux/graveleux), C (sols à éléments grossiers), D (sols insensibles à l'eau)",
      "Déterminer l'état hydrique : très humide (th), humide (h), moyen (m), sec (s), très sec (ts)",
      "Identifier la sous-catégorie (A1-A4, B1-B6, C1-C2, D1-D3)",
      "Consulter les tableaux de conditions d'utilisation en remblai et couche de forme"
    ],
    expression: "Classification en fonction du Dmax, % passant 80 µm, % passant 2 mm, VBS ou IP. Exemple : A1 = sol fin peu plastique (IP ≤ 12), A2 = sol fin moyennement plastique (12 < IP ≤ 25). L'état hydrique conditionne les conditions de mise en œuvre."
  }
];

const IdentificationNormes = () => {
  const navigate = useNavigate();
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handlePrint = (norme: NormeData) => {
    const printContent = `
      <!DOCTYPE html><html><head><title>${norme.title} - ${norme.normeNumber}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;line-height:1.6}h1{color:#1a365d;border-bottom:2px solid #0284c7;padding-bottom:10px}.section{margin:20px 0;padding:15px;background:#f0f9ff;border-radius:8px}.section-title{font-weight:bold;color:#2d3748;margin-bottom:10px;display:flex;align-items:center;gap:8px}.section-number{background:#0284c7;color:white;padding:2px 8px;border-radius:4px;font-size:12px}ul,ol{margin:10px 0;padding-left:25px}li{margin:8px 0}.header{display:flex;justify-content:space-between;margin-bottom:30px}.norme-badge{background:#f0f9ff;color:#0369a1;padding:5px 15px;border-radius:20px;font-weight:bold}</style></head><body>
      <div class="header"><h1>${norme.title}</h1><span class="norme-badge">${norme.normeNumber}</span></div>
      <div class="section"><div class="section-title"><span class="section-number">1</span> Domaine d'application</div><p>${norme.domaine}</p></div>
      <div class="section"><div class="section-title"><span class="section-number">2</span> Principe de l'essai</div><p>${norme.principe}</p></div>
      <div class="section"><div class="section-title"><span class="section-number">3</span> Appareillage</div><ul>${norme.appareillage.map(i => `<li>${i}</li>`).join('')}</ul></div>
      <div class="section"><div class="section-title"><span class="section-number">4</span> Mode opératoire</div><ol>${norme.modeOperatoire.map(s => `<li>${s}</li>`).join('')}</ol></div>
      <div class="section"><div class="section-title"><span class="section-number">5</span> Expression des résultats</div><p>${norme.expression}</p></div>
      </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(printContent); w.document.close(); w.print(); }
  };

  const handleDownloadPDF = (norme: NormeData) => {
    const pdf = new jsPDF();
    const margin = 20;
    const maxWidth = pdf.internal.pageSize.getWidth() - 2 * margin;
    let y = 20;
    pdf.setFontSize(18); pdf.setTextColor(2, 132, 199); pdf.text(norme.title, margin, y); y += 10;
    pdf.setFontSize(12); pdf.setTextColor(3, 105, 161); pdf.text(norme.normeNumber, margin, y); y += 15;
    const addSection = (num: string, title: string, content: string | string[], isList = false) => {
      if (y > 250) { pdf.addPage(); y = 20; }
      pdf.setFontSize(12); pdf.setTextColor(45, 55, 72); pdf.setFont("helvetica", "bold");
      pdf.text(`${num}. ${title}`, margin, y); y += 8;
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(10); pdf.setTextColor(74, 85, 104);
      if (isList && Array.isArray(content)) {
        content.forEach((item, i) => { if (y > 270) { pdf.addPage(); y = 20; } const lines = pdf.splitTextToSize(`${i+1}. ${item}`, maxWidth-10); pdf.text(lines, margin+5, y); y += lines.length*5+3; });
      } else { const lines = pdf.splitTextToSize(content as string, maxWidth); lines.forEach((line: string) => { if (y > 270) { pdf.addPage(); y = 20; } pdf.text(line, margin, y); y += 6; }); }
      y += 8;
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
      <EssaiBreadcrumb items={[
        { label: "Géotechnique", path: "/essais/geotechnique" },
        { label: "Identification", path: "/essais/geotechnique/identification" },
        { label: "Normes" }
      ]} />
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/essais/geotechnique/identification")} className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Normes <span className="text-primary text-glow">Essais d'Identification</span>
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 ml-14">Références normatives et modes opératoires des essais d'identification des sols</p>
      </div>
      <div className="space-y-4">
        {normesData.map((norme) => (
          <Collapsible key={norme.id} open={openItems.includes(norme.id)} onOpenChange={() => toggleItem(norme.id)}>
            <div className="border border-border/50 rounded-xl bg-card overflow-hidden">
              <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-sky-500" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">{norme.title}</h3>
                    <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{norme.normeNumber}</span>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${openItems.includes(norme.id) ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-6 pb-6 space-y-6 border-t border-border/50 pt-6">
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" size="sm" onClick={() => handlePrint(norme)}><Printer className="h-4 w-4 mr-2" />Imprimer</Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(norme)}><Download className="h-4 w-4 mr-2" />Télécharger PDF</Button>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2"><span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">1</span><Target className="h-4 w-4 text-primary" /><span className="font-semibold">Domaine d'application</span></div>
                      <p className="text-sm text-muted-foreground">{norme.domaine}</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2"><span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">2</span><FileText className="h-4 w-4 text-primary" /><span className="font-semibold">Principe de l'essai</span></div>
                      <p className="text-sm text-muted-foreground">{norme.principe}</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2"><span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">3</span><Settings className="h-4 w-4 text-primary" /><span className="font-semibold">Appareillage</span></div>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-4">{norme.appareillage.map((item, idx) => <li key={idx} className="list-disc">{item}</li>)}</ul>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2"><span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">4</span><ListOrdered className="h-4 w-4 text-primary" /><span className="font-semibold">Mode opératoire</span></div>
                      <ol className="text-sm text-muted-foreground space-y-2 ml-4">{norme.modeOperatoire.map((step, idx) => <li key={idx} className="list-decimal">{step}</li>)}</ol>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2"><span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">5</span><Calculator className="h-4 w-4 text-primary" /><span className="font-semibold">Expression des résultats</span></div>
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

export default IdentificationNormes;
