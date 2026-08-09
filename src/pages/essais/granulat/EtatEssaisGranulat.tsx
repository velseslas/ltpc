import { useState, useRef, useMemo } from "react";
import { downloadReportAsPDF } from "@/lib/pdf";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { useCarrieres } from "@/hooks/useCarrieres";
import { useEntreprise } from "@/hooks/useEntreprise";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { useEchantillonsGranulatByType, getPrefix } from "@/hooks/useEchantillonsGranulatFactory";

const ESSAI_TYPES: Record<string, string> = {
  "equivalent-sable": "Équivalent de sable",
  "bleu-methylene": "Bleu de méthylène",
  "matiere-organique": "Matière organique",
  "granulometrie": "Granulométrie",
  "masse-volumique": "Masse volumique",
  "forme-granulats": "Forme des granulats",
  "teneur-eau": "Teneur en eau",
  "los-angeles": "Los Angeles",
  "micro-deval": "Micro-Deval",
  "ecrasement": "Écrasement",
  "friabilite": "Friabilité",
};

export default function EtatEssaisGranulat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const essaiType = searchParams.get("type") || "equivalent-sable";
  const backPath = searchParams.get("back") || "/essais/granulat";

  const reportRef = useRef<HTMLDivElement>(null);

  const { data: clients } = useClients();
  const { data: carrieres } = useCarrieres();
  const { data: entreprise } = useEntreprise();
  const { data: echantillons, isLoading } = useEchantillonsGranulatByType(essaiType);

  const [clientFilter, setClientFilter] = useState("all");
  const [chantierFilter, setChantierFilter] = useState("all");
  const [carriereFilter, setCarriereFilter] = useState("all");
  const [produitFilter, setProduitFilter] = useState("all");
  const [dateDebut, setDateDebut] = useState<Date | undefined>();
  const [dateFin, setDateFin] = useState<Date | undefined>();
  const [statutFilter, setStatutFilter] = useState("all");
  const [generated, setGenerated] = useState(false);

  const { data: chantiers } = useChantiersByClient(clientFilter !== "all" ? clientFilter : "");

  // Reset chantier when client changes
  const handleClientChange = (val: string) => {
    setClientFilter(val);
    setChantierFilter("all");
  };

  // Extract unique produits
  const produits = useMemo(() => {
    if (!echantillons) return [];
    const set = new Set(echantillons.map(e => e.produit).filter(Boolean));
    return Array.from(set).sort();
  }, [echantillons]);

  // Filtered data
  const filtered = useMemo(() => {
    if (!echantillons) return [];
    return echantillons.filter(e => {
      if (clientFilter !== "all" && e.client_id !== clientFilter) return false;
      if (chantierFilter !== "all" && e.chantier_id !== chantierFilter) return false;
      if (carriereFilter !== "all" && e.carriere_id !== carriereFilter) return false;
      if (produitFilter !== "all" && e.produit !== produitFilter) return false;
      if (statutFilter !== "all" && e.statut !== statutFilter) return false;
      const dateRef = e.date_reception;
      if (dateDebut && dateRef && new Date(dateRef) < dateDebut) return false;
      if (dateFin && dateRef && new Date(dateRef) > dateFin) return false;
      return true;
    });
  }, [echantillons, clientFilter, chantierFilter, carriereFilter, produitFilter, statutFilter, dateDebut, dateFin]);

  const prefix = getPrefix(essaiType);
  const essaiTitle = ESSAI_TYPES[essaiType] || essaiType;

  const handlePrint = () => window.print();

  const handleDownload = async () => {
    downloadReportAsPDF(`etat-essais-${essaiType}`);
  };

  const selectedClient = clients?.find(c => c.id === clientFilter);
  const selectedChantier = chantiers?.find(c => c.id === chantierFilter);
  const selectedCarriere = carrieres?.find(c => c.id === carriereFilter);

  if (isLoading) {
    return (
      <div data-essai-mobile className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <EssaiBreadcrumb items={[
          { label: "Essais", path: "/essais" },
          { label: "Granulats", path: "/essais/granulat" },
          { label: essaiTitle, path: backPath },
          { label: "État des essais" },
        ]} />
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 print:hidden">
        <Button variant="outline" size="icon" onClick={() => navigate(backPath)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">État des essais — {essaiTitle}</h1>
        </div>
      </div>

      {/* Filters */}
      <Card className="print:hidden">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {/* Entreprise */}
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

            {/* Chantier */}
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

            {/* Carrière */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Carrière</label>
              <Select value={carriereFilter} onValueChange={setCarriereFilter}>
                <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {carrieres?.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Produit */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Produit</label>
              <Select value={produitFilter} onValueChange={setProduitFilter}>
                <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {produits.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Période De */}
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

            {/* Période À */}
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

            {/* Statut */}
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
          <div className="flex w-full sm:w-auto sm:justify-end gap-2 sm:gap-3 print:hidden">
            <Button
              variant="outline"
              onClick={async () => { await (handleDownload)(); (handlePrint)(); }}
              className="gap-2 w-full sm:w-auto whitespace-normal text-center h-auto min-h-10 py-2 text-xs sm:text-sm leading-tight"
            >
              <Printer className="h-4 w-4 shrink-0" />
              <Download className="h-4 w-4 shrink-0" />
              Imprimer et télécharger
            </Button>
          </div>

          <div className="w-full overflow-x-auto print:overflow-visible" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}>
          <div ref={reportRef} data-ref="report" className="bg-white text-black p-4 sm:p-8 print:p-4" style={{ minWidth: "900px" }}>
            <ReportHeader
              entreprise={entreprise}
              verificationUrl={`${window.location.origin}/essais/granulat/etat-essais?type=${essaiType}`}
              title={`ÉTAT DES ESSAIS — ${essaiTitle.toUpperCase()}`}
            />

            {/* Info sous le titre */}
            <div className="text-center mb-4">
              {selectedClient && <p className="text-base font-bold text-black">{selectedClient.nom}</p>}
              {selectedChantier && <p className="text-sm text-black">Chantier : {selectedChantier.nom}</p>}
              {selectedCarriere && <p className="text-sm text-black">Carrière : {selectedCarriere.nom}</p>}
              <p className="text-sm text-black mt-1">
                Période : {dateDebut ? format(dateDebut, "dd/MM/yyyy") : "—"} au {dateFin ? format(dateFin, "dd/MM/yyyy") : "—"}
              </p>
            </div>

            {/* Résumé filtres actifs */}
            <div className="text-xs text-black mb-4 flex flex-wrap gap-4">
              {produitFilter !== "all" && <span><strong>Produit :</strong> {produitFilter}</span>}
              {statutFilter !== "all" && <span><strong>Statut :</strong> {statutFilter === "termine" ? "Terminé" : statutFilter === "en-cours" ? "En cours" : "À faire"}</span>}
            </div>

            {/* Table */}
            <table className="w-full border-collapse text-sm print:text-xs">
              <thead>
                <tr className="bg-transparent text-black">
                  <th className="border border-black p-2 print:p-1.5 text-center">N°</th>
                  <th className="border border-black p-2 print:p-1.5 text-center">Date réception</th>
                  <th className="border border-black p-2 print:p-1.5 text-center">Entreprise</th>
                  <th className="border border-black p-2 print:p-1.5 text-center">Chantier</th>
                  <th className="border border-black p-2 print:p-1.5 text-center">Carrière</th>
                  <th className="border border-black p-2 print:p-1.5 text-center">Produit</th>
                  <th className="border border-black p-2 print:p-1.5 text-center">Date essai</th>
                  <th className="border border-black p-2 print:p-1.5 text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="border border-black p-4 text-center text-gray-500">
                      Aucun échantillon trouvé pour les critères sélectionnés
                    </td>
                  </tr>
                ) : (
                  filtered.map((e, idx) => (
                    <tr key={e.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border border-black p-2 print:p-1.5 text-center font-medium">
                        {prefix}-{String(e.numero).padStart(3, "0")}
                      </td>
                      <td className="border border-black p-2 print:p-1.5 text-center">
                        {e.date_reception ? format(new Date(e.date_reception), "dd/MM/yyyy") : "—"}
                      </td>
                      <td className="border border-black p-2 print:p-1.5">{e.clients?.nom || "—"}</td>
                      <td className="border border-black p-2 print:p-1.5">{e.chantiers?.nom || "—"}</td>
                      <td className="border border-black p-2 print:p-1.5">{e.carrieres?.nom || "—"}</td>
                      <td className="border border-black p-2 print:p-1.5">{e.produit || "—"}</td>
                      <td className="border border-black p-2 print:p-1.5 text-center">
                        {e.date_essai ? format(new Date(e.date_essai), "dd/MM/yyyy") : "—"}
                      </td>
                      <td className="border border-black p-2 print:p-1.5 text-center">
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

            {/* Footer */}
            <div className="mt-4 flex justify-between text-xs text-black">
              <span>Total : {filtered.length} échantillon(s)</span>
              <span>Généré le {format(new Date(), "dd/MM/yyyy à HH:mm", { locale: fr })}</span>
            </div>
          </div>
          </div>
        </>
      )}

      {/* Print styles */}
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
