import { useState, useRef, useMemo } from "react";
import { downloadReportAsPDF } from "@/lib/pdf";
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
import { useEchantillonsCarottage } from "@/hooks/useEchantillonsCarottage";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

export default function EtatEssaisCarottage() {
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);

  const { data: clients } = useClients();
  const { data: entreprise } = useEntreprise();
  const { data: echantillons, isLoading } = useEchantillonsCarottage();

  const [clientFilter, setClientFilter] = useState("all");
  const [chantierFilter, setChantierFilter] = useState("all");
  const [dateDebut, setDateDebut] = useState<Date | undefined>();
  const [dateFin, setDateFin] = useState<Date | undefined>();
  const [statutFilter, setStatutFilter] = useState("all");
  const [generated, setGenerated] = useState(false);

  const { data: chantiers } = useChantiersByClient(clientFilter !== "all" ? clientFilter : "");

  const handleClientChange = (val: string) => {
    setClientFilter(val);
    setChantierFilter("all");
  };

  const filtered = useMemo(() => {
    if (!echantillons) return [];
    return echantillons.filter((e) => {
      if (clientFilter !== "all" && e.client_id !== clientFilter) return false;
      if (chantierFilter !== "all" && e.chantier_id !== chantierFilter) return false;
      if (statutFilter !== "all" && e.statut !== statutFilter) return false;
      const dateRef = e.date_prelevement;
      if (dateDebut && dateRef && new Date(dateRef) < dateDebut) return false;
      if (dateFin && dateRef && new Date(dateRef) > dateFin) return false;
      return true;
    });
  }, [echantillons, clientFilter, chantierFilter, statutFilter, dateDebut, dateFin]);

  const handlePrint = () => window.print();

  const handleDownload = async () => {
    downloadReportAsPDF("etat-essais-carottage");
  };

  const selectedClient = clients?.find(c => c.id === clientFilter);
  const selectedChantier = chantiers?.find(c => c.id === chantierFilter);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div data-essai-mobile className="space-y-6">
      <div className="print:hidden">
        <EssaiBreadcrumb items={[
          { label: "Béton", path: "/essais/beton" },
          { label: "Destructif", path: "/essais/beton/destructif" },
          { label: "Carottage", path: "/essais/beton/destructif/carottage" },
          { label: "État des essais" },
        ]} />
      </div>

      <div className="flex items-center gap-4 print:hidden">
        <Button variant="outline" size="icon" onClick={() => navigate("/essais/beton/destructif/carottage")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">État des essais — <span className="text-primary">Carottage</span></h1>
        </div>
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
                  <SelectItem value="a-faire">À faire</SelectItem>
                  <SelectItem value="en-cours">En cours</SelectItem>
                  <SelectItem value="termine">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-4 gap-2">
            <Button onClick={() => setGenerated(true)} className="gap-2">
              <ListFilter className="h-4 w-4" />
              Générer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report */}
      {generated && (
        <>
          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto sm:justify-end sm:gap-3 print:hidden">
            <Button variant="outline" onClick={async () => { await (handleDownload)(); (handlePrint)(); }} className="gap-2 w-full sm:w-auto">
            <Printer className="h-4 w-4" />
            <Download className="h-4 w-4" />
            Imprimer et télécharger
          </Button>
          </div>

          <div ref={reportRef} data-ref="report" className="bg-white text-black p-8 print:p-4" style={{ minWidth: "900px" }}>
            <ReportHeader
              entreprise={entreprise}
              verificationUrl={`${window.location.origin}/essais/beton/destructif/carottage/etat-essais`}
              title="ÉTAT DES ESSAIS — CAROTTAGE SUR BÉTON"
              subtitle="NF EN 12504-1"
            />

            <div className="text-center mb-4">
              {selectedClient && <p className="text-base font-bold text-black">{selectedClient.nom}</p>}
              {selectedChantier && <p className="text-sm text-black">Chantier : {selectedChantier.nom}</p>}
              <p className="text-sm text-black mt-1">
                Période : {dateDebut ? format(dateDebut, "dd/MM/yyyy") : "—"} au {dateFin ? format(dateFin, "dd/MM/yyyy") : "—"}
              </p>
            </div>

            {statutFilter !== "all" && (
              <div className="text-xs text-black mb-4">
                <span><strong>Statut :</strong> {statutFilter === "termine" ? "Terminé" : statutFilter === "en-cours" ? "En cours" : "À faire"}</span>
              </div>
            )}

            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-[#1e5a7a] text-white">
                  <th className="border border-black p-1.5 text-center">N°</th>
                  <th className="border border-black p-1.5 text-center">Date prélèvement</th>
                  <th className="border border-black p-1.5 text-center">Entreprise</th>
                  <th className="border border-black p-1.5 text-center">Chantier</th>
                  <th className="border border-black p-1.5 text-center">Ouvrage</th>
                  <th className="border border-black p-1.5 text-center">Partie ouvrage</th>
                  <th className="border border-black p-1.5 text-center">Localisation</th>
                  <th className="border border-black p-1.5 text-center">Ø (mm)</th>
                  <th className="border border-black p-1.5 text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="border border-black p-4 text-center text-gray-500">
                      Aucun échantillon trouvé pour les critères sélectionnés
                    </td>
                  </tr>
                ) : (
                  filtered.map((e, idx) => (
                    <tr key={e.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border border-black p-1.5 text-center font-medium">
                        CR-{String(e.numero).padStart(3, "0")}
                      </td>
                      <td className="border border-black p-1.5 text-center">
                        {format(new Date(e.date_prelevement), "dd/MM/yyyy")}
                      </td>
                      <td className="border border-black p-1.5">{e.clients?.nom || "—"}</td>
                      <td className="border border-black p-1.5">{e.chantiers?.nom || "—"}</td>
                      <td className="border border-black p-1.5">{e.ouvrage || "—"}</td>
                      <td className="border border-black p-1.5">{e.partie_ouvrage || "—"}</td>
                      <td className="border border-black p-1.5">{e.localisation || "—"}</td>
                      <td className="border border-black p-1.5 text-center">{e.diametre_carotte || "—"}</td>
                      <td className="border border-black p-1.5 text-center">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-xs font-medium",
                          e.statut === "termine" && "bg-green-100 text-green-800",
                          e.statut === "en-cours" && "bg-amber-100 text-amber-800",
                          e.statut === "a-faire" && "bg-gray-100 text-gray-800",
                        )}>
                          {e.statut === "termine" ? "Terminé" : e.statut === "en-cours" ? "En cours" : "À faire"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="mt-4 flex justify-between text-xs text-black">
              <span>Total : {filtered.length} échantillon(s)</span>
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
