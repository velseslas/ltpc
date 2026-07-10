import { lazy } from "react";
import { Route } from "react-router-dom";

const EssaiGeotechnique = lazy(() => import("@/pages/essais/EssaiGeotechnique"));
const EssaiIdentification = lazy(() => import("@/pages/essais/geotechnique/EssaiIdentification"));
const EssaiCompactage = lazy(() => import("@/pages/essais/geotechnique/EssaiCompactage"));
const EssaiMecaniqueSol = lazy(() => import("@/pages/essais/geotechnique/EssaiMecaniqueSol"));
const EssaiInSitu = lazy(() => import("@/pages/essais/geotechnique/EssaiInSitu"));
const IdentificationNormes = lazy(() => import("@/pages/essais/geotechnique/normes/IdentificationNormes"));
const CompactageNormes = lazy(() => import("@/pages/essais/geotechnique/normes/CompactageNormes"));
const MecaniqueNormes = lazy(() => import("@/pages/essais/geotechnique/normes/MecaniqueNormes"));
const InSituNormes = lazy(() => import("@/pages/essais/geotechnique/normes/InSituNormes"));
const LimitesAtterberg = lazy(() => import("@/pages/essais/geotechnique/identification/LimitesAtterberg"));
const LimitesAtterbergDataEntry = lazy(() => import("@/pages/essais/geotechnique/identification/LimitesAtterbergDataEntry"));
const LimitesAtterbergReport = lazy(() => import("@/pages/essais/geotechnique/identification/LimitesAtterbergReport"));
const GranulometrieSol = lazy(() => import("@/pages/essais/geotechnique/identification/GranulometrieSol"));
const GranulometrieSolDataEntry = lazy(() => import("@/pages/essais/geotechnique/identification/GranulometrieSolDataEntry"));
const GranulometrieSolReport = lazy(() => import("@/pages/essais/geotechnique/identification/GranulometrieSolReport"));
const TeneurEauSol = lazy(() => import("@/pages/essais/geotechnique/identification/TeneurEauSol"));
const TeneurEauSolDataEntry = lazy(() => import("@/pages/essais/geotechnique/identification/TeneurEauSolDataEntry"));
const TeneurEauSolReport = lazy(() => import("@/pages/essais/geotechnique/identification/TeneurEauSolReport"));
const ClassificationSol = lazy(() => import("@/pages/essais/geotechnique/identification/ClassificationSol"));
const ClassificationSolDataEntry = lazy(() => import("@/pages/essais/geotechnique/identification/ClassificationSolDataEntry"));
const ClassificationSolReport = lazy(() => import("@/pages/essais/geotechnique/identification/ClassificationSolReport"));
const ProctorNormal = lazy(() => import("@/pages/essais/geotechnique/compactage/ProctorNormal"));
const ProctorModifie = lazy(() => import("@/pages/essais/geotechnique/compactage/ProctorModifie"));
const ProctorDataEntry = lazy(() => import("@/pages/essais/geotechnique/compactage/ProctorDataEntry"));
const ProctorReport = lazy(() => import("@/pages/essais/geotechnique/compactage/ProctorReport"));
const CBR = lazy(() => import("@/pages/essais/geotechnique/compactage/CBR"));
const CBRDataEntry = lazy(() => import("@/pages/essais/geotechnique/compactage/CBRDataEntry"));
const CBRReport = lazy(() => import("@/pages/essais/geotechnique/compactage/CBRReport"));
const DensitePlace = lazy(() => import("@/pages/essais/geotechnique/compactage/DensitePlace"));
const Cisaillement = lazy(() => import("@/pages/essais/geotechnique/mecanique/Cisaillement"));
const CompressionSimple = lazy(() => import("@/pages/essais/geotechnique/mecanique/CompressionSimple"));
const Triaxial = lazy(() => import("@/pages/essais/geotechnique/mecanique/Triaxial"));
const Oedometrique = lazy(() => import("@/pages/essais/geotechnique/mecanique/Oedometrique"));
const Penetrometre = lazy(() => import("@/pages/essais/geotechnique/insitu/Penetrometre"));
const Pressiometre = lazy(() => import("@/pages/essais/geotechnique/insitu/Pressiometre"));
const Plaque = lazy(() => import("@/pages/essais/geotechnique/insitu/Plaque"));
const PlaqueDataEntry = lazy(() => import("@/pages/essais/geotechnique/insitu/PlaqueDataEntry"));
const PlaqueReport = lazy(() => import("@/pages/essais/geotechnique/insitu/PlaqueReport"));
const Sondage = lazy(() => import("@/pages/essais/geotechnique/insitu/Sondage"));
const Densitometre = lazy(() => import("@/pages/essais/geotechnique/insitu/Densitometre"));
const DensitometreDataEntry = lazy(() => import("@/pages/essais/geotechnique/insitu/DensitometreDataEntry"));
const DensitometreReport = lazy(() => import("@/pages/essais/geotechnique/insitu/DensitometreReport"));
const EchantillonGeotechniqueForm = lazy(() => import("@/pages/essais/geotechnique/EchantillonGeotechniqueForm"));
const GeotechniqueDetail = lazy(() => import("@/pages/essais/geotechnique/GeotechniqueDetail"));
const GeotechniqueDataEntry = lazy(() => import("@/pages/essais/geotechnique/GeotechniqueDataEntry"));

