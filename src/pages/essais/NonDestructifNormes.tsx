import { ArrowLeft, Printer, Download, ChevronDown, FileText, Target, Settings, ListOrdered, Calculator } from "lucide-react";
import { downloadReportAsPDF } from "@/lib/pdf";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
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
    id: "sclerometre",
    title: "Essai Scléromètre",
    normeNumber: "NF EN 12504-2",
    domaine: "Cette norme décrit une méthode pour déterminer l'indice de rebond du béton durci à l'aide d'un scléromètre. Elle permet d'évaluer l'uniformité du béton in situ et de détecter les zones de faible qualité.",
    principe: "Une masse est projetée par un ressort contre la surface du béton. Le rebond de cette masse est mesuré et exprimé sous forme d'indice de rebond. Cet indice est corrélé à la résistance superficielle du béton.",
    appareillage: [
      "Scléromètre de type N (énergie d'impact 2,207 Nm)",
      "Enclume d'étalonnage (indice de référence)",
      "Pierre à aiguiser ou meule pour préparation de surface",
      "Crayon ou marqueur pour repérage",
      "Fiche d'enregistrement ou appareil numérique"
    ],
    modeOperatoire: [
      "Vérifier l'étalonnage du scléromètre sur l'enclume de référence",
      "Choisir une zone d'essai exempte de nids de gravier et de fissures",
      "Préparer la surface si nécessaire (éliminer le laitance, les dépôts)",
      "Tracer une grille de points espacés d'au moins 25 mm",
      "Effectuer au moins 9 mesures par zone d'essai",
      "Maintenir le scléromètre perpendiculaire à la surface",
      "Noter l'orientation de l'appareil (horizontale, verticale haut/bas)",
      "Rejeter les valeurs s'écartant de plus de 6 unités de la médiane",
      "Calculer la moyenne des valeurs retenues"
    ],
    expression: "L'indice de rebond R est la moyenne des valeurs retenues. La résistance estimée fc peut être obtenue par corrélation : fc = f(R, angle, type de béton). Précision typique : ± 25% sur la résistance. Des courbes de corrélation spécifiques doivent être établies pour plus de précision."
  },
  {
    id: "ultrason",
    title: "Essai Vitesse à Ultrason",
    normeNumber: "NF EN 12504-4",
    domaine: "Cette norme spécifie une méthode pour déterminer la vitesse de propagation d'impulsions ultrasonores dans le béton durci. Elle permet d'évaluer l'homogénéité, la présence de fissures et la qualité du béton.",
    principe: "Des impulsions ultrasonores sont émises par un transducteur et reçues par un autre après traversée du béton. La mesure du temps de propagation et de la distance parcourue permet de calculer la vitesse des ondes.",
    appareillage: [
      "Appareil de mesure ultrasonore (fréquence 20-150 kHz)",
      "Transducteurs émetteur et récepteur",
      "Gel couplant ou vaseline",
      "Barre d'étalonnage de temps de référence",
      "Mètre ruban ou télémètre laser",
      "Thermomètre"
    ],
    modeOperatoire: [
      "Étalonner l'appareil avec la barre de référence",
      "Choisir le mode de transmission (direct, semi-direct, indirect)",
      "Préparer les surfaces des points de mesure",
      "Appliquer le gel couplant sur les transducteurs",
      "Positionner les transducteurs sur les surfaces",
      "Effectuer la mesure du temps de propagation",
      "Mesurer la distance entre les transducteurs",
      "Répéter les mesures pour vérifier la reproductibilité",
      "Noter la température ambiante"
    ],
    expression: "V = L / T où V est la vitesse (m/s), L la distance parcourue (m), T le temps de propagation (s). Classification : V > 4500 m/s = excellent, 3500-4500 = bon, 3000-3500 = moyen, 2000-3000 = médiocre, < 2000 = très mauvais. La résistance peut être estimée par corrélation."
  },
  {
    id: "resistivite",
    title: "Résistivité Électrique",
    normeNumber: "NF EN 12696",
    domaine: "Cette norme décrit la mesure de la résistivité électrique du béton. Cette propriété est liée à la teneur en eau, à la porosité et à la présence d'ions dans la solution interstitielle.",
    principe: "Un courant électrique est appliqué entre deux électrodes et la différence de potentiel est mesurée entre deux autres électrodes. La résistivité est calculée à partir de ces mesures et de la géométrie du dispositif.",
    appareillage: [
      "Résistivimètre à quatre électrodes (Wenner)",
      "Électrodes en acier inoxydable ou en cuivre",
      "Espaceurs pour positionnement des électrodes",
      "Éponges humides pour contact",
      "Thermomètre",
      "Hygromètre"
    ],
    modeOperatoire: [
      "Vérifier l'étalonnage de l'appareil",
      "Choisir l'espacement des électrodes (typiquement 50 mm)",
      "Humidifier légèrement les points de contact",
      "Positionner les quatre électrodes alignées sur la surface",
      "Assurer un bon contact électrique",
      "Effectuer la mesure de résistance",
      "Répéter dans plusieurs directions",
      "Noter la température et l'humidité relative",
      "Convertir en résistivité"
    ],
    expression: "ρ = 2πaR où ρ est la résistivité (Ω.m), a l'espacement des électrodes (m), R la résistance mesurée (Ω). Interprétation : ρ > 200 Ω.m = risque de corrosion négligeable, 100-200 = faible, 50-100 = modéré, < 50 = élevé."
  },
  {
    id: "permeabilite-air",
    title: "Perméabilité à l'Air",
    normeNumber: "NF EN 12390-8",
    domaine: "Cette méthode évalue la perméabilité à l'air du béton de surface, indicateur de la durabilité potentielle du béton vis-à-vis de la pénétration des agents agressifs.",
    principe: "Une dépression est créée dans une chambre placée sur la surface du béton. La vitesse de remontée de la pression indique la perméabilité du béton à l'air.",
    appareillage: [
      "Perméabilimètre à air (type Torrent ou équivalent)",
      "Cellule de mesure avec joints d'étanchéité",
      "Pompe à vide ou système pneumatique",
      "Manomètre de précision",
      "Chronomètre",
      "Hygromètre de surface"
    ],
    modeOperatoire: [
      "Vérifier que la surface est sèche (HR < 80%)",
      "Choisir une zone plane et exempte de défauts",
      "Positionner la cellule de mesure",
      "Créer le vide dans la chambre interne",
      "Mesurer le temps de remontée de pression",
      "Répéter la mesure au moins 3 fois",
      "Vérifier l'humidité de la surface",
      "Corriger les valeurs si nécessaire"
    ],
    expression: "Le coefficient de perméabilité kT (10⁻¹⁶ m²) est calculé à partir du temps de remontée de pression. Classification : kT < 0,01 = très faible, 0,01-0,1 = faible, 0,1-1 = modérée, 1-10 = élevée, > 10 = très élevée."
  },
  {
    id: "carbonatation",
    title: "Essai Carbonatation",
    normeNumber: "NF EN 14630",
    domaine: "Cette norme décrit la méthode de mesure de la profondeur de carbonatation du béton à l'aide d'un indicateur coloré (phénolphtaléine).",
    principe: "La carbonatation du béton réduit le pH de la solution interstitielle. Un indicateur de pH (phénolphtaléine) est pulvérisé sur une surface fraîchement fracturée : la zone rose indique le béton sain (pH > 9), la zone incolore le béton carbonaté.",
    appareillage: [
      "Solution de phénolphtaléine (1% dans l'éthanol)",
      "Pulvérisateur ou compte-gouttes",
      "Burin et marteau ou carotteuse",
      "Pied à coulisse (précision 0,5 mm)",
      "Appareil photo",
      "Équipement de protection individuelle"
    ],
    modeOperatoire: [
      "Prélever une carotte ou fracturer le béton pour exposer une surface fraîche",
      "Nettoyer la surface de la poussière",
      "Pulvériser immédiatement la solution de phénolphtaléine",
      "Attendre 1 à 2 minutes pour le développement de la couleur",
      "Mesurer la profondeur de carbonatation en plusieurs points",
      "Calculer la profondeur moyenne et maximale",
      "Photographier la surface avec une échelle",
      "Répéter sur plusieurs zones représentatives"
    ],
    expression: "La profondeur de carbonatation dk est la moyenne des mesures perpendiculaires à la surface. L'évolution peut être modélisée par : dk = k√t où k est le coefficient de carbonatation (mm/√an) et t le temps (années). Permet d'estimer le temps avant dépassivation des armatures."
  },
  {
    id: "thermographie",
    title: "Thermographie Infrarouge",
    normeNumber: "NF EN 13187",
    domaine: "Cette norme décrit l'utilisation de la thermographie infrarouge pour détecter les défauts thermiques dans les structures, applicable au diagnostic des bâtiments et ouvrages en béton.",
    principe: "La caméra thermique mesure le rayonnement infrarouge émis par les surfaces. Les différences de température révèlent les défauts : cavités, délaminations, infiltrations d'eau, ponts thermiques.",
    appareillage: [
      "Caméra thermique (sensibilité < 0,1°C)",
      "Objectif adapté à la distance d'observation",
      "Thermomètre de contact pour référence",
      "Hygromètre",
      "Anémomètre",
      "Trépied pour stabilisation"
    ],
    modeOperatoire: [
      "Vérifier les conditions météorologiques (éviter soleil direct, pluie, vent fort)",
      "Étalonner la caméra et régler l'émissivité (0,9-0,95 pour béton)",
      "Établir un gradient thermique suffisant (ΔT > 10°C recommandé)",
      "Effectuer les mesures depuis plusieurs angles",
      "Identifier les zones présentant des anomalies thermiques",
      "Corréler avec les conditions environnementales",
      "Documenter les images avec échelle de température",
      "Valider par sondage si nécessaire"
    ],
    expression: "Les images thermiques sont analysées pour identifier les écarts de température significatifs (> 0,5°C pour les défauts d'adhérence). Le rapport inclut : localisation des anomalies, différence de température, interprétation probable (vide, humidité, délamination), recommandations d'investigation complémentaire."
  }
];

