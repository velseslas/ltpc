import { ArrowLeft, Printer, Download, ChevronDown, FileText, Target, Settings, ListOrdered, Calculator, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import jsPDF from "jspdf";
import FeuilleEssaiDialog from "@/components/essais/FeuilleEssaiDialog";

interface NormeData {
  id: string; title: string; normeNumber: string; domaine: string; principe: string; appareillage: string[]; modeOperatoire: string[]; expression: string;
}

const normesData: NormeData[] = [
  {
    id: "cisaillement",
    title: "Cisaillement Direct",
    normeNumber: "NF P 94-071-1",
    domaine: "Cette norme définit l'essai de cisaillement rectiligne à la boîte. Il permet de déterminer les caractéristiques de résistance au cisaillement d'un sol : cohésion (c) et angle de frottement interne (φ).",
    principe: "Un échantillon de sol est placé dans une boîte de cisaillement composée de deux demi-boîtes. Un effort normal constant est appliqué, puis un déplacement horizontal est imposé. On mesure la force de cisaillement en fonction du déplacement.",
    appareillage: ["Boîte de cisaillement (60×60 mm ou Ø 60 mm)", "Presse de cisaillement avec capteurs de force et déplacement", "Pierre poreuse et papier filtre", "Système d'application de l'effort normal", "Comparateur de déplacement vertical", "Balance de précision, étuve"],
    modeOperatoire: ["Tailler l'éprouvette aux dimensions de la boîte", "Placer l'éprouvette entre les pierres poreuses", "Appliquer l'effort normal σn (3 essais minimum à σn différents)", "Consolider sous l'effort normal (drainage libre)", "Cisailler à vitesse constante (0,5 à 1 mm/min pour sols drainés)", "Enregistrer τ = f(δh) et δv = f(δh)", "Tracer la droite de Coulomb τ = c + σn × tan(φ)"],
    expression: "τ = c + σn × tan(φ) (critère de Mohr-Coulomb). c = cohésion (kPa), φ = angle de frottement interne (°). Essai CD (consolidé drainé) pour paramètres effectifs c' et φ'. Essai CU pour paramètres non drainés cu et φu."
  },
  {
    id: "compression-simple",
    title: "Compression Simple",
    normeNumber: "NF P 94-077",
    domaine: "Cette norme définit l'essai de compression uniaxiale sur éprouvette de sol cohérent. Il permet de déterminer la résistance à la compression non confinée qu'.",
    principe: "Une éprouvette cylindrique de sol est soumise à un effort axial croissant jusqu'à la rupture, sans pression de confinement. La résistance obtenue est liée à la cohésion non drainée.",
    appareillage: ["Presse de compression avec capteur de force", "Capteur de déplacement axial", "Moule de taillage d'éprouvettes (Ø 35-40 mm, H/D = 2)", "Fil à couper, couteau", "Balance de précision", "Pied à coulisse"],
    modeOperatoire: ["Tailler l'éprouvette cylindrique (H/D ≈ 2)", "Mesurer les dimensions et la masse", "Placer l'éprouvette centrée sur le plateau de la presse", "Appliquer la charge axiale à vitesse constante (1 à 2 %/min)", "Enregistrer la courbe contrainte-déformation", "Poursuivre jusqu'à la rupture ou 15% de déformation"],
    expression: "qu = F/A où F est la force à la rupture et A la section corrigée. cu = qu/2 (cohésion non drainée). Sensibilité St = qu(intacte)/qu(remaniée). Consistance : qu < 25 kPa (très molle), 25-50 (molle), 50-100 (ferme), 100-200 (raide), > 200 (très raide)."
  },
  {
    id: "triaxial",
    title: "Essai Triaxial",
    normeNumber: "NF P 94-074",
    domaine: "Cette norme définit l'essai de compression triaxiale des sols. Il permet de déterminer les caractéristiques de résistance et de déformabilité en conditions de contraintes contrôlées.",
    principe: "Une éprouvette cylindrique est placée dans une cellule triaxiale remplie d'eau sous pression. Après consolidation sous la pression de confinement σ3, on applique un effort axial croissant (déviateur) jusqu'à la rupture.",
    appareillage: ["Cellule triaxiale avec membrane en latex", "Système de mise en pression (contrôleur pression-volume)", "Capteur de force axial", "Capteurs de pression interstitielle", "Capteur de déplacement axial", "Système de drainage et contre-pression", "Saturateur à CO2 (optionnel)"],
    modeOperatoire: ["Tailler l'éprouvette (Ø 38 mm, H = 76 mm typiquement)", "Mettre en place dans la cellule avec membrane et drains", "Saturer l'éprouvette (vérifier B ≥ 0,95)", "Consolider sous la pression σ3 souhaitée", "Cisailler en compression (augmenter σ1) à vitesse contrôlée", "Mesurer déviateur, déformations et pressions interstitielles", "Répéter pour 3 pressions de confinement différentes"],
    expression: "q = σ1 - σ3 (déviateur). Cercles de Mohr → enveloppe de rupture τ = c + σ × tan(φ). Types : UU (non consolidé non drainé), CU (consolidé non drainé), CD (consolidé drainé). Module d'Young E50 = q50%/ε50%."
  },
  {
    id: "oedometrique",
    title: "Essai Œdométrique",
    normeNumber: "NF P 94-090-1",
    domaine: "Cette norme définit l'essai de compressibilité à l'œdomètre. Il permet de déterminer les caractéristiques de consolidation des sols fins saturés : pression de préconsolidation, indices de compression et de gonflement.",
    principe: "Une éprouvette de sol est confinée latéralement dans une cellule œdométrique et soumise à des paliers de charge verticale croissants puis décroissants. On mesure le tassement en fonction du temps pour chaque palier.",
    appareillage: ["Cellule œdométrique (Ø 70 mm, H 19 mm typiquement)", "Bâti de chargement (bras de levier ou pneumatique)", "Pierres poreuses (haut et bas)", "Comparateur de déplacement (précision 0,001 mm)", "Chronomètre", "Système de saturation"],
    modeOperatoire: ["Tailler l'éprouvette dans la bague œdométrique", "Mesurer dimensions et masse initiales", "Saturer et appliquer le premier palier de charge (σ'v0)", "Doubler la charge à chaque palier (25, 50, 100, 200, 400, 800 kPa...)", "Maintenir chaque palier 24h et enregistrer les tassements", "Effectuer le déchargement par paliers", "Tracer la courbe e = f(log σ'v)"],
    expression: "Cc = Δe / Δlog(σ'v) (indice de compression). Cs = Δe / Δlog(σ'v) (indice de gonflement, déchargement). σ'p = pression de préconsolidation (méthode de Casagrande). cv = coefficient de consolidation (méthode de Casagrande ou Taylor). OCR = σ'p / σ'v0 (rapport de surconsolidation)."
  }
];

const MecaniqueNormes = () => {
  const navigate = useNavigate();
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [feuilleNorme, setFeuilleNorme] = useState<NormeData | null>(null);
  const toggleItem = (id: string) => setOpenItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handlePrint = (norme: NormeData) => {
    const printContent = `<!DOCTYPE html><html><head><title>${norme.title} - ${norme.normeNumber}</title><style>body{font-family:Arial,sans-serif;padding:40px;line-height:1.6}h1{color:#1a365d;border-bottom:2px solid #0284c7;padding-bottom:10px}.section{margin:20px 0;padding:15px;background:#f0f9ff;border-radius:8px}.section-title{font-weight:bold;color:#2d3748;margin-bottom:10px;display:flex;align-items:center;gap:8px}.section-number{background:#0284c7;color:white;padding:2px 8px;border-radius:4px;font-size:12px}ul,ol{margin:10px 0;padding-left:25px}li{margin:8px 0}.header{display:flex;justify-content:space-between;margin-bottom:30px}.norme-badge{background:#f0f9ff;color:#0369a1;padding:5px 15px;border-radius:20px;font-weight:bold}</style></head><body><div class="header"><h1>${norme.title}</h1><span class="norme-badge">${norme.normeNumber}</span></div><div class="section"><div class="section-title"><span class="section-number">1</span> Domaine d'application</div><p>${norme.domaine}</p></div><div class="section"><div class="section-title"><span class="section-number">2</span> Principe</div><p>${norme.principe}</p></div><div class="section"><div class="section-title"><span class="section-number">3</span> Appareillage</div><ul>${norme.appareillage.map(i=>`<li>${i}</li>`).join('')}</ul></div><div class="section"><div class="section-title"><span class="section-number">4</span> Mode opératoire</div><ol>${norme.modeOperatoire.map(s=>`<li>${s}</li>`).join('')}</ol></div><div class="section"><div class="section-title"><span class="section-number">5</span> Expression des résultats</div><p>${norme.expression}</p></div></body></html>`;
    const w = window.open('','_blank'); if(w){w.document.write(printContent);w.document.close();w.print();}
  };

  const handleDownloadPDF = (norme: NormeData) => {
    const pdf = new jsPDF(); const margin = 20; const maxWidth = pdf.internal.pageSize.getWidth()-2*margin; let y = 20;
    pdf.setFontSize(18);pdf.setTextColor(2,132,199);pdf.text(norme.title,margin,y);y+=10;
    pdf.setFontSize(12);pdf.setTextColor(3,105,161);pdf.text(norme.normeNumber,margin,y);y+=15;
    const addSection = (num:string,title:string,content:string|string[],isList=false) => {
      if(y>250){pdf.addPage();y=20;}pdf.setFontSize(12);pdf.setTextColor(45,55,72);pdf.setFont("helvetica","bold");pdf.text(`${num}. ${title}`,margin,y);y+=8;pdf.setFont("helvetica","normal");pdf.setFontSize(10);pdf.setTextColor(74,85,104);
      if(isList&&Array.isArray(content)){content.forEach((item,i)=>{if(y>270){pdf.addPage();y=20;}const lines=pdf.splitTextToSize(`${i+1}. ${item}`,maxWidth-10);pdf.text(lines,margin+5,y);y+=lines.length*5+3;});}else{const lines=pdf.splitTextToSize(content as string,maxWidth);lines.forEach((line:string)=>{if(y>270){pdf.addPage();y=20;}pdf.text(line,margin,y);y+=6;});}y+=8;
    };
    addSection("1","Domaine d'application",norme.domaine);addSection("2","Principe",norme.principe);addSection("3","Appareillage",norme.appareillage,true);addSection("4","Mode opératoire",norme.modeOperatoire,true);addSection("5","Expression des résultats",norme.expression);
    pdf.save(`${norme.normeNumber.replace(/\s/g,'_')}_${norme.id}.pdf`);
  };

  return (
    <>
      <EssaiBreadcrumb items={[{label:"Géotechnique",path:"/essais/geotechnique"},{label:"Mécaniques",path:"/essais/geotechnique/mecanique"},{label:"Normes"}]} />
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/essais/geotechnique/mecanique")} className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-3xl font-display font-bold text-foreground">Normes et Feuilles d'essais <span className="text-primary text-glow">Essais Mécaniques des Sols</span></h1>
        </div>
        <p className="text-muted-foreground mt-2 ml-14">Références normatives et modes opératoires des essais mécaniques</p>
      </div>
      <div className="space-y-4">
        {normesData.map((norme) => (
          <Collapsible key={norme.id} open={openItems.includes(norme.id)} onOpenChange={() => toggleItem(norme.id)}>
            <div className="border border-border/50 rounded-xl bg-card overflow-hidden">
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

export default MecaniqueNormes;
