import { useNavigate } from "react-router-dom";
import { List, Gauge, Wrench, FileMinus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useMaterielList, useEtalonnageMateriel, useMaintenanceMateriel } from "@/hooks/useMaterielLaboratoire";

const widgets = [
  {
    title: "Liste Matériel",
    description: "Inventaire complet du matériel de laboratoire",
    icon: List,
    path: "/materiel/liste",
    color: { bg: "bg-blue-500/10", icon: "text-blue-500" },
  },
  {
    title: "Étalonnage Matériel",
    description: "Suivi des étalonnages et certificats",
    icon: Gauge,
    path: "/materiel/etalonnage",
    color: { bg: "bg-purple-500/10", icon: "text-purple-500" },
  },
  {
    title: "Maintenance Matériel",
    description: "Planification et suivi de la maintenance",
    icon: Wrench,
    path: "/materiel/maintenance",
    color: { bg: "bg-amber-500/10", icon: "text-amber-500" },
  },
  {
    title: "Mouvements Matériel",
    description: "Affectations, décharges, passations et restitutions",
    icon: FileMinus,
    path: "/materiel/mouvements",
    color: { bg: "bg-rose-500/10", icon: "text-rose-500" },
  },
];

export default function MaterielDashboard() {
  const navigate = useNavigate();
  const { data: materielData } = useMaterielList();
  const { data: etalonnageData } = useEtalonnageMateriel();
  const { data: maintenanceData } = useMaintenanceMateriel();

  const counts = [
    materielData?.length || 0,
    etalonnageData?.length || 0,
    maintenanceData?.length || 0,
    0,
  ];

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire" },
      ]} />

      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Matériel <span className="text-primary">Laboratoire</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Gestion complète du matériel de laboratoire
        </p>
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
