import { useNavigate } from "react-router-dom";
import { FileText, Receipt, ShoppingCart, Banknote, ArrowUpRight, Wallet, TrendingUp, AlertTriangle, BarChart3, FlaskConical, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { StatCard } from "@/components/dashboard/StatCard";
import { useFacturationStats } from "@/hooks/useFacturation";

const widgets = [
  {
    title: "Factures",
    description: "Création et suivi des factures clients",
    icon: FileText,
    path: "/facturation/factures",
    color: { bg: "bg-blue-500/10", icon: "text-blue-500" },
  },
  {
    title: "Devis",
    description: "Génération et gestion des devis",
    icon: Receipt,
    path: "/facturation/devis",
    color: { bg: "bg-violet-500/10", icon: "text-violet-500" },
  },
  {
    title: "Bons de commande",
    description: "Suivi des bons de commande clients",
    icon: ShoppingCart,
    path: "/facturation/bons-commande",
    color: { bg: "bg-amber-500/10", icon: "text-amber-500" },
  },
  {
    title: "Paiements Espèce",
    description: "Suivi des paiements en espèce",
    icon: Banknote,
    path: "/facturation/espece",
    color: { bg: "bg-emerald-500/10", icon: "text-emerald-500" },
  },
  {
    title: "Paiements Chèque",
    description: "Suivi des paiements par chèque",
    icon: CreditCard,
    path: "/facturation/cheque",
    color: { bg: "bg-indigo-500/10", icon: "text-indigo-500" },
  },
  {
    title: "Virements bancaires",
    description: "Suivi des virements reçus",
    icon: ArrowUpRight,
    path: "/facturation/virements",
    color: { bg: "bg-cyan-500/10", icon: "text-cyan-500" },
  },
  {
    title: "Récapitulatif paiements",
    description: "Vue d'ensemble de tous les encaissements",
    icon: BarChart3,
    path: "/facturation/recapitulatif",
    color: { bg: "bg-rose-500/10", icon: "text-rose-500" },
  },
  {
    title: "Prix des essais",
    description: "Barème des prix unitaires par essai",
    icon: FlaskConical,
    path: "/facturation/prix-essais",
    color: { bg: "bg-orange-500/10", icon: "text-orange-500" },
  },
];

export default function FacturationDashboard() {
  const navigate = useNavigate();
  const stats = useFacturationStats();

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[{ label: "Facturation" }]} />

      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Module <span className="text-primary">Facturation</span>
        </h1>
        <p className="text-muted-foreground mt-2">Gestion complète de la facturation et des paiements</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Chiffre d'affaires"
          value={`${stats.totalCA.toLocaleString()} DA`}
          subtitle={`${stats.nbFactures} facture(s)`}
          icon={TrendingUp}
        />
        <StatCard
          title="Total encaissé"
          value={`${stats.totalPaye.toLocaleString()} DA`}
          subtitle={`${stats.nbPaiements} paiement(s)`}
          icon={Wallet}
        />
        <StatCard
          title="Impayés"
          value={`${stats.totalImpayes.toLocaleString()} DA`}
          subtitle={`${stats.facturesEnCours} en cours`}
          icon={AlertTriangle}
        />
        <StatCard
          title="Devis en cours"
          value={stats.nbDevis}
          subtitle={`${stats.nbBonsCommande} bon(s) de commande`}
          icon={Receipt}
        />
      </div>

      {/* Widget Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {widgets.map((w) => (
          <Card
            key={w.path}
            className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg bg-card/50 backdrop-blur-sm border-border/50 group"
            onClick={() => navigate(w.path)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", w.color.bg)}>
                  <w.icon className={cn("h-7 w-7", w.color.icon)} />
                </div>
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-1">{w.title}</h3>
              <p className="text-sm text-muted-foreground">{w.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
