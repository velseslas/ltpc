import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ArrowLeft, LogIn, Search, Filter, Users, Clock, Loader2, X } from "lucide-react";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useJournalConnexions, formatDuree } from "@/hooks/useJournalConnexions";

const ITEMS_PER_PAGE = 15;

const JournalConnexions = () => {
  const navigate = useNavigate();
  const { data: entries = [], isLoading } = useJournalConnexions();

  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [statutFilter, setStatutFilter] = useState("all");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [page, setPage] = useState(1);

  const utilisateurs = useMemo(
    () =>
      Array.from(
        new Set(entries.map((e) => e.utilisateur_nom || e.utilisateur_email || "—")),
      ).sort(),
    [entries],
  );

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const label = (e.utilisateur_nom || e.utilisateur_email || "—").toLowerCase();
      if (search && !label.includes(search.toLowerCase())) return false;
      if (userFilter !== "all" && (e.utilisateur_nom || e.utilisateur_email || "—") !== userFilter)
        return false;
      if (statutFilter === "active" && e.deconnexion_at) return false;
      if (statutFilter === "closed" && !e.deconnexion_at) return false;
      if (dateDebut && new Date(e.connexion_at) < new Date(`${dateDebut}T00:00:00`)) return false;
      if (dateFin && new Date(e.connexion_at) > new Date(`${dateFin}T23:59:59`)) return false;
      return true;
    });
  }, [entries, search, userFilter, statutFilter, dateDebut, dateFin]);

  const activeFilters =
    (userFilter !== "all" ? 1 : 0) +
    (statutFilter !== "all" ? 1 : 0) +
    (dateDebut ? 1 : 0) +
    (dateFin ? 1 : 0);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filtered.length);

  const resetFilters = () => {
    setUserFilter("all");
    setStatutFilter("all");
    setDateDebut("");
    setDateFin("");
    setPage(1);
  };

  const tempsTotal = filtered.reduce((acc, e) => acc + (e.duree_secondes ?? 0), 0);

  return (
    <div className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: "Paramètres", path: "/parametres" },
          { label: "Journal des connexions" },
        ]}
      />

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/parametres")}
          className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl bg-gradient-to-br from-lime-500 to-emerald-500">
            <LogIn className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words">
              Journal des <span className="text-primary">connexions</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Heures de connexion, de déconnexion et temps de connexion
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <LogIn className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{filtered.length}</p>
              <p className="text-xs text-muted-foreground">Connexions</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Users className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {new Set(filtered.map((e) => e.user_id)).size}
              </p>
              <p className="text-xs text-muted-foreground">Utilisateurs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <Clock className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatDuree(tempsTotal)}</p>
              <p className="text-xs text-muted-foreground">Temps cumulé</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <CardTitle>Historique des connexions</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2 shrink-0">
                    <Filter className="h-4 w-4" />
                    Filtres
                    {activeFilters > 0 && (
                      <Badge className="ml-1 bg-primary/20 text-primary">{activeFilters}</Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 space-y-4" align="end">
                  <div className="space-y-2">
                    <Label>Utilisateur</Label>
                    <Select
                      value={userFilter}
                      onValueChange={(v) => {
                        setUserFilter(v);
                        setPage(1);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les utilisateurs</SelectItem>
                        {utilisateurs.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Statut de session</Label>
                    <Select
                      value={statutFilter}
                      onValueChange={(v) => {
                        setStatutFilter(v);
                        setPage(1);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="active">En cours</SelectItem>
                        <SelectItem value="closed">Terminées</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Du</Label>
                      <Input
                        type="date"
                        value={dateDebut}
                        onChange={(e) => {
                          setDateDebut(e.target.value);
                          setPage(1);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Au</Label>
                      <Input
                        type="date"
                        value={dateFin}
                        onChange={(e) => {
                          setDateFin(e.target.value);
                          setPage(1);
                        }}
                      />
                    </div>
                  </div>
                  <Button variant="ghost" className="w-full gap-2" onClick={resetFilters}>
                    <X className="h-4 w-4" />
                    Réinitialiser les filtres
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Mobile */}
              <div className="space-y-3 md:hidden">
                {paginated.map((e) => (
                  <div key={e.id} className="rounded-lg border border-border/50 p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">
                        {e.utilisateur_nom || e.utilisateur_email || "—"}
                      </p>
                      {e.deconnexion_at ? (
                        <Badge variant="outline">Terminée</Badge>
                      ) : (
                        <Badge className="bg-emerald-500/20 text-emerald-400">En cours</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Connexion : {format(new Date(e.connexion_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Déconnexion :{" "}
                      {e.deconnexion_at
                        ? format(new Date(e.deconnexion_at), "dd/MM/yyyy HH:mm", { locale: fr })
                        : "—"}
                    </p>
                    <p className="text-xs">Durée : {formatDuree(e.duree_secondes)}</p>
                  </div>
                ))}
              </div>

              {/* Desktop */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Heure de connexion</TableHead>
                      <TableHead>Heure de déconnexion</TableHead>
                      <TableHead>Temps de connexion</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">
                          {e.utilisateur_nom || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {e.utilisateur_email || "—"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(e.connexion_at), "dd/MM/yyyy HH:mm:ss", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          {e.deconnexion_at
                            ? format(new Date(e.deconnexion_at), "dd/MM/yyyy HH:mm:ss", { locale: fr })
                            : "—"}
                        </TableCell>
                        <TableCell>{formatDuree(e.duree_secondes)}</TableCell>
                        <TableCell>
                          {e.deconnexion_at ? (
                            <Badge variant="outline">Terminée</Badge>
                          ) : (
                            <Badge className="bg-emerald-500/20 text-emerald-400">En cours</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <LogIn className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune connexion enregistrée</p>
            </div>
          )}

          {filtered.length > ITEMS_PER_PAGE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1 py-3 border-t border-border mt-4">
              <div className="text-sm text-muted-foreground">
                Affichage de {startIndex + 1} à {endIndex} sur {filtered.length} connexions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JournalConnexions;
