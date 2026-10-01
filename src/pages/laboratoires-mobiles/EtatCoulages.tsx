import { useState, useRef, useMemo } from "react";
import { downloadReportAsPDF } from "@/lib/pdf";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Printer, Download, CalendarIcon, Loader2, ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useChantier } from "@/hooks/useChantiers";
import { useClient } from "@/hooks/useClients";
import { useChantierEchantillons } from "@/hooks/useChantierEchantillons";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useCentralesBeton } from "@/hooks/useCentralesBeton";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { useRenderParams, frozenDate, frozenString } from "@/lib/render/renderParams";
import { ZoomableReport } from "@/components/ui/zoomable-report";
import { DateTextField } from "@/components/ui/date-text-field";

export default function EtatCoulages() {
  const navigate = useNavigate();
  const { chantierId } = useParams();
  const reportRef = useRef<HTMLDivElement>(null);

  const { data: chantier } = useChantier(chantierId || "");
  const { data: client } = useClient(chantier?.client_id || "");
  const { data: echantillons, isLoading } = useChantierEchantillons(chantierId || "");
  const { data: entreprise } = useEntreprise();
  const { data: centrales } = useCentralesBeton();

  // §7.2 — Rendu PDF déterministe : filtres figés côté serveur par le jeton de
  // rendu. Hors contexte PDF, `frozen` vaut null et l'écran est inchangé.
  const frozen = useRenderParams("etat-coulages");

  const [dateDebut, setDateDebut] = useState<Date | undefined>(() => frozenDate(frozen, "date_debut"));
  const [dateFin, setDateFin] = useState<Date | undefined>(() => frozenDate(frozen, "date_fin"));
  const [ouvrageFilter, setOuvrageFilter] = useState(() => frozenString(frozen, "ouvrage", "all"));
  const [partieFilter, setPartieFilter] = useState(() => frozenString(frozen, "partie", "all"));
  const [centraleFilter, setCentraleFilter] = useState(() => frozenString(frozen, "centrale", "all"));
  const [statutFilter, setStatutFilter] = useState(() => frozenString(frozen, "statut", "all"));
  const [generated, setGenerated] = useState(() => frozen !== null);

  // Extract unique values for filters
  const ouvrages = useMemo(() => {
    if (!echantillons) return [];
    const set = new Set(echantillons.map(e => e.ouvrage).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [echantillons]);

  const parties = useMemo(() => {
    if (!echantillons) return [];
    const set = new Set(echantillons.map(e => e.destination_beton).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [echantillons]);

  const centralesList = useMemo(() => {
    if (!echantillons || !centrales) return [];
    const ids = new Set(echantillons.map(e => e.centrale_id).filter(Boolean) as string[]);
    return centrales.filter(c => ids.has(c.id));
  }, [echantillons, centrales]);

  // Filtered data
  const filteredEchantillons = useMemo(() => {
    if (!echantillons) return [];
    return echantillons.filter(e => {
      if (dateDebut && e.date_coulage && new Date(e.date_coulage) < dateDebut) return false;
      if (dateFin && e.date_coulage && new Date(e.date_coulage) > dateFin) return false;
      if (ouvrageFilter !== "all" && e.ouvrage !== ouvrageFilter) return false;
      if (partieFilter !== "all" && e.destination_beton !== partieFilter) return false;
      if (centraleFilter !== "all" && e.centrale_id !== centraleFilter) return false;
      if (statutFilter !== "all" && e.statut !== statutFilter) return false;
      return true;
    });
  }, [echantillons, dateDebut, dateFin, ouvrageFilter, partieFilter, centraleFilter, statutFilter]);

  const handleGenerate = () => setGenerated(true);

  const handlePrint = () => window.print();

  const handleDownload = async () => {
    downloadReportAsPDF(`etat-coulages-${chantier?.nom || "chantier"}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <EssaiBreadcrumb items={[
          { label: "Laboratoires Mobiles", path: "/laboratoires-mobiles" },
          { label: chantier?.nom || "Chantier", path: `/laboratoires-mobiles/chantier/${chantierId}` },
          { label: "État des coulages" },
        ]} />
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 print:hidden">
        <Button variant="outline" size="icon" onClick={() => navigate(`/laboratoires-mobiles/chantier/${chantierId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">État des coulages</h1>
          <p className="text-muted-foreground">{chantier?.nom} — {client?.nom}</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="print:hidden">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {/* Période De */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Période de</label>
              <DateTextField value={dateDebut} onSelect={setDateDebut} />
            </div>

            {/* Période À */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">À</label>
              <DateTextField value={dateFin} onSelect={setDateFin} />
            </div>

            {/* Ouvrage */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Ouvrage</label>
              <Select value={ouvrageFilter} onValueChange={setOuvrageFilter}>
                <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {ouvrages.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Partie de l'ouvrage */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Partie de l'ouvrage</label>
              <Select value={partieFilter} onValueChange={setPartieFilter}>
                <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {parties.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Centrale */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Centrale</label>
              <Select value={centraleFilter} onValueChange={setCentraleFilter}>
                <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {centralesList.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
                </SelectContent>
              </Select>
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
            <Button onClick={handleGenerate} className="gap-2">
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

          <ZoomableReport className="w-full">
          <div ref={reportRef} data-ref="report" className="bg-white text-black p-4 sm:p-8 print:p-4" style={{ minWidth: "900px" }}>

            <ReportHeader
              entreprise={entreprise}
              verificationUrl={`${window.location.origin}/laboratoires-mobiles/chantier/${chantierId}/etat-coulages`}
              title="ÉTAT DES COULAGES"
              subtitle={`${dateDebut ? format(dateDebut, "dd/MM/yyyy") : ""} ${dateDebut || dateFin ? "—" : ""} ${dateFin ? format(dateFin, "dd/MM/yyyy") : ""}`}
            />

            {/* Client & chantier below title */}
            <div className="text-center mb-4">
              <p className="text-base font-bold text-black">{client?.nom || ""}</p>
              <p className="text-sm text-black">Chantier : {chantier?.nom || ""}</p>
              <p className="text-sm text-black mt-1">
                Période : {dateDebut ? format(dateDebut, "dd/MM/yyyy") : "—"} au {dateFin ? format(dateFin, "dd/MM/yyyy") : "—"}
              </p>
            </div>

            {/* Filters summary */}
            <div className="text-xs text-black mb-4 flex flex-wrap gap-4">
              {ouvrageFilter !== "all" && <span><strong>Ouvrage :</strong> {ouvrageFilter}</span>}
              {partieFilter !== "all" && <span><strong>Partie :</strong> {partieFilter}</span>}
              {centraleFilter !== "all" && <span><strong>Centrale :</strong> {centralesList.find(c => c.id === centraleFilter)?.nom}</span>}
              {statutFilter !== "all" && <span><strong>Statut :</strong> {statutFilter}</span>}
            </div>

            {/* Table */}
            <table className="w-full border-collapse text-sm print:text-xs">
              <thead>
                <tr className="bg-transparent text-black">
                  <th className="border border-black p-2 print:p-1.5 text-center">N°</th>
                  <th className="border border-black p-2 print:p-1.5 text-center">Ouvrage</th>
                  <th className="border border-black p-2 print:p-1.5 text-center">Partie ouvrage</th>
                  <th className="border border-black p-2 print:p-1.5 text-center">Date coulage</th>
                  <th className="border border-black p-2 print:p-1.5 text-center">Centrale à béton</th>
                  <th className="border border-black p-2 print:p-1.5 text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredEchantillons.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="border border-black p-4 text-center text-gray-500">
                      Aucun échantillon trouvé pour les critères sélectionnés
                    </td>
                  </tr>
                ) : (
                  filteredEchantillons.map((e, idx) => (
                    <tr key={e.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border border-black p-2 print:p-1.5 text-center font-medium">
                        EC-{String(e.numero_chantier || e.numero).padStart(3, "0")}
                      </td>
                      <td className="border border-black p-2 print:p-1.5">{e.ouvrage || "—"}</td>
                      <td className="border border-black p-2 print:p-1.5">{e.destination_beton || "—"}</td>
                      <td className="border border-black p-2 print:p-1.5 text-center">
                        {e.date_coulage ? format(new Date(e.date_coulage), "dd/MM/yyyy") : "—"}
                      </td>
                      <td className="border border-black p-2 print:p-1.5">{e.centrales_beton?.nom || "—"}</td>
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
              <span>Total : {filteredEchantillons.length} échantillon(s)</span>
              <span>Généré le {format(new Date(), "dd/MM/yyyy à HH:mm", { locale: fr })}</span>
            </div>
          </div>
          </ZoomableReport>

        </>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm 10mm 10mm 10mm; }
          body * { visibility: hidden !important; }
          [data-ref="report"], [data-ref="report"] * { visibility: visible !important; }
          [data-ref="report"] { position: static !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
