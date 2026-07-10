import { lazy } from "react";
import { Route } from "react-router-dom";

const LaboratoiresMobiles = lazy(() => import("@/pages/laboratoires-mobiles/LaboratoiresMobiles"));
const LaboratoireMobileForm = lazy(() => import("@/pages/laboratoires-mobiles/LaboratoireMobileForm"));
const LaboratoireMobileDetail = lazy(() => import("@/pages/laboratoires-mobiles/LaboratoireMobileDetail"));
const LaboratoireMobileChantier = lazy(() => import("@/pages/laboratoires-mobiles/LaboratoireMobileChantier"));
const ChantierEchantillonForm = lazy(() => import("@/pages/laboratoires-mobiles/ChantierEchantillonForm"));
const ChantierEchantillonDetail = lazy(() => import("@/pages/laboratoires-mobiles/ChantierEchantillonDetail"));
const ChantierEchantillonDataEntry = lazy(() => import("@/pages/laboratoires-mobiles/ChantierEchantillonDataEntry"));
const ChantierEchantillonReport = lazy(() => import("@/pages/laboratoires-mobiles/ChantierEchantillonReport"));
const ChantierEchantillonBulletin = lazy(() => import("@/pages/laboratoires-mobiles/ChantierEchantillonBulletin"));
const EtatCoulages = lazy(() => import("@/pages/laboratoires-mobiles/EtatCoulages"));

/** Routes des laboratoires mobiles (chantiers, échantillons, coulages). */
export const laboMobilesRoutes = (
  <>
    <Route path="/laboratoires-mobiles" element={<LaboratoiresMobiles />} />
    <Route path="/laboratoires-mobiles/nouveau" element={<LaboratoireMobileForm />} />
    <Route path="/laboratoires-mobiles/:id" element={<LaboratoireMobileDetail />} />
    <Route path="/laboratoires-mobiles/:id/modifier" element={<LaboratoireMobileForm />} />
    <Route path="/laboratoires-mobiles/chantier/:chantierId" element={<LaboratoireMobileChantier />} />
    <Route path="/laboratoires-mobiles/chantier/:chantierId/echantillon/nouveau" element={<ChantierEchantillonForm />} />
    <Route path="/laboratoires-mobiles/chantier/:chantierId/echantillon/:echantillonId" element={<ChantierEchantillonDetail />} />
    <Route path="/laboratoires-mobiles/chantier/:chantierId/echantillon/:echantillonId/modifier" element={<ChantierEchantillonForm />} />
    <Route path="/laboratoires-mobiles/chantier/:chantierId/echantillon/:echantillonId/saisie" element={<ChantierEchantillonDataEntry />} />
    <Route path="/laboratoires-mobiles/chantier/:chantierId/echantillon/:echantillonId/rapport" element={<ChantierEchantillonReport />} />
    <Route path="/laboratoires-mobiles/chantier/:chantierId/echantillon/:echantillonId/bulletin" element={<ChantierEchantillonBulletin />} />
    <Route path="/laboratoires-mobiles/chantier/:chantierId/etat-coulages" element={<EtatCoulages />} />
  </>
);
