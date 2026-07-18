import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  MapPin,
  Users,
  Eye,
  Calendar,
  ArrowLeft,
  Search,
  Info,
} from "lucide-react";
import { useLaboratoiresMobiles } from "@/hooks/useLaboratoiresMobiles";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";

export default function Affectations() {
  const navigate = useNavigate();
  const { data: labos, isLoading } = useLaboratoiresMobiles();

  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [wilayaFilter, setWilayaFilter] = useState<string>("all");

  // Only labos with a responsable affecté
  const affectations = useMemo(() => {
    if (!labos) return [];
    return labos.filter((l) => l.responsable_id && l.intervenants);
  }, [labos]);

  const wilayas = useMemo(() => {
    const set = new Set<string>();
    affectations.forEach((l) => {
      const w = (l.chantiers as any)?.ville || (l as any).ville;
      if (w) set.add(w);
    });
    return Array.from(set).sort();
  }, [affectations]);

  const filtered = useMemo(() => {
    return affectations.filter((l) => {
      if (statutFilter !== "all" && l.statut !== statutFilter) return false;
      const wil = (l.chantiers as any)?.ville;
      if (wilayaFilter !== "all" && wil !== wilayaFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        const tech = `${l.intervenants?.prenom || ""} ${l.intervenants?.nom || ""}`.toLowerCase();
        const client = (l.clients?.nom || "").toLowerCase();
        const chantier = (l.chantiers?.nom || "").toLowerCase();
        if (!tech.includes(s) && !client.includes(s) && !chantier.includes(s)) return false;
      }
      return true;
    });
  }, [affectations, statutFilter, wilayaFilter, search]);

  // Group by client
  const grouped = useMemo(() => {
    const map = new Map<string, { client: any; items: typeof filtered }>();
    filtered.forEach((l) => {
      const key = l.client_id || "none";
      if (!map.has(key)) {
        map.set(key, { client: l.clients, items: [] });
      }
      map.get(key)!.items.push(l);
    });
    return Array.from(map.values());
  }, [filtered]);

  const statutBadge = (statut: string) => {
    const map: Record<string, string> = {
      deploye: "bg-green-500/20 text-green-400 border-green-500/30",
      disponible: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      maintenance: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };
    const label: Record<string, string> = {
      deploye: "Déployé",
      disponible: "Disponible",
      maintenance: "Maintenance",
    };
    return (
      <Badge variant="outline" className={map[statut] || "bg-muted text-muted-foreground"}>
        {label[statut] || statut}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div data-essai-mobile className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: "Ressources Humaines", path: "/rh" },
          { label: "Affectations" },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          onClick={() => navigate("/rh")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Affectations des <span className="text-primary">Techniciens</span>
          </h1>
          <p className="text-muted-foreground">
            Vue consultative — les affectations sont gérées depuis Laboratoires Mobiles
          </p>
        </div>
      </div>

      {/* Info banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-3 flex items-center gap-3 text-sm">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <span className="text-muted-foreground">
            Pour créer, modifier ou supprimer une affectation, rendez-vous dans{" "}
            <button
              onClick={() => navigate("/laboratoires-mobiles")}
              className="text-primary underline hover:no-underline"
            >
              Laboratoires Mobiles
            </button>
            .
          </span>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher technicien, client, chantier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statutFilter} onValueChange={setStatutFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="deploye">Déployé</SelectItem>
            <SelectItem value="disponible">Disponible</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
        <Select value={wilayaFilter} onValueChange={setWilayaFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Wilaya" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les wilayas</SelectItem>
            {wilayas.map((w) => (
              <SelectItem key={w} value={w}>
                {w}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grouped list */}
      <div className="space-y-4">
        {grouped.map(({ client, items }) => (
          <Card key={client?.id || "none"}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{client?.nom || "Client inconnu"}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((l) => {
                const tech = l.intervenants;
                const dateAff = (l as any).date_affectation || l.date_debut;
                return (
                  <div
                    key={l.id}
                    className="bg-muted/50 rounded-lg p-4 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <h4 className="font-medium text-foreground">
                        {l.chantiers?.nom || "Chantier inconnu"}
                      </h4>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {(l.chantiers as any)?.ville || "N/A"}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-3 w-3" />
                        Technicien : {tech?.prenom} {tech?.nom?.toUpperCase()}
                      </div>
                      {(l as any).notes_affectation && (
                        <p className="text-xs text-muted-foreground italic mt-1">
                          {(l as any).notes_affectation}
                        </p>
                      )}
                    </div>
                    <div className="text-right space-y-2 shrink-0">
                      {statutBadge(l.statut || "")}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground justify-end">
                        <Calendar className="h-3 w-3" />
                        {dateAff
                          ? `Depuis le ${format(new Date(dateAff), "dd/MM/yyyy", { locale: fr })}`
                          : "Date non précisée"}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/laboratoires-mobiles/chantier/${l.chantier_id}`)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Voir le chantier
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}

        {grouped.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Aucune affectation trouvée
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
