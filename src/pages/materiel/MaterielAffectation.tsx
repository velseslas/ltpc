import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ArrowLeftRight, Pencil, MoreHorizontal, Eye, History, Search, ClipboardList, Printer, Download, X } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useAffectationMateriel, useDeleteAffectationMateriel } from "@/hooks/useMaterielLaboratoire";
import { useEntreprise } from "@/hooks/useEntreprise";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function MaterielAffectation() {
  const navigate = useNavigate();
  const { data, isLoading } = useAffectationMateriel();
  const { data: entreprise } = useEntreprise();
  const deleteMutation = useDeleteAffectationMateriel();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [filterOpen, setFilterOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [fStatut, setFStatut] = useState<string>("all");
  const [fChantier, setFChantier] = useState<string>("");
  const [fTechnicien, setFTechnicien] = useState<string>("");
  const [fDateDebut, setFDateDebut] = useState<string>("");
  const [fDateFin, setFDateFin] = useState<string>("");
  const reportRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((a: any) =>
      a.materiel_laboratoire?.nom?.toLowerCase().includes(q) ||
      a.chantiers?.nom?.toLowerCase().includes(q) ||
      a.intervenants?.nom?.toLowerCase().includes(q) ||
      a.intervenants?.prenom?.toLowerCase().includes(q) ||
      a.statut?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const reportData = useMemo(() => {
    if (!data) return [];
    return data.filter((a: any) => {
      if (fStatut !== "all" && a.statut !== fStatut) return false;
      if (fChantier && !a.chantiers?.nom?.toLowerCase().includes(fChantier.toLowerCase())) return false;
      if (fTechnicien) {
        const full = `${a.intervenants?.prenom || ""} ${a.intervenants?.nom || ""}`.toLowerCase();
        if (!full.includes(fTechnicien.toLowerCase())) return false;
      }
      if (fDateDebut && new Date(a.date_debut) < new Date(fDateDebut)) return false;
      if (fDateFin && a.date_fin && new Date(a.date_fin) > new Date(fDateFin)) return false;
      return true;
    });
  }, [data, fStatut, fChantier, fTechnicien, fDateDebut, fDateFin]);

  const handleApplyFilters = () => { setFilterOpen(false); setReportOpen(true); };
  const handleResetFilters = () => {
    setFStatut("all"); setFChantier(""); setFTechnicien(""); setFDateDebut(""); setFDateFin("");
  };

  const handlePrintReport = () => {
    const content = reportRef.current;
    if (!content) return;
    const w = window.open("", "_blank");
    if (!w) { toast.error("Veuillez autoriser les popups"); return; }
    w.document.write(`<html><head><title>Liste des affectations</title>
      <style>body{font-family:Arial,sans-serif;margin:20px;color:#111}table{width:100%;border-collapse:collapse;margin-top:12px;font-size:11px}th,td{border:1px solid #444;padding:6px 8px;text-align:left}th{background:#f1f5f9;font-weight:600}@page{size:landscape;margin:10mm}</style>
      </head><body>${content.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); w.close(); }, 400);
  };

  const handleDownloadReport = async () => {
    const content = reportRef.current;
    if (!content) return;
    toast.info("Génération du PDF...");
    try {
      const canvas = await html2canvas(content, { scale: 2, backgroundColor: "#fff", useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      pdf.save(`liste-affectations-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("PDF téléchargé");
    } catch { toast.error("Erreur lors de la génération du PDF"); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteMutation.mutateAsync(deleteId); toast.success("Supprimé"); } catch { toast.error("Erreur"); }
    setDeleteId(null);
  };

  const statutLabel = (s: string) => s === "en_cours" ? "En cours" : s === "terminee" ? "Terminée" : s;

  const statutBadge = (s: string) => {
    switch (s) {
      case "en_cours": return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">En cours</Badge>;
      case "terminee": return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Terminée</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire", path: "/materiel" },
        { label: "Affectation Matériel" },
      ]} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton to="/materiel" />
          <div>
            <h1 className="text-2xl font-bold">Affectation Matériel</h1>
            <p className="text-muted-foreground">Gestion des affectations</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher une affectation..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setFilterOpen(true)}>
          <ClipboardList className="h-4 w-4" />
          Liste affectation
        </Button>
        <Button className="gap-2" onClick={() => navigate("/materiel/affectation/nouveau")}>
          <Plus className="h-4 w-4" />
          Nouveau
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ArrowLeftRight className="h-5 w-5" />Affectations ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : !filtered.length ? (
            <div className="text-center py-12 text-muted-foreground"><ArrowLeftRight className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{search ? "Aucun résultat" : "Aucune affectation"}</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matériel</TableHead>
                  <TableHead>Chantier</TableHead>
                  <TableHead>Technicien</TableHead>
                  <TableHead>Date début</TableHead>
                  <TableHead>Date fin</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.materiel_laboratoire?.nom || "—"}</TableCell>
                    <TableCell>{a.chantiers?.nom || "—"}</TableCell>
                    <TableCell>{a.intervenants ? `${a.intervenants.prenom} ${a.intervenants.nom}` : "—"}</TableCell>
                    <TableCell>{format(new Date(a.date_debut), "dd/MM/yyyy", { locale: fr })}</TableCell>
                    <TableCell>{a.date_fin ? format(new Date(a.date_fin), "dd/MM/yyyy", { locale: fr }) : "—"}</TableCell>
                    <TableCell>{statutBadge(a.statut)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/materiel/affectation/${a.id}`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/materiel/affectation/${a.id}/modifier`)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate("/materiel/affectation/historique")}>
                            <History className="w-4 h-4 mr-2" />
                            Historique
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(a.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette affectation ? Cette action est irréversible.
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

      {/* Filter dialog */}
      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Filtres - Liste des affectations
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Statut</Label>
              <Select value={fStatut} onValueChange={setFStatut}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="terminee">Terminée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Chantier</Label>
              <Input placeholder="Nom du chantier..." value={fChantier} onChange={e => setFChantier(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Technicien</Label>
              <Input placeholder="Nom ou prénom..." value={fTechnicien} onChange={e => setFTechnicien(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Date début (après)</Label>
                <Input type="date" value={fDateDebut} onChange={e => setFDateDebut(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Date fin (avant)</Label>
                <Input type="date" value={fDateFin} onChange={e => setFDateFin(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleResetFilters}>
              <X className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
            <Button onClick={handleApplyFilters}>Afficher la liste</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Liste des affectations ({reportData.length})
              </span>
              <div className="flex gap-2 mr-6">
                <Button variant="outline" size="sm" className="gap-2" onClick={handlePrintReport}>
                  <Printer className="h-4 w-4" /> Imprimer
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadReport}>
                  <Download className="h-4 w-4" /> PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setReportOpen(false); setFilterOpen(true); }}>
                  Modifier filtres
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div data-ref="report" ref={reportRef} style={{ padding: "24px", background: "#fff", color: "#111", borderRadius: "4px" }}>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              {entreprise?.nom && <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 4px" }}>{entreprise.nom}</h2>}
              {entreprise?.numero_autorisation && (
                <p style={{ fontSize: "11px", margin: "0 0 2px", color: "#555" }}>Agrément N° {entreprise.numero_autorisation}</p>
              )}
              <h3 style={{ fontSize: "14px", fontWeight: 600, margin: "12px 0 4px", textDecoration: "underline" }}>
                LISTE DES AFFECTATIONS DE MATÉRIEL
              </h3>
              <p style={{ fontSize: "11px", color: "#555" }}>Date d'édition : {format(new Date(), "dd MMMM yyyy", { locale: fr })}</p>
            </div>

            <div style={{ marginBottom: "12px", fontSize: "11px", color: "#444" }}>
              <strong>Filtres :</strong>{" "}
              Statut : {fStatut === "all" ? "Tous" : statutLabel(fStatut)}
              {fChantier && ` • Chantier : ${fChantier}`}
              {fTechnicien && ` • Technicien : ${fTechnicien}`}
              {fDateDebut && ` • Du : ${format(new Date(fDateDebut), "dd/MM/yyyy")}`}
              {fDateFin && ` • Au : ${format(new Date(fDateFin), "dd/MM/yyyy")}`}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead>
                <tr>
                  {["N°", "Matériel", "Chantier", "Technicien", "Date début", "Date fin", "Statut", "Observations"].map(h => (
                    <th key={h} style={{ border: "1px solid #444", padding: "6px 8px", background: "#f1f5f9", fontWeight: 600, textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.map((a: any, i) => (
                  <tr key={a.id}>
                    <td style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "center" }}>{i + 1}</td>
                    <td style={{ border: "1px solid #ccc", padding: "5px 8px", fontWeight: 500 }}>{a.materiel_laboratoire?.nom || "—"}</td>
                    <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{a.chantiers?.nom || "—"}</td>
                    <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{a.intervenants ? `${a.intervenants.prenom} ${a.intervenants.nom}` : "—"}</td>
                    <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{format(new Date(a.date_debut), "dd/MM/yyyy", { locale: fr })}</td>
                    <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{a.date_fin ? format(new Date(a.date_fin), "dd/MM/yyyy", { locale: fr }) : "—"}</td>
                    <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{statutLabel(a.statut)}</td>
                    <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{a.observations || "—"}</td>
                  </tr>
                ))}
                {reportData.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ border: "1px solid #ccc", padding: "16px", textAlign: "center", color: "#888" }}>
                      Aucune affectation correspondant aux filtres
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
