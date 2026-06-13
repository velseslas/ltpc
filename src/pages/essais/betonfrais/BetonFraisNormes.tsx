import { useState, useRef } from "react";
import { downloadReportAsPDF } from "@/lib/pdf";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Printer, FileText, ChevronDown, ChevronUp, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import FeuilleEssaiDialog from "@/components/essais/FeuilleEssaiDialog";

interface NormeData {
  id: string;
  title: string;
  normeNumber: string;
  normeFull: string;
  domaine: string;
  principe: string;
  appareillage: string[];
  modeOperatoire: string[];
  expression: string;
}

const normesData: NormeData[] = [
  {
    id: "affaissement",
    title: "Essai d'Affaissement",
    normeNumber: "NF EN 12350-2",
    normeFull: "Essais pour béton frais - Partie 2 : Essai d'affaissement",
    domaine: "Cette norme européenne spécifie une méthode de détermination de l'affaissement d'un béton frais. Elle est applicable aux bétons compactables présentant un affaissement compris entre 10 mm et 210 mm.",
    principe: "L'essai consiste à remplir un moule tronconique de dimensions normalisées avec du béton frais, à démouler et à mesurer l'affaissement du béton par rapport à la hauteur initiale du moule.",
    appareillage: [
      "Moule tronconique (cône d'Abrams) : hauteur 300 mm, diamètre base 200 mm, diamètre sommet 100 mm",
      "Plaque de base rigide, plane et non absorbante",
      "Tige de piquage : barre d'acier lisse de 16 mm de diamètre, 600 mm de long, extrémités arrondies",
      "Règle graduée pour mesurer l'affaissement",
      "Portique de mesure (optionnel)"
    ],
    modeOperatoire: [
      "Humidifier le moule (cône d'Abrams) et la plaque de base.",
      "Placer le moule sur la plaque horizontale et le maintenir fermement avec les pieds.",
      "Remplir le moule en trois couches d'égale hauteur (environ 100 mm chacune).",
      "Compacter chaque couche avec 25 coups de tige de piquage répartis uniformément.",
      "Araser la surface supérieure avec la tige par un mouvement de sciage et de roulement.",
      "Retirer le moule verticalement en 5 à 10 secondes, sans mouvement latéral ni torsion.",
      "Mesurer l'affaissement immédiatement (différence entre la hauteur du moule et le point le plus haut du béton).",
      "Noter le type d'affaissement : vrai (symétrique), cisaillé (demi-cône glissé) ou affaissé (effondrement)."
    ],
    expression: "L'affaissement est exprimé en millimètres, arrondi aux 10 mm les plus proches. Le type d'affaissement doit être noté. En cas d'affaissement cisaillé, l'essai doit être recommencé."
  },
  {
    id: "temperature",
    title: "Essai de Température",
    normeNumber: "NF EN 12350-1",
    normeFull: "Essais pour béton frais - Partie 1 : Échantillonnage et essais sur site",
    domaine: "Cette norme définit les méthodes de prélèvement et d'essai du béton frais, y compris la mesure de la température. Elle s'applique à tous les bétons de masse volumique normale et lourds.",
    principe: "La température du béton frais est mesurée en insérant un capteur de température dans le béton immédiatement après le malaxage ou la livraison, afin de vérifier la conformité aux spécifications.",
    appareillage: [
      "Thermomètre ou sonde de température avec précision de ±1°C",
      "Plage de mesure adaptée (généralement de -10°C à +60°C)",
      "Longueur de sonde suffisante pour une immersion d'au moins 75 mm"
    ],
    modeOperatoire: [
      "Utiliser un thermomètre ou une sonde de température précis à ±1°C.",
      "Introduire le capteur dans le béton frais à une profondeur minimale de 75 mm.",
      "S'assurer que le capteur est entouré de béton sur tous les côtés.",
      "Laisser le thermomètre en place jusqu'à stabilisation de la lecture (environ 2 minutes).",
      "Effectuer la mesure dans les 5 minutes suivant le prélèvement.",
      "Noter également la température ambiante au moment de la mesure.",
      "Enregistrer la température du béton au degré près."
    ],
    expression: "La température est exprimée en degrés Celsius (°C), arrondie au degré le plus proche. La température ambiante doit également être consignée."
  },
  {
    id: "temps-prise",
    title: "Temps de Prise sur Site",
    normeNumber: "NF EN 480-2",
    normeFull: "Adjuvants pour béton, mortier et coulis - Méthodes d'essai - Partie 2 : Détermination du temps de prise",
    domaine: "Cette norme spécifie une méthode de détermination du temps de prise du mortier extrait du béton frais, permettant d'évaluer l'effet des adjuvants sur le temps de prise.",
    principe: "L'essai utilise l'appareil de Vicat pour déterminer le temps de début et de fin de prise du mortier en mesurant la pénétration d'une aiguille normalisée sous charge constante.",
    appareillage: [
      "Appareil de Vicat avec aiguille de pénétration",
      "Aiguille de début de prise : diamètre 1,13 mm",
      "Aiguille de fin de prise avec anneau",
      "Récipient tronconique normalisé",
      "Tamis de 5 mm pour extraction du mortier",
      "Chronomètre",
      "Balance précise à 0,1 g"
    ],
    modeOperatoire: [
      "Prélever un échantillon représentatif de béton frais.",
      "Tamiser le béton frais sur tamis de 5 mm pour extraire le mortier.",
      "Remplir le récipient tronconique normalisé avec le mortier sans compactage excessif.",
      "Araser la surface et placer le récipient sous l'appareil de Vicat.",
      "Effectuer des pénétrations régulières (toutes les 10 à 15 minutes).",
      "Déterminer le début de prise : temps où l'aiguille s'arrête à 4 mm ± 1 mm du fond.",
      "Déterminer la fin de prise : temps où l'aiguille ne pénètre plus que de 0,5 mm.",
      "Enregistrer les temps correspondants depuis le moment du gâchage."
    ],
    expression: "Les temps de début et de fin de prise sont exprimés en minutes, comptés à partir du moment où l'eau est ajoutée au ciment (gâchage). L'essai doit être réalisé à température contrôlée (20°C ± 2°C)."
  },
  {
    id: "teneur-air",
    title: "Teneur en Air",
    normeNumber: "NF EN 12350-7",
    normeFull: "Essais pour béton frais - Partie 7 : Teneur en air - Méthode de la compressibilité",
    domaine: "Cette norme spécifie la méthode de mesure de la teneur en air du béton frais compacté, à l'exclusion de l'air contenu dans les bulles de plus de quelques millimètres de diamètre.",
    principe: "La méthode consiste à mesurer le changement de volume d'un échantillon de béton soumis à une pression connue. La variation de volume est directement liée à la teneur en air occlus.",
    appareillage: [
      "Aéromètre à béton (type A ou B) conforme à la norme",
      "Récipient cylindrique de volume connu (généralement 8 litres)",
      "Couvercle étanche avec manomètre et pompe",
      "Système de mise sous pression",
      "Tige de piquage ou vibrateur",
      "Règle à araser",
      "Maillet en caoutchouc"
    ],
    modeOperatoire: [
      "Vérifier l'étanchéité et l'étalonnage de l'aéromètre.",
      "Humidifier le récipient et le remplir de béton en trois couches égales.",
      "Compacter chaque couche par vibration (3-5 secondes) ou piquage (25 coups par couche).",
      "Tapoter les parois avec le maillet pour éliminer les grosses bulles d'air.",
      "Araser la surface avec la règle et nettoyer soigneusement les bords.",
      "Fixer le couvercle hermétiquement.",
      "Ouvrir les robinets et injecter de l'eau jusqu'à ce qu'elle s'écoule sans bulles.",
      "Fermer les robinets et pomper de l'air jusqu'à atteindre la pression initiale.",
      "Ouvrir la vanne d'équilibrage et lire la teneur en air directement sur le manomètre."
    ],
    expression: "La teneur en air est exprimée en pourcentage du volume total du béton, arrondie à 0,1% près. Le résultat doit être corrigé en fonction du facteur de correction des granulats si nécessaire."
  }
];