/** Génère les routes standard d'un essai géotechnique (form/détail/saisie/modifier). */
function geoEssaiRoutes(cfg: {
  type: string; title: string; base: string; categoryPath: string; categoryLabel: string;
  customSaisie?: React.ReactNode; customReport?: React.ReactNode;
}) {
  return (
    <>
      <Route path={`${cfg.base}/nouveau`} element={<EchantillonGeotechniqueForm essaiType={cfg.type} essaiTitle={cfg.title} basePath={cfg.base} />} />
      <Route path={`${cfg.base}/:id`} element={<GeotechniqueDetail essaiType={cfg.type} essaiTitle={cfg.title} basePath={cfg.base} categoryPath={cfg.categoryPath} categoryLabel={cfg.categoryLabel} />} />
      <Route path={`${cfg.base}/:id/saisie`} element={cfg.customSaisie ?? <GeotechniqueDataEntry essaiType={cfg.type} essaiTitle={cfg.title} basePath={cfg.base} categoryPath={cfg.categoryPath} categoryLabel={cfg.categoryLabel} />} />
      <Route path={`${cfg.base}/:id/modifier`} element={<EchantillonGeotechniqueForm essaiType={cfg.type} essaiTitle={cfg.title} basePath={cfg.base} />} />
      {cfg.customReport && <Route path={`${cfg.base}/:id/rapport`} element={cfg.customReport} />}
    </>
  );
}

