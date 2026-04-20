import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { PermissionProvider } from "@/hooks/usePermissionContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import IntervenantSelection from "./pages/IntervenantSelection";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import ClientForm from "./pages/ClientForm";
import ChantierForm from "./pages/ChantierForm";
import Producteurs from "./pages/Producteurs";
import Cimenterie from "./pages/producteurs/Cimenterie";
import CimenterieForm from "./pages/producteurs/CimenterieForm";
import CimenterieDetail from "./pages/producteurs/CimenterieDetail";
import Carriere from "./pages/producteurs/Carriere";
import CarriereForm from "./pages/producteurs/CarriereForm";
import CarriereDetail from "./pages/producteurs/CarriereDetail";
import Adjuvant from "./pages/producteurs/Adjuvant";
import AdjuvantForm from "./pages/producteurs/AdjuvantForm";
import AdjuvantDetail from "./pages/producteurs/AdjuvantDetail";
import SourceEau from "./pages/producteurs/SourceEau";
import SourceEauForm from "./pages/producteurs/SourceEauForm";
import SourceEauDetail from "./pages/producteurs/SourceEauDetail";
import CentraleBeton from "./pages/producteurs/CentraleBeton";
import CentraleBetonForm from "./pages/producteurs/CentraleBetonForm";
import CentraleBetonDetail from "./pages/producteurs/CentraleBetonDetail";
import FormulationForm from "./pages/producteurs/FormulationForm";
import Essais from "./pages/Essais";
import EssaiBeton from "./pages/essais/EssaiBeton";
import EssaiGranulat from "./pages/essais/EssaiGranulat";
import EssaiGeotechnique from "./pages/essais/EssaiGeotechnique";
import EssaiIdentification from "./pages/essais/geotechnique/EssaiIdentification";
import EssaiCompactage from "./pages/essais/geotechnique/EssaiCompactage";
import EssaiMecaniqueSol from "./pages/essais/geotechnique/EssaiMecaniqueSol";
import EssaiInSitu from "./pages/essais/geotechnique/EssaiInSitu";
// Géotechnique - Identification
import LimitesAtterberg from "./pages/essais/geotechnique/identification/LimitesAtterberg";
import GranulometrieSol from "./pages/essais/geotechnique/identification/GranulometrieSol";
import GranulometrieSolDataEntry from "./pages/essais/geotechnique/identification/GranulometrieSolDataEntry";
import GranulometrieSolReport from "./pages/essais/geotechnique/identification/GranulometrieSolReport";
import TeneurEauSol from "./pages/essais/geotechnique/identification/TeneurEauSol";
import ClassificationSol from "./pages/essais/geotechnique/identification/ClassificationSol";
import TeneurEauSolDataEntry from "./pages/essais/geotechnique/identification/TeneurEauSolDataEntry";
import TeneurEauSolReport from "./pages/essais/geotechnique/identification/TeneurEauSolReport";
import ClassificationSolDataEntry from "./pages/essais/geotechnique/identification/ClassificationSolDataEntry";
import ClassificationSolReport from "./pages/essais/geotechnique/identification/ClassificationSolReport";
// Géotechnique - Compactage
import ProctorNormal from "./pages/essais/geotechnique/compactage/ProctorNormal";
import ProctorModifie from "./pages/essais/geotechnique/compactage/ProctorModifie";
import CBR from "./pages/essais/geotechnique/compactage/CBR";
import DensitePlace from "./pages/essais/geotechnique/compactage/DensitePlace";
// Géotechnique - Mécaniques
import Cisaillement from "./pages/essais/geotechnique/mecanique/Cisaillement";
import CompressionSimple from "./pages/essais/geotechnique/mecanique/CompressionSimple";
import Triaxial from "./pages/essais/geotechnique/mecanique/Triaxial";
import Oedometrique from "./pages/essais/geotechnique/mecanique/Oedometrique";
// Géotechnique - In-Situ
import Penetrometre from "./pages/essais/geotechnique/insitu/Penetrometre";
import Pressiometre from "./pages/essais/geotechnique/insitu/Pressiometre";
import Plaque from "./pages/essais/geotechnique/insitu/Plaque";
import PlaqueDataEntry from "./pages/essais/geotechnique/insitu/PlaqueDataEntry";
import PlaqueReport from "./pages/essais/geotechnique/insitu/PlaqueReport";
import Sondage from "./pages/essais/geotechnique/insitu/Sondage";
import Densitometre from "./pages/essais/geotechnique/insitu/Densitometre";
import DensitometreDataEntry from "./pages/essais/geotechnique/insitu/DensitometreDataEntry";
import DensitometreReport from "./pages/essais/geotechnique/insitu/DensitometreReport";
// Géotechnique - shared
import EchantillonGeotechniqueForm from "./pages/essais/geotechnique/EchantillonGeotechniqueForm";
import GeotechniqueDetail from "./pages/essais/geotechnique/GeotechniqueDetail";
import GeotechniqueDataEntry from "./pages/essais/geotechnique/GeotechniqueDataEntry";
import ProctorDataEntry from "./pages/essais/geotechnique/compactage/ProctorDataEntry";
import ProctorReport from "./pages/essais/geotechnique/compactage/ProctorReport";
import CBRDataEntry from "./pages/essais/geotechnique/compactage/CBRDataEntry";
import CBRReport from "./pages/essais/geotechnique/compactage/CBRReport";
import LimitesAtterbergDataEntry from "./pages/essais/geotechnique/identification/LimitesAtterbergDataEntry";
import LimitesAtterbergReport from "./pages/essais/geotechnique/identification/LimitesAtterbergReport";
import IdentificationNormes from "./pages/essais/geotechnique/normes/IdentificationNormes";
import CompactageNormes from "./pages/essais/geotechnique/normes/CompactageNormes";
import MecaniqueNormes from "./pages/essais/geotechnique/normes/MecaniqueNormes";
import InSituNormes from "./pages/essais/geotechnique/normes/InSituNormes";
import EssaiProprete from "./pages/essais/granulat/EssaiProprete";
import EssaiPhysique from "./pages/essais/granulat/EssaiPhysique";
import EssaiMecanique from "./pages/essais/granulat/EssaiMecanique";
// Essais Physiques Granulat
import AnalyseGranulometrie from "./pages/essais/granulat/physiques/AnalyseGranulometrie";
import MasseVolumique from "./pages/essais/granulat/physiques/MasseVolumique";
import FormeGranulats from "./pages/essais/granulat/physiques/FormeGranulats";
import TeneurEau from "./pages/essais/granulat/physiques/TeneurEau";
// Essais Propreté Granulat
import EquivalentSable from "./pages/essais/granulat/proprete/EquivalentSable";
import BleuMethylene from "./pages/essais/granulat/proprete/BleuMethylene";
import MatiereOrganique from "./pages/essais/granulat/proprete/MatiereOrganique";
// Essais Mécaniques Granulat
import LosAngeles from "./pages/essais/granulat/mecaniques/LosAngeles";
import MicroDeval from "./pages/essais/granulat/mecaniques/MicroDeval";
import Ecrasement from "./pages/essais/granulat/mecaniques/Ecrasement";
import Friabilite from "./pages/essais/granulat/mecaniques/Friabilite";
import EchantillonGranulatForm from "./pages/essais/granulat/EchantillonGranulatForm";
import GranulatDataEntry from "./pages/essais/granulat/saisie/GranulatDataEntry";
import GranulatDetail from "./pages/essais/granulat/detail/GranulatDetail";
import GranulatReport from "./pages/essais/granulat/rapport/GranulatReport";
import EtatEssaisGranulat from "./pages/essais/granulat/EtatEssaisGranulat";
import EtatEssaisBetonFrais from "./pages/essais/betonfrais/EtatEssaisBetonFrais";
import EtatEssaisBetonDurci from "./pages/essais/betondurci/EtatEssaisBetonDurci";
import BetonFrais from "./pages/essais/BetonFrais";
import BetonDurci from "./pages/essais/BetonDurci";
import CompressionTest from "./pages/essais/CompressionTest";
import CompressionSampleForm from "./pages/essais/CompressionSampleForm";
import CompressionDataEntry from "./pages/essais/CompressionDataEntry";
import CompressionReport from "./pages/essais/CompressionReport";
import SamplingBulletin from "./pages/essais/SamplingBulletin";
import CompressionDetail from "./pages/essais/CompressionDetail";
// Béton Frais imports
import Affaissement from "./pages/essais/betonfrais/Affaissement";
import Temperature from "./pages/essais/betonfrais/Temperature";
import TempsPrise from "./pages/essais/betonfrais/TempsPrise";
import TeneurAir from "./pages/essais/betonfrais/TeneurAir";
import EchantillonBetonFraisForm from "./pages/essais/betonfrais/EchantillonBetonFraisForm";
import BetonFraisDetail from "./pages/essais/betonfrais/BetonFraisDetail";
import BetonFraisDataEntry from "./pages/essais/betonfrais/BetonFraisDataEntry";
import BetonFraisReport from "./pages/essais/betonfrais/BetonFraisReport";
import BetonFraisNormes from "./pages/essais/betonfrais/BetonFraisNormes";
// Traction par Fendage imports
import TractionFendageTest from "./pages/essais/tractionfendage/TractionFendageTest";
import TractionFendageSampleForm from "./pages/essais/tractionfendage/TractionFendageSampleForm";
import TractionFendageDetail from "./pages/essais/tractionfendage/TractionFendageDetail";
import TractionFendageDataEntry from "./pages/essais/tractionfendage/TractionFendageDataEntry";
import TractionFendageReport from "./pages/essais/tractionfendage/TractionFendageReport";
// Module d'Élasticité imports
import ModuleElasticiteTest from "./pages/essais/moduleelasticite/ModuleElasticiteTest";
import ModuleElasticiteSampleForm from "./pages/essais/moduleelasticite/ModuleElasticiteSampleForm";
import ModuleElasticiteDetail from "./pages/essais/moduleelasticite/ModuleElasticiteDetail";
import ModuleElasticiteDataEntry from "./pages/essais/moduleelasticite/ModuleElasticiteDataEntry";
import ModuleElasticiteReport from "./pages/essais/moduleelasticite/ModuleElasticiteReport";
// Perméabilité imports
import PermeabiliteTest from "./pages/essais/permeabilite/PermeabiliteTest";
import PermeabiliteSampleForm from "./pages/essais/permeabilite/PermeabiliteSampleForm";
import PermeabiliteDetail from "./pages/essais/permeabilite/PermeabiliteDetail";
import PermeabiliteDataEntry from "./pages/essais/permeabilite/PermeabiliteDataEntry";
import PermeabiliteReport from "./pages/essais/permeabilite/PermeabiliteReport";

