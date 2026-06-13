import { ArrowLeft, Printer, Download, ChevronDown, FileText, Target, Settings, ListOrdered, Calculator, ClipboardList } from "lucide-react";
import { downloadReportAsPDF } from "@/lib/pdf";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import FeuilleEssaiDialog from "@/components/essais/FeuilleEssaiDialog";

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
    id: "compression",
    title: "Résistance à la Compression",
    normeNumber: "NF EN 12390-3",
    domaine: "Cette norme spécifie une méthode de détermination de la résistance à la compression d'éprouvettes de béton durci. Elle s'applique aux éprouvettes moulées ou aux carottes prélevées sur des structures existantes.",
    principe: "L'éprouvette est soumise à une charge croissante jusqu'à rupture. La charge maximale atteinte est enregistrée et la résistance à la compression est calculée en divisant cette charge par la section transversale de l'éprouvette.",
    appareillage: [
      "Machine d'essai de compression conforme à la norme NF EN 12390-4",
      "Plateaux de compression avec surfaces planes et parallèles",
      "Balance de précision (± 0,1% de la masse)",
      "Pied à coulisse ou réglet (précision 0,5 mm)",
      "Rectifieuse pour surfaçage si nécessaire"
    ],
    modeOperatoire: [
      "Retirer l'éprouvette de son milieu de conservation et la laisser s'égoutter",
      "Mesurer les dimensions de l'éprouvette (diamètre ou côtés) à 0,5 mm près",
      "Peser l'éprouvette pour déterminer sa masse volumique",
      "Centrer l'éprouvette sur le plateau inférieur de la machine",
      "Appliquer la charge de manière continue et sans choc à une vitesse de 0,6 ± 0,2 MPa/s",
      "Enregistrer la charge maximale atteinte au moment de la rupture",
      "Noter le type de rupture selon les figures de la norme"
    ],
    expression: "fc = F / Ac où fc est la résistance à la compression (MPa), F la charge maximale (N), et Ac l'aire de la section transversale (mm²). Pour les cubes 150x150x150 mm : Ac = 22500 mm². Le résultat est arrondi à 0,1 MPa."
  },
  {
    id: "traction-fendage",
    title: "Traction par Fendage",
    normeNumber: "NF EN 12390-6",
    domaine: "Cette norme décrit une méthode pour déterminer la résistance à la traction par fendage d'éprouvettes de béton durci. Elle est applicable aux éprouvettes cylindriques ou cubiques.",
    principe: "Une charge de compression est appliquée le long de deux génératrices diamétralement opposées d'une éprouvette cylindrique, ce qui induit des contraintes de traction orthogonales à la direction de la charge appliquée, provoquant la rupture par fendage.",
    appareillage: [
      "Machine d'essai conforme à la norme NF EN 12390-4",
      "Dispositif de fendage avec bandes de chargement en contreplaqué",
      "Bandes de chargement : largeur 15 mm ± 1 mm, épaisseur 4 mm ± 1 mm",
      "Dispositif de centrage de l'éprouvette",
      "Pied à coulisse (précision 0,5 mm)"
    ],
    modeOperatoire: [
      "Mesurer le diamètre et la longueur de l'éprouvette cylindrique",
      "Tracer les génératrices diamétralement opposées sur les faces planes",
      "Positionner les bandes de chargement en contreplaqué",
      "Centrer l'éprouvette dans le dispositif de fendage",
      "Appliquer la charge de manière continue à une vitesse de 0,04 à 0,06 MPa/s",
      "Enregistrer la charge maximale à la rupture",
      "Examiner les surfaces de rupture"
    ],
    expression: "fct = 2F / (π × L × d) où fct est la résistance à la traction par fendage (MPa), F la charge maximale (N), L la longueur de l'éprouvette (mm), et d le diamètre (mm). Le résultat est arrondi à 0,05 MPa."
  },
  {
    id: "module-elasticite",
    title: "Module d'Élasticité",
    normeNumber: "NF EN 12390-13",
    domaine: "Cette norme spécifie une méthode de détermination du module d'élasticité sécant en compression du béton durci. Elle s'applique aux bétons de masse volumique normale et aux bétons lourds.",
    principe: "L'éprouvette est soumise à des cycles de chargement-déchargement dans le domaine élastique. Le module d'élasticité est déterminé à partir de la pente de la courbe contrainte-déformation dans la partie linéaire.",
    appareillage: [
      "Machine d'essai de compression conforme à NF EN 12390-4",
      "Extensomètres ou jauges de déformation (précision 10⁻⁶)",
      "Système d'acquisition de données",
      "Dispositif de centrage de l'éprouvette",
      "Comparateur ou LVDT pour mesure des déformations"
    ],
    modeOperatoire: [
      "Déterminer préalablement la résistance à la compression fc sur éprouvettes témoins",
      "Installer les extensomètres sur l'éprouvette (base de mesure ≥ 2/3 du diamètre)",
      "Effectuer 3 cycles de préchargement entre σb (0,5 MPa) et σa (fc/3)",
      "Appliquer le 4ème cycle en enregistrant contraintes et déformations",
      "Calculer le module sécant entre σb et σa",
      "Vérifier que l'écart entre les mesures des extensomètres est < 20%"
    ],
    expression: "Ec = (σa - σb) / (εa - εb) où Ec est le module d'élasticité (GPa), σa et σb les contraintes supérieure et inférieure (MPa), εa et εb les déformations correspondantes. Le résultat est arrondi à 0,1 GPa."
  },
  {
    id: "permeabilite",
    title: "Perméabilité à l'Eau",
    normeNumber: "NF EN 12390-8",
    domaine: "Cette norme décrit une méthode pour déterminer la profondeur de pénétration de l'eau sous pression dans le béton durci. Elle permet d'évaluer l'imperméabilité du béton.",
    principe: "Une pression d'eau est appliquée sur une face de l'éprouvette pendant une durée déterminée. Après essai, l'éprouvette est fendue et la profondeur maximale de pénétration de l'eau est mesurée.",
    appareillage: [
      "Cellule d'essai étanche avec joint d'étanchéité",
      "Système de mise en pression hydraulique (500 ± 50 kPa)",
      "Manomètre de précision",
      "Dispositif de fendage des éprouvettes",
      "Réglet gradué (précision 1 mm)"
    ],
    modeOperatoire: [
      "Préparer les éprouvettes (cubes ou cylindres) avec une face de coulage identifiée",
      "Installer l'éprouvette dans la cellule d'essai, face de coulage vers le haut",
      "Appliquer une pression de 500 ± 50 kPa pendant 72 ± 2 heures",
      "Retirer l'éprouvette et la fendre perpendiculairement à la face soumise à la pression",
      "Marquer le front de pénétration de l'eau visible sur la surface de rupture",
      "Mesurer la profondeur maximale de pénétration",
      "Répéter sur au moins 3 éprouvettes"
    ],
    expression: "Mesurer la profondeur maximale de pénétration Dmax en mm. Le béton est considéré imperméable si Dmax ≤ 50 mm (classe d'exposition XC) ou Dmax ≤ 30 mm (classes XD, XS, XF, XA). La moyenne des profondeurs est également calculée."
  }
];

