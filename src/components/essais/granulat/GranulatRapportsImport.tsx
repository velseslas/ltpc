import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useProduits } from "@/hooks/useProduits";
import { useEchantillonGranulatById, getPrefix as getGranulatPrefix } from "@/hooks/useEchantillonsGranulatFactory";
import EquivalentSableReportContent from "@/pages/essais/granulat/rapport/content/EquivalentSableReportContent";
import BleuMethyleneReportContent from "@/pages/essais/granulat/rapport/content/BleuMethyleneReportContent";
import GranulometrieReportContent from "@/pages/essais/granulat/rapport/content/GranulometrieReportContent";
import MasseVolumiqueReportContent from "@/pages/essais/granulat/rapport/content/MasseVolumiqueReportContent";
import FormeGranulatsReportContent from "@/pages/essais/granulat/rapport/content/FormeGranulatsReportContent";
import LosAngelesReportContent from "@/pages/essais/granulat/rapport/content/LosAngelesReportContent";
import MicroDevalReportContent from "@/pages/essais/granulat/rapport/content/MicroDevalReportContent";

export const GRANULAT_ESSAIS = [
  { nom: "Analyse Granulométrique", table: "echantillons_granulometrie" as const, filter: "all" as const, essaiType: "granulometrie", prefix: "GR" },
  { nom: "Masse Volumique", table: "echantillons_masse_volumique" as const, filter: "all" as const, essaiType: "masse-volumique", prefix: "MV" },
  { nom: "Équivalent de Sable", table: "echantillons_equivalent_sable" as const, filter: "sable" as const, essaiType: "equivalent-sable", prefix: "ES" },
  { nom: "Valeur au Bleu de Méthylène", table: "echantillons_bleu_methylene" as const, filter: "sable" as const, essaiType: "bleu-methylene", prefix: "BM" },
  { nom: "Los Angeles", table: "echantillons_los_angeles" as const, filter: "gravier" as const, essaiType: "los-angeles", prefix: "LA" },
  { nom: "Micro-Deval", table: "echantillons_micro_deval" as const, filter: "gravier" as const, essaiType: "micro-deval", prefix: "MD" },
  { nom: "Coefficient d'Aplatissement", table: "echantillons_forme_granulats" as const, filter: "gravier" as const, essaiType: "forme-granulats", prefix: "FG" },
];

type GranulatTable = typeof GRANULAT_ESSAIS[number]["table"];

const reportContentMap: Record<string, React.ComponentType<{ resultats: Record<string, unknown> }>> = {
  "equivalent-sable": EquivalentSableReportContent,
  "bleu-methylene": BleuMethyleneReportContent,
  "granulometrie": GranulometrieReportContent,
  "masse-volumique": MasseVolumiqueReportContent,
  "forme-granulats": FormeGranulatsReportContent,
  "los-angeles": LosAngelesReportContent,
  "micro-deval": MicroDevalReportContent,
};

