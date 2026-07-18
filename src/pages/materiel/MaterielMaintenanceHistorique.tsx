import { useNavigate } from "react-router-dom";
import { PrintService } from "@/lib/print/PrintService";

// LOT 9 — Template Historique des maintenances (paysage).
PrintService.registerTemplate({ id: "materiel-maintenance-historique", title: "Historique des maintenances", orientation: "landscape" });
import { Wrench, Printer, Download } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useMaintenanceMateriel } from "@/hooks/useMaterielLaboratoire";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRef } from "react";
import { EntrepriseHeader } from "@/components/print/EntrepriseHeader";

export default function MaterielMaintenanceHistorique() {
  const navigate = useNavigate();
  const { data, isLoading } = useMaintenanceMateriel();
  const printRef = useRef<HTMLDivElement>(null);

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

  const handlePrint = () => PrintService.print({ title: "Historique des maintenances", orientation: "landscape" });

  const handleDownload = async () => {
    PrintService.print({ title: "Historique des maintenances", orientation: "landscape" });
  };

  const coutTotal = data?.reduce((sum: number, m: any) => sum + (m.cout || 0), 0) || 0;
  const totalTerminees = data?.filter((m: any) => m.statut === "termine").length || 0;

  return (
    <div data-essai-mobile className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire", path: "/materiel" },
        { label: "Maintenance Matériel", path: "/materiel/maintenance" },
        { label: "Historique" },
      ]} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton to="/materiel/maintenance" />
          <div>
            <h1 className="text-2xl font-bold">Historique des Maintenances</h1>
            <p className="text-muted-foreground">Suivi complet des maintenances matériel</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Télécharger PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total maintenances</p>
                <p className="text-2xl font-bold">{data?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Terminées</p>
                <p className="text-2xl font-bold">{totalTerminees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Coût total</p>
                <p className="text-2xl font-bold">{coutTotal.toLocaleString()} DA</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div ref={printRef} data-print-root data-print-template="materiel-maintenance-historique" data-ref="report">
        <EntrepriseHeader title="Historique des Maintenances Matériel" subtitle={`Édité le ${format(new Date(), "dd/MM/yyyy", { locale: fr })}`} />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Historique complet ({data?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
            ) : !data?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune maintenance enregistrée</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matériel</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Prestataire</TableHead>
                    <TableHead>Coût</TableHead>
                    <TableHead>Statut</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {data.map((m: any) => (
                     <TableRow key={m.id}>
                       <TableCell className="font-medium">{m.materiel_laboratoire?.nom || "—"}</TableCell>
                       <TableCell>{m.materiel_laboratoire?.reference || "—"}</TableCell>
                       <TableCell>{typeBadge(m.type_maintenance)}</TableCell>
                       <TableCell>{format(new Date(m.date_maintenance), "dd/MM/yyyy", { locale: fr })}</TableCell>
                       <TableCell>{m.prestataire || "—"}</TableCell>
                       <TableCell>{m.cout ? `${m.cout.toLocaleString()} DA` : "—"}</TableCell>
                       <TableCell>{statutBadge(m.statut)}</TableCell>
                     </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
