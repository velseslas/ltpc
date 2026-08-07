import { lazy } from "react";
import { Route } from "react-router-dom";

const Parametres = lazy(() => import("@/pages/Parametres"));
const Entreprise = lazy(() => import("@/pages/parametres/Entreprise"));
const TauxTVA = lazy(() => import("@/pages/parametres/TauxTVA"));
const Facturation = lazy(() => import("@/pages/parametres/Facturation"));
const Utilisateurs = lazy(() => import("@/pages/parametres/Utilisateurs"));
const Authentification = lazy(() => import("@/pages/parametres/Authentification"));
const Securite = lazy(() => import("@/pages/parametres/Securite"));
const AuditLog = lazy(() => import("@/pages/parametres/AuditLog"));
const NotificationsSettings = lazy(() => import("@/pages/parametres/NotificationsSettings"));
const DatabaseSettings = lazy(() => import("@/pages/parametres/DatabaseSettings"));
const SignatureSettings = lazy(() => import("@/pages/parametres/SignatureSettings"));
const QRCodeSettings = lazy(() => import("@/pages/parametres/QRCodeSettings"));
const SystemeSettings = lazy(() => import("@/pages/parametres/SystemeSettings"));
const RolesPermissions = lazy(() => import("@/pages/parametres/RolesPermissions"));
const IAAPISettings = lazy(() => import("@/pages/parametres/IAAPISettings"));
const NotificationPreferences = lazy(() => import("@/pages/parametres/NotificationPreferences"));
const JournalConnexions = lazy(() => import("@/pages/parametres/JournalConnexions"));

/** Routes de paramétrage (entreprise, TVA, utilisateurs, sécurité, notifications, etc.). */
export const parametresRoutes = (
  <>
    <Route path="/parametres" element={<Parametres />} />
    <Route path="/parametres/entreprise" element={<Entreprise />} />
    <Route path="/parametres/tva" element={<TauxTVA />} />
    <Route path="/parametres/facturation" element={<Facturation />} />
    <Route path="/parametres/utilisateurs" element={<Utilisateurs />} />
    <Route path="/parametres/authentification" element={<Authentification />} />
    <Route path="/parametres/securite" element={<Securite />} />
    <Route path="/parametres/audit" element={<AuditLog />} />
    <Route path="/parametres/notifications" element={<NotificationsSettings />} />
    <Route path="/parametres/notifications-preferences" element={<NotificationPreferences />} />
    <Route path="/parametres/database" element={<DatabaseSettings />} />
    <Route path="/parametres/signature" element={<SignatureSettings />} />
    <Route path="/parametres/qrcode" element={<QRCodeSettings />} />
    <Route path="/parametres/systeme" element={<SystemeSettings />} />
    <Route path="/parametres/roles" element={<RolesPermissions />} />
    <Route path="/parametres/ia-api" element={<IAAPISettings />} />
  </>
);