function useGranulatSamples(table: GranulatTable, carriereId: string) {
  return useQuery({
    queryKey: ["rapport-carriere-essai", table, carriereId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select("id, numero, produit, statut, date_reception, resultats")
        .eq("carriere_id", carriereId)
        .order("numero", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!carriereId,
  });
}

function RapportPopupContent({ essaiType, sampleId, essaiTitle }: { essaiType: string; sampleId: string; essaiTitle: string }) {
  const { data: echantillon, isLoading } = useEchantillonGranulatById(essaiType, sampleId);
  const { data: entreprise } = useEntreprise();
  const prefix = getGranulatPrefix(essaiType);
  const ReportContent = reportContentMap[essaiType];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!echantillon) {
    return <p className="text-center text-muted-foreground py-8">Échantillon non trouvé</p>;
  }

  const resultats = (echantillon.resultats as Record<string, unknown>) || {};

  return (
    <div className="bg-white text-black p-6 rounded-lg" style={{ fontFamily: "Arial, sans-serif" }}>
      <ReportHeader entreprise={entreprise} verificationUrl="" title={`RAPPORT D'ESSAI - ${essaiTitle.toUpperCase()}`} subtitle="" />
      <div className="mb-6">
        <h3 className="font-bold text-sm mb-2 underline text-black">Identification de l'échantillon</h3>
        <table className="w-full border-collapse border border-black text-sm">
          <tbody>
            <tr>
              <td className="border border-black px-3 py-1.5 font-medium w-1/3 text-black">N° Échantillon</td>
              <td className="border border-black px-3 py-1.5 text-black">{prefix}-{String(echantillon.numero).padStart(3, "0")}</td>
            </tr>
            <tr>
              <td className="border border-black px-3 py-1.5 font-medium text-black">Carrière / Fournisseur</td>
              <td className="border border-black px-3 py-1.5 text-black">{echantillon.carrieres?.nom || "-"}</td>
            </tr>
            <tr>
              <td className="border border-black px-3 py-1.5 font-medium text-black">Produit</td>
              <td className="border border-black px-3 py-1.5 text-black">{echantillon.produit}</td>
            </tr>
            <tr>
              <td className="border border-black px-3 py-1.5 font-medium text-black">Date de réception</td>
              <td className="border border-black px-3 py-1.5 text-black">
                {echantillon.date_reception ? format(new Date(echantillon.date_reception), "dd/MM/yyyy", { locale: fr }) : "-"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {ReportContent && <ReportContent resultats={resultats} />}
    </div>
  );
}

function EssaiRow({
  label, table, carriereId, produitNom, carriereNom, essaiType, essaiTitle, prefix, selectedId, onSelect,
}: {
  label: string; table: GranulatTable; carriereId: string; produitNom: string; carriereNom: string;
  essaiType: string; essaiTitle: string; prefix: string;
  selectedId?: string; onSelect?: (key: string, id: string) => void;
}) {
  const { data: samples = [] } = useGranulatSamples(table, carriereId);
  const filtered = samples.filter((s: any) => s.produit === produitNom);
  const [localId, setLocalId] = useState("");
  const value = selectedId ?? localId;
  const [showRapport, setShowRapport] = useState(false);

  const handleSelect = (id: string) => {
    setLocalId(id);
    onSelect?.(`${table}::${produitNom}`, id);
  };

  const selectedSample = filtered.find((s: any) => s.id === value);

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground ml-1">{label}</span>
      <div className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-muted/10">
        <Select value={value} onValueChange={handleSelect}>
          <SelectTrigger className="bg-secondary border-border flex-1">
            <SelectValue placeholder="Sélectionner rapport" />
          </SelectTrigger>
          <SelectContent>
            {filtered.length === 0 ? (
              <SelectItem value="__none" disabled>Aucun rapport disponible</SelectItem>
            ) : (
              filtered.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>
                  {prefix}-{String(s.numero).padStart(3, "0")} — {carriereNom} — {s.produit}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50 whitespace-nowrap"
          disabled={!value}
          onClick={() => setShowRapport(true)}
        >
          Rapport
        </Button>
      </div>

      <Dialog open={showRapport} onOpenChange={setShowRapport}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Rapport {selectedSample ? `${prefix}-${String(selectedSample.numero).padStart(3, "0")}` : ""} — {essaiTitle}
            </DialogTitle>
          </DialogHeader>
          {value && showRapport && (
            <RapportPopupContent essaiType={essaiType} sampleId={value} essaiTitle={essaiTitle} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function GranulatRapportsImport({
  carriereId,
  carriereNom,
  onSelect,
  selectedByKey,
}: {
  carriereId: string;
  carriereNom: string;
  onSelect?: (key: string, id: string) => void;
  selectedByKey?: Record<string, string>;
}) {
  const { data: produits = [] } = useProduits(carriereId, "carriere");

  const isSable = (nom: string) => nom.toLowerCase().includes("sable");

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-6 space-y-6">
        <h2 className="text-lg font-bold text-foreground">Rapports d'essais de la carrière</h2>

        {produits.length === 0 ? (
          <p className="text-xs italic text-muted-foreground p-3">
            Aucun produit enregistré pour cette carrière.
          </p>
        ) : (
          GRANULAT_ESSAIS.map((essai) => {
            const produitsForEssai = produits.filter((p: any) =>
              essai.filter === "all" ? true : essai.filter === "sable" ? isSable(p.nom) : !isSable(p.nom)
            );
            if (produitsForEssai.length === 0) return null;
            return (
              <div key={essai.table} className="space-y-2">
                <h3 className="text-sm font-semibold text-primary">{essai.nom}</h3>
                <Separator className="bg-border/50" />
                {produitsForEssai.map((p: any) => (
                  <EssaiRow
                    key={`${essai.table}-${p.id}`}
                    label={`${p.nom} — ${carriereNom}`}
                    table={essai.table}
                    carriereId={carriereId}
                    produitNom={p.nom}
                    carriereNom={carriereNom}
                    essaiType={essai.essaiType}
                    essaiTitle={essai.nom}
                    prefix={essai.prefix}
                    selectedId={selectedByKey?.[`${essai.table}::${p.nom}`]}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export default GranulatRapportsImport;
