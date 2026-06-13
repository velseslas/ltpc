import { ArrowLeft, Printer, Download, ChevronDown, FileText, Target, Settings, ListOrdered, Calculator, ClipboardList } from "lucide-react";
import { downloadReportAsPDF } from "@/lib/pdf";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import FeuilleEssaiDialog from "@/components/essais/FeuilleEssaiDialog";

interface NormeData {
  id: string; title: string; normeNumber: string; domaine: string; principe: string; appareillage: string[]; modeOperatoire: string[]; expression: string;
}

const normesData: NormeData[] = [
  {
    id: "penetrometre",
    title: "Pénétromètre Dynamique",
    normeNumber: "NF P 94-115",
    domaine: "Cette norme définit l'essai de pénétration dynamique type A (pénétromètre dynamique lourd). Il permet la reconnaissance des sols en mesurant leur résistance à l'enfoncement d'une pointe normalisée.",
    principe: "Une pointe conique est enfoncée dans le sol par battage d'un mouton de masse et hauteur de chute normalisées. On mesure le nombre de coups nécessaires pour enfoncer la pointe d'une longueur donnée (20 cm).",
    appareillage: ["Pointe conique perdue ou récupérable", "Train de tiges (Ø 42 mm)", "Mouton de 64 kg, hauteur de chute 75 cm", "Enclume et tête de battage", "Dispositif de guidage", "Règle de mesure d'enfoncement"],
    modeOperatoire: ["Mettre en place le pénétromètre verticalement", "Visser la première tige avec la pointe", "Battre et compter le nombre de coups par 20 cm d'enfoncement", "Ajouter les tiges au fur et à mesure de l'avancement", "Enregistrer le nombre de coups Nd pour chaque intervalle", "Poursuivre jusqu'à la profondeur souhaitée ou au refus", "Tracer le pénétrogramme Nd = f(profondeur)"],
    expression: "Rd = M²×g×H / [A×e×(M+M')] (résistance de pointe dynamique, formule des Hollandais). M = masse du mouton, H = hauteur de chute, A = section de la pointe, e = enfoncement par coup, M' = masse des tiges + enclume. Corrélation empirique avec qc (CPT)."
  },
  {
    id: "pressiometre",
    title: "Essai Pressiométrique",
    normeNumber: "NF P 94-110-1",
    domaine: "Cette norme définit l'essai pressiométrique Ménard. Il permet de mesurer in situ les caractéristiques de déformabilité et de résistance des sols : module pressiométrique EM et pression limite pl.",
    principe: "Une sonde cylindrique dilatable est introduite dans un forage. On applique des paliers de pression croissants et on mesure les variations de volume de la sonde. La courbe pression-volume permet de déterminer les paramètres pressiométriques.",
    appareillage: ["Sonde pressiométrique (Ø 58 ou 44 mm)", "Contrôleur pression-volume (CPV)", "Tubulure de liaison", "Équipement de forage préalable", "Manomètre étalon", "Chronomètre"],
    modeOperatoire: ["Réaliser un forage soigné (Ø adapté à la sonde)", "Descendre la sonde à la profondeur d'essai", "Appliquer des paliers de pression croissants (10 paliers minimum)", "Maintenir chaque palier 60 secondes", "Lire les volumes à 15, 30 et 60 secondes", "Poursuivre jusqu'à la pression limite (volume doublé)", "Appliquer les corrections (résistance de la sonde, pression hydrostatique)"],
    expression: "EM = 2(1+ν) × V0 × Δp/ΔV (module pressiométrique). pl = pression limite (quand V = 2V0). pf = pression de fluage. α = coefficient rhéologique. Catégorie de sol selon EM/pl : argile (EM/pl = 5-15), sable (EM/pl = 7-12), roche altérée (EM/pl = 8-15)."
  },
  {
    id: "plaque",
    title: "Essai de Plaque",
    normeNumber: "NF P 94-117-1",
    domaine: "Cette norme définit l'essai de chargement à la plaque. Il permet de déterminer le module de déformation d'un sol en surface ou dans une excavation, pour le contrôle de compactage des plateformes.",
    principe: "Une plaque circulaire rigide est chargée sur le sol par paliers successifs. On mesure l'enfoncement de la plaque sous chaque palier de charge. Le module est calculé à partir de la relation charge-enfoncement.",
    appareillage: ["Plaque circulaire rigide (Ø 600 mm ou 750 mm)", "Vérin hydraulique avec manomètre", "Véhicule ou massif de réaction", "Comparateurs de déplacement (2 ou 3)", "Poutre de référence indéformable", "Pompe hydraulique"],
    modeOperatoire: ["Niveler la surface d'essai et mettre du sable fin si nécessaire", "Placer la plaque centrée sur la zone d'essai", "Installer les comparateurs sur la poutre de référence", "Appliquer une précharge de 0,01 MPa puis décharger", "Premier cycle : charger par paliers jusqu'à 0,25 MPa", "Décharger complètement et attendre la stabilisation", "Deuxième cycle : recharger par paliers jusqu'à 0,25 MPa"],
    expression: "EV2 = (π/4) × Δσ × Ø / Δz (module au 2ème cycle). EV1 = module au 1er cycle. k = EV2/EV1 (rapport des modules). Objectifs : EV2 ≥ 50 MPa et k ≤ 2 pour couche de forme. EV2 ≥ 30 MPa pour fond de forme."
  },
  {
    id: "sondage",
    title: "Sondage Carotté",
    normeNumber: "NF P 94-500 / NF EN ISO 22475-1",
    domaine: "Ces normes définissent les méthodes de sondage carotté pour la reconnaissance géotechnique. Le sondage permet de prélever des échantillons intacts pour identification et essais en laboratoire.",
    principe: "Un carottier est enfoncé dans le sol par rotation ou battage pour extraire des échantillons cylindriques (carottes). La qualité de l'échantillon dépend du type de carottier et de la technique de prélèvement.",
    appareillage: ["Sondeuse rotative ou à percussion", "Carottiers simples, doubles ou triples", "Tubes de prélèvement en acier ou PVC", "Fluide de forage (eau, boue bentonitique)", "Caisse à carottes pour stockage", "Appareil photo pour documentation"],
    modeOperatoire: ["Implanter le sondage selon le plan de reconnaissance", "Forer jusqu'à la profondeur de prélèvement", "Introduire le carottier adapté au type de sol", "Enfoncer par rotation lente et pression contrôlée", "Extraire la carotte avec précaution", "Conditionner les échantillons (paraffinage, tube étanche)", "Documenter la coupe géologique et les observations", "Transporter vers le laboratoire en conditions adaptées"],
    expression: "Taux de récupération = (longueur carotte récupérée / longueur forée) × 100. RQD (Rock Quality Designation) = (Σ morceaux > 10 cm / longueur forée) × 100 (pour roches). Classes de qualité : 1 (très bon, intact) à 5 (très pauvre, remanié)."
  },
  {
    id: "densitometre",
    title: "Densitomètre à Membrane",
    normeNumber: "NF P 94-061-2",
    domaine: "Cette norme définit l'essai de détermination de la masse volumique en place d'un matériau au moyen du densitomètre à membrane. Il est applicable aux sols grenus et aux matériaux de remblai contenant peu de fines.",
    principe: "Un trou est creusé dans le sol et le volume est mesuré en appliquant une membrane souple remplie d'eau. Le sol extrait est pesé et sa teneur en eau est déterminée. La densité sèche est calculée à partir du volume du trou, de la masse du sol et de sa teneur en eau.",
    appareillage: ["Densitomètre à membrane avec cylindre gradué", "Pompe à vide ou dispositif de mise en pression", "Membrane souple en caoutchouc ou latex", "Balance de précision (± 0,1 g)", "Étuve de séchage (105 ± 5 °C)", "Outils de creusement (burin, spatule)", "Récipients étanches pour le sol", "Plateau de base avec anneau de fixation"],
    modeOperatoire: ["Niveler la surface et positionner le plateau de base", "Mesurer le volume initial V0 (lecture sur le cylindre gradué)", "Creuser un trou cylindrique de 10 à 15 cm de profondeur", "Recueillir soigneusement tout le sol extrait dans un récipient", "Peser la masse totale du sol extrait (M)", "Mesurer le volume final V1 avec la membrane dans le trou", "Calculer le volume du trou V = V1 − V0", "Prélever un échantillon pour déterminer la teneur en eau W", "Calculer la densité humide P = M / V", "Calculer la densité sèche Pd = P × 100 / (100 + W)"],
    expression: "V = V1 − V0 (volume du trou en cm³). E = H − S (poids de l'eau). I = S − Tare (sol sec). W = (E / I) × 100 (teneur en eau en %). P = M / V (densité humide en g/cm³). Pd = P × 100 / (100 + W) (densité sèche en g/cm³). % Compactage = (Pd / γd max) × 100. Objectif : % Compactage ≥ 95% (selon spécifications du projet)."
  }
];

