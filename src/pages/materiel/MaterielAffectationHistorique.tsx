import { useNavigate } from "react-router-dom";
import { downloadReportAsPDF } from "@/lib/pdf";
import { ArrowLeftRight, Printer, Download } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useAffectationMateriel } from "@/hooks/useMaterielLaboratoire";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRef } from "react";
import { EntrepriseHeader } from "@/components/print/EntrepriseHeader";

export default function MaterielAffectationHistorique() {
  const navigate = useNavigate();
  const { data, isLoading } = useAffectationMateriel();
  const printRef = useRef<HTMLDivElement>(null);

  const statutBadge = (s: string) => {
    switch (s) {
      case "en_cours": return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">En cours</Badge>;
      case "terminee": return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Terminée</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  const handlePrint = () => window.print();

  const handleDownload = async () => {
    downloadReportAsPDF(`historique-affectations-${format(new Date(), "yyyy-MM-dd")}`);
  };

  const totalEnCours = data?.filter((a: any) => a.statut === "en_cours").length || 0;
  const totalTerminees = data?.filter((a: any) => a.statut === "terminee").length || 0;

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire", path: "/materiel" },
        { label: "Affectation Matériel", path: "/materiel/affectation" },
        { label: "Historique" },
      ]} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton to="/materiel/affectation" />
          <div>
            <h1 className="text-2xl font-bold">Historique des Affectations</h1>
            <p className="text-muted-foreground">Suivi complet des affectations matériel</p>
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
                <ArrowLeftRight className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total affectations</p>
                <p className="text-2xl font-bold">{data?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <ArrowLeftRight className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold">{totalEnCours}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <ArrowLeftRight className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Terminées</p>
                <p className="text-2xl font-bold">{totalTerminees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div ref={printRef} data-ref="report">
        <EntrepriseHeader title="Historique des Affectations Matériel" subtitle={`Édité le ${format(new Date(), "dd/MM/yyyy", { locale: fr })}`} />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" />
              Historique complet ({data?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
            ) : !data?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune affectation enregistrée</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matériel</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Chantier</TableHead>
                    <TableHead>Technicien</TableHead>
                    <TableHead>Date début</TableHead>
                    <TableHead>Date fin</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((a: any) => {
                    const debut = new Date(a.date_debut);
                    const fin = a.date_fin ? new Date(a.date_fin) : new Date();
                    const duree = Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.materiel_laboratoire?.nom || "—"}</TableCell>
                        <TableCell>{a.materiel_laboratoire?.reference || "—"}</TableCell>
                        <TableCell>{a.chantiers?.nom || "—"}</TableCell>
                        <TableCell>{a.intervenants ? `${a.intervenants.prenom} ${a.intervenants.nom}` : "—"}</TableCell>
                        <TableCell>{format(debut, "dd/MM/yyyy", { locale: fr })}</TableCell>
                        <TableCell>{a.date_fin ? format(new Date(a.date_fin), "dd/MM/yyyy", { locale: fr }) : "—"}</TableCell>
                        <TableCell>{duree}j</TableCell>
                        <TableCell>{statutBadge(a.statut)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
