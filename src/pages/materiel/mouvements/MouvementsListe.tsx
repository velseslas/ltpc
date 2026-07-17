import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Printer } from "lucide-react";
import { useMouvements, MouvementType, MOUVEMENT_TYPE_LABEL } from "@/hooks/useMouvementsMateriel";
import { MouvementTypeBadge, MouvementStatutBadge } from "@/components/materiel/MovementBadges";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PrintService } from "@/lib/print/PrintService";

// LOT 9 — Template Liste des mouvements matériel (paysage).
PrintService.registerTemplate({ id: "materiel-mouvements-liste", title: "Liste des mouvements", orientation: "landscape" });

export default function MouvementsListe() {
  const navigate = useNavigate();
  const [type, setType] = useState<MouvementType | "all">("all");
  const [search, setSearch] = useState("");
  const { data } = useMouvements({ type: type === "all" ? undefined : type });

  const filtered = (data || []).filter((m) => {
    const s = search.toLowerCase();
    return !s || m.numero?.toLowerCase().includes(s) || m.chantiers?.nom?.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire", path: "/materiel" },
        { label: "Mouvements", path: "/materiel/mouvements" },
        { label: "Liste" },
      ]} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton to="/materiel/mouvements" />
          <h1 className="text-2xl font-bold">Liste des Mouvements</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" /> Imprimer</Button>
          <Button onClick={() => navigate("/materiel/mouvements/nouveau/affectation")}>
            <Plus className="h-4 w-4 mr-2" /> Nouveau
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <Input placeholder="Rechercher (n°, chantier...)" value={search} onChange={(e) => setSearch(e.target.value)} className="md:max-w-sm" />
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger className="md:w-60"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {(Object.keys(MOUVEMENT_TYPE_LABEL) as MouvementType[]).map((t) => (
                  <SelectItem key={t} value={t}>{MOUVEMENT_TYPE_LABEL[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <CardTitle className="md:ml-auto text-base">{filtered.length} mouvement(s)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead><TableHead>Type</TableHead>
                <TableHead>Date</TableHead><TableHead>Chantier</TableHead>
                <TableHead>Technicien</TableHead><TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id} className="cursor-pointer" onClick={() => navigate(`/materiel/mouvements/${m.id}`)}>
                  <TableCell className="font-mono">{m.numero}</TableCell>
                  <TableCell><MouvementTypeBadge type={m.type} /></TableCell>
                  <TableCell>{format(new Date(m.date_mouvement), "dd/MM/yyyy", { locale: fr })}</TableCell>
                  <TableCell>{m.chantiers?.nom || "—"}</TableCell>
                  <TableCell>
                    {m.entrant ? `${m.entrant.prenom} ${m.entrant.nom}` : (m.sortant ? `${m.sortant.prenom} ${m.sortant.nom}` : "—")}
                  </TableCell>
                  <TableCell><MouvementStatutBadge statut={m.statut} /></TableCell>
                </TableRow>
              ))}
              {!filtered.length && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun mouvement</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
