import { useNavigate } from "react-router-dom";
import { CreditCard, Banknote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { usePaiementsCheque, usePaiementsEspece } from "@/hooks/useFacturation";

const widgets = [
  {
    title: "Chèque",
    description: "Gestion des paiements par chèque",
    icon: CreditCard,
    path: "/facturation/cheque",
    color: { bg: "bg-blue-500/10", icon: "text-blue-500" },
  },
  {
    title: "Espèce",
    description: "Gestion des paiements en espèce",
    icon: Banknote,
    path: "/facturation/espece",
    color: { bg: "bg-emerald-500/10", icon: "text-emerald-500" },
  },
];

export default function FacturationDashboard() {
  const navigate = useNavigate();
  const { data: chequeData } = usePaiementsCheque();
  const { data: especeData } = usePaiementsEspece();

  const counts = [chequeData?.length || 0, especeData?.length || 0];

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[{ label: "Facturation" }]} />

      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Module <span className="text-primary">Facturation</span>
        </h1>
        <p className="text-muted-foreground mt-2">Gestion des paiements</p>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {widgets.map((w, index) => (
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
                <span className="text-3xl font-bold text-foreground">{counts[index]}</span>
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