import FormulationBeton from "./pages/essais/formulation/FormulationBeton";
import FormulationBetonWizard from "./pages/essais/formulation/FormulationBetonWizard";
import EssaiDestructif from "./pages/essais/EssaiDestructif";
// Destructif - Carottage
import CarottageTest from "./pages/essais/destructif/CarottageTest";
import CarottageSampleForm from "./pages/essais/destructif/CarottageSampleForm";
import CarottageDetail from "./pages/essais/destructif/CarottageDetail";
import CarottageDataEntry from "./pages/essais/destructif/CarottageDataEntry";
import CarottageReport from "./pages/essais/destructif/CarottageReport";
import EtatEssaisCarottage from "./pages/essais/destructif/EtatEssaisCarottage";
import EssaiNonDestructif from "./pages/essais/EssaiNonDestructif";
// Non Destructif - Scléromètre
import SclerometreTest from "./pages/essais/nondestructif/SclerometreTest";
import SclerometreSampleForm from "./pages/essais/nondestructif/SclerometreSampleForm";
import SclerometreDetail from "./pages/essais/nondestructif/SclerometreDetail";
import SclerometreDataEntry from "./pages/essais/nondestructif/SclerometreDataEntry";
import SclerometreReport from "./pages/essais/nondestructif/SclerometreReport";
// Non Destructif - Ultrason
import UltrasonTest from "./pages/essais/nondestructif/UltrasonTest";
import UltrasonSampleForm from "./pages/essais/nondestructif/UltrasonSampleForm";
import UltrasonDetail from "./pages/essais/nondestructif/UltrasonDetail";
import UltrasonDataEntry from "./pages/essais/nondestructif/UltrasonDataEntry";
import UltrasonReport from "./pages/essais/nondestructif/UltrasonReport";
// Normes imports
import BetonDurciNormes from "./pages/essais/betonfrais/BetonDurciNormes";
import DestructifNormes from "./pages/essais/DestructifNormes";
import NonDestructifNormes from "./pages/essais/NonDestructifNormes";
import GranulatPhysiquesNormes from "./pages/essais/granulat/GranulatPhysiquesNormes";
import GranulatPropreteNormes from "./pages/essais/granulat/GranulatPropreteNormes";
import GranulatMecaniquesNormes from "./pages/essais/granulat/GranulatMecaniquesNormes";
import MaitreOuvrageListe from "./pages/maitres-ouvrage/MaitreOuvrageListe";
import MaitreOuvrageForm from "./pages/maitres-ouvrage/MaitreOuvrageForm";
import MaitreOuvrageDetail from "./pages/maitres-ouvrage/MaitreOuvrageDetail";
import MaitreOeuvreListe from "./pages/maitres-oeuvre/MaitreOeuvreListe";
import MaitreOeuvreForm from "./pages/maitres-oeuvre/MaitreOeuvreForm";
import MaitreOeuvreDetail from "./pages/maitres-oeuvre/MaitreOeuvreDetail";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import Parametres from "./pages/Parametres";
import Entreprise from "./pages/parametres/Entreprise";
import TauxTVA from "./pages/parametres/TauxTVA";
import Facturation from "./pages/parametres/Facturation";
import Utilisateurs from "./pages/parametres/Utilisateurs";
import Authentification from "./pages/parametres/Authentification";
import Securite from "./pages/parametres/Securite";
import AuditLog from "./pages/parametres/AuditLog";
import NotificationsSettings from "./pages/parametres/NotificationsSettings";
import DatabaseSettings from "./pages/parametres/DatabaseSettings";
import SignatureSettings from "./pages/parametres/SignatureSettings";
import QRCodeSettings from "./pages/parametres/QRCodeSettings";
import SystemeSettings from "./pages/parametres/SystemeSettings";
import RolesPermissions from "./pages/parametres/RolesPermissions";
import RH from "./pages/RH";
import Postes from "./pages/rh/Postes";
import PosteForm from "./pages/rh/PosteForm";
import Employes from "./pages/rh/Employes";
import EmployeForm from "./pages/rh/EmployeForm";
import EmployeDetail from "./pages/rh/EmployeDetail";
import Affectations from "./pages/rh/Affectations";
import AffectationForm from "./pages/rh/AffectationForm";
import TechnicienDetail from "./pages/rh/TechnicienDetail";
import Documents from "./pages/rh/Documents";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import DocumentsIndex from "./pages/documents/DocumentsIndex";
import LettresEngagement from "./pages/documents/LettresEngagement";
import OffresService from "./pages/documents/OffresService";
import OffresPrix from "./pages/documents/OffresPrix";
import AttestationsBonneExecution from "./pages/documents/AttestationsBonneExecution";
import Contrats from "./pages/documents/Contrats";
import ContratPreviewPage from "./pages/documents/ContratPreviewPage";
import ContratEditPage from "./pages/documents/ContratEditPage";
import EngagementPreviewPage from "./pages/documents/EngagementPreviewPage";
import EngagementEditPage from "./pages/documents/EngagementEditPage";
import DossierAdministratif from "./pages/documents/DossierAdministratif";
import LaboratoiresMobiles from "./pages/laboratoires-mobiles/LaboratoiresMobiles";
import LaboratoireMobileForm from "./pages/laboratoires-mobiles/LaboratoireMobileForm";
import LaboratoireMobileDetail from "./pages/laboratoires-mobiles/LaboratoireMobileDetail";
import LaboratoireMobileChantier from "./pages/laboratoires-mobiles/LaboratoireMobileChantier";
import ChantierEchantillonForm from "./pages/laboratoires-mobiles/ChantierEchantillonForm";
import ChantierEchantillonDetail from "./pages/laboratoires-mobiles/ChantierEchantillonDetail";
import ChantierEchantillonDataEntry from "./pages/laboratoires-mobiles/ChantierEchantillonDataEntry";
import ChantierEchantillonReport from "./pages/laboratoires-mobiles/ChantierEchantillonReport";
import ChantierEchantillonBulletin from "./pages/laboratoires-mobiles/ChantierEchantillonBulletin";
import EtatCoulages from "./pages/laboratoires-mobiles/EtatCoulages";
import { UserCog, Truck, Microscope, Receipt, FileText } from "lucide-react";
import FacturationDashboard from "./pages/facturation/FacturationDashboard";
import FactureListe from "./pages/facturation/FactureListe";
import FactureForm from "./pages/facturation/FactureForm";
import FactureDetail from "./pages/facturation/FactureDetail";
import FactureDataEntry from "./pages/facturation/FactureDataEntry";
import FactureEdit from "./pages/facturation/FactureEdit";
import FacturePreview from "./pages/facturation/FacturePreview";
import DevisListe from "./pages/facturation/DevisListe";
import DevisForm from "./pages/facturation/DevisForm";
import DevisDetail from "./pages/facturation/DevisDetail";
import DevisEdit from "./pages/facturation/DevisEdit";
import DevisPreview from "./pages/facturation/DevisPreview";
import DevisDataEntry from "./pages/facturation/DevisDataEntry";
import BonCommandeListe from "./pages/facturation/BonCommandeListe";
import BonCommandeForm from "./pages/facturation/BonCommandeForm";
import EspeceListe from "./pages/facturation/EspeceListe";
import EspeceForm from "./pages/facturation/EspeceForm";
import EtatPaiementsEspece from "./pages/facturation/EtatPaiementsEspece";
import EspeceEdit from "./pages/facturation/EspeceEdit";
import VirementListe from "./pages/facturation/VirementListe";
import VirementForm from "./pages/facturation/VirementForm";
import ChequeListe from "./pages/facturation/ChequeListe";
import ChequeForm from "./pages/facturation/ChequeForm";
import ChequeEdit from "./pages/facturation/ChequeEdit";
import RecapitulatifPaiements from "./pages/facturation/RecapitulatifPaiements";
import PrixEssaiListe from "./pages/facturation/PrixEssaiListe";
import PrestataireListe from "./pages/prestataires/PrestataireListe";
import PrestataireForm from "./pages/prestataires/PrestataireForm";
import PrestataireDetail from "./pages/prestataires/PrestataireDetail";
import BonCommandePrestataireForm from "./pages/prestataires/BonCommandePrestataireForm";
import MaterielDashboard from "./pages/materiel/MaterielDashboard";
import MaterielListe from "./pages/materiel/MaterielListe";
import MaterielInventaire from "./pages/materiel/MaterielInventaire";
import MaterielDetail from "./pages/materiel/MaterielDetail";
import MaterielListeForm from "./pages/materiel/MaterielListeForm";
import MaterielAffectation from "./pages/materiel/MaterielAffectation";
import MaterielAffectationForm from "./pages/materiel/MaterielAffectationForm";
import MaterielEtalonnage from "./pages/materiel/MaterielEtalonnage";
import MaterielEtalonnageForm from "./pages/materiel/MaterielEtalonnageForm";
import MaterielMaintenance from "./pages/materiel/MaterielMaintenance";
import MaterielMaintenanceForm from "./pages/materiel/MaterielMaintenanceForm";
import MaterielAffectationHistorique from "./pages/materiel/MaterielAffectationHistorique";
import MaterielEtalonnageHistorique from "./pages/materiel/MaterielEtalonnageHistorique";
import MaterielMaintenanceHistorique from "./pages/materiel/MaterielMaintenanceHistorique";
import MaterielAffectationDetail from "./pages/materiel/MaterielAffectationDetail";
import MaterielEtalonnageDetail from "./pages/materiel/MaterielEtalonnageDetail";
import MaterielMaintenanceDetail from "./pages/materiel/MaterielMaintenanceDetail";

