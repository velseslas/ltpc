import { useNavigate } from "react-router-dom";
import { PrintService } from "@/lib/print/PrintService";

// LOT 9 — Template Historique des étalonnages (paysage).
PrintService.registerTemplate({ id: "materiel-etalonnage-historique", title: "Historique des étalonnages", orientation: "landscape" });
import { Gauge, Printer, Download } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useEtalonnageMateriel } from "@/hooks/useMaterielLaboratoire";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useRef } from "react";
import { EntrepriseHeader } from "@/components/print/EntrepriseHeader";

export default function MaterielEtalonnageHistorique() {
  const navigate = useNavigate();
  const { data, isLoading } = useEtalonnageMateriel();
  const printRef = useRef<HTMLDivElement>(null);

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
    if (days < 0) return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Échu ({Math.abs(days)}j)</Badge>;
    if (days <= 30) return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">{days}j restants</Badge>;
    return <span className="text-muted-foreground">{format(new Date(date), "dd/MM/yyyy", { locale: fr })}</span>;
  };

  const handlePrint = () => PrintService.print({ title: "Historique des étalonnages", orientation: "landscape" });

  const handleDownload = async () => {
    PrintService.print({ title: "Historique des étalonnages", orientation: "landscape" });
  };

  const totalConformes = data?.filter((e: any) => e.resultat === "conforme").length || 0;
  const totalNonConformes = data?.filter((e: any) => e.resultat === "non_conforme").length || 0;

  return (
    <div data-essai-mobile className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire", path: "/materiel" },
        { label: "Étalonnage Matériel", path: "/materiel/etalonnage" },
        { label: "Historique" },
      ]} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton to="/materiel/etalonnage" />
          <div>
            <h1 className="text-2xl font-bold">Historique des Étalonnages</h1>
            <p className="text-muted-foreground">Suivi complet des étalonnages matériel</p>
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
                <Gauge className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total étalonnages</p>
                <p className="text-2xl font-bold">{data?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Gauge className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conformes</p>
                <p className="text-2xl font-bold">{totalConformes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Gauge className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Non conformes</p>
                <p className="text-2xl font-bold">{totalNonConformes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div ref={printRef} data-print-root data-print-template="materiel-etalonnage-historique" data-ref="report">
        <EntrepriseHeader title="Historique des Étalonnages Matériel" subtitle={`Édité le ${format(new Date(), "dd/MM/yyyy", { locale: fr })}`} />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Historique complet ({data?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
            ) : !data?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <Gauge className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun étalonnage enregistré</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matériel</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Date étalonnage</TableHead>
                    <TableHead>Organisme</TableHead>
                    <TableHead>N° Certificat</TableHead>
                    <TableHead>Résultat</TableHead>
                    <TableHead>Échéance</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {data.map((e: any) => (
                     <TableRow key={e.id}>
                       <TableCell className="font-medium">{e.materiel_laboratoire?.nom || "—"}</TableCell>
                       <TableCell>{e.materiel_laboratoire?.reference || "—"}</TableCell>
                       <TableCell>{format(new Date(e.date_etalonnage), "dd/MM/yyyy", { locale: fr })}</TableCell>
                       <TableCell>{e.organisme || "—"}</TableCell>
                       <TableCell>{e.numero_certificat || "—"}</TableCell>
                       <TableCell>{resultatBadge(e.resultat)}</TableCell>
                       <TableCell>{echeanceBadge(e.date_prochain_etalonnage)}</TableCell>
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
