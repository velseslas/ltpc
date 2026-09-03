import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Printer, Download, Loader2, ListFilter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { downloadReportAsPDF } from "@/lib/pdf";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { ZoomableReport } from "@/components/ui/zoomable-report";
import { useCarrieres } from "@/hooks/useCarrieres";
import { useEntreprise } from "@/hooks/useEntreprise";

interface ProduitSynthese {
  produit: string;
  granulometrie: any | null;
  granulometrie_date: string | null;
  es: any | null;
  es_date: string | null;
  mb: any | null;
  mb_date: string | null;
  la: any | null;
  la_date: string | null;
  mde: any | null;
  mde_date: string | null;
  mv: any | null;
  mv_date: string | null;
}

async function fetchByCarriere(table: string, carriereId: string) {
  const { data } = await (supabase as any)
    .from(table)
    .select("produit, resultats, created_at")
    .eq("carriere_id", carriereId)
    .order("created_at", { ascending: false });
  return (data || []) as { produit: string | null; resultats: any; created_at: string }[];
}

/** Garde le résultat le plus récent par produit. */
function latestByProduit(rows: { produit: string | null; resultats: any; created_at: string }[]) {
  const map = new Map<string, { resultats: any; created_at: string }>();
  for (const r of rows) {
    if (!r.produit) continue;
    if (!map.has(r.produit)) map.set(r.produit, { resultats: r.resultats, created_at: r.created_at });
  }
  return map;
}

function useRapportCarriere(carriereId: string | null) {
  return useQuery({
    queryKey: ["rapport-carriere", carriereId],
    queryFn: async (): Promise<ProduitSynthese[]> => {
      if (!carriereId) return [];
      const [granulo, es, mb, la, mde, mv] = await Promise.all([
        fetchByCarriere("echantillons_granulometrie", carriereId),
        fetchByCarriere("echantillons_equivalent_sable", carriereId),
        fetchByCarriere("echantillons_bleu_methylene", carriereId),
        fetchByCarriere("echantillons_los_angeles", carriereId),
        fetchByCarriere("echantillons_micro_deval", carriereId),
        fetchByCarriere("echantillons_masse_volumique", carriereId),
      ]);

      const gMap = latestByProduit(granulo);
      const esMap = latestByProduit(es);
      const mbMap = latestByProduit(mb);
      const laMap = latestByProduit(la);
      const mdeMap = latestByProduit(mde);
      const mvMap = latestByProduit(mv);

      const produits = new Set<string>();
      [gMap, esMap, mbMap, laMap, mdeMap, mvMap].forEach(m => m.forEach((_, k) => produits.add(k)));

      return Array.from(produits).sort().map(p => ({
        produit: p,
        granulometrie: gMap.get(p)?.resultats ?? null,
        granulometrie_date: gMap.get(p)?.created_at ?? null,
        es: esMap.get(p)?.resultats ?? null,
        es_date: esMap.get(p)?.created_at ?? null,
        mb: mbMap.get(p)?.resultats ?? null,
        mb_date: mbMap.get(p)?.created_at ?? null,
        la: laMap.get(p)?.resultats ?? null,
        la_date: laMap.get(p)?.created_at ?? null,
        mde: mdeMap.get(p)?.resultats ?? null,
        mde_date: mdeMap.get(p)?.created_at ?? null,
        mv: mvMap.get(p)?.resultats ?? null,
        mv_date: mvMap.get(p)?.created_at ?? null,
      }));
    },
    enabled: !!carriereId,
  });
}

const fmtNum = (v: any, digits = 1) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(digits) : "—";
};
const fmtDate = (d: string | null) => (d ? format(new Date(d), "dd/MM/yyyy") : "—");

