import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { PermissionProvider } from "@/hooks/usePermissionContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const IntervenantSelection = lazy(() => import("./pages/IntervenantSelection"));
const Clients = lazy(() => import("./pages/Clients"));
const ClientDetail = lazy(() => import("./pages/ClientDetail"));
const ClientForm = lazy(() => import("./pages/ClientForm"));
const ChantierForm = lazy(() => import("./pages/ChantierForm"));
const Producteurs = lazy(() => import("./pages/Producteurs"));
const Cimenterie = lazy(() => import("./pages/producteurs/Cimenterie"));
const CimenterieForm = lazy(() => import("./pages/producteurs/CimenterieForm"));
const CimenterieDetail = lazy(() => import("./pages/producteurs/CimenterieDetail"));
const Carriere = lazy(() => import("./pages/producteurs/Carriere"));
const CarriereForm = lazy(() => import("./pages/producteurs/CarriereForm"));
const CarriereDetail = lazy(() => import("./pages/producteurs/CarriereDetail"));
const Adjuvant = lazy(() => import("./pages/producteurs/Adjuvant"));
const AdjuvantForm = lazy(() => import("./pages/producteurs/AdjuvantForm"));
const AdjuvantDetail = lazy(() => import("./pages/producteurs/AdjuvantDetail"));
const SourceEau = lazy(() => import("./pages/producteurs/SourceEau"));
const SourceEauForm = lazy(() => import("./pages/producteurs/SourceEauForm"));
const SourceEauDetail = lazy(() => import("./pages/producteurs/SourceEauDetail"));
const CentraleBeton = lazy(() => import("./pages/producteurs/CentraleBeton"));
const CentraleBetonForm = lazy(() => import("./pages/producteurs/CentraleBetonForm"));
const CentraleBetonDetail = lazy(() => import("./pages/producteurs/CentraleBetonDetail"));
const FormulationForm = lazy(() => import("./pages/producteurs/FormulationForm"));
const Essais = lazy(() => import("./pages/Essais"));
const EssaisAudit = lazy(() => import("./pages/essais/EssaisAudit"));
const EssaiBeton = lazy(() => import("./pages/essais/EssaiBeton"));
const EssaiGranulat = lazy(() => import("./pages/essais/EssaiGranulat"));
const EssaiGeotechnique = lazy(() => import("./pages/essais/EssaiGeotechnique"));
const EssaiIdentification = lazy(() => import("./pages/essais/geotechnique/EssaiIdentification"));
const EssaiCompactage = lazy(() => import("./pages/essais/geotechnique/EssaiCompactage"));
const EssaiMecaniqueSol = lazy(() => import("./pages/essais/geotechnique/EssaiMecaniqueSol"));
const EssaiInSitu = lazy(() => import("./pages/essais/geotechnique/EssaiInSitu"));
const LimitesAtterberg = lazy(() => import("./pages/essais/geotechnique/identification/LimitesAtterberg"));
const GranulometrieSol = lazy(() => import("./pages/essais/geotechnique/identification/GranulometrieSol"));
const GranulometrieSolDataEntry = lazy(() => import("./pages/essais/geotechnique/identification/GranulometrieSolDataEntry"));
const GranulometrieSolReport = lazy(() => import("./pages/essais/geotechnique/identification/GranulometrieSolReport"));
const TeneurEauSol = lazy(() => import("./pages/essais/geotechnique/identification/TeneurEauSol"));
const ClassificationSol = lazy(() => import("./pages/essais/geotechnique/identification/ClassificationSol"));
const TeneurEauSolDataEntry = lazy(() => import("./pages/essais/geotechnique/identification/TeneurEauSolDataEntry"));
const TeneurEauSolReport = lazy(() => import("./pages/essais/geotechnique/identification/TeneurEauSolReport"));
const ClassificationSolDataEntry = lazy(() => import("./pages/essais/geotechnique/identification/ClassificationSolDataEntry"));
const ClassificationSolReport = lazy(() => import("./pages/essais/geotechnique/identification/ClassificationSolReport"));
const ProctorNormal = lazy(() => import("./pages/essais/geotechnique/compactage/ProctorNormal"));
const ProctorModifie = lazy(() => import("./pages/essais/geotechnique/compactage/ProctorModifie"));
const CBR = lazy(() => import("./pages/essais/geotechnique/compactage/CBR"));
const DensitePlace = lazy(() => import("./pages/essais/geotechnique/compactage/DensitePlace"));
const Cisaillement = lazy(() => import("./pages/essais/geotechnique/mecanique/Cisaillement"));
const CompressionSimple = lazy(() => import("./pages/essais/geotechnique/mecanique/CompressionSimple"));
const Triaxial = lazy(() => import("./pages/essais/geotechnique/mecanique/Triaxial"));
const Oedometrique = lazy(() => import("./pages/essais/geotechnique/mecanique/Oedometrique"));
const Penetrometre = lazy(() => import("./pages/essais/geotechnique/insitu/Penetrometre"));
const Pressiometre = lazy(() => import("./pages/essais/geotechnique/insitu/Pressiometre"));
const Plaque = lazy(() => import("./pages/essais/geotechnique/insitu/Plaque"));
const PlaqueDataEntry = lazy(() => import("./pages/essais/geotechnique/insitu/PlaqueDataEntry"));
const PlaqueReport = lazy(() => import("./pages/essais/geotechnique/insitu/PlaqueReport"));
const Sondage = lazy(() => import("./pages/essais/geotechnique/insitu/Sondage"));
const Densitometre = lazy(() => import("./pages/essais/geotechnique/insitu/Densitometre"));
const DensitometreDataEntry = lazy(() => import("./pages/essais/geotechnique/insitu/DensitometreDataEntry"));
const DensitometreReport = lazy(() => import("./pages/essais/geotechnique/insitu/DensitometreReport"));
const EchantillonGeotechniqueForm = lazy(() => import("./pages/essais/geotechnique/EchantillonGeotechniqueForm"));
const GeotechniqueDetail = lazy(() => import("./pages/essais/geotechnique/GeotechniqueDetail"));
const GeotechniqueDataEntry = lazy(() => import("./pages/essais/geotechnique/GeotechniqueDataEntry"));
const ProctorDataEntry = lazy(() => import("./pages/essais/geotechnique/compactage/ProctorDataEntry"));
const ProctorReport = lazy(() => import("./pages/essais/geotechnique/compactage/ProctorReport"));
const CBRDataEntry = lazy(() => import("./pages/essais/geotechnique/compactage/CBRDataEntry"));
const CBRReport = lazy(() => import("./pages/essais/geotechnique/compactage/CBRReport"));
const LimitesAtterbergDataEntry = lazy(() => import("./pages/essais/geotechnique/identification/LimitesAtterbergDataEntry"));
const LimitesAtterbergReport = lazy(() => import("./pages/essais/geotechnique/identification/LimitesAtterbergReport"));
const IdentificationNormes = lazy(() => import("./pages/essais/geotechnique/normes/IdentificationNormes"));
const CompactageNormes = lazy(() => import("./pages/essais/geotechnique/normes/CompactageNormes"));
const MecaniqueNormes = lazy(() => import("./pages/essais/geotechnique/normes/MecaniqueNormes"));
const InSituNormes = lazy(() => import("./pages/essais/geotechnique/normes/InSituNormes"));
const EssaiProprete = lazy(() => import("./pages/essais/granulat/EssaiProprete"));
const EssaiPhysique = lazy(() => import("./pages/essais/granulat/EssaiPhysique"));
const EssaiMecanique = lazy(() => import("./pages/essais/granulat/EssaiMecanique"));
const AnalyseGranulometrie = lazy(() => import("./pages/essais/granulat/physiques/AnalyseGranulometrie"));
const MasseVolumique = lazy(() => import("./pages/essais/granulat/physiques/MasseVolumique"));
const FormeGranulats = lazy(() => import("./pages/essais/granulat/physiques/FormeGranulats"));
const TeneurEau = lazy(() => import("./pages/essais/granulat/physiques/TeneurEau"));
const EquivalentSable = lazy(() => import("./pages/essais/granulat/proprete/EquivalentSable"));
const BleuMethylene = lazy(() => import("./pages/essais/granulat/proprete/BleuMethylene"));
const MatiereOrganique = lazy(() => import("./pages/essais/granulat/proprete/MatiereOrganique"));
const LosAngeles = lazy(() => import("./pages/essais/granulat/mecaniques/LosAngeles"));
const MicroDeval = lazy(() => import("./pages/essais/granulat/mecaniques/MicroDeval"));
const Ecrasement = lazy(() => import("./pages/essais/granulat/mecaniques/Ecrasement"));
const Friabilite = lazy(() => import("./pages/essais/granulat/mecaniques/Friabilite"));
const EchantillonGranulatForm = lazy(() => import("./pages/essais/granulat/EchantillonGranulatForm"));
const GranulatDataEntry = lazy(() => import("./pages/essais/granulat/saisie/GranulatDataEntry"));
const GranulatDetail = lazy(() => import("./pages/essais/granulat/detail/GranulatDetail"));
const GranulatReport = lazy(() => import("./pages/essais/granulat/rapport/GranulatReport"));
const EtatEssaisGranulat = lazy(() => import("./pages/essais/granulat/EtatEssaisGranulat"));
const EtatEssaisBetonFrais = lazy(() => import("./pages/essais/betonfrais/EtatEssaisBetonFrais"));
const EtatEssaisBetonDurci = lazy(() => import("./pages/essais/betondurci/EtatEssaisBetonDurci"));
const BetonFrais = lazy(() => import("./pages/essais/BetonFrais"));
const BetonDurci = lazy(() => import("./pages/essais/BetonDurci"));
const CompressionTest = lazy(() => import("./pages/essais/CompressionTest"));
const CompressionSampleForm = lazy(() => import("./pages/essais/CompressionSampleForm"));
const CompressionDataEntry = lazy(() => import("./pages/essais/CompressionDataEntry"));
const CompressionReport = lazy(() => import("./pages/essais/CompressionReport"));
const SamplingBulletin = lazy(() => import("./pages/essais/SamplingBulletin"));
const CompressionDetail = lazy(() => import("./pages/essais/CompressionDetail"));
const Affaissement = lazy(() => import("./pages/essais/betonfrais/Affaissement"));
const Temperature = lazy(() => import("./pages/essais/betonfrais/Temperature"));
const TempsPrise = lazy(() => import("./pages/essais/betonfrais/TempsPrise"));
const TeneurAir = lazy(() => import("./pages/essais/betonfrais/TeneurAir"));
const EchantillonBetonFraisForm = lazy(() => import("./pages/essais/betonfrais/EchantillonBetonFraisForm"));
const BetonFraisDetail = lazy(() => import("./pages/essais/betonfrais/BetonFraisDetail"));
const BetonFraisDataEntry = lazy(() => import("./pages/essais/betonfrais/BetonFraisDataEntry"));
const BetonFraisReport = lazy(() => import("./pages/essais/betonfrais/BetonFraisReport"));
const BetonFraisNormes = lazy(() => import("./pages/essais/betonfrais/BetonFraisNormes"));
const TractionFendageTest = lazy(() => import("./pages/essais/tractionfendage/TractionFendageTest"));
const TractionFendageSampleForm = lazy(() => import("./pages/essais/tractionfendage/TractionFendageSampleForm"));
const TractionFendageDetail = lazy(() => import("./pages/essais/tractionfendage/TractionFendageDetail"));
const TractionFendageDataEntry = lazy(() => import("./pages/essais/tractionfendage/TractionFendageDataEntry"));
const TractionFendageReport = lazy(() => import("./pages/essais/tractionfendage/TractionFendageReport"));
const ModuleElasticiteTest = lazy(() => import("./pages/essais/moduleelasticite/ModuleElasticiteTest"));
const ModuleElasticiteSampleForm = lazy(() => import("./pages/essais/moduleelasticite/ModuleElasticiteSampleForm"));
const ModuleElasticiteDetail = lazy(() => import("./pages/essais/moduleelasticite/ModuleElasticiteDetail"));
const ModuleElasticiteDataEntry = lazy(() => import("./pages/essais/moduleelasticite/ModuleElasticiteDataEntry"));
const ModuleElasticiteReport = lazy(() => import("./pages/essais/moduleelasticite/ModuleElasticiteReport"));
const PermeabiliteTest = lazy(() => import("./pages/essais/permeabilite/PermeabiliteTest"));
const PermeabiliteSampleForm = lazy(() => import("./pages/essais/permeabilite/PermeabiliteSampleForm"));
const PermeabiliteDetail = lazy(() => import("./pages/essais/permeabilite/PermeabiliteDetail"));
const PermeabiliteDataEntry = lazy(() => import("./pages/essais/permeabilite/PermeabiliteDataEntry"));
const PermeabiliteReport = lazy(() => import("./pages/essais/permeabilite/PermeabiliteReport"));
const FormulationBeton = lazy(() => import("./pages/essais/formulation/FormulationBeton"));
const FormulationBetonWizard = lazy(() => import("./pages/essais/formulation/FormulationBetonWizard"));
const FormulationReport = lazy(() => import("./pages/essais/formulation/FormulationReport"));
const EssaisConvenance = lazy(() => import("./pages/essais/formulation/EssaisConvenance"));
const EssaiDestructif = lazy(() => import("./pages/essais/EssaiDestructif"));
const CarottageTest = lazy(() => import("./pages/essais/destructif/CarottageTest"));
const CarottageSampleForm = lazy(() => import("./pages/essais/destructif/CarottageSampleForm"));
const CarottageDetail = lazy(() => import("./pages/essais/destructif/CarottageDetail"));
const CarottageDataEntry = lazy(() => import("./pages/essais/destructif/CarottageDataEntry"));
const CarottageReport = lazy(() => import("./pages/essais/destructif/CarottageReport"));
const EtatEssaisCarottage = lazy(() => import("./pages/essais/destructif/EtatEssaisCarottage"));
const EssaiNonDestructif = lazy(() => import("./pages/essais/EssaiNonDestructif"));
const SclerometreTest = lazy(() => import("./pages/essais/nondestructif/SclerometreTest"));
const SclerometreSampleForm = lazy(() => import("./pages/essais/nondestructif/SclerometreSampleForm"));
const SclerometreDetail = lazy(() => import("./pages/essais/nondestructif/SclerometreDetail"));
const SclerometreDataEntry = lazy(() => import("./pages/essais/nondestructif/SclerometreDataEntry"));
const SclerometreReport = lazy(() => import("./pages/essais/nondestructif/SclerometreReport"));
const UltrasonTest = lazy(() => import("./pages/essais/nondestructif/UltrasonTest"));
const UltrasonSampleForm = lazy(() => import("./pages/essais/nondestructif/UltrasonSampleForm"));
const UltrasonDetail = lazy(() => import("./pages/essais/nondestructif/UltrasonDetail"));
const UltrasonDataEntry = lazy(() => import("./pages/essais/nondestructif/UltrasonDataEntry"));
const UltrasonReport = lazy(() => import("./pages/essais/nondestructif/UltrasonReport"));
const BetonDurciNormes = lazy(() => import("./pages/essais/betonfrais/BetonDurciNormes"));
const DestructifNormes = lazy(() => import("./pages/essais/DestructifNormes"));
const NonDestructifNormes = lazy(() => import("./pages/essais/NonDestructifNormes"));
const GranulatPhysiquesNormes = lazy(() => import("./pages/essais/granulat/GranulatPhysiquesNormes"));
const GranulatPropreteNormes = lazy(() => import("./pages/essais/granulat/GranulatPropreteNormes"));
const GranulatMecaniquesNormes = lazy(() => import("./pages/essais/granulat/GranulatMecaniquesNormes"));
const MaitreOuvrageListe = lazy(() => import("./pages/maitres-ouvrage/MaitreOuvrageListe"));
const MaitreOuvrageForm = lazy(() => import("./pages/maitres-ouvrage/MaitreOuvrageForm"));
const MaitreOuvrageDetail = lazy(() => import("./pages/maitres-ouvrage/MaitreOuvrageDetail"));
const MaitreOeuvreListe = lazy(() => import("./pages/maitres-oeuvre/MaitreOeuvreListe"));
const MaitreOeuvreForm = lazy(() => import("./pages/maitres-oeuvre/MaitreOeuvreForm"));
const MaitreOeuvreDetail = lazy(() => import("./pages/maitres-oeuvre/MaitreOeuvreDetail"));
const PlaceholderPage = lazy(() => import("./pages/PlaceholderPage").then(m => ({ default: m.PlaceholderPage })));
const Parametres = lazy(() => import("./pages/Parametres"));
const Entreprise = lazy(() => import("./pages/parametres/Entreprise"));
const TauxTVA = lazy(() => import("./pages/parametres/TauxTVA"));
const Facturation = lazy(() => import("./pages/parametres/Facturation"));
const Utilisateurs = lazy(() => import("./pages/parametres/Utilisateurs"));
const Authentification = lazy(() => import("./pages/parametres/Authentification"));
const Securite = lazy(() => import("./pages/parametres/Securite"));
const AuditLog = lazy(() => import("./pages/parametres/AuditLog"));
const NotificationsSettings = lazy(() => import("./pages/parametres/NotificationsSettings"));
const DatabaseSettings = lazy(() => import("./pages/parametres/DatabaseSettings"));
const SignatureSettings = lazy(() => import("./pages/parametres/SignatureSettings"));
const QRCodeSettings = lazy(() => import("./pages/parametres/QRCodeSettings"));
const SystemeSettings = lazy(() => import("./pages/parametres/SystemeSettings"));
const RolesPermissions = lazy(() => import("./pages/parametres/RolesPermissions"));
const RH = lazy(() => import("./pages/RH"));
const Postes = lazy(() => import("./pages/rh/Postes"));
const PosteForm = lazy(() => import("./pages/rh/PosteForm"));
const Employes = lazy(() => import("./pages/rh/Employes"));
const EmployeForm = lazy(() => import("./pages/rh/EmployeForm"));
const EmployeDetail = lazy(() => import("./pages/rh/EmployeDetail"));
const Affectations = lazy(() => import("./pages/rh/Affectations"));
const AffectationForm = lazy(() => import("./pages/rh/AffectationForm"));
const TechnicienDetail = lazy(() => import("./pages/rh/TechnicienDetail"));
const Documents = lazy(() => import("./pages/rh/Documents"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DocumentsIndex = lazy(() => import("./pages/documents/DocumentsIndex"));
const LettresEngagement = lazy(() => import("./pages/documents/LettresEngagement"));
const OffresService = lazy(() => import("./pages/documents/OffresService"));
const OffreServicePreviewPage = lazy(() => import("./pages/documents/OffreServicePreviewPage"));
const OffreServiceEditPage = lazy(() => import("./pages/documents/OffreServiceEditPage"));
const OffresPrix = lazy(() => import("./pages/documents/OffresPrix"));
const AttestationsBonneExecution = lazy(() => import("./pages/documents/AttestationsBonneExecution"));
const Contrats = lazy(() => import("./pages/documents/Contrats"));
const ContratPreviewPage = lazy(() => import("./pages/documents/ContratPreviewPage"));
const ContratEditPage = lazy(() => import("./pages/documents/ContratEditPage"));
const EngagementPreviewPage = lazy(() => import("./pages/documents/EngagementPreviewPage"));
const EngagementEditPage = lazy(() => import("./pages/documents/EngagementEditPage"));
const DossierAdministratif = lazy(() => import("./pages/documents/DossierAdministratif"));
const LaboratoiresMobiles = lazy(() => import("./pages/laboratoires-mobiles/LaboratoiresMobiles"));
const LaboratoireMobileForm = lazy(() => import("./pages/laboratoires-mobiles/LaboratoireMobileForm"));
const LaboratoireMobileDetail = lazy(() => import("./pages/laboratoires-mobiles/LaboratoireMobileDetail"));
const LaboratoireMobileChantier = lazy(() => import("./pages/laboratoires-mobiles/LaboratoireMobileChantier"));
const ChantierEchantillonForm = lazy(() => import("./pages/laboratoires-mobiles/ChantierEchantillonForm"));
const ChantierEchantillonDetail = lazy(() => import("./pages/laboratoires-mobiles/ChantierEchantillonDetail"));
const ChantierEchantillonDataEntry = lazy(() => import("./pages/laboratoires-mobiles/ChantierEchantillonDataEntry"));
const ChantierEchantillonReport = lazy(() => import("./pages/laboratoires-mobiles/ChantierEchantillonReport"));
const ChantierEchantillonBulletin = lazy(() => import("./pages/laboratoires-mobiles/ChantierEchantillonBulletin"));
const EtatCoulages = lazy(() => import("./pages/laboratoires-mobiles/EtatCoulages"));
const FacturationDashboard = lazy(() => import("./pages/facturation/FacturationDashboard"));
const FactureListe = lazy(() => import("./pages/facturation/FactureListe"));
const FactureForm = lazy(() => import("./pages/facturation/FactureForm"));
const FactureDetail = lazy(() => import("./pages/facturation/FactureDetail"));
const FactureDataEntry = lazy(() => import("./pages/facturation/FactureDataEntry"));
const FactureEdit = lazy(() => import("./pages/facturation/FactureEdit"));
const FacturePreview = lazy(() => import("./pages/facturation/FacturePreview"));
const DevisListe = lazy(() => import("./pages/facturation/DevisListe"));
const DevisForm = lazy(() => import("./pages/facturation/DevisForm"));
const DevisDetail = lazy(() => import("./pages/facturation/DevisDetail"));
const DevisEdit = lazy(() => import("./pages/facturation/DevisEdit"));
const DevisPreview = lazy(() => import("./pages/facturation/DevisPreview"));
const DevisDataEntry = lazy(() => import("./pages/facturation/DevisDataEntry"));
const BonCommandeListe = lazy(() => import("./pages/facturation/BonCommandeListe"));
const BonCommandeForm = lazy(() => import("./pages/facturation/BonCommandeForm"));
const EspeceListe = lazy(() => import("./pages/facturation/EspeceListe"));
const EspeceForm = lazy(() => import("./pages/facturation/EspeceForm"));
const EtatPaiementsEspece = lazy(() => import("./pages/facturation/EtatPaiementsEspece"));
const EspeceEdit = lazy(() => import("./pages/facturation/EspeceEdit"));
const VirementListe = lazy(() => import("./pages/facturation/VirementListe"));
const VirementForm = lazy(() => import("./pages/facturation/VirementForm"));
const ChequeListe = lazy(() => import("./pages/facturation/ChequeListe"));
const ChequeForm = lazy(() => import("./pages/facturation/ChequeForm"));
const ChequeEdit = lazy(() => import("./pages/facturation/ChequeEdit"));
const RecapitulatifPaiements = lazy(() => import("./pages/facturation/RecapitulatifPaiements"));
const PrixEssaiListe = lazy(() => import("./pages/facturation/PrixEssaiListe"));
const PrestataireListe = lazy(() => import("./pages/prestataires/PrestataireListe"));
const PrestataireForm = lazy(() => import("./pages/prestataires/PrestataireForm"));
const PrestataireDetail = lazy(() => import("./pages/prestataires/PrestataireDetail"));
const BonCommandePrestataireForm = lazy(() => import("./pages/prestataires/BonCommandePrestataireForm"));
const MaterielDashboard = lazy(() => import("./pages/materiel/MaterielDashboard"));
const MaterielListe = lazy(() => import("./pages/materiel/MaterielListe"));
const MaterielInventaire = lazy(() => import("./pages/materiel/MaterielInventaire"));
const MaterielDetail = lazy(() => import("./pages/materiel/MaterielDetail"));
const MaterielListeForm = lazy(() => import("./pages/materiel/MaterielListeForm"));
const MaterielAffectation = lazy(() => import("./pages/materiel/MaterielAffectation"));
const MaterielAffectationForm = lazy(() => import("./pages/materiel/MaterielAffectationForm"));
const MaterielEtalonnage = lazy(() => import("./pages/materiel/MaterielEtalonnage"));
const MaterielEtalonnageForm = lazy(() => import("./pages/materiel/MaterielEtalonnageForm"));
const MaterielMaintenance = lazy(() => import("./pages/materiel/MaterielMaintenance"));
const MaterielMaintenanceForm = lazy(() => import("./pages/materiel/MaterielMaintenanceForm"));
const MaterielAffectationHistorique = lazy(() => import("./pages/materiel/MaterielAffectationHistorique"));
const MaterielEtalonnageHistorique = lazy(() => import("./pages/materiel/MaterielEtalonnageHistorique"));
const MaterielEtalonnageCertificat = lazy(() => import("./pages/materiel/MaterielEtalonnageCertificat"));
const MaterielMaintenanceHistorique = lazy(() => import("./pages/materiel/MaterielMaintenanceHistorique"));
const MaterielAffectationDetail = lazy(() => import("./pages/materiel/MaterielAffectationDetail"));
const MaterielEtalonnageDetail = lazy(() => import("./pages/materiel/MaterielEtalonnageDetail"));
const MaterielMaintenanceDetail = lazy(() => import("./pages/materiel/MaterielMaintenanceDetail"));
const MaterielDecharge = lazy(() => import("./pages/materiel/MaterielDecharge"));
const MouvementsDashboard = lazy(() => import("./pages/materiel/mouvements/MouvementsDashboard"));
const MouvementsListe = lazy(() => import("./pages/materiel/mouvements/MouvementsListe"));
const MouvementsDechargeListe = lazy(() => import("./pages/materiel/mouvements/MouvementsDechargeListe"));
const MouvementForm = lazy(() => import("./pages/materiel/mouvements/MouvementForm"));
const MouvementDetail = lazy(() => import("./pages/materiel/mouvements/MouvementDetail"));
// Géotechnique - Identification
// Géotechnique - Compactage
// Géotechnique - Mécaniques
// Géotechnique - In-Situ
// Géotechnique - shared
// Essais Physiques Granulat
// Essais Propreté Granulat
// Essais Mécaniques Granulat
// Béton Frais imports
// Traction par Fendage imports
// Module d'Élasticité imports
// Perméabilité imports

// Destructif - Carottage
// Non Destructif - Scléromètre
// Non Destructif - Ultrason
// Normes imports
import { UserCog, Truck, Microscope, Receipt, FileText } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

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

    {/* Page d'impression A4 dédiée — source de vérité PDF, sans chrome */}
    <Route
      path="/reports/compression/:id/print"
      element={
        <ProtectedRoute>
          <CompressionReport />
        </ProtectedRoute>
      }
    />


    
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
      <Route path="/essais/audit" element={<EssaisAudit />} />
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
      <Route path="/essais/beton/formulation/:formulationId/modifier-etude" element={<FormulationBetonWizard />} />
      <Route path="/essais/beton/formulation/:id/rapport" element={<FormulationReport />} />
      <Route path="/essais/beton/formulation/:formulationId/convenance" element={<EssaisConvenance />} />
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
      <Route path="/materiel/mouvements/nouveau/:type" element={<MouvementForm />} />
      <Route path="/materiel/mouvements/:id" element={<MouvementDetail />} />
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
      <Route path="/documents/offres-service/:id" element={<OffreServicePreviewPage />} />
      <Route path="/documents/offres-service/:id/edit" element={<OffreServiceEditPage />} />
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
          <ErrorBoundary>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
              <AppRoutes />
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
