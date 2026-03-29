import { useState, useRef, useMemo } from "react";
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
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useChantier } from "@/hooks/useChantiers";
import { useClient } from "@/hooks/useClients";
import { useChantierEchantillons } from "@/hooks/useChantierEchantillons";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useCentralesBeton } from "@/hooks/useCentralesBeton";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

export default function EtatCoulages() {
  const navigate = useNavigate();
  const { chantierId } = useParams();
  const reportRef = useRef<HTMLDivElement>(null);

  const { data: chantier } = useChantier(chantierId || "");
  const { data: client } = useClient(chantier?.client_id || "");
  const { data: echantillons, isLoading } = useChantierEchantillons(chantierId || "");
  const { data: entreprise } = useEntreprise();
  const { data: centrales } = useCentralesBeton();

  const [dateDebut, setDateDebut] = useState<Date | undefined>();
  const [dateFin, setDateFin] = useState<Date | undefined>();
  const [ouvrageFilter, setOuvrageFilter] = useState("all");
  const [partieFilter, setPartieFilter] = useState("all");
  const [centraleFilter, setCentraleFilter] = useState("all");
  const [statutFilter, setStatutFilter] = useState("all");
  const [generated, setGenerated] = useState(false);

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
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 5;
    const availableWidth = pageWidth - margin * 2;
    const imgRatio = canvas.height / canvas.width;
    const imgHeight = availableWidth * imgRatio;

    if (imgHeight <= pageHeight - margin * 2) {
      pdf.addImage(imgData, "PNG", margin, margin, availableWidth, imgHeight);
    } else {
      // Multi-page
      let yOffset = 0;
      const sliceHeight = ((pageHeight - margin * 2) / imgHeight) * canvas.height;
      while (yOffset < canvas.height) {
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.min(sliceHeight, canvas.height - yOffset);
        const ctx = sliceCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height);
          const sliceData = sliceCanvas.toDataURL("image/png");
          if (yOffset > 0) pdf.addPage();
          const h = (sliceCanvas.height / canvas.width) * availableWidth;
          pdf.addImage(sliceData, "PNG", margin, margin, availableWidth, h);
        }
        yOffset += sliceHeight;
      }
    }
    pdf.save(`etat-coulages-${chantier?.nom || "chantier"}.pdf`);
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
          <div className="flex gap-2 justify-end print:hidden">
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimer
            </Button>
            <Button variant="outline" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Télécharger PDF
            </Button>
          </div>

          <div ref={reportRef} className="bg-white text-black p-8 print:p-4" style={{ minWidth: "1100px" }}>
            {/* Client name above header */}
            <div className="text-center mb-2">
              <p className="text-lg font-bold text-black">{client?.nom || ""}</p>
              <p className="text-sm text-black">Chantier : {chantier?.nom || ""}</p>
            </div>

            <ReportHeader
              entreprise={entreprise}
              verificationUrl={`${window.location.origin}/laboratoires-mobiles/chantier/${chantierId}/etat-coulages`}
              title="ÉTAT DES COULAGES"
              subtitle={`${dateDebut ? format(dateDebut, "dd/MM/yyyy") : ""} ${dateDebut || dateFin ? "—" : ""} ${dateFin ? format(dateFin, "dd/MM/yyyy") : ""}`}
            />

            {/* Filters summary */}
            <div className="text-xs text-black mb-4 flex flex-wrap gap-4">
              {ouvrageFilter !== "all" && <span><strong>Ouvrage :</strong> {ouvrageFilter}</span>}
              {partieFilter !== "all" && <span><strong>Partie :</strong> {partieFilter}</span>}
              {centraleFilter !== "all" && <span><strong>Centrale :</strong> {centralesList.find(c => c.id === centraleFilter)?.nom}</span>}
              {statutFilter !== "all" && <span><strong>Statut :</strong> {statutFilter}</span>}
            </div>

            {/* Table */}
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-[#1e5a7a] text-white">
                  <th className="border border-black p-1.5 text-center">N°</th>
                  <th className="border border-black p-1.5 text-center">Date coulage</th>
                  <th className="border border-black p-1.5 text-center">Ouvrage</th>
                  <th className="border border-black p-1.5 text-center">Partie ouvrage</th>
                  <th className="border border-black p-1.5 text-center">Centrale</th>
                  <th className="border border-black p-1.5 text-center">Classe résistance</th>
                  <th className="border border-black p-1.5 text-center">Classe consistance</th>
                  <th className="border border-black p-1.5 text-center">Type éprouvette</th>
                  <th className="border border-black p-1.5 text-center">Nb éprouvettes</th>
                  <th className="border border-black p-1.5 text-center">Mode coulage</th>
                  <th className="border border-black p-1.5 text-center">T° béton</th>
                  <th className="border border-black p-1.5 text-center">T° air</th>
                  <th className="border border-black p-1.5 text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredEchantillons.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="border border-black p-4 text-center text-gray-500">
                      Aucun échantillon trouvé pour les critères sélectionnés
                    </td>
                  </tr>
                ) : (
                  filteredEchantillons.map((e, idx) => (
                    <tr key={e.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border border-black p-1.5 text-center font-medium">
                        EC-{String(e.numero_chantier || e.numero).padStart(3, "0")}
                      </td>
                      <td className="border border-black p-1.5 text-center">
                        {e.date_coulage ? format(new Date(e.date_coulage), "dd/MM/yyyy") : "—"}
                      </td>
                      <td className="border border-black p-1.5">{e.ouvrage || "—"}</td>
                      <td className="border border-black p-1.5">{e.destination_beton || "—"}</td>
                      <td className="border border-black p-1.5">{e.centrales_beton?.nom || "—"}</td>
                      <td className="border border-black p-1.5 text-center">{e.classe_resistance || "—"}</td>
                      <td className="border border-black p-1.5 text-center">{e.classe_consistance || "—"}</td>
                      <td className="border border-black p-1.5 text-center">{e.type_eprouvette || "—"}</td>
                      <td className="border border-black p-1.5 text-center">{e.nombre_eprouvettes || "—"}</td>
                      <td className="border border-black p-1.5 text-center">{e.mode_coulage || "—"}</td>
                      <td className="border border-black p-1.5 text-center">{e.temperature_beton ?? "—"}</td>
                      <td className="border border-black p-1.5 text-center">{e.temperature_air ?? "—"}</td>
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

            {/* Footer */}
            <div className="mt-4 flex justify-between text-xs text-black">
              <span>Total : {filteredEchantillons.length} échantillon(s)</span>
              <span>Généré le {format(new Date(), "dd/MM/yyyy à HH:mm", { locale: fr })}</span>
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
