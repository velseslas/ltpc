import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ConvenanceStepProps {
  formulationId?: string;
  clientId?: string;
  chantierId?: string;
}

export function ConvenanceStep({ formulationId }: ConvenanceStepProps) {
  const [selectedId, setSelectedId] = useState("");
  const [showRapport, setShowRapport] = useState(false);
  const [dialogMsg, setDialogMsg] = useState("");

  const { data: echantillons = [], isLoading } = useQuery({
    queryKey: ["echantillons-compression-convenance", formulationId],
    queryFn: async () => {
      if (!formulationId) return [];
      const { data, error } = await supabase
        .from("echantillons_compression")
        .select(`id, numero, ouvrage, date_coulage, statut, essai_convenance, essai_convenance_details, formulation_id, clients(nom), chantiers(nom)`)
        .eq("formulation_id", formulationId)
        .eq("essai_convenance", true)
        .order("numero", { ascending: true });
      if (error) {
        console.error("[ConvenanceStep] query error", error);
        throw error;
      }
      console.log("[ConvenanceStep] formulationId=", formulationId, "rows=", data?.length, data);
      return data || [];
    },
    enabled: !!formulationId,
    staleTime: 0,
    refetchOnMount: "always",
  });

  // Auto-select first available
  useEffect(() => {
    if (!selectedId && echantillons.length > 0) {
      setSelectedId(echantillons[0].id);
    }
  }, [echantillons, selectedId]);

  const handleVoirRapport = () => {
    if (!formulationId) {
      setDialogMsg("Enregistrez d'abord la formulation.");
      return;
    }
    if (echantillons.length === 0) {
      setDialogMsg("Aucun essai de convenance disponible pour cette formulation.");
      return;
    }
    if (!selectedId) {
      setDialogMsg("Veuillez sélectionner un rapport avant de le consulter.");
      return;
    }
    setShowRapport(true);
  };

  const selected = echantillons.find((e: any) => e.id === selectedId);

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Essai de convenance</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sélectionnez un rapport d'essai de compression marqué comme convenance pour cette formulation.
          </p>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground ml-1">
            Rapport d'essai de convenance
          </span>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-muted/10">
            <Select value={selectedId} onValueChange={setSelectedId} disabled={!formulationId || isLoading}>
              <SelectTrigger className="bg-secondary border-border flex-1">
                <SelectValue
                  placeholder={
                    !formulationId
                      ? "Enregistrez la formulation pour activer la sélection"
                      : isLoading
                      ? "Chargement..."
                      : "Sélectionner rapport"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {echantillons.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    Aucun rapport disponible
                  </SelectItem>
                ) : (
                  echantillons.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>
                      EC-{String(e.numero).padStart(3, "0")}
                      {e.essai_convenance_details ? ` — ${e.essai_convenance_details}` : ""}
                      {e.clients?.nom ? ` — ${e.clients.nom}` : ""}
                      {e.chantiers?.nom ? ` — ${e.chantiers.nom}` : ""}
                      {e.date_coulage ? ` — ${format(new Date(e.date_coulage), "dd/MM/yyyy", { locale: fr })}` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50 whitespace-nowrap"
              onClick={handleVoirRapport}
            >
              Voir rapport
            </Button>
          </div>
          {dialogMsg && (
            <p className="text-xs text-destructive ml-1">{dialogMsg}</p>
          )}
        </div>

        <Dialog open={showRapport} onOpenChange={setShowRapport}>
          <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 flex flex-col">
            <DialogHeader className="p-4 border-b border-border">
              <DialogTitle>
                Rapport {selected ? `EC-${String(selected.numero).padStart(3, "0")}` : ""} — Essai de convenance
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              {selectedId && showRapport && (
                <iframe
                  src={`/essais/beton/beton-durci/compression/${selectedId}/rapport?embed=1`}
                  className="w-full h-full border-0"
                  title="Rapport essai de convenance"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default ConvenanceStep;
