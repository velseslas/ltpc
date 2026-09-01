import { lazy } from "react";
import { Route } from "react-router-dom";

const EssaiGranulat = lazy(() => import("@/pages/essais/EssaiGranulat"));
const EtatEssaisGranulat = lazy(() => import("@/pages/essais/granulat/EtatEssaisGranulat"));
const EssaiProprete = lazy(() => import("@/pages/essais/granulat/EssaiProprete"));
const EssaiPhysique = lazy(() => import("@/pages/essais/granulat/EssaiPhysique"));
const EssaiMecanique = lazy(() => import("@/pages/essais/granulat/EssaiMecanique"));
const GranulatPhysiquesNormes = lazy(() => import("@/pages/essais/granulat/GranulatPhysiquesNormes"));
const GranulatPropreteNormes = lazy(() => import("@/pages/essais/granulat/GranulatPropreteNormes"));
const GranulatMecaniquesNormes = lazy(() => import("@/pages/essais/granulat/GranulatMecaniquesNormes"));
const AnalyseGranulometrie = lazy(() => import("@/pages/essais/granulat/physiques/AnalyseGranulometrie"));
const MasseVolumique = lazy(() => import("@/pages/essais/granulat/physiques/MasseVolumique"));
const FormeGranulats = lazy(() => import("@/pages/essais/granulat/physiques/FormeGranulats"));
const TeneurEau = lazy(() => import("@/pages/essais/granulat/physiques/TeneurEau"));
const EquivalentSable = lazy(() => import("@/pages/essais/granulat/proprete/EquivalentSable"));
const BleuMethylene = lazy(() => import("@/pages/essais/granulat/proprete/BleuMethylene"));
const MatiereOrganique = lazy(() => import("@/pages/essais/granulat/proprete/MatiereOrganique"));
const LosAngeles = lazy(() => import("@/pages/essais/granulat/mecaniques/LosAngeles"));
const MicroDeval = lazy(() => import("@/pages/essais/granulat/mecaniques/MicroDeval"));
const Ecrasement = lazy(() => import("@/pages/essais/granulat/mecaniques/Ecrasement"));
const Friabilite = lazy(() => import("@/pages/essais/granulat/mecaniques/Friabilite"));
const EchantillonGranulatForm = lazy(() => import("@/pages/essais/granulat/EchantillonGranulatForm"));
const GranulatDataEntry = lazy(() => import("@/pages/essais/granulat/saisie/GranulatDataEntry"));
const GranulatDetail = lazy(() => import("@/pages/essais/granulat/detail/GranulatDetail"));
const GranulatReport = lazy(() => import("@/pages/essais/granulat/rapport/GranulatReport"));
const RapportCarriere = lazy(() => import("@/pages/essais/granulat/RapportCarriere"));

/** Génère les 5 routes standard d'un essai granulat (liste/nouveau/détail/saisie/modifier/rapport). */
function granulatEssaiRoutes(cfg: {
  type: string; title: string; base: string; reportTitle: string; norm: string;
  showClasseConsistance?: boolean;
}) {
  return (
    <>
      <Route path={`${cfg.base}/nouveau`} element={<EchantillonGranulatForm essaiType={cfg.type} essaiTitle={cfg.title} basePath={cfg.base} />} />
      <Route path={`${cfg.base}/:id`} element={<GranulatDetail essaiType={cfg.type} essaiTitle={cfg.title} basePath={cfg.base} />} />
      <Route path={`${cfg.base}/:id/saisie`} element={<GranulatDataEntry essaiType={cfg.type} essaiTitle={cfg.title} basePath={cfg.base} />} />
      <Route path={`${cfg.base}/:id/modifier`} element={<EchantillonGranulatForm essaiType={cfg.type} essaiTitle={cfg.title} basePath={cfg.base} />} />
      <Route path={`${cfg.base}/:id/rapport`} element={<GranulatReport essaiType={cfg.type} essaiTitle={cfg.reportTitle} normRef={cfg.norm} basePath={cfg.base} />} />
    </>
  );
}

