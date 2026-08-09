import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { downloadReportAsPDF } from "@/lib/pdf";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Printer, Download, CalendarIcon, Loader2, ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useClients } from "@/hooks/useClients";
import { useChantiersByClient } from "@/hooks/useChantiers";
import { useFactures } from "@/hooks/useFacturation";

const BACK_PATH = "/facturation/factures";

export default function EtatFactures() {
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);

  const { data: entreprise } = useEntreprise();
  const { data: clients } = useClients();
  const { data: factures, isLoading } = useFactures();

  const [clientFilter, setClientFilter] = useState("all");
  const [chantierFilter, setChantierFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [statutFilter, setStatutFilter] = useState("all");
  const [dateDebut, setDateDebut] = useState<Date | undefined>();
  const [dateFin, setDateFin] = useState<Date | undefined>();
  const [generated, setGenerated] = useState(false);
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");


  const { data: chantiers } = useChantiersByClient(clientFilter !== "all" ? clientFilter : "");

  const handleClientChange = (val: string) => {
    setClientFilter(val);
    setChantierFilter("all");
  };

  const filtered = useMemo(() => {
    if (!factures) return [];
    return (factures as any[]).filter((f: any) => {
      if (clientFilter !== "all" && f.client_id !== clientFilter) return false;
      if (chantierFilter !== "all" && f.chantier_id !== chantierFilter) return false;
      if (modeFilter !== "all" && (f.mode_paiement || "") !== modeFilter) return false;
      if (statutFilter !== "all" && f.statut !== statutFilter) return false;
      const dateRef = f.date_emission;
      if (dateDebut && dateRef && new Date(dateRef) < dateDebut) return false;
      if (dateFin && dateRef && new Date(dateRef) > dateFin) return false;
      return true;
    });
  }, [factures, clientFilter, chantierFilter, modeFilter, statutFilter, dateDebut, dateFin]);

  const totalMontant = filtered.reduce(
    (sum: number, f: any) => sum + Number((f.mode_paiement || "") === "espece" ? f.montant_ht : f.montant_ttc) || sum,
    0
  );

  const handlePrint = () => window.print();
  const handleDownload = async () => downloadReportAsPDF("etat-factures");


  const selectedClient = clients?.find((c: any) => c.id === clientFilter);
  const selectedChantier = chantiers?.find((c: any) => c.id === chantierFilter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div data-essai-mobile className="space-y-6">
      <div className="print:hidden">
        <AppBreadcrumb items={[
          { label: "Facturation", path: "/facturation" },
          { label: "Factures", path: BACK_PATH },
          { label: "État des factures" },
        ]} />
      </div>

      <div className="flex items-center gap-4 print:hidden">
        <Button variant="outline" size="icon" onClick={() => navigate(BACK_PATH)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">État des factures</h1>
      </div>

      {/* Filtres */}
      <Card className="print:hidden">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Client</label>
              <Select value={clientFilter} onValueChange={handleClientChange}>
                <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {clients?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Chantier</label>
              <Select value={chantierFilter} onValueChange={setChantierFilter} disabled={clientFilter === "all"}>
                <SelectTrigger><SelectValue placeholder={clientFilter === "all" ? "Sélectionnez un client" : "Tous"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {chantiers?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Mode de paiement</label>
              <Select value={modeFilter} onValueChange={setModeFilter}>
                <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                  <SelectItem value="espece">Espèce</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Statut</label>
              <Select value={statutFilter} onValueChange={setStatutFilter}>
                <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="payee">Payée</SelectItem>
                  <SelectItem value="impayee">Impayée</SelectItem>
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
          </div>

          <div className="flex mt-4 gap-2 print:hidden">
            <Button onClick={() => setGenerated(true)} className="gap-2 w-full sm:w-auto sm:ml-auto">
              <ListFilter className="h-4 w-4" />
              Générer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rapport */}
      {generated && (
        <>
          <div className="grid grid-cols-1 gap-2 w-full sm:flex sm:w-auto sm:justify-end sm:gap-3 print:hidden">

            <Select value={orientation} onValueChange={(v) => setOrientation(v as "landscape" | "portrait")}>
              <SelectTrigger className="w-full sm:w-[190px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="landscape">Vue paysage</SelectItem>
                <SelectItem value="portrait">Vue normale (portrait)</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={async () => { await handleDownload(); handlePrint(); }}
              className="gap-2 w-full sm:w-auto whitespace-normal text-center h-auto min-h-10 py-2 text-xs sm:text-sm leading-tight"
            >
              <Printer className="h-4 w-4 shrink-0" />
              <Download className="h-4 w-4 shrink-0" />
              Imprimer et télécharger
            </Button>
          </div>

          <div className="w-full overflow-x-auto print:overflow-visible" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}>
          <div
            ref={reportRef}
            data-ref="report"
            className="bg-white text-black p-8 print:p-4"
            style={{ minWidth: orientation === "landscape" ? "900px" : undefined }}
          >

            <ReportHeader
              entreprise={entreprise}
              verificationUrl={`${window.location.origin}/facturation/factures/etat`}
              title="ÉTAT DES FACTURES"
            />

            <div className="text-center mb-4">
              {selectedClient && <p className="text-base font-bold text-black">{selectedClient.nom}</p>}
              {selectedChantier && <p className="text-sm text-black">Chantier : {selectedChantier.nom}</p>}
              <p className="text-sm text-black mt-1">
                Période : {dateDebut ? format(dateDebut, "dd/MM/yyyy") : "—"} au {dateFin ? format(dateFin, "dd/MM/yyyy") : "—"}
              </p>
            </div>

            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-transparent text-black">
                  <th className="border border-black p-1.5 text-center">N° Facture</th>
                  <th className="border border-black p-1.5 text-center">Client</th>
                  <th className="border border-black p-1.5 text-center">Chantier</th>
                  <th className="border border-black p-1.5 text-center">Date</th>
                  <th className="border border-black p-1.5 text-center">Mode</th>
                  <th className="border border-black p-1.5 text-center">Montant</th>
                  <th className="border border-black p-1.5 text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border border-black p-4 text-center text-gray-500">
                      Aucune facture trouvée pour les critères sélectionnés
                    </td>
                  </tr>
                ) : (
                  filtered.map((f: any, idx: number) => (
                    <tr key={f.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border border-black p-1.5 text-center font-medium">{f.numero}</td>
                      <td className="border border-black p-1.5">{f.clients?.nom || "—"}</td>
                      <td className="border border-black p-1.5">{f.chantiers?.nom || "—"}</td>
                      <td className="border border-black p-1.5 text-center">
                        {f.date_emission ? format(new Date(f.date_emission), "dd/MM/yyyy") : "—"}
                      </td>
                      <td className="border border-black p-1.5 text-center">
                        {f.mode_paiement === "cheque" ? "Chèque" : f.mode_paiement === "espece" ? "Espèce" : "—"}
                      </td>
                      <td className="border border-black p-1.5 text-right">
                        {Number((f.mode_paiement || "") === "espece" ? f.montant_ht : f.montant_ttc).toLocaleString()} DA
                      </td>
                      <td className="border border-black p-1.5 text-center">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-xs font-medium",
                          f.statut === "payee" && "bg-green-100 text-green-800",
                          f.statut !== "payee" && "bg-red-100 text-red-800",
                        )}>
                          {f.statut === "payee" ? "Payée" : "Impayée"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="mt-4 flex justify-between text-xs text-black">
              <span>Total : {filtered.length} facture(s) — {totalMontant.toLocaleString()} DA</span>
              <span>Généré le {format(new Date(), "dd/MM/yyyy à HH:mm", { locale: fr })}</span>
            </div>
          </div>
          </div>
        </>
      )}

      <style>{`
        @media print {
          @page { size: A4 ${orientation}; margin: 10mm; }
          html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body * { visibility: hidden; }
          [data-ref="report"], [data-ref="report"] * { visibility: visible; }
          [data-ref="report"] { position: absolute; left: 0; top: 0; width: 100%; min-width: 0 !important; padding: 0 !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>

  );
}
