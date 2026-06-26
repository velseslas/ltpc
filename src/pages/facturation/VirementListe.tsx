import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ArrowUpRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { usePaiementsVirement, useDeletePaiementVirement } from "@/hooks/useFacturation";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statutBadge = (s: string) => {
  const map: Record<string, { label: string; cls: string }> = {
    en_attente: { label: "En attente", cls: "bg-amber-500/20 text-amber-500 border-amber-500/30" },
    recu: { label: "Reçu", cls: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" },
    rejete: { label: "Rejeté", cls: "bg-red-500/20 text-red-500 border-red-500/30" },
  };
  const m = map[s] || { label: s, cls: "" };
  return <Badge className={m.cls}>{m.label}</Badge>;
};

export default function VirementListe() {
  const navigate = useNavigate();
  const { data, isLoading } = usePaiementsVirement();
  const deleteMutation = useDeletePaiementVirement();
  const [search, setSearch] = useState("");

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce virement ?")) return;
    try { await deleteMutation.mutateAsync(id); toast.success("Supprimé"); } catch { toast.error("Erreur"); }
  };

  const filtered = data?.filter((v: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (v.reference_virement?.toLowerCase().includes(s) ||
      (v.clients as any)?.nom?.toLowerCase().includes(s) ||
      (v.factures as any)?.numero?.toLowerCase().includes(s) ||
      v.banque?.toLowerCase().includes(s) ||
      v.statut?.toLowerCase().includes(s) ||
      String(v.montant ?? "").includes(s));
  });

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[{ label: "Facturation", path: "/facturation" }, { label: "Virements" }]} />
      <div className="flex items-center gap-3">
        <BackButton to="/facturation" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Virements bancaires</h1>
          <p className="text-muted-foreground">Suivi des virements reçus</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par référence, client, facture, banque, montant..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-11 bg-card border-border"
          />
        </div>
        <Button className="gap-2 shrink-0" onClick={() => navigate("/facturation/virements/nouveau")}>
          <Plus className="h-4 w-4" />Nouveau virement
        </Button>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader><CardTitle className="flex items-center gap-2"><ArrowUpRight className="h-5 w-5" />Virements ({filtered?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : !filtered?.length ? (
            <div className="text-center py-12 text-muted-foreground"><ArrowUpRight className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Aucun virement</p></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Facture</TableHead>
                    <TableHead>Banque</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((v: any) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.reference_virement || "—"}</TableCell>
                      <TableCell>{(v.clients as any)?.nom || "—"}</TableCell>
                      <TableCell>{(v.factures as any)?.numero || "—"}</TableCell>
                      <TableCell>{v.banque || "—"}</TableCell>
                      <TableCell>{Number(v.montant).toLocaleString()} DA</TableCell>
                      <TableCell>{format(new Date(v.date_virement), "dd/MM/yyyy", { locale: fr })}</TableCell>
                      <TableCell>{statutBadge(v.statut)}</TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
