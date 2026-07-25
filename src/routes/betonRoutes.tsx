import { lazy } from "react";
import { Route } from "react-router-dom";

const EssaiBeton = lazy(() => import("@/pages/essais/EssaiBeton"));
const FormulationBeton = lazy(() => import("@/pages/essais/formulation/FormulationBeton"));
const FormulationBetonWizard = lazy(() => import("@/pages/essais/formulation/FormulationBetonWizard"));
const FormulationReport = lazy(() => import("@/pages/essais/formulation/FormulationReport"));
const EssaisConvenance = lazy(() => import("@/pages/essais/formulation/EssaisConvenance"));
const BetonFrais = lazy(() => import("@/pages/essais/BetonFrais"));
const BetonDurci = lazy(() => import("@/pages/essais/BetonDurci"));
const EtatEssaisBetonFrais = lazy(() => import("@/pages/essais/betonfrais/EtatEssaisBetonFrais"));
const EtatEssaisBetonDurci = lazy(() => import("@/pages/essais/betondurci/EtatEssaisBetonDurci"));
const BetonFraisNormes = lazy(() => import("@/pages/essais/betonfrais/BetonFraisNormes"));
const BetonDurciNormes = lazy(() => import("@/pages/essais/betonfrais/BetonDurciNormes"));
const Affaissement = lazy(() => import("@/pages/essais/betonfrais/Affaissement"));
const Temperature = lazy(() => import("@/pages/essais/betonfrais/Temperature"));
const TempsPrise = lazy(() => import("@/pages/essais/betonfrais/TempsPrise"));
const TeneurAir = lazy(() => import("@/pages/essais/betonfrais/TeneurAir"));
const EchantillonBetonFraisForm = lazy(() => import("@/pages/essais/betonfrais/EchantillonBetonFraisForm"));
const BetonFraisDetail = lazy(() => import("@/pages/essais/betonfrais/BetonFraisDetail"));
const BetonFraisDataEntry = lazy(() => import("@/pages/essais/betonfrais/BetonFraisDataEntry"));
const BetonFraisReport = lazy(() => import("@/pages/essais/betonfrais/BetonFraisReport"));
const CompressionTest = lazy(() => import("@/pages/essais/CompressionTest"));
const CompressionSampleForm = lazy(() => import("@/pages/essais/CompressionSampleForm"));
const CompressionDataEntry = lazy(() => import("@/pages/essais/CompressionDataEntry"));
const CompressionReport = lazy(() => import("@/pages/essais/CompressionReport"));
const CompressionDetail = lazy(() => import("@/pages/essais/CompressionDetail"));
const SamplingBulletin = lazy(() => import("@/pages/essais/SamplingBulletin"));
const TractionFendageTest = lazy(() => import("@/pages/essais/tractionfendage/TractionFendageTest"));
const TractionFendageSampleForm = lazy(() => import("@/pages/essais/tractionfendage/TractionFendageSampleForm"));
const TractionFendageDetail = lazy(() => import("@/pages/essais/tractionfendage/TractionFendageDetail"));
const TractionFendageDataEntry = lazy(() => import("@/pages/essais/tractionfendage/TractionFendageDataEntry"));
const TractionFendageReport = lazy(() => import("@/pages/essais/tractionfendage/TractionFendageReport"));
const ModuleElasticiteTest = lazy(() => import("@/pages/essais/moduleelasticite/ModuleElasticiteTest"));
const ModuleElasticiteSampleForm = lazy(() => import("@/pages/essais/moduleelasticite/ModuleElasticiteSampleForm"));
const ModuleElasticiteDetail = lazy(() => import("@/pages/essais/moduleelasticite/ModuleElasticiteDetail"));
const ModuleElasticiteDataEntry = lazy(() => import("@/pages/essais/moduleelasticite/ModuleElasticiteDataEntry"));
const ModuleElasticiteReport = lazy(() => import("@/pages/essais/moduleelasticite/ModuleElasticiteReport"));
const PermeabiliteTest = lazy(() => import("@/pages/essais/permeabilite/PermeabiliteTest"));
const PermeabiliteSampleForm = lazy(() => import("@/pages/essais/permeabilite/PermeabiliteSampleForm"));
const PermeabiliteDetail = lazy(() => import("@/pages/essais/permeabilite/PermeabiliteDetail"));
const PermeabiliteDataEntry = lazy(() => import("@/pages/essais/permeabilite/PermeabiliteDataEntry"));
const PermeabiliteReport = lazy(() => import("@/pages/essais/permeabilite/PermeabiliteReport"));
const EssaiDestructif = lazy(() => import("@/pages/essais/EssaiDestructif"));
const DestructifNormes = lazy(() => import("@/pages/essais/DestructifNormes"));
const CarottageTest = lazy(() => import("@/pages/essais/destructif/CarottageTest"));
const CarottageSampleForm = lazy(() => import("@/pages/essais/destructif/CarottageSampleForm"));
const CarottageDetail = lazy(() => import("@/pages/essais/destructif/CarottageDetail"));
const CarottageDataEntry = lazy(() => import("@/pages/essais/destructif/CarottageDataEntry"));
const CarottageEvaluationNormative = lazy(() => import("@/pages/essais/destructif/CarottageEvaluationNormative"));
const CarottageReport = lazy(() => import("@/pages/essais/destructif/CarottageReport"));
const EtatEssaisCarottage = lazy(() => import("@/pages/essais/destructif/EtatEssaisCarottage"));
const EssaiNonDestructif = lazy(() => import("@/pages/essais/EssaiNonDestructif"));
const NonDestructifNormes = lazy(() => import("@/pages/essais/NonDestructifNormes"));
const SclerometreTest = lazy(() => import("@/pages/essais/nondestructif/SclerometreTest"));
const SclerometreSampleForm = lazy(() => import("@/pages/essais/nondestructif/SclerometreSampleForm"));
const SclerometreDetail = lazy(() => import("@/pages/essais/nondestructif/SclerometreDetail"));
const SclerometreDataEntry = lazy(() => import("@/pages/essais/nondestructif/SclerometreDataEntry"));
const SclerometreReport = lazy(() => import("@/pages/essais/nondestructif/SclerometreReport"));
const UltrasonTest = lazy(() => import("@/pages/essais/nondestructif/UltrasonTest"));
const UltrasonSampleForm = lazy(() => import("@/pages/essais/nondestructif/UltrasonSampleForm"));
const UltrasonDetail = lazy(() => import("@/pages/essais/nondestructif/UltrasonDetail"));
const UltrasonDataEntry = lazy(() => import("@/pages/essais/nondestructif/UltrasonDataEntry"));
const UltrasonReport = lazy(() => import("@/pages/essais/nondestructif/UltrasonReport"));

