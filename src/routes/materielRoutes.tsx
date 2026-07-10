import { lazy } from "react";
import { Route } from "react-router-dom";

const MaterielDashboard = lazy(() => import("@/pages/materiel/MaterielDashboard"));
const MaterielListe = lazy(() => import("@/pages/materiel/MaterielListe"));
const MaterielInventaire = lazy(() => import("@/pages/materiel/MaterielInventaire"));
const MaterielDetail = lazy(() => import("@/pages/materiel/MaterielDetail"));
const MaterielListeForm = lazy(() => import("@/pages/materiel/MaterielListeForm"));
const MaterielAffectation = lazy(() => import("@/pages/materiel/MaterielAffectation"));
const MaterielAffectationForm = lazy(() => import("@/pages/materiel/MaterielAffectationForm"));
const MaterielEtalonnage = lazy(() => import("@/pages/materiel/MaterielEtalonnage"));
const MaterielEtalonnageForm = lazy(() => import("@/pages/materiel/MaterielEtalonnageForm"));
const MaterielMaintenance = lazy(() => import("@/pages/materiel/MaterielMaintenance"));
const MaterielMaintenanceForm = lazy(() => import("@/pages/materiel/MaterielMaintenanceForm"));
const MaterielAffectationHistorique = lazy(() => import("@/pages/materiel/MaterielAffectationHistorique"));
const MaterielEtalonnageHistorique = lazy(() => import("@/pages/materiel/MaterielEtalonnageHistorique"));
const MaterielEtalonnageCertificat = lazy(() => import("@/pages/materiel/MaterielEtalonnageCertificat"));
const MaterielMaintenanceHistorique = lazy(() => import("@/pages/materiel/MaterielMaintenanceHistorique"));
const MaterielAffectationDetail = lazy(() => import("@/pages/materiel/MaterielAffectationDetail"));
const MaterielEtalonnageDetail = lazy(() => import("@/pages/materiel/MaterielEtalonnageDetail"));
const MaterielMaintenanceDetail = lazy(() => import("@/pages/materiel/MaterielMaintenanceDetail"));
const MaterielDecharge = lazy(() => import("@/pages/materiel/MaterielDecharge"));
const MouvementsDashboard = lazy(() => import("@/pages/materiel/mouvements/MouvementsDashboard"));
const MouvementsListe = lazy(() => import("@/pages/materiel/mouvements/MouvementsListe"));
const MouvementsDechargeListe = lazy(() => import("@/pages/materiel/mouvements/MouvementsDechargeListe"));
const MouvementsPassationListe = lazy(() => import("@/pages/materiel/mouvements/MouvementsPassationListe"));
const MouvementForm = lazy(() => import("@/pages/materiel/mouvements/MouvementForm"));
const MouvementDetail = lazy(() => import("@/pages/materiel/mouvements/MouvementDetail"));

/** Routes du matériel (liste, affectation, étalonnage, maintenance, mouvements). */
export const materielRoutes = (
  <>
    <Route path="/materiel" element={<MaterielDashboard />} />
    <Route path="/materiel/liste" element={<MaterielListe />} />
    <Route path="/materiel/inventaire" element={<MaterielInventaire />} />
    <Route path="/materiel/liste/nouveau" element={<MaterielListeForm />} />
    <Route path="/materiel/liste/:id" element={<MaterielDetail />} />
    <Route path="/materiel/liste/:id/modifier" element={<MaterielListeForm />} />
    <Route path="/materiel/affectation" element={<MaterielAffectation />} />
    <Route path="/materiel/affectation/nouveau" element={<MaterielAffectationForm />} />
    <Route path="/materiel/affectation/historique" element={<MaterielAffectationHistorique />} />
    <Route path="/materiel/affectation/:id" element={<MaterielAffectationDetail />} />
    <Route path="/materiel/affectation/:id/modifier" element={<MaterielAffectationForm />} />
    <Route path="/materiel/etalonnage" element={<MaterielEtalonnage />} />
    <Route path="/materiel/etalonnage/nouveau" element={<MaterielEtalonnageForm />} />
    <Route path="/materiel/etalonnage/historique" element={<MaterielEtalonnageHistorique />} />
    <Route path="/materiel/etalonnage/:id" element={<MaterielEtalonnageDetail />} />
    <Route path="/materiel/etalonnage/:id/certificat" element={<MaterielEtalonnageCertificat />} />
    <Route path="/materiel/etalonnage/:id/modifier" element={<MaterielEtalonnageForm />} />
    <Route path="/materiel/maintenance" element={<MaterielMaintenance />} />
    <Route path="/materiel/maintenance/nouveau" element={<MaterielMaintenanceForm />} />
    <Route path="/materiel/maintenance/historique" element={<MaterielMaintenanceHistorique />} />
    <Route path="/materiel/maintenance/:id" element={<MaterielMaintenanceDetail />} />
    <Route path="/materiel/maintenance/:id/modifier" element={<MaterielMaintenanceForm />} />
    <Route path="/materiel/decharge" element={<MaterielDecharge />} />
    <Route path="/materiel/mouvements" element={<MouvementsDashboard />} />
    <Route path="/materiel/mouvements/liste" element={<MouvementsListe />} />
    <Route path="/materiel/mouvements/decharge" element={<MouvementsDechargeListe />} />
    <Route path="/materiel/mouvements/passation" element={<MouvementsPassationListe />} />
    <Route path="/materiel/mouvements/affectation" element={<MaterielAffectation />} />
    <Route path="/materiel/mouvements/affectation/nouveau" element={<MaterielAffectationForm />} />
    <Route path="/materiel/mouvements/affectation/:id" element={<MaterielAffectationDetail />} />
    <Route path="/materiel/mouvements/affectation/:id/modifier" element={<MaterielAffectationForm />} />
    <Route path="/materiel/mouvements/nouveau/:type" element={<MouvementForm />} />
    <Route path="/materiel/mouvements/:id" element={<MouvementDetail />} />
  </>
);
