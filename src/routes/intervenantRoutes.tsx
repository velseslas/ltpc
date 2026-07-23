import { lazy } from "react";
import { Route } from "react-router-dom";

const IntervenantSelection = lazy(() => import("@/pages/IntervenantSelection"));
const Clients = lazy(() => import("@/pages/Clients"));
const ClientDetail = lazy(() => import("@/pages/ClientDetail"));
const ClientForm = lazy(() => import("@/pages/ClientForm"));
const ChantierForm = lazy(() => import("@/pages/ChantierForm"));
const ChantierDetail = lazy(() => import("@/pages/intervenant/ChantierDetail"));
const Producteurs = lazy(() => import("@/pages/Producteurs"));
const Cimenterie = lazy(() => import("@/pages/producteurs/Cimenterie"));
const CimenterieForm = lazy(() => import("@/pages/producteurs/CimenterieForm"));
const CimenterieDetail = lazy(() => import("@/pages/producteurs/CimenterieDetail"));
const Carriere = lazy(() => import("@/pages/producteurs/Carriere"));
const CarriereForm = lazy(() => import("@/pages/producteurs/CarriereForm"));
const CarriereDetail = lazy(() => import("@/pages/producteurs/CarriereDetail"));
const Adjuvant = lazy(() => import("@/pages/producteurs/Adjuvant"));
const AdjuvantForm = lazy(() => import("@/pages/producteurs/AdjuvantForm"));
const AdjuvantDetail = lazy(() => import("@/pages/producteurs/AdjuvantDetail"));
const SourceEau = lazy(() => import("@/pages/producteurs/SourceEau"));
const SourceEauForm = lazy(() => import("@/pages/producteurs/SourceEauForm"));
const SourceEauDetail = lazy(() => import("@/pages/producteurs/SourceEauDetail"));
const CentraleBeton = lazy(() => import("@/pages/producteurs/CentraleBeton"));
const CentraleBetonForm = lazy(() => import("@/pages/producteurs/CentraleBetonForm"));
const CentraleBetonDetail = lazy(() => import("@/pages/producteurs/CentraleBetonDetail"));
const FormulationForm = lazy(() => import("@/pages/producteurs/FormulationForm"));
const PrestataireListe = lazy(() => import("@/pages/prestataires/PrestataireListe"));
const PrestataireForm = lazy(() => import("@/pages/prestataires/PrestataireForm"));
const PrestataireDetail = lazy(() => import("@/pages/prestataires/PrestataireDetail"));
const BonCommandePrestataireForm = lazy(() => import("@/pages/prestataires/BonCommandePrestataireForm"));
const MaitreOuvrageListe = lazy(() => import("@/pages/maitres-ouvrage/MaitreOuvrageListe"));
const MaitreOuvrageForm = lazy(() => import("@/pages/maitres-ouvrage/MaitreOuvrageForm"));
const MaitreOuvrageDetail = lazy(() => import("@/pages/maitres-ouvrage/MaitreOuvrageDetail"));
const MaitreOeuvreListe = lazy(() => import("@/pages/maitres-oeuvre/MaitreOeuvreListe"));
const MaitreOeuvreForm = lazy(() => import("@/pages/maitres-oeuvre/MaitreOeuvreForm"));
const MaitreOeuvreDetail = lazy(() => import("@/pages/maitres-oeuvre/MaitreOeuvreDetail"));

