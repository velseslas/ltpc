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
    id: "granulometrie",
    title: "Analyse Granulométrique",
    normeNumber: "NF EN 933-1",
    domaine: "Cette norme spécifie la méthode de référence pour la détermination de la granularité des granulats par tamisage. Elle s'applique aux granulats naturels ou artificiels jusqu'à 63 mm.",
    principe: "L'échantillon est séparé en classes granulaires au moyen d'une série de tamis à mailles carrées. La masse retenue sur chaque tamis est rapportée à la masse totale de l'échantillon.",
    appareillage: [
      "Série de tamis conformes à l'ISO 3310-1 et ISO 3310-2",
      "Tamis de contrôle : 0,063 - 0,125 - 0,25 - 0,5 - 1 - 2 - 4 - 8 - 16 - 31,5 - 63 mm",
      "Tamiseuse mécanique",
      "Balance (précision 0,1% de la masse de l'échantillon)",
      "Étuve ventilée (110 ± 5)°C",
      "Brosses de nettoyage des tamis"
    ],
    modeOperatoire: [
      "Sécher l'échantillon à l'étuve jusqu'à masse constante",
      "Peser l'échantillon sec (M1)",
      "Laver si nécessaire sur tamis de 0,063 mm et re-sécher",
      "Peser l'échantillon après lavage (M2)",
      "Assembler la colonne de tamis du plus grand au plus petit",
      "Verser l'échantillon sur le tamis supérieur",
      "Tamiser pendant un temps suffisant (mouvement mécanique ou manuel)",
      "Peser le refus de chaque tamis (Ri)",
      "Vérifier que la somme des refus correspond à M2 (± 1%)"
    ],
    expression: "Passant cumulé (%) = 100 × (M2 - ΣRi) / M2. Fines (%) = 100 × (M1 - M2) / M1 + passant au tamis 0,063 mm. Tracer la courbe granulométrique sur papier semi-log. Calculer le module de finesse Mf = (ΣRefus cumulés aux tamis 0,16 à 5 mm) / 100."
  },
  {
    id: "forme",
    title: "Forme des Granulats",
    normeNumber: "NF EN 933-3/4",
    domaine: "Ces normes spécifient les méthodes de détermination de la forme des gravillons : coefficient d'aplatissement (EN 933-3) et indice de forme (EN 933-4). Elles s'appliquent aux granulats de dimensions supérieures à 4 mm.",
    principe: "Le coefficient d'aplatissement est le pourcentage de granulats dont le rapport dimension/épaisseur est supérieur à 1,58. L'indice de forme mesure le rapport longueur/épaisseur des grains.",
    appareillage: [
      "Grilles à fentes parallèles (barreaux à écartements normalisés)",
      "Tamis de référence pour fractionnement",
      "Balance (précision 0,1%)",
      "Pied à coulisse pour indice de forme",
      "Séparateur d'échantillon"
    ],
    modeOperatoire: [
      "Fractionner l'échantillon sur les tamis di/Di",
      "Peser chaque fraction granulaire (Mi)",
      "Faire passer chaque fraction sur la grille d'écartement Di/1,58",
      "Peser les éléments passants (mi)",
      "Pour l'indice de forme : mesurer L, l, E de 100 grains minimum",
      "Calculer le coefficient ou l'indice pour chaque fraction"
    ],
    expression: "Coefficient d'aplatissement global : FI = 100 × Σmi / ΣMi (%). Classification : FI ≤ 15 : catégorie FI15, FI ≤ 20 : FI20, etc. Indice de forme SI = 100 × M1 / M0 où M1 est la masse des grains non cubiques (L/E > 3)."
  },
  {
    id: "masse-volumique",
    title: "Masse Volumique et Absorption",
    normeNumber: "NF EN 1097-6",
    domaine: "Cette norme spécifie les méthodes de détermination de la masse volumique réelle, de la masse volumique après immersion et de l'absorption d'eau des granulats.",
    principe: "La masse volumique est déterminée par pesées hydrostatiques. L'absorption est mesurée par la différence de masse entre l'état saturé surface sèche et l'état sec.",
    appareillage: [
      "Balance hydrostatique (précision 0,01 g pour sable, 0,1 g pour gravillons)",
      "Pycnomètre pour sable (500 ou 1000 ml)",
      "Panier en treillis pour pesée hydrostatique",
      "Étuve ventilée (110 ± 5)°C",
      "Bain thermostaté à 22°C",
      "Moule tronconique et dame pour essai sable"
    ],
    modeOperatoire: [
      "Pour gravillons : immerger l'échantillon pendant 24h",
      "Essuyer les grains (état saturé surface sèche SSS)",
      "Peser dans l'air (M1) et dans l'eau (M2)",
      "Sécher et peser (M3)",
      "Pour sable : utiliser la méthode pycnométrique",
      "Remplir le pycnomètre, éliminer les bulles d'air",
      "Déterminer les masses aux différents états"
    ],
    expression: "Masse volumique réelle ρa = ρw × M3 / (M1 - M2). Masse volumique SSS ρssd = ρw × M1 / (M1 - M2). Masse volumique apparente ρrd = ρw × M3 / (M3 - M2). Absorption WA24 = 100 × (M1 - M3) / M3 (%)."
  },
  {
    id: "teneur-eau",
    title: "Teneur en Eau",
    normeNumber: "NF EN 1097-5",
    domaine: "Cette norme spécifie la méthode de détermination de la teneur en eau des granulats par séchage en étuve ventilée. Elle s'applique à tous les types de granulats.",
    principe: "La teneur en eau est le rapport de la masse d'eau contenue dans l'échantillon à la masse sèche, exprimée en pourcentage.",
    appareillage: [
      "Étuve ventilée réglable à (110 ± 5)°C",
      "Balance de précision adaptée (0,1% de la masse)",
      "Récipients de séchage résistants à la chaleur",
      "Dessiccateur pour refroidissement",
      "Thermomètre de contrôle"
    ],
    modeOperatoire: [
      "Prélever un échantillon représentatif (masse selon dimension maximale)",
      "Peser l'échantillon humide avec son récipient (M1)",
      "Placer à l'étuve à (110 ± 5)°C",
      "Sécher jusqu'à masse constante (variation < 0,1% entre 2 pesées à 1h d'intervalle)",
      "Refroidir à température ambiante (dessiccateur si nécessaire)",
      "Peser l'échantillon sec avec son récipient (M2)"
    ],
    expression: "Teneur en eau w = 100 × (M1 - M2) / (M2 - Mr) où Mr est la masse du récipient. Le résultat est exprimé en % avec une décimale. Masse minimale d'échantillon : D ≤ 4 mm → 200 g, D = 8 mm → 500 g, D = 16 mm → 1 kg, D = 32 mm → 2 kg."
  }
];

const GranulatPhysiquesNormes = () => {
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
          { label: "Granulat", path: "/essais/granulat" },
          { label: "Physiques", path: "/essais/granulat/physiques" },
          { label: "Normes et Feuilles d'essais" }
        ]} 
      />
      
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/essais/granulat/physiques")}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Normes et Feuilles d'essais <span className="text-primary text-glow">Essais Physiques</span>
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 ml-14">
          Références normatives et modes opératoires des essais physiques sur granulats
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
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-amber-500" />
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
      <FeuilleEssaiDialog
        open={!!feuilleNorme}
        onOpenChange={(open) => !open && setFeuilleNorme(null)}
        normeTitle={feuilleNorme?.title || ""}
        normeNumber={feuilleNorme?.normeNumber || ""}
      />
    </>
  );
};

export default GranulatPhysiquesNormes;