const queryClient = new QueryClient();

function AuthRedirect() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return null;
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <Auth />;
}

// Layout wrapper that persists the sidebar during navigation
function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <PermissionProvider>
        <MainLayout>
          <Outlet />
        </MainLayout>
      </PermissionProvider>
    </ProtectedRoute>
  );
}

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<AuthRedirect />} />
    
    {/* All protected routes with persistent layout */}
    <Route element={<ProtectedLayout />}>
      <Route path="/" element={<Index />} />
      <Route path="/notifications" element={<Notifications />} />
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
      <Route path="/rh" element={<RH />} />
      <Route path="/rh/postes" element={<Postes />} />
      <Route path="/rh/postes/nouveau" element={<PosteForm />} />
      <Route path="/rh/postes/:id/modifier" element={<PosteForm />} />
      <Route path="/rh/employes" element={<Employes />} />
      <Route path="/rh/employes/nouveau" element={<EmployeForm />} />
      <Route path="/rh/employes/:id" element={<EmployeDetail />} />
      <Route path="/rh/employes/:id/modifier" element={<EmployeForm />} />
      <Route path="/rh/affectations" element={<Affectations />} />
      <Route path="/rh/affectations/nouveau" element={<AffectationForm />} />
      <Route path="/rh/affectations/:id/modifier" element={<AffectationForm />} />
      <Route path="/rh/techniciens/:id" element={<TechnicienDetail />} />
      <Route path="/rh/documents" element={<Documents />} />
      <Route path="/essais" element={<Essais />} />
      <Route path="/essais/granulat" element={<EssaiGranulat />} />
      <Route path="/essais/granulat/etat-essais" element={<EtatEssaisGranulat />} />
      <Route path="/essais/granulat/proprete" element={<EssaiProprete />} />
      <Route path="/essais/granulat/proprete/normes" element={<GranulatPropreteNormes />} />
      <Route path="/essais/granulat/proprete/equivalent-sable" element={<EquivalentSable />} />
      <Route path="/essais/granulat/proprete/equivalent-sable/nouveau" element={<EchantillonGranulatForm essaiType="equivalent-sable" essaiTitle="Équivalent de sable" basePath="/essais/granulat/proprete/equivalent-sable" />} />
      <Route path="/essais/granulat/proprete/equivalent-sable/:id" element={<GranulatDetail essaiType="equivalent-sable" essaiTitle="Équivalent de sable" basePath="/essais/granulat/proprete/equivalent-sable" />} />
      <Route path="/essais/granulat/proprete/equivalent-sable/:id/saisie" element={<GranulatDataEntry essaiType="equivalent-sable" essaiTitle="Équivalent de sable" basePath="/essais/granulat/proprete/equivalent-sable" />} />
      <Route path="/essais/granulat/proprete/equivalent-sable/:id/modifier" element={<EchantillonGranulatForm essaiType="equivalent-sable" essaiTitle="Équivalent de sable" basePath="/essais/granulat/proprete/equivalent-sable" />} />
      <Route path="/essais/granulat/proprete/equivalent-sable/:id/rapport" element={<GranulatReport essaiType="equivalent-sable" essaiTitle="Équivalent de Sable" normRef="Norme NF EN 933-8" basePath="/essais/granulat/proprete/equivalent-sable" />} />
      <Route path="/essais/granulat/proprete/bleu-methylene" element={<BleuMethylene />} />
      <Route path="/essais/granulat/proprete/bleu-methylene/nouveau" element={<EchantillonGranulatForm essaiType="bleu-methylene" essaiTitle="Essai au bleu de méthylène" basePath="/essais/granulat/proprete/bleu-methylene" />} />
      <Route path="/essais/granulat/proprete/bleu-methylene/:id" element={<GranulatDetail essaiType="bleu-methylene" essaiTitle="Essai au bleu de méthylène" basePath="/essais/granulat/proprete/bleu-methylene" />} />
      <Route path="/essais/granulat/proprete/bleu-methylene/:id/saisie" element={<GranulatDataEntry essaiType="bleu-methylene" essaiTitle="Essai au bleu de méthylène" basePath="/essais/granulat/proprete/bleu-methylene" />} />
      <Route path="/essais/granulat/proprete/bleu-methylene/:id/modifier" element={<EchantillonGranulatForm essaiType="bleu-methylene" essaiTitle="Essai au bleu de méthylène" basePath="/essais/granulat/proprete/bleu-methylene" />} />
      <Route path="/essais/granulat/proprete/bleu-methylene/:id/rapport" element={<GranulatReport essaiType="bleu-methylene" essaiTitle="Bleu de Méthylène" normRef="Norme NF EN 933-9" basePath="/essais/granulat/proprete/bleu-methylene" />} />
      <Route path="/essais/granulat/proprete/matiere-organique" element={<MatiereOrganique />} />
      <Route path="/essais/granulat/proprete/matiere-organique/nouveau" element={<EchantillonGranulatForm essaiType="matiere-organique" essaiTitle="Teneur en matière organique" basePath="/essais/granulat/proprete/matiere-organique" />} />
      <Route path="/essais/granulat/proprete/matiere-organique/:id" element={<GranulatDetail essaiType="matiere-organique" essaiTitle="Teneur en matière organique" basePath="/essais/granulat/proprete/matiere-organique" />} />
      <Route path="/essais/granulat/proprete/matiere-organique/:id/saisie" element={<GranulatDataEntry essaiType="matiere-organique" essaiTitle="Teneur en matière organique" basePath="/essais/granulat/proprete/matiere-organique" />} />
      <Route path="/essais/granulat/proprete/matiere-organique/:id/modifier" element={<EchantillonGranulatForm essaiType="matiere-organique" essaiTitle="Teneur en matière organique" basePath="/essais/granulat/proprete/matiere-organique" />} />
      <Route path="/essais/granulat/proprete/matiere-organique/:id/rapport" element={<GranulatReport essaiType="matiere-organique" essaiTitle="Matière Organique" normRef="Norme NF EN 1744-1" basePath="/essais/granulat/proprete/matiere-organique" />} />
      <Route path="/essais/granulat/physiques" element={<EssaiPhysique />} />
      <Route path="/essais/granulat/physiques/granulometrie" element={<AnalyseGranulometrie />} />
      <Route path="/essais/granulat/physiques/granulometrie/nouveau" element={<EchantillonGranulatForm essaiType="granulometrie" essaiTitle="Analyse Granulométrique" basePath="/essais/granulat/physiques/granulometrie" />} />
      <Route path="/essais/granulat/physiques/granulometrie/:id" element={<GranulatDetail essaiType="granulometrie" essaiTitle="Analyse Granulométrique" basePath="/essais/granulat/physiques/granulometrie" />} />
      <Route path="/essais/granulat/physiques/granulometrie/:id/saisie" element={<GranulatDataEntry essaiType="granulometrie" essaiTitle="Analyse Granulométrique" basePath="/essais/granulat/physiques/granulometrie" />} />
      <Route path="/essais/granulat/physiques/granulometrie/:id/modifier" element={<EchantillonGranulatForm essaiType="granulometrie" essaiTitle="Analyse Granulométrique" basePath="/essais/granulat/physiques/granulometrie" />} />
      <Route path="/essais/granulat/physiques/granulometrie/:id/rapport" element={<GranulatReport essaiType="granulometrie" essaiTitle="Analyse Granulométrique" normRef="Norme NF EN 933-1" basePath="/essais/granulat/physiques/granulometrie" />} />
      <Route path="/essais/granulat/physiques/masse-volumique" element={<MasseVolumique />} />
      <Route path="/essais/granulat/physiques/masse-volumique/nouveau" element={<EchantillonGranulatForm essaiType="masse-volumique" essaiTitle="Masse Volumique" basePath="/essais/granulat/physiques/masse-volumique" />} />
      <Route path="/essais/granulat/physiques/masse-volumique/:id" element={<GranulatDetail essaiType="masse-volumique" essaiTitle="Masse Volumique" basePath="/essais/granulat/physiques/masse-volumique" />} />
      <Route path="/essais/granulat/physiques/masse-volumique/:id/saisie" element={<GranulatDataEntry essaiType="masse-volumique" essaiTitle="Masse Volumique" basePath="/essais/granulat/physiques/masse-volumique" />} />
      <Route path="/essais/granulat/physiques/masse-volumique/:id/modifier" element={<EchantillonGranulatForm essaiType="masse-volumique" essaiTitle="Masse Volumique" basePath="/essais/granulat/physiques/masse-volumique" />} />
      <Route path="/essais/granulat/physiques/masse-volumique/:id/rapport" element={<GranulatReport essaiType="masse-volumique" essaiTitle="Masse Volumique" normRef="Norme NF EN 1097-6" basePath="/essais/granulat/physiques/masse-volumique" />} />
      <Route path="/essais/granulat/physiques/forme" element={<FormeGranulats />} />
      <Route path="/essais/granulat/physiques/forme/nouveau" element={<EchantillonGranulatForm essaiType="forme-granulats" essaiTitle="Forme des Granulats" basePath="/essais/granulat/physiques/forme" />} />
      <Route path="/essais/granulat/physiques/forme/:id" element={<GranulatDetail essaiType="forme-granulats" essaiTitle="Forme des Granulats" basePath="/essais/granulat/physiques/forme" />} />
      <Route path="/essais/granulat/physiques/forme/:id/saisie" element={<GranulatDataEntry essaiType="forme-granulats" essaiTitle="Forme des Granulats" basePath="/essais/granulat/physiques/forme" />} />
      <Route path="/essais/granulat/physiques/forme/:id/modifier" element={<EchantillonGranulatForm essaiType="forme-granulats" essaiTitle="Forme des Granulats" basePath="/essais/granulat/physiques/forme" />} />
      <Route path="/essais/granulat/physiques/forme/:id/rapport" element={<GranulatReport essaiType="forme-granulats" essaiTitle="Forme des Granulats" normRef="Norme NF EN 933-3" basePath="/essais/granulat/physiques/forme" />} />
      <Route path="/essais/granulat/physiques/teneur-eau" element={<TeneurEau />} />
      <Route path="/essais/granulat/physiques/teneur-eau/nouveau" element={<EchantillonGranulatForm essaiType="teneur-eau" essaiTitle="Teneur en Eau" basePath="/essais/granulat/physiques/teneur-eau" />} />
      <Route path="/essais/granulat/physiques/teneur-eau/:id" element={<GranulatDetail essaiType="teneur-eau" essaiTitle="Teneur en Eau" basePath="/essais/granulat/physiques/teneur-eau" />} />
      <Route path="/essais/granulat/physiques/teneur-eau/:id/saisie" element={<GranulatDataEntry essaiType="teneur-eau" essaiTitle="Teneur en Eau" basePath="/essais/granulat/physiques/teneur-eau" />} />
      <Route path="/essais/granulat/physiques/teneur-eau/:id/modifier" element={<EchantillonGranulatForm essaiType="teneur-eau" essaiTitle="Teneur en Eau" basePath="/essais/granulat/physiques/teneur-eau" />} />
      <Route path="/essais/granulat/physiques/teneur-eau/:id/rapport" element={<GranulatReport essaiType="teneur-eau" essaiTitle="Teneur en Eau" normRef="Norme NF EN 1097-5" basePath="/essais/granulat/physiques/teneur-eau" />} />
      <Route path="/essais/granulat/physiques/normes" element={<GranulatPhysiquesNormes />} />
      <Route path="/essais/granulat/mecaniques" element={<EssaiMecanique />} />
      <Route path="/essais/granulat/mecaniques/normes" element={<GranulatMecaniquesNormes />} />
      <Route path="/essais/granulat/mecaniques/los-angeles" element={<LosAngeles />} />
      <Route path="/essais/granulat/mecaniques/los-angeles/nouveau" element={<EchantillonGranulatForm essaiType="los-angeles" essaiTitle="Essai Los Angeles" basePath="/essais/granulat/mecaniques/los-angeles" />} />
      <Route path="/essais/granulat/mecaniques/los-angeles/:id" element={<GranulatDetail essaiType="los-angeles" essaiTitle="Essai Los Angeles" basePath="/essais/granulat/mecaniques/los-angeles" />} />
      <Route path="/essais/granulat/mecaniques/los-angeles/:id/saisie" element={<GranulatDataEntry essaiType="los-angeles" essaiTitle="Essai Los Angeles" basePath="/essais/granulat/mecaniques/los-angeles" />} />
      <Route path="/essais/granulat/mecaniques/los-angeles/:id/modifier" element={<EchantillonGranulatForm essaiType="los-angeles" essaiTitle="Essai Los Angeles" basePath="/essais/granulat/mecaniques/los-angeles" />} />
      <Route path="/essais/granulat/mecaniques/los-angeles/:id/rapport" element={<GranulatReport essaiType="los-angeles" essaiTitle="Los Angeles" normRef="Norme NF EN 1097-2" basePath="/essais/granulat/mecaniques/los-angeles" />} />
      <Route path="/essais/granulat/mecaniques/micro-deval" element={<MicroDeval />} />
      <Route path="/essais/granulat/mecaniques/micro-deval/nouveau" element={<EchantillonGranulatForm essaiType="micro-deval" essaiTitle="Essai Micro-Deval" basePath="/essais/granulat/mecaniques/micro-deval" />} />
      <Route path="/essais/granulat/mecaniques/micro-deval/:id" element={<GranulatDetail essaiType="micro-deval" essaiTitle="Essai Micro-Deval" basePath="/essais/granulat/mecaniques/micro-deval" />} />
      <Route path="/essais/granulat/mecaniques/micro-deval/:id/saisie" element={<GranulatDataEntry essaiType="micro-deval" essaiTitle="Essai Micro-Deval" basePath="/essais/granulat/mecaniques/micro-deval" />} />
      <Route path="/essais/granulat/mecaniques/micro-deval/:id/modifier" element={<EchantillonGranulatForm essaiType="micro-deval" essaiTitle="Essai Micro-Deval" basePath="/essais/granulat/mecaniques/micro-deval" />} />
      <Route path="/essais/granulat/mecaniques/micro-deval/:id/rapport" element={<GranulatReport essaiType="micro-deval" essaiTitle="Micro-Deval" normRef="Norme NF EN 1097-1" basePath="/essais/granulat/mecaniques/micro-deval" />} />
      <Route path="/essais/granulat/mecaniques/ecrasement" element={<Ecrasement />} />
      <Route path="/essais/granulat/mecaniques/ecrasement/nouveau" element={<EchantillonGranulatForm essaiType="ecrasement" essaiTitle="Résistance à l'Écrasement" basePath="/essais/granulat/mecaniques/ecrasement" />} />
      <Route path="/essais/granulat/mecaniques/ecrasement/:id" element={<GranulatDetail essaiType="ecrasement" essaiTitle="Résistance à l'Écrasement" basePath="/essais/granulat/mecaniques/ecrasement" />} />
      <Route path="/essais/granulat/mecaniques/ecrasement/:id/saisie" element={<GranulatDataEntry essaiType="ecrasement" essaiTitle="Résistance à l'Écrasement" basePath="/essais/granulat/mecaniques/ecrasement" />} />
      <Route path="/essais/granulat/mecaniques/ecrasement/:id/modifier" element={<EchantillonGranulatForm essaiType="ecrasement" essaiTitle="Résistance à l'Écrasement" basePath="/essais/granulat/mecaniques/ecrasement" />} />
      <Route path="/essais/granulat/mecaniques/ecrasement/:id/rapport" element={<GranulatReport essaiType="ecrasement" essaiTitle="Écrasement" normRef="Norme NF P 18-576" basePath="/essais/granulat/mecaniques/ecrasement" />} />
      <Route path="/essais/granulat/mecaniques/friabilite" element={<Friabilite />} />
      <Route path="/essais/granulat/mecaniques/friabilite/nouveau" element={<EchantillonGranulatForm essaiType="friabilite" essaiTitle="Essai de Friabilité" basePath="/essais/granulat/mecaniques/friabilite" />} />
      <Route path="/essais/granulat/mecaniques/friabilite/:id" element={<GranulatDetail essaiType="friabilite" essaiTitle="Essai de Friabilité" basePath="/essais/granulat/mecaniques/friabilite" />} />
      <Route path="/essais/granulat/mecaniques/friabilite/:id/saisie" element={<GranulatDataEntry essaiType="friabilite" essaiTitle="Essai de Friabilité" basePath="/essais/granulat/mecaniques/friabilite" />} />
      <Route path="/essais/granulat/mecaniques/friabilite/:id/modifier" element={<EchantillonGranulatForm essaiType="friabilite" essaiTitle="Essai de Friabilité" basePath="/essais/granulat/mecaniques/friabilite" />} />
      <Route path="/essais/granulat/mecaniques/friabilite/:id/rapport" element={<GranulatReport essaiType="friabilite" essaiTitle="Friabilité" normRef="Norme NF P 18-576" basePath="/essais/granulat/mecaniques/friabilite" />} />
      {/* Géotechnique Routes */}
      <Route path="/essais/geotechnique" element={<EssaiGeotechnique />} />
      <Route path="/essais/geotechnique/identification" element={<EssaiIdentification />} />
      <Route path="/essais/geotechnique/compactage" element={<EssaiCompactage />} />
      <Route path="/essais/geotechnique/mecanique" element={<EssaiMecaniqueSol />} />
      <Route path="/essais/geotechnique/in-situ" element={<EssaiInSitu />} />
      {/* Normes Géotechnique */}
      <Route path="/essais/geotechnique/identification/normes" element={<IdentificationNormes />} />
      <Route path="/essais/geotechnique/compactage/normes" element={<CompactageNormes />} />
      <Route path="/essais/geotechnique/mecanique/normes" element={<MecaniqueNormes />} />
      <Route path="/essais/geotechnique/in-situ/normes" element={<InSituNormes />} />
      {/* Identification */}
      <Route path="/essais/geotechnique/identification/limites-atterberg" element={<LimitesAtterberg />} />
      <Route path="/essais/geotechnique/identification/limites-atterberg/nouveau" element={<EchantillonGeotechniqueForm essaiType="limites-atterberg" essaiTitle="Limites d'Atterberg" basePath="/essais/geotechnique/identification/limites-atterberg" />} />
      <Route path="/essais/geotechnique/identification/limites-atterberg/:id" element={<GeotechniqueDetail essaiType="limites-atterberg" essaiTitle="Limites d'Atterberg" basePath="/essais/geotechnique/identification/limites-atterberg" categoryPath="/essais/geotechnique/identification" categoryLabel="Identification" />} />
      <Route path="/essais/geotechnique/identification/limites-atterberg/:id/saisie" element={<LimitesAtterbergDataEntry />} />
      <Route path="/essais/geotechnique/identification/limites-atterberg/:id/modifier" element={<EchantillonGeotechniqueForm essaiType="limites-atterberg" essaiTitle="Limites d'Atterberg" basePath="/essais/geotechnique/identification/limites-atterberg" />} />
      <Route path="/essais/geotechnique/identification/limites-atterberg/:id/rapport" element={<LimitesAtterbergReport />} />
      <Route path="/essais/geotechnique/identification/granulometrie-sol" element={<GranulometrieSol />} />
      <Route path="/essais/geotechnique/identification/granulometrie-sol/nouveau" element={<EchantillonGeotechniqueForm essaiType="granulometrie-sol" essaiTitle="Analyse Granulométrique des Sols" basePath="/essais/geotechnique/identification/granulometrie-sol" />} />
      <Route path="/essais/geotechnique/identification/granulometrie-sol/:id" element={<GeotechniqueDetail essaiType="granulometrie-sol" essaiTitle="Analyse Granulométrique des Sols" basePath="/essais/geotechnique/identification/granulometrie-sol" categoryPath="/essais/geotechnique/identification" categoryLabel="Identification" />} />
      <Route path="/essais/geotechnique/identification/granulometrie-sol/:id/saisie" element={<GranulometrieSolDataEntry />} />
      <Route path="/essais/geotechnique/identification/granulometrie-sol/:id/rapport" element={<GranulometrieSolReport />} />
      <Route path="/essais/geotechnique/identification/granulometrie-sol/:id/modifier" element={<EchantillonGeotechniqueForm essaiType="granulometrie-sol" essaiTitle="Analyse Granulométrique des Sols" basePath="/essais/geotechnique/identification/granulometrie-sol" />} />
      <Route path="/essais/geotechnique/identification/teneur-eau-sol" element={<TeneurEauSol />} />
      <Route path="/essais/geotechnique/identification/teneur-eau-sol/nouveau" element={<EchantillonGeotechniqueForm essaiType="teneur-eau-sol" essaiTitle="Teneur en Eau des Sols" basePath="/essais/geotechnique/identification/teneur-eau-sol" />} />
      <Route path="/essais/geotechnique/identification/teneur-eau-sol/:id" element={<GeotechniqueDetail essaiType="teneur-eau-sol" essaiTitle="Teneur en Eau des Sols" basePath="/essais/geotechnique/identification/teneur-eau-sol" categoryPath="/essais/geotechnique/identification" categoryLabel="Identification" />} />
      <Route path="/essais/geotechnique/identification/teneur-eau-sol/:id/saisie" element={<TeneurEauSolDataEntry />} />
      <Route path="/essais/geotechnique/identification/teneur-eau-sol/:id/rapport" element={<TeneurEauSolReport />} />
      <Route path="/essais/geotechnique/identification/teneur-eau-sol/:id/modifier" element={<EchantillonGeotechniqueForm essaiType="teneur-eau-sol" essaiTitle="Teneur en Eau des Sols" basePath="/essais/geotechnique/identification/teneur-eau-sol" />} />
      <Route path="/essais/geotechnique/identification/classification-sol" element={<ClassificationSol />} />
      <Route path="/essais/geotechnique/identification/classification-sol/nouveau" element={<EchantillonGeotechniqueForm essaiType="classification-sol" essaiTitle="Classification des Sols" basePath="/essais/geotechnique/identification/classification-sol" />} />
      <Route path="/essais/geotechnique/identification/classification-sol/:id" element={<GeotechniqueDetail essaiType="classification-sol" essaiTitle="Classification des Sols" basePath="/essais/geotechnique/identification/classification-sol" categoryPath="/essais/geotechnique/identification" categoryLabel="Identification" />} />
      <Route path="/essais/geotechnique/identification/classification-sol/:id/saisie" element={<ClassificationSolDataEntry />} />
      <Route path="/essais/geotechnique/identification/classification-sol/:id/modifier" element={<EchantillonGeotechniqueForm essaiType="classification-sol" essaiTitle="Classification des Sols" basePath="/essais/geotechnique/identification/classification-sol" />} />
      <Route path="/essais/geotechnique/identification/classification-sol/:id/rapport" element={<ClassificationSolReport />} />
      {/* Compactage */}
      <Route path="/essais/geotechnique/compactage/proctor-normal" element={<ProctorNormal />} />
      <Route path="/essais/geotechnique/compactage/proctor-normal/nouveau" element={<EchantillonGeotechniqueForm essaiType="proctor-normal" essaiTitle="Essai Proctor Normal" basePath="/essais/geotechnique/compactage/proctor-normal" />} />
      <Route path="/essais/geotechnique/compactage/proctor-normal/:id" element={<GeotechniqueDetail essaiType="proctor-normal" essaiTitle="Essai Proctor Normal" basePath="/essais/geotechnique/compactage/proctor-normal" categoryPath="/essais/geotechnique/compactage" categoryLabel="Compactage" />} />
      <Route path="/essais/geotechnique/compactage/proctor-normal/:id/saisie" element={<ProctorDataEntry essaiType="proctor-normal" />} />
      <Route path="/essais/geotechnique/compactage/proctor-normal/:id/modifier" element={<EchantillonGeotechniqueForm essaiType="proctor-normal" essaiTitle="Essai Proctor Normal" basePath="/essais/geotechnique/compactage/proctor-normal" />} />
      <Route path="/essais/geotechnique/compactage/proctor-normal/:id/rapport" element={<ProctorReport essaiType="proctor-normal" />} />
      <Route path="/essais/geotechnique/compactage/proctor-modifie" element={<ProctorModifie />} />
      <Route path="/essais/geotechnique/compactage/proctor-modifie/nouveau" element={<EchantillonGeotechniqueForm essaiType="proctor-modifie" essaiTitle="Essai Proctor Modifié" basePath="/essais/geotechnique/compactage/proctor-modifie" />} />
      <Route path="/essais/geotechnique/compactage/proctor-modifie/:id" element={<GeotechniqueDetail essaiType="proctor-modifie" essaiTitle="Essai Proctor Modifié" basePath="/essais/geotechnique/compactage/proctor-modifie" categoryPath="/essais/geotechnique/compactage" categoryLabel="Compactage" />} />
      <Route path="/essais/geotechnique/compactage/proctor-modifie/:id/saisie" element={<ProctorDataEntry essaiType="proctor-modifie" />} />
      <Route path="/essais/geotechnique/compactage/proctor-modifie/:id/modifier" element={<EchantillonGeotechniqueForm essaiType="proctor-modifie" essaiTitle="Essai Proctor Modifié" basePath="/essais/geotechnique/compactage/proctor-modifie" />} />
      <Route path="/essais/geotechnique/compactage/proctor-modifie/:id/rapport" element={<ProctorReport essaiType="proctor-modifie" />} />
      <Route path="/essais/geotechnique/compactage/cbr" element={<CBR />} />
      <Route path="/essais/geotechnique/compactage/cbr/nouveau" element={<EchantillonGeotechniqueForm essaiType="cbr" essaiTitle="Essai CBR" basePath="/essais/geotechnique/compactage/cbr" />} />
      <Route path="/essais/geotechnique/compactage/cbr/:id" element={<GeotechniqueDetail essaiType="cbr" essaiTitle="Essai CBR" basePath="/essais/geotechnique/compactage/cbr" categoryPath="/essais/geotechnique/compactage" categoryLabel="Compactage" />} />
      <Route path="/essais/geotechnique/compactage/cbr/:id/saisie" element={<CBRDataEntry />} />
      <Route path="/essais/geotechnique/compactage/cbr/:id/modifier" element={<EchantillonGeotechniqueForm essaiType="cbr" essaiTitle="Essai CBR" basePath="/essais/geotechnique/compactage/cbr" />} />
      <Route path="/essais/geotechnique/compactage/cbr/:id/rapport" element={<CBRReport />} />
      <Route path="/essais/geotechnique/compactage/densite-place" element={<DensitePlace />} />
      <Route path="/essais/geotechnique/compactage/densite-place/nouveau" element={<EchantillonGeotechniqueForm essaiType="densite-place" essaiTitle="Densité en Place" basePath="/essais/geotechnique/compactage/densite-place" />} />
      <Route path="/essais/geotechnique/compactage/densite-place/:id" element={<GeotechniqueDetail essaiType="densite-place" essaiTitle="Densité en Place" basePath="/essais/geotechnique/compactage/densite-place" categoryPath="/essais/geotechnique/compactage" categoryLabel="Compactage" />} />
      <Route path="/essais/geotechnique/compactage/densite-place/:id/saisie" element={<GeotechniqueDataEntry essaiType="densite-place" essaiTitle="Densité en Place" basePath="/essais/geotechnique/compactage/densite-place" categoryPath="/essais/geotechnique/compactage" categoryLabel="Compactage" />} />
      <Route path="/essais/geotechnique/compactage/densite-place/:id/modifier" element={<EchantillonGeotechniqueForm essaiType="densite-place" essaiTitle="Densité en Place" basePath="/essais/geotechnique/compactage/densite-place" />} />
      {/* Mécaniques */}
      <Route path="/essais/geotechnique/mecanique/cisaillement" element={<Cisaillement />} />
      <Route path="/essais/geotechnique/mecanique/cisaillement/nouveau" element={<EchantillonGeotechniqueForm essaiType="cisaillement" essaiTitle="Cisaillement Direct" basePath="/essais/geotechnique/mecanique/cisaillement" />} />
      <Route path="/essais/geotechnique/mecanique/cisaillement/:id" element={<GeotechniqueDetail essaiType="cisaillement" essaiTitle="Cisaillement Direct" basePath="/essais/geotechnique/mecanique/cisaillement" categoryPath="/essais/geotechnique/mecanique" categoryLabel="Mécaniques" />} />
      <Route path="/essais/geotechnique/mecanique/cisaillement/:id/saisie" element={<GeotechniqueDataEntry essaiType="cisaillement" essaiTitle="Cisaillement Direct" basePath="/essais/geotechnique/mecanique/cisaillement" categoryPath="/essais/geotechnique/mecanique" categoryLabel="Mécaniques" />} />
      <Route path="/essais/geotechnique/mecanique/cisaillement/:id/modifier" element={<EchantillonGeotechniqueForm essaiType="cisaillement" essaiTitle="Cisaillement Direct" basePath="/essais/geotechnique/mecanique/cisaillement" />} />
      <Route path="/essais/geotechnique/mecanique/compression-simple" element={<CompressionSimple />} />
      <Route path="/essais/geotechnique/mecanique/compression-simple/nouveau" element={<EchantillonGeotechniqueForm essaiType="compression-simple" essaiTitle="Compression Simple" basePath="/essais/geotechnique/mecanique/compression-simple" />} />
      <Route path="/essais/geotechnique/mecanique/compression-simple/:id" element={<GeotechniqueDetail essaiType="compression-simple" essaiTitle="Compression Simple" basePath="/essais/geotechnique/mecanique/compression-simple" categoryPath="/essais/geotechnique/mecanique" categoryLabel="Mécaniques" />} />
      <Route path="/essais/geotechnique/mecanique/compression-simple/:id/saisie" element={<GeotechniqueDataEntry essaiType="compression-simple" essaiTitle="Compression Simple" basePath="/essais/geotechnique/mecanique/compression-simple" categoryPath="/essais/geotechnique/mecanique" categoryLabel="Mécaniques" />} />
      <Route path="/essais/geotechnique/mecanique/compression-simple/:id/modifier" element={<EchantillonGeotechniqueForm essaiType="compression-simple" essaiTitle="Compression Simple" basePath="/essais/geotechnique/mecanique/compression-simple" />} />
      <Route path="/essais/geotechnique/mecanique/triaxial" element={<Triaxial />} />
      <Route path="/essais/geotechnique/mecanique/triaxial/nouveau" element={<EchantillonGeotechniqueForm essaiType="triaxial" essaiTitle="Essai Triaxial" basePath="/essais/geotechnique/mecanique/triaxial" />} />
      <Route path="/essais/geotechnique/mecanique/triaxial/:id" element={<GeotechniqueDetail essaiType="triaxial" essaiTitle="Essai Triaxial" basePath="/essais/geotechnique/mecanique/triaxial" categoryPath="/essais/geotechnique/mecanique" categoryLabel="Mécaniques" />} />
      <Route path="/essais/geotechnique/mecanique/triaxial/:id/saisie" element={<GeotechniqueDataEntry essaiType="triaxial" essaiTitle="Essai Triaxial" basePath="/essais/geotechnique/mecanique/triaxial" categoryPath="/essais/geotechnique/mecanique" categoryLabel="Mécaniques" />} />
      <Route path="/essais/geotechnique/mecanique/triaxial/:id/modifier" element={<EchantillonGeotechniqueForm essaiType="triaxial" essaiTitle="Essai Triaxial" basePath="/essais/geotechnique/mecanique/triaxial" />} />
      <Route path="/essais/geotechnique/mecanique/oedometrique" element={<Oedometrique />} />
      <Route path="/essais/geotechnique/mecanique/oedometrique/nouveau" element={<EchantillonGeotechniqueForm essaiType="oedometrique" essaiTitle="Essai Œdométrique" basePath="/essais/geotechnique/mecanique/oedometrique" />} />
      <Route path="/essais/geotechnique/mecanique/oedometrique/:id" element={<GeotechniqueDetail essaiType="oedometrique" essaiTitle="Essai Œdométrique" basePath="/essais/geotechnique/mecanique/oedometrique" categoryPath="/essais/geotechnique/mecanique" categoryLabel="Mécaniques" />} />
      <Route path="/essais/geotechnique/mecanique/oedometrique/:id/saisie" element={<GeotechniqueDataEntry essaiType="oedometrique" essaiTitle="Essai Œdométrique" basePath="/essais/geotechnique/mecanique/oedometrique" categoryPath="/essais/geotechnique/mecanique" categoryLabel="Mécaniques" />} />
      <Route path="/essais/geotechnique/mecanique/oedometrique/:id/modifier" element={<EchantillonGeotechniqueForm essaiType="oedometrique" essaiTitle="Essai Œdométrique" basePath="/essais/geotechnique/mecanique/oedometrique" />} />
      {/* In-Situ */}
      <Route path="/essais/geotechnique/in-situ/penetrometre" element={<Penetrometre />} />
      <Route path="/essais/geotechnique/in-situ/penetrometre/nouveau" element={<EchantillonGeotechniqueForm essaiType="penetrometre" essaiTitle="Pénétromètre Dynamique" basePath="/essais/geotechnique/in-situ/penetrometre" />} />
      <Route path="/essais/geotechnique/in-situ/penetrometre/:id" element={<GeotechniqueDetail essaiType="penetrometre" essaiTitle="Pénétromètre Dynamique" basePath="/essais/geotechnique/in-situ/penetrometre" categoryPath="/essais/geotechnique/in-situ" categoryLabel="In-Situ" />} />
      <Route path="/essais/geotechnique/in-situ/penetrometre/:id/saisie" element={<GeotechniqueDataEntry essaiType="penetrometre" essaiTitle="Pénétromètre Dynamique" basePath="/essais/geotechnique/in-situ/penetrometre" categoryPath="/essais/geotechnique/in-situ" categoryLabel="In-Situ" />} />
      <Route path="/essais/geotechnique/in-situ/penetrometre/:id/modifier" element={<EchantillonGeotechniqueForm essaiType="penetrometre" essaiTitle="Pénétromètre Dynamique" basePath="/essais/geotechnique/in-situ/penetrometre" />} />
      <Route path="/essais/geotechnique/in-situ/pressiometre" element={<Pressiometre />} />
      <Route path="/essais/geotechnique/in-situ/pressiometre/nouveau" element={<EchantillonGeotechniqueForm essaiType="pressiometre" essaiTitle="Pressiomètre" basePath="/essais/geotechnique/in-situ/pressiometre" />} />
      <Route path="/essais/geotechnique/in-situ/pressiometre/:id" element={<GeotechniqueDetail essaiType="pressiometre" essaiTitle="Pressiomètre" basePath="/essais/geotechnique/in-situ/pressiometre" categoryPath="/essais/geotechnique/in-situ" categoryLabel="In-Situ" />} />
      <Route path="/essais/geotechnique/in-situ/pressiometre/:id/saisie" element={<GeotechniqueDataEntry essaiType="pressiometre" essaiTitle="Pressiomètre" basePath="/essais/geotechnique/in-situ/pressiometre" categoryPath="/essais/geotechnique/in-situ" categoryLabel="In-Situ" />} />
      <Route path="/essais/geotechnique/in-situ/pressiometre/:id/modifier" element={<EchantillonGeotechniqueForm essaiType="pressiometre" essaiTitle="Pressiomètre" basePath="/essais/geotechnique/in-situ/pressiometre" />} />
      <Route path="/essais/geotechnique/in-situ/plaque" element={<Plaque />} />
      <Route path="/essais/geotechnique/in-situ/plaque/nouveau" element={<EchantillonGeotechniqueForm essaiType="plaque" essaiTitle="Essai de Plaque" basePath="/essais/geotechnique/in-situ/plaque" />} />
      <Route path="/essais/geotechnique/in-situ/plaque/:id" element={<GeotechniqueDetail essaiType="plaque" essaiTitle="Essai de Plaque" basePath="/essais/geotechnique/in-situ/plaque" categoryPath="/essais/geotechnique/in-situ" categoryLabel="In-Situ" />} />
      <Route path="/essais/geotechnique/in-situ/plaque/:id/saisie" element={<PlaqueDataEntry />} />
      <Route path="/essais/geotechnique/in-situ/plaque/:id/rapport" element={<PlaqueReport />} />
      <Route path="/essais/geotechnique/in-situ/plaque/:id/modifier" element={<EchantillonGeotechniqueForm essaiType="plaque" essaiTitle="Essai de Plaque" basePath="/essais/geotechnique/in-situ/plaque" />} />
      <Route path="/essais/geotechnique/in-situ/sondage" element={<Sondage />} />
      <Route path="/essais/geotechnique/in-situ/sondage/nouveau" element={<EchantillonGeotechniqueForm essaiType="sondage" essaiTitle="Sondage" basePath="/essais/geotechnique/in-situ/sondage" />} />
      <Route path="/essais/geotechnique/in-situ/sondage/:id" element={<GeotechniqueDetail essaiType="sondage" essaiTitle="Sondage" basePath="/essais/geotechnique/in-situ/sondage" categoryPath="/essais/geotechnique/in-situ" categoryLabel="In-Situ" />} />
      <Route path="/essais/geotechnique/in-situ/sondage/:id/saisie" element={<GeotechniqueDataEntry essaiType="sondage" essaiTitle="Sondage" basePath="/essais/geotechnique/in-situ/sondage" categoryPath="/essais/geotechnique/in-situ" categoryLabel="In-Situ" />} />
      <Route path="/essais/geotechnique/in-situ/sondage/:id/modifier" element={<EchantillonGeotechniqueForm essaiType="sondage" essaiTitle="Sondage" basePath="/essais/geotechnique/in-situ/sondage" />} />
      {/* Densitomètre */}
      <Route path="/essais/geotechnique/in-situ/densitometre" element={<Densitometre />} />
      <Route path="/essais/geotechnique/in-situ/densitometre/nouveau" element={<EchantillonGeotechniqueForm essaiType="densitometre" essaiTitle="Densitomètre à Membrane" basePath="/essais/geotechnique/in-situ/densitometre" />} />
      <Route path="/essais/geotechnique/in-situ/densitometre/:id" element={<GeotechniqueDetail essaiType="densitometre" essaiTitle="Densitomètre à Membrane" basePath="/essais/geotechnique/in-situ/densitometre" categoryPath="/essais/geotechnique/in-situ" categoryLabel="In-Situ" />} />
      <Route path="/essais/geotechnique/in-situ/densitometre/:id/saisie" element={<DensitometreDataEntry />} />
      <Route path="/essais/geotechnique/in-situ/densitometre/:id/modifier" element={<EchantillonGeotechniqueForm essaiType="densitometre" essaiTitle="Densitomètre à Membrane" basePath="/essais/geotechnique/in-situ/densitometre" />} />
      <Route path="/essais/geotechnique/in-situ/densitometre/:id/rapport" element={<DensitometreReport />} />
      <Route path="/essais/beton" element={<EssaiBeton />} />
      <Route path="/essais/beton/formulation" element={<FormulationBeton />} />
      <Route path="/essais/beton/formulation/nouveau" element={<FormulationBetonWizard />} />
      <Route path="/essais/beton/beton-frais" element={<BetonFrais />} />
      <Route path="/essais/beton/beton-frais/etat-essais" element={<EtatEssaisBetonFrais />} />
      <Route path="/essais/beton/beton-frais/normes" element={<BetonFraisNormes />} />
      {/* Affaissement routes */}
      <Route path="/essais/beton/beton-frais/affaissement" element={<Affaissement />} />
      <Route path="/essais/beton/beton-frais/affaissement/nouveau" element={<EchantillonBetonFraisForm essaiType="affaissement" essaiTitle="Essai d'Affaissement" basePath="/essais/beton/beton-frais/affaissement" showClasseConsistance />} />
      <Route path="/essais/beton/beton-frais/affaissement/:id" element={<BetonFraisDetail essaiType="affaissement" essaiTitle="Essai d'Affaissement" basePath="/essais/beton/beton-frais/affaissement" />} />
      <Route path="/essais/beton/beton-frais/affaissement/:id/saisie" element={<BetonFraisDataEntry essaiType="affaissement" essaiTitle="Essai d'Affaissement" basePath="/essais/beton/beton-frais/affaissement" />} />
      <Route path="/essais/beton/beton-frais/affaissement/:id/modifier" element={<EchantillonBetonFraisForm essaiType="affaissement" essaiTitle="Essai d'Affaissement" basePath="/essais/beton/beton-frais/affaissement" showClasseConsistance />} />
      <Route path="/essais/beton/beton-frais/affaissement/:id/rapport" element={<BetonFraisReport essaiType="affaissement" essaiTitle="Essai d'Affaissement" normRef="Norme NF EN 12350-2" basePath="/essais/beton/beton-frais/affaissement" />} />
      {/* Temperature routes */}
      <Route path="/essais/beton/beton-frais/temperature" element={<Temperature />} />
      <Route path="/essais/beton/beton-frais/temperature/nouveau" element={<EchantillonBetonFraisForm essaiType="temperature" essaiTitle="Essai de Température" basePath="/essais/beton/beton-frais/temperature" />} />
      <Route path="/essais/beton/beton-frais/temperature/:id" element={<BetonFraisDetail essaiType="temperature" essaiTitle="Essai de Température" basePath="/essais/beton/beton-frais/temperature" />} />
      <Route path="/essais/beton/beton-frais/temperature/:id/saisie" element={<BetonFraisDataEntry essaiType="temperature" essaiTitle="Essai de Température" basePath="/essais/beton/beton-frais/temperature" />} />
      <Route path="/essais/beton/beton-frais/temperature/:id/modifier" element={<EchantillonBetonFraisForm essaiType="temperature" essaiTitle="Essai de Température" basePath="/essais/beton/beton-frais/temperature" />} />
      <Route path="/essais/beton/beton-frais/temperature/:id/rapport" element={<BetonFraisReport essaiType="temperature" essaiTitle="Essai de Température" normRef="Norme NF EN 12350-1" basePath="/essais/beton/beton-frais/temperature" />} />
      {/* Temps de prise routes */}
      <Route path="/essais/beton/beton-frais/temps-prise" element={<TempsPrise />} />
      <Route path="/essais/beton/beton-frais/temps-prise/nouveau" element={<EchantillonBetonFraisForm essaiType="temps-prise" essaiTitle="Temps de Prise sur Site" basePath="/essais/beton/beton-frais/temps-prise" />} />
      <Route path="/essais/beton/beton-frais/temps-prise/:id" element={<BetonFraisDetail essaiType="temps-prise" essaiTitle="Temps de Prise sur Site" basePath="/essais/beton/beton-frais/temps-prise" />} />
      <Route path="/essais/beton/beton-frais/temps-prise/:id/saisie" element={<BetonFraisDataEntry essaiType="temps-prise" essaiTitle="Temps de Prise sur Site" basePath="/essais/beton/beton-frais/temps-prise" />} />
      <Route path="/essais/beton/beton-frais/temps-prise/:id/modifier" element={<EchantillonBetonFraisForm essaiType="temps-prise" essaiTitle="Temps de Prise sur Site" basePath="/essais/beton/beton-frais/temps-prise" />} />
      <Route path="/essais/beton/beton-frais/temps-prise/:id/rapport" element={<BetonFraisReport essaiType="temps-prise" essaiTitle="Temps de Prise sur Site" normRef="Norme NF EN 480-2" basePath="/essais/beton/beton-frais/temps-prise" />} />
      {/* Teneur en air routes */}
      <Route path="/essais/beton/beton-frais/teneur-air" element={<TeneurAir />} />
      <Route path="/essais/beton/beton-frais/teneur-air/nouveau" element={<EchantillonBetonFraisForm essaiType="teneur-air" essaiTitle="Teneur en Air" basePath="/essais/beton/beton-frais/teneur-air" />} />
      <Route path="/essais/beton/beton-frais/teneur-air/:id" element={<BetonFraisDetail essaiType="teneur-air" essaiTitle="Teneur en Air" basePath="/essais/beton/beton-frais/teneur-air" />} />
      <Route path="/essais/beton/beton-frais/teneur-air/:id/saisie" element={<BetonFraisDataEntry essaiType="teneur-air" essaiTitle="Teneur en Air" basePath="/essais/beton/beton-frais/teneur-air" />} />
      <Route path="/essais/beton/beton-frais/teneur-air/:id/modifier" element={<EchantillonBetonFraisForm essaiType="teneur-air" essaiTitle="Teneur en Air" basePath="/essais/beton/beton-frais/teneur-air" />} />
      <Route path="/essais/beton/beton-frais/teneur-air/:id/rapport" element={<BetonFraisReport essaiType="teneur-air" essaiTitle="Teneur en Air" normRef="Norme NF EN 12350-7" basePath="/essais/beton/beton-frais/teneur-air" />} />
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
      {/* Traction par Fendage Routes */}
      <Route path="/essais/beton/beton-durci/traction-fendage" element={<TractionFendageTest />} />
      <Route path="/essais/beton/beton-durci/traction-fendage/nouveau" element={<TractionFendageSampleForm />} />
      <Route path="/essais/beton/beton-durci/traction-fendage/:id" element={<TractionFendageDetail />} />
      <Route path="/essais/beton/beton-durci/traction-fendage/:id/modifier" element={<TractionFendageSampleForm />} />
      <Route path="/essais/beton/beton-durci/traction-fendage/:id/saisie" element={<TractionFendageDataEntry />} />
      <Route path="/essais/beton/beton-durci/traction-fendage/:id/rapport" element={<TractionFendageReport />} />
      {/* Module d'Élasticité Routes */}
      <Route path="/essais/beton/beton-durci/module-elasticite" element={<ModuleElasticiteTest />} />
      <Route path="/essais/beton/beton-durci/module-elasticite/nouveau" element={<ModuleElasticiteSampleForm />} />
      <Route path="/essais/beton/beton-durci/module-elasticite/:id" element={<ModuleElasticiteDetail />} />
      <Route path="/essais/beton/beton-durci/module-elasticite/:id/modifier" element={<ModuleElasticiteSampleForm />} />
      <Route path="/essais/beton/beton-durci/module-elasticite/:id/saisie" element={<ModuleElasticiteDataEntry />} />
      <Route path="/essais/beton/beton-durci/module-elasticite/:id/rapport" element={<ModuleElasticiteReport />} />
      {/* Perméabilité Routes */}
      <Route path="/essais/beton/beton-durci/permeabilite" element={<PermeabiliteTest />} />
      <Route path="/essais/beton/beton-durci/permeabilite/nouveau" element={<PermeabiliteSampleForm />} />
      <Route path="/essais/beton/beton-durci/permeabilite/:id" element={<PermeabiliteDetail />} />
      <Route path="/essais/beton/beton-durci/permeabilite/:id/modifier" element={<PermeabiliteSampleForm />} />
      <Route path="/essais/beton/beton-durci/permeabilite/:id/saisie" element={<PermeabiliteDataEntry />} />
      <Route path="/essais/beton/beton-durci/permeabilite/:id/rapport" element={<PermeabiliteReport />} />
      <Route path="/essais/beton/destructif" element={<EssaiDestructif />} />
      <Route path="/essais/beton/destructif/normes" element={<DestructifNormes />} />
      {/* Carottage Routes */}
      <Route path="/essais/beton/destructif/carottage" element={<CarottageTest />} />
      <Route path="/essais/beton/destructif/carottage/nouveau" element={<CarottageSampleForm />} />
      <Route path="/essais/beton/destructif/carottage/:id" element={<CarottageDetail />} />
      <Route path="/essais/beton/destructif/carottage/:id/modifier" element={<CarottageSampleForm />} />
      <Route path="/essais/beton/destructif/carottage/:id/saisie" element={<CarottageDataEntry />} />
      <Route path="/essais/beton/destructif/carottage/:id/rapport" element={<CarottageReport />} />
      <Route path="/essais/beton/destructif/carottage/etat-essais" element={<EtatEssaisCarottage />} />
      <Route path="/essais/beton/non-destructif" element={<EssaiNonDestructif />} />
      <Route path="/essais/beton/non-destructif/normes" element={<NonDestructifNormes />} />
      {/* Scléromètre Routes */}
      <Route path="/essais/beton/non-destructif/sclerometre" element={<SclerometreTest />} />
      <Route path="/essais/beton/non-destructif/sclerometre/nouveau" element={<SclerometreSampleForm />} />
      <Route path="/essais/beton/non-destructif/sclerometre/:id" element={<SclerometreDetail />} />
      <Route path="/essais/beton/non-destructif/sclerometre/:id/modifier" element={<SclerometreSampleForm />} />
      <Route path="/essais/beton/non-destructif/sclerometre/:id/saisie" element={<SclerometreDataEntry />} />
      <Route path="/essais/beton/non-destructif/sclerometre/:id/rapport" element={<SclerometreReport />} />
      {/* Ultrason Routes */}
      <Route path="/essais/beton/non-destructif/ultrason" element={<UltrasonTest />} />
      <Route path="/essais/beton/non-destructif/ultrason/nouveau" element={<UltrasonSampleForm />} />
      <Route path="/essais/beton/non-destructif/ultrason/:id" element={<UltrasonDetail />} />
      <Route path="/essais/beton/non-destructif/ultrason/:id/modifier" element={<UltrasonSampleForm />} />
      <Route path="/essais/beton/non-destructif/ultrason/:id/saisie" element={<UltrasonDataEntry />} />
      <Route path="/essais/beton/non-destructif/ultrason/:id/rapport" element={<UltrasonReport />} />
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
      <Route path="/materiel/etalonnage/:id/modifier" element={<MaterielEtalonnageForm />} />
      <Route path="/materiel/maintenance" element={<MaterielMaintenance />} />
      <Route path="/materiel/maintenance/nouveau" element={<MaterielMaintenanceForm />} />
      <Route path="/materiel/maintenance/historique" element={<MaterielMaintenanceHistorique />} />
      <Route path="/materiel/maintenance/:id" element={<MaterielMaintenanceDetail />} />
      <Route path="/materiel/maintenance/:id/modifier" element={<MaterielMaintenanceForm />} />
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
      <Route path="/documents" element={<DocumentsIndex />} />
      <Route path="/documents/lettres-engagement" element={<LettresEngagement />} />
      <Route path="/documents/lettres-engagement/:id" element={<EngagementPreviewPage />} />
      <Route path="/documents/lettres-engagement/:id/edit" element={<EngagementEditPage />} />
      <Route path="/documents/offres-service" element={<OffresService />} />
      <Route path="/documents/offres-prix" element={<OffresPrix />} />
      <Route path="/documents/attestations" element={<AttestationsBonneExecution />} />
      <Route path="/documents/contrats" element={<Contrats />} />
      <Route path="/documents/contrats/:id" element={<ContratPreviewPage />} />
      <Route path="/documents/contrats/:id/edit" element={<ContratEditPage />} />
      <Route path="/documents/dossier-administratif" element={<DossierAdministratif />} />
      <Route path="/parametres" element={<Parametres />} />
      <Route path="/parametres/entreprise" element={<Entreprise />} />
      <Route path="/parametres/tva" element={<TauxTVA />} />
      <Route path="/parametres/facturation" element={<Facturation />} />
      <Route path="/parametres/utilisateurs" element={<Utilisateurs />} />
      <Route path="/parametres/authentification" element={<Authentification />} />
      <Route path="/parametres/securite" element={<Securite />} />
      <Route path="/parametres/audit" element={<AuditLog />} />
      <Route path="/parametres/notifications" element={<NotificationsSettings />} />
      <Route path="/parametres/database" element={<DatabaseSettings />} />
      <Route path="/parametres/signature" element={<SignatureSettings />} />
      <Route path="/parametres/qrcode" element={<QRCodeSettings />} />
      <Route path="/parametres/systeme" element={<SystemeSettings />} />
      <Route path="/parametres/roles" element={<RolesPermissions />} />
    </Route>
    
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