export default function RapportCarriere() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reportRef = useRef<HTMLDivElement>(null);

  const { data: carrieres } = useCarrieres();
  const { data: entreprise } = useEntreprise();

  const [carriereId, setCarriereId] = useState<string>(searchParams.get("carriere") || "");
  const [wilaya, setWilaya] = useState<string>("");
  const [generated, setGenerated] = useState(false);

  // Génération automatique quand la carrière vient de la liste
  useEffect(() => {
    if (carriereId && carrieres?.some(c => c.id === carriereId)) {
      const c = carrieres.find(x => x.id === carriereId);
      if (c?.ville && !wilaya) setWilaya(c.ville);
      setGenerated(true);
    }
  }, [carriereId, carrieres]);

  // Wilayas distinctes des carrières (champ ville des intervenants carrière)
  const wilayas = useMemo(
    () => Array.from(new Set((carrieres || []).map(c => c.ville).filter((v): v is string => !!v))).sort(),
    [carrieres]
  );

  const carrieresFiltrees = useMemo(
    () => (carrieres || []).filter(c => !wilaya || c.ville === wilaya),
    [carrieres, wilaya]
  );

  const { data: synthese, isLoading } = useRapportCarriere(generated && carriereId ? carriereId : null);

  const selectedCarriere = useMemo(
    () => carrieres?.find(c => c.id === carriereId),
    [carrieres, carriereId]
  );

  const handlePrint = () => window.print();
  const handleDownload = async () => {
    downloadReportAsPDF(`rapport-carriere-${selectedCarriere?.nom || ""}`);
  };

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <EssaiBreadcrumb items={[
          { label: "Essais", path: "/essais" },
          { label: "Granulats", path: "/essais/granulat" },
          { label: "Rapport Carrière", path: "/essais/granulat/rapport-carriere" },
          { label: selectedCarriere?.nom || "Génération" },
        ]} />
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 print:hidden">
        <Button variant="outline" size="icon" onClick={() => navigate("/essais/granulat/rapport-carriere")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Rapport Carrière</h1>
          <p className="text-sm text-muted-foreground">
            Synthèse des derniers résultats d'essais par produit d'une carrière
          </p>
        </div>
      </div>

      {/* Filtres */}
      <Card className="print:hidden">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Wilaya <span className="text-destructive">*</span>
              </label>
              <Select
                value={wilaya}
                onValueChange={(v) => { setWilaya(v); setCarriereId(""); setGenerated(false); }}
              >
                <SelectTrigger><SelectValue placeholder="Sélectionnez une wilaya" /></SelectTrigger>
                <SelectContent>
                  {wilayas.map(w => (
                    <SelectItem key={w} value={w}>{w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Carrière</label>
              <Select
                value={carriereId}
                onValueChange={(v) => { setCarriereId(v); setGenerated(false); }}
                disabled={!wilaya}
              >
                <SelectTrigger><SelectValue placeholder={wilaya ? "Sélectionnez une carrière" : "Choisissez d'abord une wilaya"} /></SelectTrigger>
                <SelectContent>
                  {carrieresFiltrees.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/essais/granulat/rapport-carriere")}
            >
              Annuler
            </Button>
            <Button onClick={() => setGenerated(true)} disabled={!wilaya || !carriereId} className="gap-2">
              <ListFilter className="h-4 w-4" />
              Suivant
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chargement */}
      {generated && isLoading && (
        <div className="flex items-center justify-center h-48 print:hidden">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Rapport */}
      {generated && !isLoading && synthese && (
        <>
          <div className="flex w-full sm:w-auto sm:justify-end gap-2 sm:gap-3 print:hidden">
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

          <ZoomableReport className="w-full">
            <div ref={reportRef} data-ref="report" className="bg-white text-black p-4 sm:p-8 print:p-4" style={{ minWidth: "900px" }}>
              <ReportHeader
                entreprise={entreprise}
                verificationUrl={`${window.location.origin}/essais/granulat/rapport-carriere`}
                title="RAPPORT CARRIÈRE — SYNTHÈSE DES ESSAIS GRANULATS"
              />

              {/* Infos carrière */}
              <div className="text-center mb-4">
                <p className="text-base font-bold text-black">{selectedCarriere?.nom}</p>
                {selectedCarriere?.ville && <p className="text-sm text-black">Wilaya : {selectedCarriere.ville}</p>}
                {selectedCarriere?.type_agregat && <p className="text-sm text-black">Type d'agrégat : {selectedCarriere.type_agregat}</p>}
              </div>

              {/* Table synthèse */}
              <table className="w-full border-collapse text-sm print:text-xs">
                <thead>
                  <tr className="bg-transparent text-black">
                    <th className="border border-black p-2 print:p-1.5 text-center" rowSpan={2}>Produit</th>
                    <th className="border border-black p-2 print:p-1.5 text-center" colSpan={2}>Granulométrie</th>
                    <th className="border border-black p-2 print:p-1.5 text-center" colSpan={2}>Équivalent de sable</th>
                    <th className="border border-black p-2 print:p-1.5 text-center" rowSpan={2}>MB (g/100g)</th>
                    <th className="border border-black p-2 print:p-1.5 text-center" rowSpan={2}>LA (%)</th>
                    <th className="border border-black p-2 print:p-1.5 text-center" rowSpan={2}>MDE (%)</th>
                    <th className="border border-black p-2 print:p-1.5 text-center" colSpan={2}>Densité (g/cm³)</th>
                  </tr>
                  <tr className="bg-transparent text-black">
                    <th className="border border-black p-2 print:p-1.5 text-center">MF</th>
                    <th className="border border-black p-2 print:p-1.5 text-center">Fines f (%)</th>
                    <th className="border border-black p-2 print:p-1.5 text-center">ES</th>
                    <th className="border border-black p-2 print:p-1.5 text-center">ESV</th>
                    <th className="border border-black p-2 print:p-1.5 text-center">Absolue</th>
                    <th className="border border-black p-2 print:p-1.5 text-center">Apparente</th>
                  </tr>
                </thead>
                <tbody>
                  {synthese.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="border border-black p-4 text-center text-gray-500">
                        Aucun essai enregistré pour cette carrière
                      </td>
                    </tr>
                  ) : (
                    synthese.map((row, idx) => {
                      const mvNode = row.mv?.sable || row.mv?.gravier || row.mv;
                      return (
                        <tr key={row.produit} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="border border-black p-2 print:p-1.5 font-medium">{row.produit}</td>
                          <td className="border border-black p-2 print:p-1.5 text-center">
                            {fmtNum(row.granulometrie?.module_finesse, 2)}
                          </td>
                          <td className="border border-black p-2 print:p-1.5 text-center">
                            {fmtNum(row.granulometrie?.teneur_fines_f)}
                          </td>
                          <td className="border border-black p-2 print:p-1.5 text-center">{fmtNum(row.es?.es_moyen, 0)}</td>
                          <td className="border border-black p-2 print:p-1.5 text-center">{fmtNum(row.es?.esv_moyen, 0)}</td>
                          <td className="border border-black p-2 print:p-1.5 text-center">{fmtNum(row.mb?.valeur_mb, 2)}</td>
                          <td className="border border-black p-2 print:p-1.5 text-center">{fmtNum(row.la?.coefficient_la, 0)}</td>
                          <td className="border border-black p-2 print:p-1.5 text-center">{fmtNum(row.mde?.coefficient_mde, 0)}</td>
                          <td className="border border-black p-2 print:p-1.5 text-center">
                            {fmtNum(mvNode?.densite_seche ?? mvNode?.densite_absolue, 3)}
                          </td>
                          <td className="border border-black p-2 print:p-1.5 text-center">
                            {fmtNum(mvNode?.densite_humide ?? mvNode?.densite_apparente, 3)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Dates des derniers essais */}
              {synthese.length > 0 && (
                <div className="mt-4 text-xs text-black">
                  <p className="font-semibold mb-1">Dates des derniers essais :</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                    {synthese.map(row => (
                      <span key={row.produit}>
                        <strong>{row.produit}</strong> :
                        {row.granulometrie_date && ` Granulo ${fmtDate(row.granulometrie_date)}`}
                        {row.es_date && ` · ES ${fmtDate(row.es_date)}`}
                        {row.mb_date && ` · MB ${fmtDate(row.mb_date)}`}
                        {row.la_date && ` · LA ${fmtDate(row.la_date)}`}
                        {row.mde_date && ` · MDE ${fmtDate(row.mde_date)}`}
                        {row.mv_date && ` · MV ${fmtDate(row.mv_date)}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-4 flex justify-between text-xs text-black">
                <span>Produits : {synthese.length}</span>
                <span>Généré le {format(new Date(), "dd/MM/yyyy à HH:mm", { locale: fr })}</span>
              </div>
            </div>
          </ZoomableReport>
        </>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
