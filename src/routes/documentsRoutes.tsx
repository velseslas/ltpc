import { lazy } from "react";
import { Route } from "react-router-dom";

const DocumentsIndex = lazy(() => import("@/pages/documents/DocumentsIndex"));
const LettresEngagement = lazy(() => import("@/pages/documents/LettresEngagement"));
const OffresService = lazy(() => import("@/pages/documents/OffresService"));
const OffreServicePreviewPage = lazy(() => import("@/pages/documents/OffreServicePreviewPage"));
const OffreServiceEditPage = lazy(() => import("@/pages/documents/OffreServiceEditPage"));
const OffresPrix = lazy(() => import("@/pages/documents/OffresPrix"));
const AttestationsBonneExecution = lazy(() => import("@/pages/documents/AttestationsBonneExecution"));
const Contrats = lazy(() => import("@/pages/documents/Contrats"));
const ContratPreviewPage = lazy(() => import("@/pages/documents/ContratPreviewPage"));
const ContratEditPage = lazy(() => import("@/pages/documents/ContratEditPage"));
const EngagementPreviewPage = lazy(() => import("@/pages/documents/EngagementPreviewPage"));
const EngagementEditPage = lazy(() => import("@/pages/documents/EngagementEditPage"));
const DossierAdministratif = lazy(() => import("@/pages/documents/DossierAdministratif"));

/** Routes des documents commerciaux (lettres, offres, contrats, attestations, dossier admin). */
export const documentsRoutes = (
  <>
    <Route path="/documents" element={<DocumentsIndex />} />
    <Route path="/documents/lettres-engagement" element={<LettresEngagement />} />
    <Route path="/documents/lettres-engagement/:id" element={<EngagementPreviewPage />} />
    <Route path="/documents/lettres-engagement/:id/edit" element={<EngagementEditPage />} />
    <Route path="/documents/offres-service" element={<OffresService />} />
    <Route path="/documents/offres-service/:id" element={<OffreServicePreviewPage />} />
    <Route path="/documents/offres-service/:id/edit" element={<OffreServiceEditPage />} />
    <Route path="/documents/offres-prix" element={<OffresPrix />} />
    <Route path="/documents/attestations" element={<AttestationsBonneExecution />} />
    <Route path="/documents/contrats" element={<Contrats />} />
    <Route path="/documents/contrats/:id" element={<ContratPreviewPage />} />
    <Route path="/documents/contrats/:id/edit" element={<ContratEditPage />} />
    <Route path="/documents/dossier-administratif" element={<DossierAdministratif />} />
  </>
);
