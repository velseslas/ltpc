// DashboardRoleProvider — architecture de Dashboards par rôle (Phase 11).
// Chaque rôle possède sa propre liste de widgets, sans duplication de code.
// Les widgets sont lazy-loadés pour préserver les performances.
import { lazy, Suspense, ComponentType } from "react";
import { Loader2 } from "lucide-react";
import { usePermissionContext } from "@/hooks/usePermissionContext";
import type { AppRole } from "@/hooks/useRolesPermissions";

export type DashboardWidgetKey =
  | "ai"
  | "statsCards"
  | "monthlyChart"
  | "conformity"
  | "familyDistribution"
  | "quickStats"
  | "planning"
  | "activity"
  | "equipment"
  | "recentTests"
  | "summary";

const widgetRegistry: Record<DashboardWidgetKey, ComponentType> = {
  ai: lazy(() => import("@/components/dashboard/widgets/DashboardAIWidget")),
  statsCards: lazy(() => import("@/components/dashboard/layouts/AdminStatsCards")),
  monthlyChart: lazy(() => import("@/components/dashboard/layouts/MonthlyChartBlock")),
  conformity: lazy(() => import("@/components/dashboard/layouts/ConformityBlock")),
  familyDistribution: lazy(() => import("@/components/dashboard/widgets/DashboardFamilyDistribution")),
  quickStats: lazy(() => import("@/components/dashboard/layouts/QuickStatsBlock")),
  planning: lazy(() => import("@/components/dashboard/widgets/DashboardPlanningWidget")),
  activity: lazy(() => import("@/components/dashboard/layouts/ActivityBlock")),
  equipment: lazy(() => import("@/components/dashboard/layouts/EquipmentBlock")),
  recentTests: lazy(() => import("@/components/dashboard/layouts/RecentTestsBlock")),
  summary: lazy(() => import("@/components/dashboard/widgets/DashboardSummaryWidget")),
};

export interface DashboardSection {
  id: string;
  cols?: 1 | 2 | 3;
  widgets: DashboardWidgetKey[];
}

export interface DashboardLayout {
  role: string;
  sections: DashboardSection[];
}

// Layout de référence (administrateur) : équivalent au Dashboard existant, enrichi.
const ADMIN_LAYOUT: DashboardLayout = {
  role: "admin",
  sections: [
    { id: "ai", widgets: ["ai"] },
    { id: "stats", widgets: ["statsCards"] },
    { id: "charts-1", cols: 3, widgets: ["monthlyChart", "monthlyChart", "conformity"] },
    { id: "charts-2", cols: 3, widgets: ["familyDistribution", "familyDistribution", "quickStats"] },
    { id: "planning", widgets: ["planning"] },
    { id: "main", cols: 3, widgets: ["activity", "activity", "equipment"] },
    { id: "recent", widgets: ["recentTests"] },
    { id: "summary", widgets: ["summary"] },
  ],
};

const INGENIEUR_LAYOUT: DashboardLayout = {
  role: "ingenieur",
  sections: [
    { id: "ai", widgets: ["ai"] },
    { id: "stats", widgets: ["statsCards"] },
    { id: "charts", cols: 3, widgets: ["monthlyChart", "monthlyChart", "conformity"] },
    { id: "family", widgets: ["familyDistribution"] },
    { id: "planning", widgets: ["planning"] },
    { id: "recent", widgets: ["recentTests"] },
    { id: "summary", widgets: ["summary"] },
  ],
};

const TECHNICIEN_LAYOUT: DashboardLayout = {
  role: "technicien",
  sections: [
    { id: "stats", widgets: ["statsCards"] },
    { id: "planning", widgets: ["planning"] },
    { id: "recent", widgets: ["recentTests"] },
    { id: "equipment", widgets: ["equipment"] },
    { id: "summary", widgets: ["summary"] },
  ],
};

const SECRETARIAT_LAYOUT: DashboardLayout = {
  role: "secretariat",
  sections: [
    { id: "stats", widgets: ["statsCards"] },
    { id: "planning", widgets: ["planning"] },
    { id: "recent", widgets: ["recentTests"] },
    { id: "summary", widgets: ["summary"] },
  ],
};

const DIRECTION_LAYOUT: DashboardLayout = {
  role: "direction",
  sections: [
    { id: "ai", widgets: ["ai"] },
    { id: "stats", widgets: ["statsCards"] },
    { id: "charts", cols: 3, widgets: ["monthlyChart", "monthlyChart", "conformity"] },
    { id: "family", cols: 3, widgets: ["familyDistribution", "familyDistribution", "quickStats"] },
    { id: "planning", widgets: ["planning"] },
    { id: "summary", widgets: ["summary"] },
  ],
};

const LAYOUTS_BY_ROLE: Record<string, DashboardLayout> = {
  super_admin: ADMIN_LAYOUT,
  admin: ADMIN_LAYOUT,
  manager: ADMIN_LAYOUT,
  ingenieur: INGENIEUR_LAYOUT,
  technicien: TECHNICIEN_LAYOUT,
  operateur: TECHNICIEN_LAYOUT,
  secretariat: SECRETARIAT_LAYOUT,
  lecteur: SECRETARIAT_LAYOUT,
  direction: DIRECTION_LAYOUT,
};

export function resolveDashboardLayout(role: AppRole | string | null | undefined): DashboardLayout {
  if (!role) return ADMIN_LAYOUT;
  return LAYOUTS_BY_ROLE[role] || ADMIN_LAYOUT;
}

function colsClass(cols?: 1 | 2 | 3): string {
  if (cols === 3) return "grid grid-cols-1 lg:grid-cols-3 gap-6";
  if (cols === 2) return "grid grid-cols-1 lg:grid-cols-2 gap-6";
  return "";
}

/**
 * Rendu du Dashboard selon le rôle courant.
 * Aucun changement métier : orchestration pure de widgets existants.
 */
export function DashboardRoleRenderer() {
  const { role } = usePermissionContext();
  const layout = resolveDashboardLayout(role);

  return (
    <Suspense fallback={<div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
      <div className="space-y-6">
        {layout.sections.map((section) => {
          if (!section.cols) {
            return (
              <div key={section.id}>
                {section.widgets.map((w, i) => {
                  const W = widgetRegistry[w];
                  return <W key={`${section.id}-${w}-${i}`} />;
                })}
              </div>
            );
          }
          // Sections en colonnes : le 1er widget occupe cols-1, on gère cols-2 si widget répété.
          const uniqueWidgets = section.widgets;
          return (
            <div key={section.id} className={colsClass(section.cols)}>
              {(() => {
                // Cas 3 colonnes avec "widget widget widget2" => premier bloc lg:col-span-2
                if (section.cols === 3 && uniqueWidgets.length === 3 && uniqueWidgets[0] === uniqueWidgets[1]) {
                  const A = widgetRegistry[uniqueWidgets[0]];
                  const B = widgetRegistry[uniqueWidgets[2]];
                  return (
                    <>
                      <div className="lg:col-span-2"><A /></div>
                      <div><B /></div>
                    </>
                  );
                }
                return uniqueWidgets.map((w, i) => {
                  const W = widgetRegistry[w];
                  return <div key={`${section.id}-${w}-${i}`}><W /></div>;
                });
              })()}
            </div>
          );
        })}
      </div>
    </Suspense>
  );
}