const NonDestructifNormes = () => {
  const navigate = useNavigate();
  const [openItems, setOpenItems] = useState<string[]>([]);

  const [printingNormeId, setPrintingNormeId] = useState<string | null>(null);
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
          { label: "Non Destructif", path: "/essais/beton/non-destructif" },
          { label: "Normes et Feuilles d'essais" }
        ]} 
      />
      
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/essais/beton/non-destructif")}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Normes et Feuilles d'essais <span className="text-primary text-glow">Essais Non Destructifs</span>
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 ml-14">
          Références normatives et modes opératoires des essais non destructifs
        </p>
      </div>

      <div className="space-y-4">
        {normesData.map((norme) => (
          <Collapsible
            key={norme.id}
            open={openItems.includes(norme.id)}
            onOpenChange={() => toggleItem(norme.id)}
          >
            <div data-ref="report" className="border border-border/50 rounded-xl bg-card overflow-hidden">
              <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-violet-500" />
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
                    <Button variant="outline" size="sm" onClick={async () => { await (() => handleDownloadPDF(norme))(); (() => handlePrint(norme))(); }}>
            <Printer className="h-4 w-4 mr-2" />
            <Download className="h-4 w-4 mr-2" />
            Imprimer et télécharger
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

export default NonDestructifNormes;
