import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { PermissionProvider } from "@/hooks/usePermissionContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import LtpcAI from "@/pages/ltpc-ai/LtpcAI";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkStatusToaster } from "@/components/pwa/NetworkStatusToaster";
import { PWAUpdatePrompt } from "@/components/pwa/PWAUpdatePrompt";

const DebugPWA = lazy(() => import("@/pages/pwa/DebugPWA"));
const DebugNotifications = lazy(() => import("@/pages/pwa/DebugNotifications"));

// Route modules — un fichier par domaine (voir src/routes/).
import { intervenantRoutes } from "@/routes/intervenantRoutes";
import { rhRoutes } from "@/routes/rhRoutes";
import { essaisCoreRoutes } from "@/routes/essaisCoreRoutes";
import { granulatRoutes } from "@/routes/granulatRoutes";
import { geotechniqueRoutes } from "@/routes/geotechniqueRoutes";
import { betonRoutes } from "@/routes/betonRoutes";
import { laboMobilesRoutes } from "@/routes/laboMobilesRoutes";
import { materielRoutes } from "@/routes/materielRoutes";
import { facturationRoutes } from "@/routes/facturationRoutes";
import { documentsRoutes } from "@/routes/documentsRoutes";
import { parametresRoutes } from "@/routes/parametresRoutes";
import { messagerieRoutes } from "@/routes/messagerieRoutes";

// Pages transverses (accueil, auth, LTPC AI, print, verif).
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const KnowledgeBase = lazy(() => import("@/pages/ltpc-ai/KnowledgeBase"));
const Monitoring = lazy(() => import("@/pages/ltpc-ai/Monitoring"));
const CentrePilotage = lazy(() => import("@/pages/ltpc-ai/CentrePilotage"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NotFound = lazy(() => import("./pages/NotFound"));
const VerificationPage = lazy(() => import("./pages/verification/VerificationPage"));
const CompressionReport = lazy(() => import("./pages/essais/CompressionReport"));
const RapportTechniquePrintView = lazy(() => import("./pages/essais/rapports-techniques/RapportTechniquePrintView"));
const RenderBootstrap = lazy(() => import("./pages/render/RenderBootstrap"));

// Phase 5 — Performance : defaults React Query optimisés pour réduire les
// requêtes réseau redondantes (focus/reconnect) tout en gardant les données
// fraîches sur navigation. Aucune modification métier.
const queryClient = new QueryClient({
  // Filet de sécurité global : après TOUTE mutation réussie (enregistrer,
  // modifier, supprimer), on invalide les requêtes actives. React Query ne
  // refetch que les queries actuellement montées → l'écran affiché se met
  // à jour immédiatement, sans rechargement manuel de la page.
  mutationCache: new MutationCache({
    onSuccess: () => {
      queryClient.invalidateQueries({ type: "active" });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // 5 min : évite les refetch trop fréquents
      gcTime: 1000 * 60 * 30,          // 30 min : garde le cache pour navigations arrière rapides
      retry: 1,
      refetchOnWindowFocus: false,     // évite les rafales au retour d'onglet
      refetchOnReconnect: "always",    // resynchronise après perte réseau (utile PWA)
      refetchOnMount: true,
    },
    mutations: {
      retry: 0,
    },
  },
});


function AuthRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
}

/** Layout persistant : sidebar + protection + permissions. */
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
    {/* Routes publiques */}
    <Route path="/auth" element={<AuthRedirect />} />
    <Route path="/verification/:token" element={<VerificationPage />} />

    {/* §7.2 — Point d'entrée du moteur PDF : consomme le jeton de rendu figé
        côté serveur puis redirige vers la route d'impression réelle LTPC. */}
    <Route
      path="/__render/:token"
      element={
        <Suspense fallback={<div className="p-8 text-sm">Chargement…</div>}>
          <RenderBootstrap />
        </Suspense>
      }
    />


    {/* Page d'impression A4 dédiée — source de vérité PDF, sans chrome */}
    <Route
      path="/reports/compression/:id/print"
      element={
        <ProtectedRoute>
          <CompressionReport />
        </ProtectedRoute>
      }
    />
    <Route
      path="/reports/rapport-technique/:id/print"
      element={
        <ProtectedRoute>
          <Suspense fallback={<div className="p-8 text-sm">Chargement…</div>}>
            <RapportTechniquePrintView />
          </Suspense>
        </ProtectedRoute>
      }
    />

    {/* Routes protégées avec layout persistant */}
    <Route element={<ProtectedLayout />}>
      <Route path="/" element={<Index />} />
      <Route path="/ltpc-ai" element={<LtpcAI />} />
      <Route path="/ltpc-ai/knowledge" element={<KnowledgeBase />} />
      <Route path="/ltpc-ai/monitoring" element={<Monitoring />} />
      <Route path="/ltpc-ai/audit" element={<CentrePilotage />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/debug/pwa" element={<DebugPWA />} />
      <Route path="/debug/notifications" element={<DebugNotifications />} />
      {intervenantRoutes}
      {rhRoutes}
      {essaisCoreRoutes}
      {granulatRoutes}
      {geotechniqueRoutes}
      {betonRoutes}
      {laboMobilesRoutes}
      {materielRoutes}
      {facturationRoutes}
      {documentsRoutes}
      {parametresRoutes}
      {messagerieRoutes}
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <NetworkStatusToaster />
      <PWAUpdatePrompt />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <Suspense fallback={<div className="flex items-center justify-center min-h-dvh"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
              <AppRoutes />
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
