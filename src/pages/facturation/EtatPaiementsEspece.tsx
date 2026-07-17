import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Printer, Download, CalendarIcon, Loader2, ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useClients } from "@/hooks/useClients";
import { useChantiersByClient } from "@/hooks/useChantiers";
import { useEntreprise } from "@/hooks/useEntreprise";
import { usePaiementsEspece } from "@/hooks/useFacturation";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { PrintService } from "@/lib/print/PrintService";

// LOT 8 — Template État des paiements en espèce (paysage).
PrintService.registerTemplate({
  id: "etat-paiements-espece",
  title: "État des paiements en espèce",
  orientation: "landscape",
});

export default function EtatPaiementsEspece() {
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);

  const { data: clients } = useClients();
  const { data: entreprise } = useEntreprise();
  const { data: paiements, isLoading } = usePaiementsEspece();

  const [clientFilter, setClientFilter] = useState("all");
  const [chantierFilter, setChantierFilter] = useState("all");
  const [statutFilter, setStatutFilter] = useState("all");
  const [dateDebut, setDateDebut] = useState<Date | undefined>();
  const [dateFin, setDateFin] = useState<Date | undefined>();
  const [generated, setGenerated] = useState(false);

  const { data: chantiers } = useChantiersByClient(clientFilter !== "all" ? clientFilter : "");

  const handleClientChange = (val: string) => {
    setClientFilter(val);
    setChantierFilter("all");
  };

  const filtered = useMemo(() => {
    if (!paiements) return [];
    return paiements.filter((e: any) => {
      if (clientFilter !== "all" && e.client_id !== clientFilter) return false;
      if (chantierFilter !== "all" && e.chantier_id !== chantierFilter) return false;
      if (statutFilter !== "all" && e.statut !== statutFilter) return false;
      if (dateDebut && new Date(e.date_paiement) < dateDebut) return false;
      if (dateFin && new Date(e.date_paiement) > dateFin) return false;
      return true;
    });
  }, [paiements, clientFilter, chantierFilter, statutFilter, dateDebut, dateFin]);

  const totalMontant = filtered.reduce((sum: number, e: any) => sum + (Number(e.montant) || 0), 0);

  const handlePrint = () => window.print();

  const handleDownload = async () => {
    downloadReportAsPDF("etat-paiements-espece");
  };

  const selectedClient = clients?.find(c => c.id === clientFilter);
  const selectedChantier = chantiers?.find(c => c.id === chantierFilter);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <AppBreadcrumb items={[
          { label: "Facturation", path: "/facturation" },
          { label: "Espèce", path: "/facturation/espece" },
          { label: "État des paiements" },
        ]} />
      </div>

      <div className="flex items-center gap-4 print:hidden">
        <Button variant="outline" size="icon" onClick={() => navigate("/facturation/espece")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">État des paiements en espèce</h1>
      </div>

      {/* Filters */}
      <Card className="print:hidden">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Entreprise</label>
              <Select value={clientFilter} onValueChange={handleClientChange}>
                <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Chantier</label>
              <Select value={chantierFilter} onValueChange={setChantierFilter} disabled={clientFilter === "all"}>
                <SelectTrigger><SelectValue placeholder={clientFilter === "all" ? "Sélectionnez une entreprise" : "Tous"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {chantiers?.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Période de</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateDebut && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateDebut ? format(dateDebut, "dd/MM/yyyy") : "Début"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateDebut} onSelect={setDateDebut} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">À</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateFin && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFin ? format(dateFin, "dd/MM/yyyy") : "Fin"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFin} onSelect={setDateFin} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Statut</label>
              <Select value={statutFilter} onValueChange={setStatutFilter}>
                <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="recu">Reçu</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-4 gap-2">
            <Button onClick={() => setGenerated(true)} className="gap-2">
              <ListFilter className="h-4 w-4" />Générer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report */}
      {generated && (
        <>
          <div className="flex gap-2 justify-end print:hidden">
            <Button variant="outline" onClick={handlePrint} className="gap-2"><Printer className="h-4 w-4" />Imprimer</Button>
            <Button variant="outline" onClick={handleDownload} className="gap-2"><Download className="h-4 w-4" />Télécharger PDF</Button>
          </div>

          <div ref={reportRef} data-ref="report" className="bg-white text-black p-8 print:p-4" style={{ minWidth: "900px" }}>
            <ReportHeader
              entreprise={entreprise}
              verificationUrl={`${window.location.origin}/facturation/espece/etat`}
              title="ÉTAT DES PAIEMENTS EN ESPÈCE"
            />

            <div className="text-center mb-4">
              {selectedClient && <p className="text-base font-bold text-black">{selectedClient.nom}</p>}
              {selectedChantier && <p className="text-sm text-black">Chantier : {selectedChantier.nom}</p>}
              <p className="text-sm text-black mt-1">
                Période : {dateDebut ? format(dateDebut, "dd/MM/yyyy") : "—"} au {dateFin ? format(dateFin, "dd/MM/yyyy") : "—"}
              </p>
            </div>

            <div className="text-xs text-black mb-4 flex flex-wrap gap-4">
              {statutFilter !== "all" && <span><strong>Statut :</strong> {statutFilter === "recu" ? "Reçu" : "En attente"}</span>}
            </div>

            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-[#1e5a7a] text-white">
                  <th className="border border-black p-1.5 text-center">N°</th>
                  <th className="border border-black p-1.5 text-center">N° Reçu</th>
                  <th className="border border-black p-1.5 text-center">Date paiement</th>
                  <th className="border border-black p-1.5 text-center">Entreprise</th>
                  <th className="border border-black p-1.5 text-center">Chantier</th>
                  <th className="border border-black p-1.5 text-center">Montant (DA)</th>
                  <th className="border border-black p-1.5 text-center">Statut</th>
                  <th className="border border-black p-1.5 text-center">Observations</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="border border-black p-4 text-center text-gray-500">Aucun paiement trouvé</td></tr>
                ) : (
                  filtered.map((e: any, idx: number) => (
                    <tr key={e.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border border-black p-1.5 text-center font-medium">{idx + 1}</td>
                      <td className="border border-black p-1.5 text-center">{e.numero_recu || "—"}</td>
                      <td className="border border-black p-1.5 text-center">{format(new Date(e.date_paiement), "dd/MM/yyyy")}</td>
                      <td className="border border-black p-1.5">{e.clients?.nom || "—"}</td>
                      <td className="border border-black p-1.5">{e.chantiers?.nom || "—"}</td>
                      <td className="border border-black p-1.5 text-right font-medium">{Number(e.montant).toLocaleString()}</td>
                      <td className="border border-black p-1.5 text-center">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-xs font-medium",
                          e.statut === "recu" && "bg-green-100 text-green-800",
                          e.statut === "en_attente" && "bg-amber-100 text-amber-800",
                        )}>
                          {e.statut === "recu" ? "Reçu" : "En attente"}
                        </span>
                      </td>
                      <td className="border border-black p-1.5 text-xs">{e.observations || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={5} className="border border-black p-1.5 text-right">TOTAL</td>
                    <td className="border border-black p-1.5 text-right">{totalMontant.toLocaleString()} DA</td>
                    <td colSpan={2} className="border border-black p-1.5"></td>
                  </tr>
                </tfoot>
              )}
            </table>

            <div className="mt-4 flex justify-between text-xs text-black">
              <span>Total : {filtered.length} paiement(s)</span>
              <span>Généré le {format(new Date(), "dd/MM/yyyy à HH:mm", { locale: fr })}</span>
            </div>
          </div>
        </>
      )}

      <style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          body * { visibility: hidden; }
          [data-print-area], [data-print-area] * { visibility: visible; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