/** Routes des essais Géotechniques (identification, compactage, mécaniques, in-situ). */
export const geotechniqueRoutes = (
  <>
    <Route path="/essais/geotechnique" element={<EssaiGeotechnique />} />
    <Route path="/essais/geotechnique/identification" element={<EssaiIdentification />} />
    <Route path="/essais/geotechnique/compactage" element={<EssaiCompactage />} />
    <Route path="/essais/geotechnique/mecanique" element={<EssaiMecaniqueSol />} />
    <Route path="/essais/geotechnique/in-situ" element={<EssaiInSitu />} />
    <Route path="/essais/geotechnique/identification/normes" element={<IdentificationNormes />} />
    <Route path="/essais/geotechnique/compactage/normes" element={<CompactageNormes />} />
    <Route path="/essais/geotechnique/mecanique/normes" element={<MecaniqueNormes />} />
    <Route path="/essais/geotechnique/in-situ/normes" element={<InSituNormes />} />
    {/* Identification */}
    <Route path="/essais/geotechnique/identification/limites-atterberg" element={<LimitesAtterberg />} />
    {geoEssaiRoutes({ type: "limites-atterberg", title: "Limites d'Atterberg", base: "/essais/geotechnique/identification/limites-atterberg", categoryPath: "/essais/geotechnique/identification", categoryLabel: "Identification", customSaisie: <LimitesAtterbergDataEntry />, customReport: <LimitesAtterbergReport /> })}
    <Route path="/essais/geotechnique/identification/granulometrie-sol" element={<GranulometrieSol />} />
    {geoEssaiRoutes({ type: "granulometrie-sol", title: "Analyse Granulométrique des Sols", base: "/essais/geotechnique/identification/granulometrie-sol", categoryPath: "/essais/geotechnique/identification", categoryLabel: "Identification", customSaisie: <GranulometrieSolDataEntry />, customReport: <GranulometrieSolReport /> })}
    <Route path="/essais/geotechnique/identification/teneur-eau-sol" element={<TeneurEauSol />} />
    {geoEssaiRoutes({ type: "teneur-eau-sol", title: "Teneur en Eau des Sols", base: "/essais/geotechnique/identification/teneur-eau-sol", categoryPath: "/essais/geotechnique/identification", categoryLabel: "Identification", customSaisie: <TeneurEauSolDataEntry />, customReport: <TeneurEauSolReport /> })}
    <Route path="/essais/geotechnique/identification/classification-sol" element={<ClassificationSol />} />
    {geoEssaiRoutes({ type: "classification-sol", title: "Classification des Sols", base: "/essais/geotechnique/identification/classification-sol", categoryPath: "/essais/geotechnique/identification", categoryLabel: "Identification", customSaisie: <ClassificationSolDataEntry />, customReport: <ClassificationSolReport /> })}
    {/* Compactage */}
    <Route path="/essais/geotechnique/compactage/proctor-normal" element={<ProctorNormal />} />
    {geoEssaiRoutes({ type: "proctor-normal", title: "Essai Proctor Normal", base: "/essais/geotechnique/compactage/proctor-normal", categoryPath: "/essais/geotechnique/compactage", categoryLabel: "Compactage", customSaisie: <ProctorDataEntry essaiType="proctor-normal" />, customReport: <ProctorReport essaiType="proctor-normal" /> })}
    <Route path="/essais/geotechnique/compactage/proctor-modifie" element={<ProctorModifie />} />
    {geoEssaiRoutes({ type: "proctor-modifie", title: "Essai Proctor Modifié", base: "/essais/geotechnique/compactage/proctor-modifie", categoryPath: "/essais/geotechnique/compactage", categoryLabel: "Compactage", customSaisie: <ProctorDataEntry essaiType="proctor-modifie" />, customReport: <ProctorReport essaiType="proctor-modifie" /> })}
    <Route path="/essais/geotechnique/compactage/cbr" element={<CBR />} />
    {geoEssaiRoutes({ type: "cbr", title: "Essai CBR", base: "/essais/geotechnique/compactage/cbr", categoryPath: "/essais/geotechnique/compactage", categoryLabel: "Compactage", customSaisie: <CBRDataEntry />, customReport: <CBRReport /> })}
    <Route path="/essais/geotechnique/compactage/densite-place" element={<DensitePlace />} />
    {geoEssaiRoutes({ type: "densite-place", title: "Densité en Place", base: "/essais/geotechnique/compactage/densite-place", categoryPath: "/essais/geotechnique/compactage", categoryLabel: "Compactage" })}
    {/* Mécaniques */}
    <Route path="/essais/geotechnique/mecanique/cisaillement" element={<Cisaillement />} />
    {geoEssaiRoutes({ type: "cisaillement", title: "Cisaillement Direct", base: "/essais/geotechnique/mecanique/cisaillement", categoryPath: "/essais/geotechnique/mecanique", categoryLabel: "Mécaniques" })}
    <Route path="/essais/geotechnique/mecanique/compression-simple" element={<CompressionSimple />} />
    {geoEssaiRoutes({ type: "compression-simple", title: "Compression Simple", base: "/essais/geotechnique/mecanique/compression-simple", categoryPath: "/essais/geotechnique/mecanique", categoryLabel: "Mécaniques" })}
    <Route path="/essais/geotechnique/mecanique/triaxial" element={<Triaxial />} />
    {geoEssaiRoutes({ type: "triaxial", title: "Essai Triaxial", base: "/essais/geotechnique/mecanique/triaxial", categoryPath: "/essais/geotechnique/mecanique", categoryLabel: "Mécaniques" })}
    <Route path="/essais/geotechnique/mecanique/oedometrique" element={<Oedometrique />} />
    {geoEssaiRoutes({ type: "oedometrique", title: "Essai Œdométrique", base: "/essais/geotechnique/mecanique/oedometrique", categoryPath: "/essais/geotechnique/mecanique", categoryLabel: "Mécaniques" })}
    {/* In-Situ */}
    <Route path="/essais/geotechnique/in-situ/penetrometre" element={<Penetrometre />} />
    {geoEssaiRoutes({ type: "penetrometre", title: "Pénétromètre Dynamique", base: "/essais/geotechnique/in-situ/penetrometre", categoryPath: "/essais/geotechnique/in-situ", categoryLabel: "In-Situ" })}
    <Route path="/essais/geotechnique/in-situ/pressiometre" element={<Pressiometre />} />
    {geoEssaiRoutes({ type: "pressiometre", title: "Pressiomètre", base: "/essais/geotechnique/in-situ/pressiometre", categoryPath: "/essais/geotechnique/in-situ", categoryLabel: "In-Situ" })}
    <Route path="/essais/geotechnique/in-situ/plaque" element={<Plaque />} />
    {geoEssaiRoutes({ type: "plaque", title: "Essai de Plaque", base: "/essais/geotechnique/in-situ/plaque", categoryPath: "/essais/geotechnique/in-situ", categoryLabel: "In-Situ", customSaisie: <PlaqueDataEntry />, customReport: <PlaqueReport /> })}
    <Route path="/essais/geotechnique/in-situ/sondage" element={<Sondage />} />
    {geoEssaiRoutes({ type: "sondage", title: "Sondage", base: "/essais/geotechnique/in-situ/sondage", categoryPath: "/essais/geotechnique/in-situ", categoryLabel: "In-Situ" })}
    <Route path="/essais/geotechnique/in-situ/densitometre" element={<Densitometre />} />
    {geoEssaiRoutes({ type: "densitometre", title: "Densitomètre à Membrane", base: "/essais/geotechnique/in-situ/densitometre", categoryPath: "/essais/geotechnique/in-situ", categoryLabel: "In-Situ", customSaisie: <DensitometreDataEntry />, customReport: <DensitometreReport /> })}
  </>
);