/** Génère les routes standard d'un essai béton frais (nouveau/détail/saisie/modifier/rapport). */
function betonFraisRoutes(cfg: { type: string; title: string; base: string; norm: string; showClasseConsistance?: boolean }) {
  return (
    <>
      <Route path={`${cfg.base}/nouveau`} element={<EchantillonBetonFraisForm essaiType={cfg.type} essaiTitle={cfg.title} basePath={cfg.base} showClasseConsistance={cfg.showClasseConsistance} />} />
      <Route path={`${cfg.base}/:id`} element={<BetonFraisDetail essaiType={cfg.type} essaiTitle={cfg.title} basePath={cfg.base} />} />
      <Route path={`${cfg.base}/:id/saisie`} element={<BetonFraisDataEntry essaiType={cfg.type} essaiTitle={cfg.title} basePath={cfg.base} />} />
      <Route path={`${cfg.base}/:id/modifier`} element={<EchantillonBetonFraisForm essaiType={cfg.type} essaiTitle={cfg.title} basePath={cfg.base} showClasseConsistance={cfg.showClasseConsistance} />} />
      <Route path={`${cfg.base}/:id/rapport`} element={<BetonFraisReport essaiType={cfg.type} essaiTitle={cfg.title} normRef={cfg.norm} basePath={cfg.base} />} />
    </>
  );
}