/** Routes du module Intervenant (clients, producteurs, prestataires, MOA/MOE). */
export const intervenantRoutes = (
  <>
    <Route path="/intervenant" element={<IntervenantSelection />} />
    <Route path="/intervenant/clients" element={<Clients />} />
    <Route path="/intervenant/clients/nouveau" element={<ClientForm />} />
    <Route path="/intervenant/clients/:id" element={<ClientDetail />} />
    <Route path="/intervenant/clients/:id/modifier" element={<ClientForm />} />
    <Route path="/intervenant/chantiers/nouveau" element={<ChantierForm />} />
    <Route path="/intervenant/chantiers/:chantierId/modifier" element={<ChantierForm />} />
    <Route path="/intervenant/producteurs" element={<Producteurs />} />
    <Route path="/intervenant/producteurs/cimenterie" element={<Cimenterie />} />
    <Route path="/intervenant/producteurs/cimenterie/nouveau" element={<CimenterieForm />} />
    <Route path="/intervenant/producteurs/cimenterie/:id" element={<CimenterieDetail />} />
    <Route path="/intervenant/producteurs/cimenterie/:id/modifier" element={<CimenterieForm />} />
    <Route path="/intervenant/producteurs/carriere" element={<Carriere />} />
    <Route path="/intervenant/producteurs/carriere/nouveau" element={<CarriereForm />} />
    <Route path="/intervenant/producteurs/carriere/:id" element={<CarriereDetail />} />
    <Route path="/intervenant/producteurs/carriere/:id/modifier" element={<CarriereForm />} />
    <Route path="/intervenant/producteurs/adjuvant" element={<Adjuvant />} />
    <Route path="/intervenant/producteurs/adjuvant/nouveau" element={<AdjuvantForm />} />
    <Route path="/intervenant/producteurs/adjuvant/:id" element={<AdjuvantDetail />} />
    <Route path="/intervenant/producteurs/adjuvant/:id/modifier" element={<AdjuvantForm />} />
    <Route path="/intervenant/producteurs/eau" element={<SourceEau />} />
    <Route path="/intervenant/producteurs/eau/nouveau" element={<SourceEauForm />} />
    <Route path="/intervenant/producteurs/eau/:id" element={<SourceEauDetail />} />
    <Route path="/intervenant/producteurs/eau/:id/modifier" element={<SourceEauForm />} />
    <Route path="/intervenant/producteurs/centrale" element={<CentraleBeton />} />
    <Route path="/intervenant/producteurs/centrale/nouveau" element={<CentraleBetonForm />} />
    <Route path="/intervenant/producteurs/centrale/:id" element={<CentraleBetonDetail />} />
    <Route path="/intervenant/producteurs/centrale/:id/modifier" element={<CentraleBetonForm />} />
    <Route path="/intervenant/producteurs/centrale/:id/formulation/nouveau" element={<FormulationForm />} />
    <Route path="/intervenant/producteurs/centrale/:id/formulation/:formulationId/modifier" element={<FormulationForm />} />
    <Route path="/intervenant/prestataires" element={<PrestataireListe />} />
    <Route path="/intervenant/prestataires/nouveau" element={<PrestataireForm />} />
    <Route path="/intervenant/prestataires/:id" element={<PrestataireDetail />} />
    <Route path="/intervenant/prestataires/:id/modifier" element={<PrestataireForm />} />
    <Route path="/intervenant/prestataires/:id/bon-commande/nouveau" element={<BonCommandePrestataireForm />} />
    <Route path="/intervenant/maitres-ouvrage" element={<MaitreOuvrageListe />} />
    <Route path="/intervenant/maitres-ouvrage/nouveau" element={<MaitreOuvrageForm />} />
    <Route path="/intervenant/maitres-ouvrage/:id" element={<MaitreOuvrageDetail />} />
    <Route path="/intervenant/maitres-ouvrage/:id/modifier" element={<MaitreOuvrageForm />} />
    <Route path="/intervenant/maitres-oeuvre" element={<MaitreOeuvreListe />} />
    <Route path="/intervenant/maitres-oeuvre/nouveau" element={<MaitreOeuvreForm />} />
    <Route path="/intervenant/maitres-oeuvre/:id" element={<MaitreOeuvreDetail />} />
    <Route path="/intervenant/maitres-oeuvre/:id/modifier" element={<MaitreOeuvreForm />} />
  </>
);