const InSituNormes = () => {
  const navigate = useNavigate();
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [printingNormeId, setPrintingNormeId] = useState<string | null>(null);
  const [feuilleNorme, setFeuilleNorme] = useState<NormeData | null>(null);
  const toggleItem = (id: string) => setOpenItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

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
      <EssaiBreadcrumb items={[{label:"Géotechnique",path:"/essais/geotechnique"},{label:"In-Situ",path:"/essais/geotechnique/in-situ"},{label:"Normes et Feuilles d'essais"}]} />
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/essais/geotechnique/in-situ")} className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-3xl font-display font-bold text-foreground">Normes et Feuilles d'essais <span className="text-primary text-glow">Essais In-Situ</span></h1>
        </div>
        <p className="text-muted-foreground mt-2 ml-14">Références normatives et modes opératoires des essais in-situ</p>
      </div>
      <div className="space-y-4">
        {normesData.map((norme) => (
          <Collapsible key={norme.id} open={openItems.includes(norme.id)} onOpenChange={() => toggleItem(norme.id)}>
            <div data-ref={printingNormeId === norme.id ? "report" : undefined} className="border border-border/50 rounded-xl bg-card overflow-hidden">
              <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/10 flex items-center justify-center"><FileText className="h-6 w-6 text-sky-500" /></div>
                  <div className="text-left"><h3 className="font-semibold text-lg">{norme.title}</h3><span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{norme.normeNumber}</span></div>
                </div>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${openItems.includes(norme.id)?'rotate-180':''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-6 pb-6 space-y-6 border-t border-border/50 pt-6">
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setFeuilleNorme(norme)}><ClipboardList className="h-4 w-4 mr-2" />Feuille d'essai</Button>
                    <Button variant="outline" size="sm" onClick={() => handlePrint(norme)}><Printer className="h-4 w-4 mr-2" />Imprimer</Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(norme)}><Download className="h-4 w-4 mr-2" />Télécharger PDF</Button>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/30 rounded-lg"><div className="flex items-center gap-2 mb-2"><span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">1</span><Target className="h-4 w-4 text-primary" /><span className="font-semibold">Domaine d'application</span></div><p className="text-sm text-muted-foreground">{norme.domaine}</p></div>
                    <div className="p-4 bg-muted/30 rounded-lg"><div className="flex items-center gap-2 mb-2"><span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">2</span><FileText className="h-4 w-4 text-primary" /><span className="font-semibold">Principe de l'essai</span></div><p className="text-sm text-muted-foreground">{norme.principe}</p></div>
                    <div className="p-4 bg-muted/30 rounded-lg"><div className="flex items-center gap-2 mb-2"><span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">3</span><Settings className="h-4 w-4 text-primary" /><span className="font-semibold">Appareillage</span></div><ul className="text-sm text-muted-foreground space-y-1 ml-4">{norme.appareillage.map((item,idx)=><li key={idx} className="list-disc">{item}</li>)}</ul></div>
                    <div className="p-4 bg-muted/30 rounded-lg"><div className="flex items-center gap-2 mb-2"><span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">4</span><ListOrdered className="h-4 w-4 text-primary" /><span className="font-semibold">Mode opératoire</span></div><ol className="text-sm text-muted-foreground space-y-2 ml-4">{norme.modeOperatoire.map((step,idx)=><li key={idx} className="list-decimal">{step}</li>)}</ol></div>
                    <div className="p-4 bg-muted/30 rounded-lg"><div className="flex items-center gap-2 mb-2"><span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">5</span><Calculator className="h-4 w-4 text-primary" /><span className="font-semibold">Expression des résultats</span></div><p className="text-sm text-muted-foreground">{norme.expression}</p></div>
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

export default InSituNormes;
