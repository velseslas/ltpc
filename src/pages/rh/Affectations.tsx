import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChantierStatutBadge } from "@/components/chantiers/ChantierStatutBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  MapPin,
  Users,
  Calendar,
  ArrowLeft,
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import { useAffectations, useDeleteAffectation } from "@/hooks/useAffectations";
import { useIntervenants } from "@/hooks/useIntervenants";
import { useClients } from "@/hooks/useClients";
import { ConfirmDelete } from "@/components/common/ConfirmDelete";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";

export default function Affectations() {
  const navigate = useNavigate();
  const { data: affectations, isLoading } = useAffectations();
  const { data: intervenants } = useIntervenants();
  const { data: clients } = useClients();
  const deleteAffectation = useDeleteAffectation();

  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [technicienFilter, setTechnicienFilter] = useState<string>("all");

  const list = affectations ?? [];

  const filtered = useMemo(() => {
    return list.filter((a: any) => {
      if (clientFilter !== "all" && a.client_id !== clientFilter) return false;
      if (technicienFilter !== "all" && a.intervenant_id !== technicienFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        const tech = `${a.intervenant?.prenom || ""} ${a.intervenant?.nom || ""}`.toLowerCase();
        const client = (a.client?.nom || "").toLowerCase();
        const chantier = (a.chantier?.nom || "").toLowerCase();
        if (!tech.includes(s) && !client.includes(s) && !chantier.includes(s)) return false;
      }
      return true;
    });
  }, [list, clientFilter, technicienFilter, search]);

  // Regroupement par client (un chantier peut avoir plusieurs techniciens)
  const grouped = useMemo(() => {
    const map = new Map<string, { client: any; items: any[] }>();
    filtered.forEach((a: any) => {
      const key = a.client_id || "none";
      if (!map.has(key)) map.set(key, { client: a.client, items: [] });
      map.get(key)!.items.push(a);
    });
    return Array.from(map.values());
  }, [filtered]);

  const isActive = (a: any) => !a.date_fin || new Date(a.date_fin) >= new Date();

  const handleDelete = async (id: string) => {
    try {
      await deleteAffectation.mutateAsync(id);
      toast.success("Affectation supprimée");
    } catch (e) {
      toast.error("Erreur lors de la suppression");
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
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
              Un chantier peut avoir plusieurs techniciens, un technicien peut être affecté à
              plusieurs chantiers
            </p>
          </div>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => navigate("/rh/affectations/nouveau")}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle affectation
        </Button>
      </div>

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
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les clients</SelectItem>
            {clients?.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={technicienFilter} onValueChange={setTechnicienFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Technicien" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les techniciens</SelectItem>
            {intervenants?.map((i: any) => (
              <SelectItem key={i.id} value={i.id}>
                {i.prenom} {i.nom}
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
                <Badge variant="outline">{items.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((a: any) => (
                <div
                  key={a.id}
                  className="bg-muted/50 rounded-lg p-4 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <h4 className="font-medium text-foreground">
                      {a.chantier?.nom || "Chantier inconnu"}
                    </h4>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {a.chantier?.ville || "N/A"}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-3 w-3" />
                      Technicien : {a.intervenant?.prenom} {a.intervenant?.nom?.toUpperCase()}
                    </div>
                    {a.notes && (
                      <p className="text-xs text-muted-foreground italic mt-1">{a.notes}</p>
                    )}
                  </div>
                  <div className="text-right space-y-2 shrink-0">
                    <div className="flex items-center gap-2 justify-end flex-wrap">
                      <ChantierStatutBadge statut={a.chantier?.statut} />
                      <Badge
                        variant="outline"
                        className={
                          a.statut !== "inactif"
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5" />
                        {a.statut !== "inactif" ? "Technicien actif" : "Technicien inactif"}
                      </Badge>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/rh/affectations/${a.id}/modifier`)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(`/laboratoires-mobiles/chantier/${a.chantier_id}`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir le chantier
                          </DropdownMenuItem>
                          <ConfirmDelete
                            trigger={
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            }
                            onConfirm={() => handleDelete(a.id)}
                            description="Cette affectation sera définitivement supprimée."
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground justify-end">
                      <Calendar className="h-3 w-3" />
                      {a.date_debut
                        ? `Du ${format(new Date(a.date_debut), "dd/MM/yyyy", { locale: fr })}`
                        : "Date non précisée"}
                      {a.date_fin
                        ? ` au ${format(new Date(a.date_fin), "dd/MM/yyyy", { locale: fr })}`
                        : ""}
                    </div>
                  </div>
                </div>
              ))}
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
