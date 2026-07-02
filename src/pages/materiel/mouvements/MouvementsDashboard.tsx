import { useNavigate } from "react-router-dom";
import { ArrowLeftRight, FileCheck, Repeat, Undo2, List, AlertTriangle } from "lucide-react";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMaterialStatusCounts, useMouvements, STATUT_LABEL } from "@/hooks/useMouvementsMateriel";
import { MaterielStatutBadge, MouvementTypeBadge, MouvementStatutBadge } from "@/components/materiel/MovementBadges";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const TYPES = [
  { type: "affectation", label: "Affectation", icon: ArrowLeftRight, color: "bg-blue-500/10 text-blue-500" },
  { type: "decharge", label: "Décharge", icon: FileCheck, color: "bg-indigo-500/10 text-indigo-500" },
  { type: "passation", label: "Passation", icon: Repeat, color: "bg-purple-500/10 text-purple-500" },
  { type: "restitution", label: "Restitution", icon: Undo2, color: "bg-emerald-500/10 text-emerald-500" },
] as const;

const STATUT_KEYS: Array<keyof typeof STATUT_LABEL> = [
  "disponible", "affecte", "pris_en_charge", "en_maintenance", "hors_service", "perdu",
];

export default function MouvementsDashboard() {
  const navigate = useNavigate();
  const { data: counts } = useMaterialStatusCounts();
  const { data: recent } = useMouvements();

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire", path: "/materiel" },
        { label: "Mouvements Matériel" },
      ]} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton to="/materiel" />
          <div>
            <h1 className="text-2xl font-bold">Gestion des Mouvements de Matériel</h1>
            <p className="text-muted-foreground">Traçabilité complète : affectation, décharge, passation, restitution</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate("/materiel/mouvements/liste")}>
          <List className="h-4 w-4 mr-2" /> Tous les mouvements
        </Button>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {STATUT_KEYS.map((k) => (
          <Card key={k}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">{STATUT_LABEL[k]}</p>
              <p className="text-3xl font-bold">{counts?.[k] || 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Nouveau mouvement */}
      <Card>
        <CardHeader><CardTitle>Nouveau mouvement</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TYPES.map((t) => (
              <button
                key={t.type}
                onClick={() => {
                  if (t.type === "decharge") navigate("/materiel/mouvements/decharge");
                  else if (t.type === "affectation") navigate("/materiel/mouvements/affectation");
                  else navigate(`/materiel/mouvements/nouveau/${t.type}`);
                }}
                className="border border-border rounded-xl p-4 text-left hover:border-primary/60 transition group"
              >
                <div className={`w-12 h-12 rounded-xl ${t.color} flex items-center justify-center mb-3 group-hover:scale-110 transition`}>
                  <t.icon className="h-6 w-6" />
                </div>
                <p className="font-semibold">{t.label}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent */}
      <Card>
        <CardHeader><CardTitle>Derniers mouvements</CardTitle></CardHeader>
        <CardContent>
          {!recent?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucun mouvement enregistré</p>
          ) : (
            <div className="space-y-2">
              {recent.slice(0, 8).map((m) => (
                <div key={m.id} onClick={() => navigate(`/materiel/mouvements/${m.id}`)}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/40 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <MouvementTypeBadge type={m.type} />
                    <div>
                      <p className="font-medium">{m.numero}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.chantiers?.nom || "—"} · {format(new Date(m.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <MouvementStatutBadge statut={m.statut} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