const BetonDurciNormes = () => {
  const navigate = useNavigate();
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [printingNormeId, setPrintingNormeId] = useState<string | null>(null);
  const [feuilleNorme, setFeuilleNorme] = useState<NormeData | null>(null);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handlePrint = (norme: NormeData) => {
    setOpenItems(prev => prev.includes(norme.id) ? prev : [...prev, norme.id]);
    setPrintingNormeId(norme.id);
    setTimeout(() => { window.print(); setPrintingNormeId(null); }, 100);
  };

  const handleDownloadPDF = (norme: NormeData) => {
    setOpenItems(prev => prev.includes(norme.id) ? prev : [...prev, norme.id]);
    setPrintingNormeId(norme.id);
    setTimeout(() => {
      downloadReportAsPDF(`${norme.normeNumber.replace(/\s+/g, '_')}_${norme.id}`);
      setPrintingNormeId(null);
    }, 100);
  };

  return (
    <>
      <EssaiBreadcrumb 
        items={[
          { label: "Béton", path: "/essais/beton" },
          { label: "Béton Durci", path: "/essais/beton/beton-durci" },
          { label: "Normes et Feuilles d'essais" }
        ]} 
      />
      
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/essais/beton/beton-durci")}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Normes et Feuilles d'essais <span className="text-primary text-glow">Béton Durci</span>
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 ml-14">
          Références normatives et modes opératoires des essais sur béton durci
        </p>
      </div>

      <div className="space-y-4">
        {normesData.map((norme) => (
          <Collapsible
            key={norme.id}
            open={openItems.includes(norme.id)}
            onOpenChange={() => toggleItem(norme.id)}
          >
            <div data-ref={printingNormeId === norme.id ? "report" : undefined} className="border border-border/50 rounded-xl bg-card overflow-hidden">
              <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-purple-500" />
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
      <FeuilleEssaiDialog open={!!feuilleNorme} onOpenChange={() => setFeuilleNorme(null)} normeTitle={feuilleNorme?.title || ""} normeNumber={feuilleNorme?.normeNumber || ""} />
    </>
  );
};

export default BetonDurciNormes;