export default function BetonFraisNormes() {
  const navigate = useNavigate();
  const [openNormes, setOpenNormes] = useState<string[]>([]);
  const [printingNormeId, setPrintingNormeId] = useState<string | null>(null);
  const [feuilleNorme, setFeuilleNorme] = useState<NormeData | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const toggleNorme = (id: string) => {
    setOpenNormes(prev => 
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    );
  };

  const handlePrint = (normeId: string) => {
    const norme = normesData.find(n => n.id === normeId);
    if (!norme) return;
    setOpenNormes(prev => prev.includes(norme.id) ? prev : [...prev, norme.id]);
    setPrintingNormeId(norme.id);
    setTimeout(() => { window.print(); setPrintingNormeId(null); }, 100);
  };

  const handleDownloadPDF = async (normeId: string) => {
    const norme = normesData.find(n => n.id === normeId);
    if (!norme) return;
    setOpenNormes(prev => prev.includes(norme.id) ? prev : [...prev, norme.id]);
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
          { label: "Béton Frais", path: "/essais/beton/beton-frais" },
          { label: "Normes et Feuilles d'essais" }
        ]} 
      />
      
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/essais/beton/beton-frais")}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Normes et Feuilles d'essais <span className="text-primary text-glow">Béton Frais</span>
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 ml-14">
          Références normatives et modes opératoires des essais sur béton frais
        </p>
      </div>

      <div className="space-y-4" ref={printRef}>
        {normesData.map((norme) => (
          <Card key={norme.id} className="border-border bg-card overflow-hidden">
            <Collapsible open={openNormes.includes(norme.id)} onOpenChange={() => toggleNorme(norme.id)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{norme.title}</CardTitle>
                        <span className="inline-block text-xs font-medium bg-muted px-2 py-1 rounded-full text-muted-foreground mt-1">
                          {norme.normeNumber}
                        </span>
                      </div>
                    </div>
                    {openNormes.includes(norme.id) ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-6">
                  {/* Norme complète */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm font-medium text-primary mb-1">{norme.normeNumber}</p>
                    <p className="text-foreground font-medium">{norme.normeFull}</p>
                  </div>

                  {/* Domaine d'application */}
                  <div>
                    <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1</span>
                      Domaine d'application
                    </h4>
                    <p className="text-sm text-muted-foreground pl-8">{norme.domaine}</p>
                  </div>

                  {/* Principe */}
                  <div>
                    <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
                      Principe de l'essai
                    </h4>
                    <p className="text-sm text-muted-foreground pl-8">{norme.principe}</p>
                  </div>

                  {/* Appareillage */}
                  <div>
                    <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">3</span>
                      Appareillage
                    </h4>
                    <ul className="space-y-1 pl-8">
                      {norme.appareillage.map((item, index) => (
                        <li key={index} className="flex gap-2 text-sm text-muted-foreground">
                          <span className="text-primary">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Mode opératoire */}
                  <div>
                    <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">4</span>
                      Mode Opératoire
                    </h4>
                    <ol className="space-y-2 pl-8">
                      {norme.modeOperatoire.map((step, index) => (
                        <li key={index} className="flex gap-3 text-sm">
                          <span className="text-primary font-semibold min-w-[24px]">{index + 1}.</span>
                          <span className="text-muted-foreground">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Expression des résultats */}
                  <div>
                    <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">5</span>
                      Expression des résultats
                    </h4>
                    <p className="text-sm text-muted-foreground pl-8">{norme.expression}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-border">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setFeuilleNorme(norme)}
                      className="flex items-center gap-2"
                    >
                      <ClipboardList className="h-4 w-4" />
                      Feuille d'essai
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePrint(norme.id)}
                      className="flex items-center gap-2"
                    >
                      <Printer className="h-4 w-4" />
                      Imprimer
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleDownloadPDF(norme.id)}
                      className="flex items-center gap-2 gradient-primary text-primary-foreground"
                    >
                      <Download className="h-4 w-4" />
                      Télécharger PDF
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
      <FeuilleEssaiDialog open={!!feuilleNorme} onOpenChange={() => setFeuilleNorme(null)} normeTitle={feuilleNorme?.title || ""} normeNumber={feuilleNorme?.normeNumber || ""} />
    </>
  );
}
