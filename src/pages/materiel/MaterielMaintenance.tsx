import { useNavigate } from "react-router-dom";
import { PrintService } from "@/lib/print/PrintService";

// LOT 9 — Template Maintenances matériel (paysage).
PrintService.registerTemplate({ id: "materiel-maintenance", title: "Maintenances matériel", orientation: "landscape" });
import { Plus, Trash2, Wrench, Pencil, MoreHorizontal, Eye, History, Search, ClipboardList, Printer, Download, X, Filter } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useMaintenanceMateriel, useDeleteMaintenanceMateriel, useMaterielList } from "@/hooks/useMaterielLaboratoire";
import { useEntreprise } from "@/hooks/useEntreprise";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EntrepriseHeader } from "@/components/print/EntrepriseHeader";
import { AdminOnly } from "@/components/common/AdminOnly";

export default function MaterielMaintenance() {
  const navigate = useNavigate();
  const { data, isLoading } = useMaintenanceMateriel();
  const { data: entreprise } = useEntreprise();
  const { data: materiels } = useMaterielList();
  const deleteMutation = useDeleteMaintenanceMateriel();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Inline report mode
  const [reportMode, setReportMode] = useState(false);
  const [fType, setFType] = useState<string>("all");
  const [fStatut, setFStatut] = useState<string>("all");
  const [fMateriel, setFMateriel] = useState<string>("all");
  const [fPrestataire, setFPrestataire] = useState<string>("all");
  const [fDateDebut, setFDateDebut] = useState<string>("");
  const [fDateFin, setFDateFin] = useState<string>("");
  const reportRef = useRef<HTMLDivElement>(null);

  const prestataires = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.map((m: any) => m.prestataire).filter(Boolean))) as string[];
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((m: any) =>
      m.materiel_laboratoire?.nom?.toLowerCase().includes(q) ||
      m.type_maintenance?.toLowerCase().includes(q) ||
      m.prestataire?.toLowerCase().includes(q) ||
      m.statut?.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const reportData = useMemo(() => {
    if (!data) return [];
    return data.filter((m: any) => {
      if (fType !== "all" && m.type_maintenance !== fType) return false;
      if (fStatut !== "all" && m.statut !== fStatut) return false;
      if (fMateriel !== "all" && m.materiel_id !== fMateriel) return false;
      if (fPrestataire !== "all" && m.prestataire !== fPrestataire) return false;
      if (fDateDebut && new Date(m.date_maintenance) < new Date(fDateDebut)) return false;
      if (fDateFin && new Date(m.date_maintenance) > new Date(fDateFin)) return false;
      return true;
    });
  }, [data, fType, fStatut, fMateriel, fPrestataire, fDateDebut, fDateFin]);

  const handleResetFilters = () => {
    setFType("all"); setFStatut("all"); setFMateriel("all"); setFPrestataire("all");
    setFDateDebut(""); setFDateFin("");
  };

  const handlePrintReport = () => {
    PrintService.print({ title: "Maintenances matériel", orientation: "landscape" });
  };

  const handleDownloadReport = async () => {
    PrintService.print({ title: "Maintenances matériel", orientation: "landscape" });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteMutation.mutateAsync(deleteId); toast.success("Supprimé"); } catch { toast.error("Erreur"); }
    setDeleteId(null);
  };

  const typeLabel = (t: string) => t === "preventive" ? "Préventive" : t === "corrective" ? "Corrective" : t === "curative" ? "Curative" : t;
  const statutLabel = (s: string) => s === "planifie" ? "Planifié" : s === "en_cours" ? "En cours" : s === "termine" ? "Terminé" : s;

  const typeBadge = (t: string) => {
    switch (t) {
      case "preventive": return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Préventive</Badge>;
      case "corrective": return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Corrective</Badge>;
      case "curative": return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Curative</Badge>;
      default: return <Badge variant="outline">{t}</Badge>;
    }
  };

  const statutBadge = (s: string) => {
    switch (s) {
      case "planifie": return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Planifié</Badge>;
      case "en_cours": return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">En cours</Badge>;
      case "termine": return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Terminé</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  // ---- Report (inline) view ----
  if (reportMode) {
    return (
      <div data-essai-mobile className="space-y-6">
        <AppBreadcrumb items={[
          { label: "Matériel Laboratoire", path: "/materiel" },
          { label: "Maintenance Matériel", path: "/materiel/maintenance" },
          { label: "Liste maintenance" },
        ]} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="shrink-0 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50" onClick={() => setReportMode(false)}>
              <X className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ClipboardList className="h-6 w-6" />
                Liste des maintenances
              </h1>
              <p className="text-muted-foreground">Filtrez puis exportez la liste</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handlePrintReport}>
              <Printer className="h-4 w-4" /> Imprimer
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleDownloadReport}>
              <Download className="h-4 w-4" /> PDF
            </Button>
          </div>
        </div>

        {/* Filtres */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border rounded-lg bg-muted/30">
          <div className="grid gap-1.5">
            <Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Type</Label>
            <Select value={fType} onValueChange={setFType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="preventive">Préventive</SelectItem>
                <SelectItem value="corrective">Corrective</SelectItem>
                <SelectItem value="curative">Curative</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Statut</Label>
            <Select value={fStatut} onValueChange={setFStatut}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="planifie">Planifié</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="termine">Terminé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Matériel</Label>
            <Select value={fMateriel} onValueChange={setFMateriel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les matériels</SelectItem>
                {materiels?.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Prestataire</Label>
            <Select value={fPrestataire} onValueChange={setFPrestataire}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les prestataires</SelectItem>
                {prestataires.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Date maintenance (après)</Label>
            <DateInput value={fDateDebut} onChange={e => setFDateDebut(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Date maintenance (avant)</Label>
            <DateInput value={fDateFin} onChange={e => setFDateFin(e.target.value)} />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <Button variant="ghost" size="sm" onClick={handleResetFilters} className="gap-2">
              <X className="h-4 w-4" /> Réinitialiser les filtres
            </Button>
          </div>
        </div>

        {/* Rapport (sans wrapper Card) */}
        <div data-print-root data-print-template="materiel-maintenance" data-ref="report" ref={reportRef} style={{ padding: "24px", background: "#fff", color: "#111", borderRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <EntrepriseHeader title="LISTE DES MAINTENANCES DE MATÉRIEL" subtitle={`Date d'édition : ${format(new Date(), "dd MMMM yyyy", { locale: fr })}`} />

          <div style={{ marginBottom: "12px", fontSize: "11px", color: "#444" }}>
            <strong>Filtres :</strong>{" "}
            Type : {fType === "all" ? "Tous" : typeLabel(fType)}
            {fStatut !== "all" && ` • Statut : ${statutLabel(fStatut)}`}
            {fMateriel !== "all" && ` • Matériel : ${materiels?.find(m => m.id === fMateriel)?.nom || ""}`}
            {fPrestataire !== "all" && ` • Prestataire : ${fPrestataire}`}
            {fDateDebut && ` • Du : ${format(new Date(fDateDebut), "dd/MM/yyyy")}`}
            {fDateFin && ` • Au : ${format(new Date(fDateFin), "dd/MM/yyyy")}`}
            {" • "}<strong>Total : {reportData.length}</strong>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <thead>
              <tr>
                {["N°", "Matériel", "Type", "Date", "Prestataire", "Coût (DA)", "Statut", "Description"].map(h => (
                  <th key={h} style={{ border: "1px solid #444", padding: "6px 8px", background: "#f1f5f9", fontWeight: 600, textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportData.map((m: any, i) => (
                <tr key={m.id}>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "center" }}>{i + 1}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px", fontWeight: 500 }}>{m.materiel_laboratoire?.nom || "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{typeLabel(m.type_maintenance)}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{format(new Date(m.date_maintenance), "dd/MM/yyyy", { locale: fr })}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{m.prestataire || "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "right" }}>{m.cout ? Number(m.cout).toLocaleString() : "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{statutLabel(m.statut)}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{m.description || "—"}</td>
                </tr>
              ))}
              {reportData.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ border: "1px solid #ccc", padding: "16px", textAlign: "center", color: "#888" }}>
                    Aucune maintenance correspondant aux filtres
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ---- Default list view ----
  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire", path: "/materiel" },
        { label: "Maintenance Matériel" },
      ]} />


      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton to="/materiel" />
          <div>
            <h1 className="text-2xl font-bold">Maintenance Matériel</h1>
            <p className="text-muted-foreground">Planification et suivi</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher une maintenance..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setReportMode(true)}>
          <ClipboardList className="h-4 w-4" />
          Liste maintenance
        </Button>
        <Button className="gap-2" onClick={() => navigate("/materiel/maintenance/nouveau")}>
          <Plus className="hidden md:inline-block h-4 w-4" />
          Nouveau
        </Button>
      </div>

      <div className="border rounded-lg">
        <div className="p-4 border-b flex items-center gap-2 font-medium">
          <Wrench className="h-5 w-5" />
          Maintenances ({filtered.length})
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : !filtered.length ? (
            <div className="text-center py-12 text-muted-foreground"><Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{search ? "Aucun résultat" : "Aucune maintenance enregistrée"}</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 px-3 font-medium">Matériel</th>
                    <th className="py-2 px-3 font-medium">Type</th>
                    <th className="py-2 px-3 font-medium">Date</th>
                    <th className="py-2 px-3 font-medium">Prestataire</th>
                    <th className="py-2 px-3 font-medium">Coût</th>
                    <th className="py-2 px-3 font-medium">Statut</th>
                    <th className="py-2 px-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m: any) => (
                    <tr key={m.id} className="border-b hover:bg-muted/30">
                      <td className="py-2 px-3 font-medium">{m.materiel_laboratoire?.nom || "—"}</td>
                      <td className="py-2 px-3">{typeBadge(m.type_maintenance)}</td>
                      <td className="py-2 px-3">{format(new Date(m.date_maintenance), "dd/MM/yyyy", { locale: fr })}</td>
                      <td className="py-2 px-3">{m.prestataire || "—"}</td>
                      <td className="py-2 px-3">{m.cout ? `${Number(m.cout).toLocaleString()} DA` : "—"}</td>
                      <td className="py-2 px-3">{statutBadge(m.statut)}</td>
                      <td className="py-2 px-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/materiel/maintenance/${m.id}`)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/materiel/maintenance/${m.id}/modifier`)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate("/materiel/maintenance/historique")}>
                              <History className="w-4 h-4 mr-2" />
                              Historique
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteId(m.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette maintenance ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
