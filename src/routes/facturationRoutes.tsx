import { lazy } from "react";
import { Route } from "react-router-dom";

const FacturationDashboard = lazy(() => import("@/pages/facturation/FacturationDashboard"));
const FactureListe = lazy(() => import("@/pages/facturation/FactureListe"));
const EtatFactures = lazy(() => import("@/pages/facturation/EtatFactures"));
const FactureForm = lazy(() => import("@/pages/facturation/FactureForm"));
const FactureDetail = lazy(() => import("@/pages/facturation/FactureDetail"));
const FactureDataEntry = lazy(() => import("@/pages/facturation/FactureDataEntry"));
const FactureEdit = lazy(() => import("@/pages/facturation/FactureEdit"));
const FacturePreview = lazy(() => import("@/pages/facturation/FacturePreview"));
const DevisListe = lazy(() => import("@/pages/facturation/DevisListe"));
const DevisForm = lazy(() => import("@/pages/facturation/DevisForm"));
const DevisDetail = lazy(() => import("@/pages/facturation/DevisDetail"));
const DevisEdit = lazy(() => import("@/pages/facturation/DevisEdit"));
const DevisPreview = lazy(() => import("@/pages/facturation/DevisPreview"));
const DevisDataEntry = lazy(() => import("@/pages/facturation/DevisDataEntry"));
const BonCommandeListe = lazy(() => import("@/pages/facturation/BonCommandeListe"));
const BonCommandeForm = lazy(() => import("@/pages/facturation/BonCommandeForm"));
const EspeceListe = lazy(() => import("@/pages/facturation/EspeceListe"));
const EspeceForm = lazy(() => import("@/pages/facturation/EspeceForm"));
const EtatPaiementsEspece = lazy(() => import("@/pages/facturation/EtatPaiementsEspece"));
const EspeceEdit = lazy(() => import("@/pages/facturation/EspeceEdit"));
const VirementListe = lazy(() => import("@/pages/facturation/VirementListe"));
const VirementForm = lazy(() => import("@/pages/facturation/VirementForm"));
const ChequeListe = lazy(() => import("@/pages/facturation/ChequeListe"));
const ChequeForm = lazy(() => import("@/pages/facturation/ChequeForm"));
const ChequeEdit = lazy(() => import("@/pages/facturation/ChequeEdit"));
const RecapitulatifPaiements = lazy(() => import("@/pages/facturation/RecapitulatifPaiements"));
const PrixEssaiListe = lazy(() => import("@/pages/facturation/PrixEssaiListe"));

/** Routes facturation (factures, devis, bons de commande, paiements, prix). */
export const facturationRoutes = (
  <>
    <Route path="/facturation" element={<FacturationDashboard />} />
    <Route path="/facturation/factures" element={<FactureListe />} />
    <Route path="/facturation/factures/nouveau" element={<FactureForm />} />
    <Route path="/facturation/factures/:id" element={<FactureDetail />} />
    <Route path="/facturation/factures/:id/saisie" element={<FactureDataEntry />} />
    <Route path="/facturation/factures/:id/modifier" element={<FactureEdit />} />
    <Route path="/facturation/factures/:id/apercu" element={<FacturePreview />} />
    <Route path="/facturation/devis" element={<DevisListe />} />
    <Route path="/facturation/devis/nouveau" element={<DevisForm />} />
    <Route path="/facturation/devis/:id" element={<DevisDetail />} />
    <Route path="/facturation/devis/:id/saisie" element={<DevisDataEntry />} />
    <Route path="/facturation/devis/:id/modifier" element={<DevisEdit />} />
    <Route path="/facturation/devis/:id/apercu" element={<DevisPreview />} />
    <Route path="/facturation/bons-commande" element={<BonCommandeListe />} />
    <Route path="/facturation/bons-commande/nouveau" element={<BonCommandeForm />} />
    <Route path="/facturation/espece" element={<EspeceListe />} />
    <Route path="/facturation/espece/nouveau" element={<EspeceForm />} />
    <Route path="/facturation/espece/etat" element={<EtatPaiementsEspece />} />
    <Route path="/facturation/espece/:id/modifier" element={<EspeceEdit />} />
    <Route path="/facturation/cheque" element={<ChequeListe />} />
    <Route path="/facturation/cheque/nouveau" element={<ChequeForm />} />
    <Route path="/facturation/cheque/:id/modifier" element={<ChequeEdit />} />
    <Route path="/facturation/virements" element={<VirementListe />} />
    <Route path="/facturation/virements/nouveau" element={<VirementForm />} />
    <Route path="/facturation/recapitulatif" element={<RecapitulatifPaiements />} />
    <Route path="/facturation/prix-essais" element={<PrixEssaiListe />} />
  </>
);