/** Routes des essais Béton (formulation, frais, durci, destructifs, non destructifs). */
export const betonRoutes = (
  <>
    <Route path="/essais/beton" element={<EssaiBeton />} />
    {/* Formulation */}
    <Route path="/essais/beton/formulation" element={<FormulationBeton />} />
    <Route path="/essais/beton/formulation/nouveau" element={<FormulationBetonWizard />} />
    <Route path="/essais/beton/formulation/:formulationId/modifier-etude" element={<FormulationBetonWizard />} />
    <Route path="/essais/beton/formulation/:id/rapport" element={<FormulationReport />} />
    <Route path="/essais/beton/formulation/:formulationId/convenance" element={<EssaisConvenance />} />
    {/* Béton Frais */}
    <Route path="/essais/beton/beton-frais" element={<BetonFrais />} />
    <Route path="/essais/beton/beton-frais/etat-essais" element={<EtatEssaisBetonFrais />} />
    <Route path="/essais/beton/beton-frais/normes" element={<BetonFraisNormes />} />
    <Route path="/essais/beton/beton-frais/affaissement" element={<Affaissement />} />
    {betonFraisRoutes({ type: "affaissement", title: "Essai d'Affaissement", base: "/essais/beton/beton-frais/affaissement", norm: "Norme NF EN 12350-2", showClasseConsistance: true })}
    <Route path="/essais/beton/beton-frais/temperature" element={<Temperature />} />
    {betonFraisRoutes({ type: "temperature", title: "Essai de Température De Béton", base: "/essais/beton/beton-frais/temperature", norm: "Norme NF EN 12350-1" })}
    <Route path="/essais/beton/beton-frais/temps-prise" element={<TempsPrise />} />
    {betonFraisRoutes({ type: "temps-prise", title: "Temps de Prise sur Site", base: "/essais/beton/beton-frais/temps-prise", norm: "Norme NF EN 480-2" })}
    <Route path="/essais/beton/beton-frais/teneur-air" element={<TeneurAir />} />
    {betonFraisRoutes({ type: "teneur-air", title: "Teneur en Air", base: "/essais/beton/beton-frais/teneur-air", norm: "Norme NF EN 12350-7" })}
    {/* Béton Durci */}
    <Route path="/essais/beton/beton-durci" element={<BetonDurci />} />
    <Route path="/essais/beton/beton-durci/normes" element={<BetonDurciNormes />} />
    <Route path="/essais/beton/beton-durci/etat-essais" element={<EtatEssaisBetonDurci />} />
    <Route path="/essais/beton/beton-durci/compression" element={<CompressionTest />} />
    <Route path="/essais/beton/beton-durci/compression/nouveau" element={<CompressionSampleForm />} />
    <Route path="/essais/beton/beton-durci/compression/:id/saisie" element={<CompressionDataEntry />} />
    <Route path="/essais/beton/beton-durci/compression/:id/rapport" element={<CompressionReport />} />
    <Route path="/essais/beton/beton-durci/compression/:id/bulletin" element={<SamplingBulletin />} />
    <Route path="/essais/beton/beton-durci/compression/:id" element={<CompressionDetail />} />
    <Route path="/essais/beton/beton-durci/compression/:id/modifier" element={<CompressionSampleForm />} />
    <Route path="/essais/beton/beton-durci/traction-fendage" element={<TractionFendageTest />} />
    <Route path="/essais/beton/beton-durci/traction-fendage/nouveau" element={<TractionFendageSampleForm />} />
    <Route path="/essais/beton/beton-durci/traction-fendage/:id" element={<TractionFendageDetail />} />
    <Route path="/essais/beton/beton-durci/traction-fendage/:id/modifier" element={<TractionFendageSampleForm />} />
    <Route path="/essais/beton/beton-durci/traction-fendage/:id/saisie" element={<TractionFendageDataEntry />} />
    <Route path="/essais/beton/beton-durci/traction-fendage/:id/rapport" element={<TractionFendageReport />} />
    <Route path="/essais/beton/beton-durci/module-elasticite" element={<ModuleElasticiteTest />} />
    <Route path="/essais/beton/beton-durci/module-elasticite/nouveau" element={<ModuleElasticiteSampleForm />} />
    <Route path="/essais/beton/beton-durci/module-elasticite/:id" element={<ModuleElasticiteDetail />} />
    <Route path="/essais/beton/beton-durci/module-elasticite/:id/modifier" element={<ModuleElasticiteSampleForm />} />
    <Route path="/essais/beton/beton-durci/module-elasticite/:id/saisie" element={<ModuleElasticiteDataEntry />} />
    <Route path="/essais/beton/beton-durci/module-elasticite/:id/rapport" element={<ModuleElasticiteReport />} />
    <Route path="/essais/beton/beton-durci/permeabilite" element={<PermeabiliteTest />} />
    <Route path="/essais/beton/beton-durci/permeabilite/nouveau" element={<PermeabiliteSampleForm />} />
    <Route path="/essais/beton/beton-durci/permeabilite/:id" element={<PermeabiliteDetail />} />
    <Route path="/essais/beton/beton-durci/permeabilite/:id/modifier" element={<PermeabiliteSampleForm />} />
    <Route path="/essais/beton/beton-durci/permeabilite/:id/saisie" element={<PermeabiliteDataEntry />} />
    <Route path="/essais/beton/beton-durci/permeabilite/:id/rapport" element={<PermeabiliteReport />} />
    {/* Destructif */}
    <Route path="/essais/beton/destructif" element={<EssaiDestructif />} />
    <Route path="/essais/beton/destructif/normes" element={<DestructifNormes />} />
    <Route path="/essais/beton/destructif/carottage" element={<CarottageTest />} />
    <Route path="/essais/beton/destructif/carottage/nouveau" element={<CarottageSampleForm />} />
    <Route path="/essais/beton/destructif/carottage/:id" element={<CarottageDetail />} />
    <Route path="/essais/beton/destructif/carottage/:id/modifier" element={<CarottageSampleForm />} />
    <Route path="/essais/beton/destructif/carottage/:id/saisie" element={<CarottageDataEntry />} />
    <Route path="/essais/beton/destructif/carottage/:id/evaluation-normative" element={<CarottageEvaluationNormative />} />
    <Route path="/essais/beton/destructif/carottage/:id/rapport" element={<CarottageReport />} />
    <Route path="/essais/beton/destructif/carottage/etat-essais" element={<EtatEssaisCarottage />} />
    {/* Non destructif */}
    <Route path="/essais/beton/non-destructif" element={<EssaiNonDestructif />} />
    <Route path="/essais/beton/non-destructif/normes" element={<NonDestructifNormes />} />
    <Route path="/essais/beton/non-destructif/sclerometre" element={<SclerometreTest />} />
    <Route path="/essais/beton/non-destructif/sclerometre/nouveau" element={<SclerometreSampleForm />} />
    <Route path="/essais/beton/non-destructif/sclerometre/:id" element={<SclerometreDetail />} />
    <Route path="/essais/beton/non-destructif/sclerometre/:id/modifier" element={<SclerometreSampleForm />} />
    <Route path="/essais/beton/non-destructif/sclerometre/:id/saisie" element={<SclerometreDataEntry />} />
    <Route path="/essais/beton/non-destructif/sclerometre/:id/rapport" element={<SclerometreReport />} />
    <Route path="/essais/beton/non-destructif/ultrason" element={<UltrasonTest />} />
    <Route path="/essais/beton/non-destructif/ultrason/nouveau" element={<UltrasonSampleForm />} />
    <Route path="/essais/beton/non-destructif/ultrason/:id" element={<UltrasonDetail />} />
    <Route path="/essais/beton/non-destructif/ultrason/:id/modifier" element={<UltrasonSampleForm />} />
    <Route path="/essais/beton/non-destructif/ultrason/:id/saisie" element={<UltrasonDataEntry />} />
    <Route path="/essais/beton/non-destructif/ultrason/:id/rapport" element={<UltrasonReport />} />
  </>
);
