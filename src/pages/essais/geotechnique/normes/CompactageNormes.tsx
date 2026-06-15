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
    id: "proctor-normal",
    title: "Essai Proctor Normal",
    normeNumber: "NF P 94-093",
    domaine: "Cette norme définit l'essai de compactage des sols à l'énergie Proctor Normal. Il permet de déterminer la teneur en eau optimale et la densité sèche maximale pour une énergie de compactage donnée.",
    principe: "Un échantillon de sol est compacté dans un moule normalisé en plusieurs couches avec une dame de masse et de hauteur de chute définies. L'essai est répété pour différentes teneurs en eau afin de tracer la courbe Proctor.",
    appareillage: [
      "Moule Proctor (Ø 101,6 mm, H 116,4 mm) ou moule CBR",
      "Dame Proctor Normal (2,490 kg, hauteur de chute 305 mm)",
      "Règle à araser",
      "Étuve à 105°C, balance (précision 1 g)",
      "Pulvérisateur d'eau, bacs de malaxage",
      "Tamis de 5 mm et 20 mm"
    ],
    modeOperatoire: [
      "Sécher le matériau et le tamiser à 5 mm (moule Proctor) ou 20 mm (moule CBR)",
      "Préparer 5 à 6 échantillons à des teneurs en eau croissantes",
      "Compacter chaque échantillon en 3 couches de 25 coups (moule Proctor)",
      "Araser le dessus du moule et peser l'ensemble",
      "Prélever un échantillon pour déterminer la teneur en eau",
      "Tracer la courbe γd = f(w) et déterminer l'optimum"
    ],
    expression: "γd = γh / (1 + w) où γh est la masse volumique humide et w la teneur en eau. La courbe Proctor donne : wOPN (teneur en eau optimale) et γd max (densité sèche maximale). Énergie de compactage : E = (m × g × h × n × N) / V ≈ 600 kJ/m³."
  },
  {
    id: "proctor-modifie",
    title: "Essai Proctor Modifié",
    normeNumber: "NF P 94-093",
    domaine: "Cette norme définit l'essai de compactage des sols à l'énergie Proctor Modifié. L'énergie de compactage est environ 5 fois supérieure à celle du Proctor Normal.",
    principe: "Le principe est identique au Proctor Normal mais avec une énergie de compactage plus élevée : dame plus lourde, hauteur de chute plus grande et 5 couches au lieu de 3.",
    appareillage: [
      "Moule Proctor (Ø 101,6 mm) ou moule CBR (Ø 152 mm)",
      "Dame Proctor Modifié (4,535 kg, hauteur de chute 457 mm)",
      "Rehausse, règle à araser",
      "Étuve à 105°C, balance (précision 1 g)",
      "Bacs de malaxage, pulvérisateur",
      "Tamis de 5 mm et 20 mm"
    ],
    modeOperatoire: [
      "Préparer le matériau comme pour le Proctor Normal",
      "Préparer 5 à 6 échantillons à des teneurs en eau croissantes",
      "Compacter en 5 couches de 25 coups (moule Proctor) ou 56 coups (moule CBR)",
      "Araser et peser l'ensemble moule + sol",
      "Déterminer la teneur en eau de chaque point",
      "Tracer la courbe et déterminer wOPM et γd max"
    ],
    expression: "γd = γh / (1 + w). Énergie Proctor Modifié ≈ 2700 kJ/m³. La densité sèche maximale OPM est supérieure à l'OPN et la teneur en eau optimale OPM est inférieure à l'OPN. Rapport typique : γd OPM / γd OPN ≈ 1,05 à 1,10."
  },
  {
    id: "cbr",
    title: "Essai CBR",
    normeNumber: "NF P 94-078",
    domaine: "Cette norme définit l'essai CBR (California Bearing Ratio) qui mesure la résistance au poinçonnement d'un sol compacté. Il est utilisé pour le dimensionnement des chaussées.",
    principe: "Un piston cylindrique normalisé est enfoncé dans une éprouvette de sol compacté à vitesse constante. La force nécessaire est comparée à celle requise pour enfoncer le même piston dans un matériau de référence (pierre concassée).",
    appareillage: [
      "Moule CBR (Ø 152 mm, H 152 mm) avec embase et rehausse",
      "Piston CBR (Ø 49,6 mm, section 19,35 cm²)",
      "Presse CBR avec capteur de force et de déplacement",
      "Surcharges annulaires (2,27 kg chacune)",
      "Disque d'espacement, papier filtre",
      "Bac d'immersion pour imbibition (4 jours)"
    ],
    modeOperatoire: [
      "Compacter l'échantillon à l'énergie Proctor Modifié (3 énergies : 10, 25, 56 coups)",
      "Pour le CBR après immersion : immerger 4 jours avec surcharges et mesurer le gonflement",
      "Placer les surcharges sur l'éprouvette dans la presse",
      "Enfoncer le piston à vitesse constante de 1,27 mm/min",
      "Relever les efforts à 2,5 mm et 5 mm d'enfoncement",
      "Calculer les indices CBR pour chaque énergie de compactage"
    ],
    expression: "CBR = max(F2,5/13,35 ; F5/20) × 100 où F2,5 et F5 sont les efforts (kN) mesurés à 2,5 et 5 mm. CBR immédiat : essai sans immersion. CBR imbibé : après 4 jours d'immersion. IPI (Indice Portant Immédiat) : CBR à la teneur en eau naturelle."
  },
  {
    id: "densite-place",
    title: "Densité en Place",
    normeNumber: "NF P 94-061-1 / NF P 94-061-2",
    domaine: "Ces normes définissent les méthodes de détermination de la masse volumique d'un sol en place. Elles permettent de contrôler le compactage sur chantier.",
    principe: "La méthode au sable consiste à creuser un trou dans le sol, peser le matériau extrait et mesurer le volume du trou en le remplissant de sable calibré. La méthode au gammadensimètre utilise l'atténuation des rayons gamma.",
    appareillage: [
      "Densitomètre à sable (cône et bouteille)",
      "Sable calibré (masse volumique connue)",
      "Plateau avec trou central",
      "Balance de terrain (précision 1 g)",
      "Capsules étanches pour teneur en eau",
      "Ou : gammadensimètre à transmission/rétrodiffusion"
    ],
    modeOperatoire: [
      "Niveler la surface du sol et poser le plateau",
      "Creuser un trou cylindrique (environ 15 cm de diamètre, 15 cm de profondeur)",
      "Peser tout le matériau extrait (Mh)",
      "Prélever un échantillon pour la teneur en eau",
      "Remplir le trou avec le sable calibré et mesurer le volume V",
      "Calculer γh = Mh/V puis γd = γh/(1+w)"
    ],
    expression: "γd = Mh / [V × (1 + w)]. Taux de compactage = (γd terrain / γd OPM) × 100. Objectifs courants : ≥ 95% OPM pour remblais, ≥ 98,5% OPM pour couches de forme, ≥ 97% OPN pour fond de forme."
  }
];

const CompactageNormes = () => {
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
      <EssaiBreadcrumb items={[{label:"Géotechnique",path:"/essais/geotechnique"},{label:"Compactage",path:"/essais/geotechnique/compactage"},{label:"Normes et Feuilles d'essais"}]} />
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/essais/geotechnique/compactage")} className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-3xl font-display font-bold text-foreground">Normes et Feuilles d'essais <span className="text-primary text-glow">Essais de Compactage</span></h1>
        </div>
        <p className="text-muted-foreground mt-2 ml-14">Références normatives et modes opératoires des essais de compactage</p>
      </div>
      <div className="space-y-4">
        {normesData.map((norme) => (
          <Collapsible key={norme.id} open={openItems.includes(norme.id)} onOpenChange={() => toggleItem(norme.id)}>
            <div data-ref="report" className="border border-border/50 rounded-xl bg-card overflow-hidden">
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

export default CompactageNormes;