/** Routes des essais Granulat (propreté, physiques, mécaniques). */
export const granulatRoutes = (
  <>
    <Route path="/essais/granulat" element={<EssaiGranulat />} />
    <Route path="/essais/granulat/etat-essais" element={<EtatEssaisGranulat />} />
    {/* Propreté */}
    <Route path="/essais/granulat/proprete" element={<EssaiProprete />} />
    <Route path="/essais/granulat/proprete/normes" element={<GranulatPropreteNormes />} />
    <Route path="/essais/granulat/proprete/equivalent-sable" element={<EquivalentSable />} />
    {granulatEssaiRoutes({ type: "equivalent-sable", title: "Équivalent de sable", base: "/essais/granulat/proprete/equivalent-sable", reportTitle: "Équivalent de Sable", norm: "Norme NF EN 933-8" })}
    <Route path="/essais/granulat/proprete/bleu-methylene" element={<BleuMethylene />} />
    {granulatEssaiRoutes({ type: "bleu-methylene", title: "Essai au bleu de méthylène", base: "/essais/granulat/proprete/bleu-methylene", reportTitle: "Bleu de Méthylène", norm: "Norme NF EN 933-9" })}
    <Route path="/essais/granulat/proprete/matiere-organique" element={<MatiereOrganique />} />
    {granulatEssaiRoutes({ type: "matiere-organique", title: "Teneur en matière organique", base: "/essais/granulat/proprete/matiere-organique", reportTitle: "Matière Organique", norm: "Norme NF EN 1744-1" })}
    {/* Physiques */}
    <Route path="/essais/granulat/physiques" element={<EssaiPhysique />} />
    <Route path="/essais/granulat/physiques/normes" element={<GranulatPhysiquesNormes />} />
    <Route path="/essais/granulat/physiques/granulometrie" element={<AnalyseGranulometrie />} />
    {granulatEssaiRoutes({ type: "granulometrie", title: "Analyse Granulométrique", base: "/essais/granulat/physiques/granulometrie", reportTitle: "Analyse Granulométrique", norm: "Norme NF EN 933-1" })}
    <Route path="/essais/granulat/physiques/masse-volumique" element={<MasseVolumique />} />
    {granulatEssaiRoutes({ type: "masse-volumique", title: "Masse Volumique", base: "/essais/granulat/physiques/masse-volumique", reportTitle: "Masse Volumique", norm: "Norme NF EN 1097-6" })}
    <Route path="/essais/granulat/physiques/forme" element={<FormeGranulats />} />
    {granulatEssaiRoutes({ type: "forme-granulats", title: "Forme des Granulats", base: "/essais/granulat/physiques/forme", reportTitle: "Forme des Granulats", norm: "Norme NF EN 933-3" })}
    <Route path="/essais/granulat/physiques/teneur-eau" element={<TeneurEau />} />
    {granulatEssaiRoutes({ type: "teneur-eau", title: "Teneur en Eau", base: "/essais/granulat/physiques/teneur-eau", reportTitle: "Teneur en Eau", norm: "Norme NF EN 1097-5" })}
    {/* Mécaniques */}
    <Route path="/essais/granulat/mecaniques" element={<EssaiMecanique />} />
    <Route path="/essais/granulat/mecaniques/normes" element={<GranulatMecaniquesNormes />} />
    <Route path="/essais/granulat/mecaniques/los-angeles" element={<LosAngeles />} />
    {granulatEssaiRoutes({ type: "los-angeles", title: "Essai Los Angeles", base: "/essais/granulat/mecaniques/los-angeles", reportTitle: "Los Angeles", norm: "Norme NF EN 1097-2" })}
    <Route path="/essais/granulat/mecaniques/micro-deval" element={<MicroDeval />} />
    {granulatEssaiRoutes({ type: "micro-deval", title: "Essai Micro-Deval", base: "/essais/granulat/mecaniques/micro-deval", reportTitle: "Micro-Deval", norm: "Norme NF EN 1097-1" })}
    <Route path="/essais/granulat/mecaniques/ecrasement" element={<Ecrasement />} />
    {granulatEssaiRoutes({ type: "ecrasement", title: "Résistance à l'Écrasement", base: "/essais/granulat/mecaniques/ecrasement", reportTitle: "Écrasement", norm: "Norme NF P 18-576" })}
    <Route path="/essais/granulat/mecaniques/friabilite" element={<Friabilite />} />
    {granulatEssaiRoutes({ type: "friabilite", title: "Essai de Friabilité", base: "/essais/granulat/mecaniques/friabilite", reportTitle: "Friabilité", norm: "Norme NF P 18-576" })}
  </>
);
