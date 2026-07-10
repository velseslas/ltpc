import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  Percent, 
  Receipt, 
  Users, 
  KeyRound, 
  Shield, 
  FileText, 
  Bell, 
  Database, 
  PenTool, 
  QrCode, 
  Settings,
  UserCog,
  Brain
} from "lucide-react";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";

const Parametres = () => {
  const navigate = useNavigate();

  const settingsWidgets = [
    {
      id: "entreprise",
      title: "Entreprise",
      description: "Informations de l'entreprise, logo, coordonnées et préférences",
      icon: Building2,
      gradient: "from-blue-500/20 to-cyan-500/10",
      iconColor: "text-blue-500",
      path: "/parametres/entreprise"
    },
    {
      id: "tva",
      title: "Taux TVA",
      description: "Configuration des différents taux de TVA applicables",
      icon: Percent,
      gradient: "from-violet-500/20 to-purple-500/10",
      iconColor: "text-violet-500",
      path: "/parametres/tva"
    },
    {
      id: "facturation",
      title: "Facturation",
      description: "Modèles de facture, conditions de paiement et paramètres comptables",
      icon: Receipt,
      gradient: "from-emerald-500/20 to-green-500/10",
      iconColor: "text-emerald-500",
      path: "/parametres/facturation"
    },
    {
      id: "utilisateurs",
      title: "Utilisateurs",
      description: "Gérer les utilisateurs, les rôles et les permissions",
      icon: Users,
      gradient: "from-amber-500/20 to-orange-500/10",
      iconColor: "text-amber-500",
      path: "/parametres/utilisateurs"
    },
    {
      id: "authentification",
      title: "Authentification",
      description: "Gestion des comptes utilisateurs et authentification",
      icon: KeyRound,
      gradient: "from-sky-500/20 to-blue-500/10",
      iconColor: "text-sky-500",
      path: "/parametres/authentification"
    },
    {
      id: "securite",
      title: "Sécurité",
      description: "Paramètres de sécurité et d'authentification",
      icon: Shield,
      gradient: "from-rose-500/20 to-red-500/10",
      iconColor: "text-rose-500",
      path: "/parametres/securite"
    },
    {
      id: "audit",
      title: "Journal d'Audit",
      description: "Suivi des actions des utilisateurs et des modifications système",
      icon: FileText,
      gradient: "from-teal-500/20 to-cyan-500/10",
      iconColor: "text-teal-500",
      path: "/parametres/audit"
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "Canaux, fréquences, catégories et Push (Web / PWA)",
      icon: Bell,
      gradient: "from-indigo-500/20 to-violet-500/10",
      iconColor: "text-indigo-500",
      path: "/parametres/notifications-preferences"
    },
    {
      id: "database",
      title: "Base de données",
      description: "Configuration et maintenance de la base de données",
      icon: Database,
      gradient: "from-slate-500/20 to-gray-500/10",
      iconColor: "text-slate-500",
      path: "/parametres/database"
    },
    {
      id: "signature",
      title: "Signature",
      description: "Gestion des signatures électroniques et cachets numériques",
      icon: PenTool,
      gradient: "from-pink-500/20 to-rose-500/10",
      iconColor: "text-pink-500",
      path: "/parametres/signature"
    },
    {
      id: "qrcode",
      title: "QR Code",
      description: "Configuration automatique des QR codes pour documents PDF",
      icon: QrCode,
      gradient: "from-purple-500/20 to-indigo-500/10",
      iconColor: "text-purple-500",
      path: "/parametres/qrcode"
    },
    {
      id: "roles",
      title: "Rôles & Permissions",
      description: "Gestion des rôles utilisateurs et de leurs droits d'accès au système",
      icon: UserCog,
      gradient: "from-cyan-500/20 to-teal-500/10",
      iconColor: "text-cyan-500",
      path: "/parametres/roles"
    },
    {
      id: "ia-api",
      title: "IA & API",
      description: "Configuration des assistants IA et des clés API",
      icon: Brain,
      gradient: "from-violet-500/20 to-fuchsia-500/10",
      iconColor: "text-violet-500",
      path: "/parametres/ia-api"
    },
    {
      id: "systeme",
      title: "Système",
      description: "Configuration générale du système",
      icon: Settings,
      gradient: "from-orange-500/20 to-amber-500/10",
      iconColor: "text-orange-500",
      path: "/parametres/systeme"
    },
  ];

  return (
    <>
      <AppBreadcrumb items={[{ label: "Paramètres" }]} />

      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">
          <span className="text-primary text-glow">Paramètres</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Configuration et personnalisation de votre application
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsWidgets.map((widget) => (
          <div
            key={widget.id}
            onClick={() => navigate(widget.path)}
            className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5 hover:border-primary/50"
          >
            <div className="space-y-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${widget.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <widget.icon className={`h-7 w-7 ${widget.iconColor}`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {widget.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {widget.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Parametres;
