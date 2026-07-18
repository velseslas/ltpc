import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Repeat } from "lucide-react";
import { useMouvements } from "@/hooks/useMouvementsMateriel";
import { MouvementStatutBadge } from "@/components/materiel/MovementBadges";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function MouvementsPassationListe() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useMouvements({ type: "passation" });

  const filtered = (data || []).filter((m) => {
    const s = search.toLowerCase();
    return (
      !s ||
      m.numero?.toLowerCase().includes(s) ||
      m.chantiers?.nom?.toLowerCase().includes(s) ||
      `${m.entrant?.prenom || ""} ${m.entrant?.nom || ""}`.toLowerCase().includes(s) ||
      `${m.sortant?.prenom || ""} ${m.sortant?.nom || ""}`.toLowerCase().includes(s)
    );
  });

  return (
    <div data-essai-mobile className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: "Matériel Laboratoire", path: "/materiel" },
          { label: "Mouvements", path: "/materiel/mouvements" },
          { label: "Passation" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton to="/materiel/mouvements" />
          <div>
            <h1 className="text-2xl font-bold">Passation</h1>
            <p className="text-muted-foreground">Liste des passations de matériel entre techniciens</p>
          </div>
        </div>
        <Button onClick={() => navigate("/materiel/mouvements/nouveau/passation")}>
          <Plus className="h-4 w-4 mr-2" /> Nouvelle passation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher (n°, chantier, technicien...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <CardTitle className="md:ml-auto text-base text-muted-foreground">
              {filtered.length} passation(s)
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Chantier</TableHead>
                <TableHead>Technicien sortant</TableHead>
                <TableHead>Technicien entrant</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : !filtered.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Repeat className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    Aucune passation
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((m) => (
                  <TableRow
                    key={m.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/materiel/mouvements/${m.id}`)}
                  >
                    <TableCell className="font-mono">{m.numero}</TableCell>
                    <TableCell>
                      {format(new Date(m.date_mouvement), "dd/MM/yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>{m.chantiers?.nom || "—"}</TableCell>
                    <TableCell>{m.sortant ? `${m.sortant.prenom} ${m.sortant.nom}` : "—"}</TableCell>
                    <TableCell>{m.entrant ? `${m.entrant.prenom} ${m.entrant.nom}` : "—"}</TableCell>
                    <TableCell>
                      <MouvementStatutBadge statut={m.statut} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
