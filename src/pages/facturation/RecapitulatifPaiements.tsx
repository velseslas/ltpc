import { Banknote, ArrowUpRight, BarChart3 } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { StatCard } from "@/components/dashboard/StatCard";
import { usePaiementsEspece, usePaiementsVirement } from "@/hooks/useFacturation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RecapitulatifPaiements() {
  const { data: especes, isLoading: loadEsp } = usePaiementsEspece();
  const { data: virements, isLoading: loadVir } = usePaiementsVirement();

  const totalEspece = especes?.reduce((s: number, e: any) => s + (Number(e.montant) || 0), 0) || 0;
  const totalVirement = virements?.reduce((s: number, v: any) => s + (Number(v.montant) || 0), 0) || 0;
  const totalGlobal = totalEspece + totalVirement;

  return (
    <div data-essai-mobile className="space-y-6">
      <AppBreadcrumb items={[{ label: "Facturation", path: "/facturation" }, { label: "Récapitulatif" }]} />
      <div className="flex items-center gap-3">
        <BackButton to="/facturation" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Récapitulatif des paiements</h1>
          <p className="text-muted-foreground">Vue d'ensemble de tous les encaissements</p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <StatCard title="Total encaissé" value={`${totalGlobal.toLocaleString()} DA`} subtitle={`${(especes?.length || 0) + (virements?.length || 0)} paiement(s)`} icon={BarChart3} />
        <StatCard title="Espèces" value={`${totalEspece.toLocaleString()} DA`} subtitle={`${especes?.length || 0} paiement(s)`} icon={Banknote} />
        <StatCard title="Virements" value={`${totalVirement.toLocaleString()} DA`} subtitle={`${virements?.length || 0} paiement(s)`} icon={ArrowUpRight} />
      </div>

      <Tabs defaultValue="tous" className="w-full">
        <TabsList>
          <TabsTrigger value="tous">Tous</TabsTrigger>
          <TabsTrigger value="espece">Espèces</TabsTrigger>
          <TabsTrigger value="virement">Virements</TabsTrigger>
        </TabsList>

        <TabsContent value="tous">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {especes?.map((e: any) => (
                      <TableRow key={`esp-${e.id}`}>
                        <TableCell><Badge variant="outline">Espèce</Badge></TableCell>
                        <TableCell>{(e.clients as any)?.nom || "—"}</TableCell>
                        <TableCell>{Number(e.montant).toLocaleString()} DA</TableCell>
                        <TableCell>{format(new Date(e.date_paiement), "dd/MM/yyyy", { locale: fr })}</TableCell>
                        <TableCell><Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">{e.statut}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {virements?.map((v: any) => (
                      <TableRow key={`vir-${v.id}`}>
                        <TableCell><Badge variant="outline">Virement</Badge></TableCell>
                        <TableCell>{(v.clients as any)?.nom || "—"}</TableCell>
                        <TableCell>{Number(v.montant).toLocaleString()} DA</TableCell>
                        <TableCell>{format(new Date(v.date_virement), "dd/MM/yyyy", { locale: fr })}</TableCell>
                        <TableCell><Badge className="bg-cyan-500/20 text-cyan-500 border-cyan-500/30">{v.statut}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="espece">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>N° Reçu</TableHead><TableHead>Client</TableHead><TableHead>Montant</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {especes?.map((e: any) => (
                      <TableRow key={e.id}>
                        <TableCell>{e.numero_recu || "—"}</TableCell>
                        <TableCell>{(e.clients as any)?.nom || "—"}</TableCell>
                        <TableCell>{Number(e.montant).toLocaleString()} DA</TableCell>
                        <TableCell>{format(new Date(e.date_paiement), "dd/MM/yyyy", { locale: fr })}</TableCell>
                        <TableCell><Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">{e.statut}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="virement">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Référence</TableHead><TableHead>Client</TableHead><TableHead>Banque</TableHead><TableHead>Montant</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {virements?.map((v: any) => (
                      <TableRow key={v.id}>
                        <TableCell>{v.reference_virement || "—"}</TableCell>
                        <TableCell>{(v.clients as any)?.nom || "—"}</TableCell>
                        <TableCell>{v.banque || "—"}</TableCell>
                        <TableCell>{Number(v.montant).toLocaleString()} DA</TableCell>
                        <TableCell>{format(new Date(v.date_virement), "dd/MM/yyyy", { locale: fr })}</TableCell>
                        <TableCell><Badge className="bg-cyan-500/20 text-cyan-500 border-cyan-500/30">{v.statut}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
