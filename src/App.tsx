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
import LtpcAI from "@/pages/ltpc-ai/LtpcAI";
import LtpcAIFab from "@/components/ltpc-ai/LtpcAIFab";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
  if (isLoading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
}

/** Layout persistant : sidebar + protection + permissions + FAB IA. */
function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <PermissionProvider>
        <MainLayout>
          <Outlet />
          <LtpcAIFab />
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

    {/* Page d'impression A4 dédiée — source de vérité PDF, sans chrome */}
    <Route
      path="/reports/compression/:id/print"
      element={
        <ProtectedRoute>
          <CompressionReport />
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
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
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
