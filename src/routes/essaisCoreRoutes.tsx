import { lazy } from "react";
import { Route } from "react-router-dom";

const Essais = lazy(() => import("@/pages/Essais"));
const RedactionRapportTechnique = lazy(() => import("@/pages/essais/RedactionRapportTechnique"));
const NouveauRapportTechnique = lazy(() => import("@/pages/essais/rapports-techniques/NouveauRapportTechnique"));
const RapportTechniqueDetail = lazy(() => import("@/pages/essais/rapports-techniques/RapportTechniqueDetail"));
const HistoriqueRapportsTechniques = lazy(() => import("@/pages/essais/rapports-techniques/HistoriqueRapportsTechniques"));
const EssaisAudit = lazy(() => import("@/pages/essais/EssaisAudit"));

/** Routes racines du module Essais (dashboard, rapports techniques, audit). */
export const essaisCoreRoutes = (
  <>
    <Route path="/essais" element={<Essais />} />
    <Route path="/essais/redaction-rapport-technique" element={<RedactionRapportTechnique />} />
    <Route path="/essais/rapports-techniques" element={<RedactionRapportTechnique />} />
    <Route path="/essais/rapports-techniques/nouveau" element={<NouveauRapportTechnique />} />
    <Route path="/essais/rapports-techniques/:id" element={<RapportTechniqueDetail />} />
    <Route path="/essais/audit" element={<EssaisAudit />} />
  </>
);
