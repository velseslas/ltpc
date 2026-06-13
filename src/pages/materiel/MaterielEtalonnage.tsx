import { useNavigate } from "react-router-dom";
import { downloadReportAsPDF } from "@/lib/pdf";
import { Plus, Trash2, Gauge, Pencil, MoreHorizontal, Eye, History, Search, ClipboardList, Printer, Download, X, Filter, FileText } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useEtalonnageMateriel, useDeleteEtalonnageMateriel, useMaterielList } from "@/hooks/useMaterielLaboratoire";
import { useEntreprise } from "@/hooks/useEntreprise";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useState, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
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

export default function MaterielEtalonnage() {
  const navigate = useNavigate();
  const { data, isLoading } = useEtalonnageMateriel();
  const { data: entreprise } = useEntreprise();
  const { data: materiels } = useMaterielList();
  const deleteMutation = useDeleteEtalonnageMateriel();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Inline report mode
  const [reportMode, setReportMode] = useState(false);
  const [fResultat, setFResultat] = useState<string>("all");
  const [fMateriel, setFMateriel] = useState<string>("all");
  const [fOrganisme, setFOrganisme] = useState<string>("all");
  const [fDateDebut, setFDateDebut] = useState<string>("");
  const [fDateFin, setFDateFin] = useState<string>("");
  const reportRef = useRef<HTMLDivElement>(null);

  const organismes = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.map((e: any) => e.organisme).filter(Boolean))) as string[];
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((e: any) =>
      e.materiel_laboratoire?.nom?.toLowerCase().includes(q) ||
      e.organisme?.toLowerCase().includes(q) ||
      e.numero_certificat?.toLowerCase().includes(q) ||
      e.resultat?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const reportData = useMemo(() => {
    if (!data) return [];
    return data.filter((e: any) => {
      if (fResultat !== "all" && e.resultat !== fResultat) return false;
      if (fMateriel !== "all" && e.materiel_id !== fMateriel) return false;
      if (fOrganisme !== "all" && e.organisme !== fOrganisme) return false;
      if (fDateDebut && new Date(e.date_etalonnage) < new Date(fDateDebut)) return false;
      if (fDateFin && new Date(e.date_etalonnage) > new Date(fDateFin)) return false;
      return true;
    });
  }, [data, fResultat, fMateriel, fOrganisme, fDateDebut, fDateFin]);

  const handleResetFilters = () => {
    setFResultat("all"); setFMateriel("all"); setFOrganisme("all");
    setFDateDebut(""); setFDateFin("");
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleDownloadReport = async () => {
    downloadReportAsPDF(`liste-etalonnages-${format(new Date(), "yyyy-MM-dd")}`);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteMutation.mutateAsync(deleteId); toast.success("Supprimé"); } catch { toast.error("Erreur"); }
    setDeleteId(null);
  };

  const resultatLabel = (r: string) => r === "conforme" ? "Conforme" : r === "non_conforme" ? "Non conforme" : r;

  const resultatBadge = (r: string) => {
    switch (r) {
      case "conforme": return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Conforme</Badge>;
      case "non_conforme": return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Non conforme</Badge>;
      default: return <Badge variant="outline">{r}</Badge>;
    }
  };

  const echeanceBadge = (date: string | null) => {
    if (!date) return <span className="text-muted-foreground">—</span>;
    const days = differenceInDays(new Date(date), new Date());
    if (days < 0) return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Échu</Badge>;
    if (days <= 30) return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">{days}j</Badge>;
    return <span className="text-muted-foreground">{format(new Date(date), "dd/MM/yyyy", { locale: fr })}</span>;
  };

  // ---- Report (inline) view ----
  if (reportMode) {
    return (
      <div className="space-y-6">
        <AppBreadcrumb items={[
          { label: "Matériel Laboratoire", path: "/materiel" },
          { label: "Étalonnage Matériel", path: "/materiel/etalonnage" },
          { label: "Liste étalonnage" },
        ]} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="shrink-0 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50" onClick={() => setReportMode(false)}>
              <X className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ClipboardList className="h-6 w-6" />
                Liste des étalonnages
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
            <Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Résultat</Label>
            <Select value={fResultat} onValueChange={setFResultat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les résultats</SelectItem>
                <SelectItem value="conforme">Conforme</SelectItem>
                <SelectItem value="non_conforme">Non conforme</SelectItem>
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
            <Label className="text-xs">Organisme</Label>
            <Select value={fOrganisme} onValueChange={setFOrganisme}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les organismes</SelectItem>
                {organismes.map(o => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Date étalonnage (après)</Label>
            <Input type="date" value={fDateDebut} onChange={e => setFDateDebut(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Date étalonnage (avant)</Label>
            <Input type="date" value={fDateFin} onChange={e => setFDateFin(e.target.value)} />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <Button variant="ghost" size="sm" onClick={handleResetFilters} className="gap-2">
              <X className="h-4 w-4" /> Réinitialiser les filtres
            </Button>
          </div>
        </div>

        {/* Rapport (sans wrapper Card) */}
        <div data-ref="report" ref={reportRef} style={{ padding: "24px", background: "#fff", color: "#111", borderRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <EntrepriseHeader title="LISTE DES ÉTALONNAGES DE MATÉRIEL" subtitle={`Date d'édition : ${format(new Date(), "dd MMMM yyyy", { locale: fr })}`} />

          <div style={{ marginBottom: "12px", fontSize: "11px", color: "#444" }}>
            <strong>Filtres :</strong>{" "}
            Résultat : {fResultat === "all" ? "Tous" : resultatLabel(fResultat)}
            {fMateriel !== "all" && ` • Matériel : ${materiels?.find(m => m.id === fMateriel)?.nom || ""}`}
            {fOrganisme !== "all" && ` • Organisme : ${fOrganisme}`}
            {fDateDebut && ` • Du : ${format(new Date(fDateDebut), "dd/MM/yyyy")}`}
            {fDateFin && ` • Au : ${format(new Date(fDateFin), "dd/MM/yyyy")}`}
            {" • "}<strong>Total : {reportData.length}</strong>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <thead>
              <tr>
                {["N°", "Matériel", "Date étalonnage", "Organisme", "N° Certificat", "Résultat", "Prochain étalonnage", "Observations"].map(h => (
                  <th key={h} style={{ border: "1px solid #444", padding: "6px 8px", background: "#f1f5f9", fontWeight: 600, textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportData.map((e: any, i) => (
                <tr key={e.id}>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "center" }}>{i + 1}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px", fontWeight: 500 }}>{e.materiel_laboratoire?.nom || "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{format(new Date(e.date_etalonnage), "dd/MM/yyyy", { locale: fr })}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{e.organisme || "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{e.numero_certificat || "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{resultatLabel(e.resultat)}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{e.date_prochain_etalonnage ? format(new Date(e.date_prochain_etalonnage), "dd/MM/yyyy", { locale: fr }) : "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{e.observations || "—"}</td>
                </tr>
              ))}
              {reportData.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ border: "1px solid #ccc", padding: "16px", textAlign: "center", color: "#888" }}>
                    Aucun étalonnage correspondant aux filtres
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
        { label: "Étalonnage Matériel" },
      ]} />


      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton to="/materiel" />
          <div>
            <h1 className="text-2xl font-bold">Étalonnage Matériel</h1>
            <p className="text-muted-foreground">Suivi des étalonnages</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un étalonnage..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setReportMode(true)}>
          <ClipboardList className="h-4 w-4" />
          Liste étalonnage
        </Button>
        <Button className="gap-2" onClick={() => navigate("/materiel/etalonnage/nouveau")}>
          <Plus className="h-4 w-4" />
          Nouveau
        </Button>
      </div>

      <div className="border rounded-lg">
        <div className="p-4 border-b flex items-center gap-2 font-medium">
          <Gauge className="h-5 w-5" />
          Étalonnages ({filtered.length})
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : !filtered.length ? (
            <div className="text-center py-12 text-muted-foreground"><Gauge className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{search ? "Aucun résultat" : "Aucun étalonnage enregistré"}</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 px-3 font-medium">Matériel</th>
                    <th className="py-2 px-3 font-medium">Date</th>
                    <th className="py-2 px-3 font-medium">Organisme</th>
                    <th className="py-2 px-3 font-medium">N° Certificat</th>
                    <th className="py-2 px-3 font-medium">Résultat</th>
                    <th className="py-2 px-3 font-medium">Échéance</th>
                    <th className="py-2 px-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e: any) => (
                    <tr key={e.id} className="border-b hover:bg-muted/30">
                      <td className="py-2 px-3 font-medium">{e.materiel_laboratoire?.nom || "—"}</td>
                      <td className="py-2 px-3">{format(new Date(e.date_etalonnage), "dd/MM/yyyy", { locale: fr })}</td>
                      <td className="py-2 px-3">{e.organisme || "—"}</td>
                      <td className="py-2 px-3">{e.numero_certificat || "—"}</td>
                      <td className="py-2 px-3">{resultatBadge(e.resultat)}</td>
                      <td className="py-2 px-3">{echeanceBadge(e.date_prochain_etalonnage)}</td>
                      <td className="py-2 px-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/materiel/etalonnage/${e.id}`)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Détails
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => navigate(`/materiel/etalonnage/${e.id}/certificat`)}
                              disabled={!e.certificat_url}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              {e.certificat_url ? "Voir certificat" : "Pas de certificat"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/materiel/etalonnage/${e.id}/modifier`)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate("/materiel/etalonnage/historique")}>
                              <History className="w-4 h-4 mr-2" />
                              Historique
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteId(e.id)}
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
              Êtes-vous sûr de vouloir supprimer cet étalonnage ? Cette action est irréversible.
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
