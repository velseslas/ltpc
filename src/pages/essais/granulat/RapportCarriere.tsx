import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { useCarrieres } from "@/hooks/useCarrieres";
import { GranulatRapportsImport } from "@/components/essais/granulat/GranulatRapportsImport";

export default function RapportCarriere() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { data: carrieres } = useCarrieres();

  const [carriereId, setCarriereId] = useState<string>(searchParams.get("carriere") || "");
  const [wilaya, setWilaya] = useState<string>("");
  const [step, setStep] = useState(1);
  const [selectedByKey, setSelectedByKey] = useState<Record<string, string>>({});


  // Ouverture depuis la liste : pré-remplit la wilaya de la carrière
  useEffect(() => {
    if (carriereId && carrieres?.some(c => c.id === carriereId)) {
      const c = carrieres.find(x => x.id === carriereId);
      if (c?.ville && !wilaya) setWilaya(c.ville);
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

  const selectedCarriere = useMemo(
    () => carrieres?.find(c => c.id === carriereId),
    [carrieres, carriereId]
  );

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

      {/* Étape 1 — Sélection carrière (la suite arrivera plus tard) */}
      <Card className="print:hidden">
        <CardContent className="pt-6">
          <p className="text-sm font-medium mb-4">Étape 1 sur 2 — Sélection de la carrière</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Wilaya <span className="text-destructive">*</span>
              </label>
              <Select
                value={wilaya}
                onValueChange={(v) => { setWilaya(v); setCarriereId(""); }}
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
                onValueChange={(v) => setCarriereId(v)}
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
            <Button disabled={!wilaya || !carriereId}>
              Suivant
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
