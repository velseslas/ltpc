import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileBarChart, Loader2, Plus, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ConvenanceStepProps {
  formulationId?: string;
  clientId?: string;
  chantierId?: string;
}

const getStatutBadge = (statut: string) => {
  switch (statut) {
    case "en-cours":
      return <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10">En cours</Badge>;
    case "termine":
      return <Badge variant="outline" className="border-emerald-500/50 text-emerald-500 bg-emerald-500/10">Terminé</Badge>;
    case "a-faire":
      return <Badge variant="outline" className="border-sky-500/50 text-sky-500 bg-sky-500/10">À faire</Badge>;
    default:
      return <Badge variant="outline" className="border-muted-foreground/50 text-muted-foreground">{statut}</Badge>;
  }
};

export function ConvenanceStep({ formulationId, clientId, chantierId }: ConvenanceStepProps) {
  const navigate = useNavigate();

  const { data: echantillons, isLoading } = useQuery({
    queryKey: ["echantillons-compression-convenance", formulationId],
    queryFn: async () => {
      if (!formulationId) return [];
      const { data, error } = await supabase
        .from("echantillons_compression")
        .select(`*, clients(id, nom), chantiers(id, nom)`)
        .eq("formulation_id", formulationId)
        .eq("essai_convenance", true)
        .order("numero", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!formulationId,
  });

  const handleCreate = () => {
    const params = new URLSearchParams();
    params.set("convenance", "1");
    if (formulationId) params.set("formulationId", formulationId);
    if (clientId) params.set("clientId", clientId);
    if (chantierId) params.set("chantierId", chantierId);
    navigate(`/essais/beton/beton-durci/compression/nouveau?${params.toString()}`);
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Essai de convenance</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Liste des essais de compression marqués comme essai de convenance pour cette formulation.
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2 gradient-primary text-primary-foreground" disabled={!formulationId}>
            <Plus className="w-4 h-4" />
            Nouveau essai de convenance
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium">N°</TableHead>
                <TableHead className="text-muted-foreground font-medium">Client</TableHead>
                <TableHead className="text-muted-foreground font-medium">Chantier</TableHead>
                <TableHead className="text-muted-foreground font-medium">Ouvrage</TableHead>
                <TableHead className="text-muted-foreground font-medium">Date de coulage</TableHead>
                <TableHead className="text-muted-foreground font-medium text-center">Statut</TableHead>
                <TableHead className="text-muted-foreground font-medium text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!formulationId ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Enregistrez d'abord la formulation pour pouvoir associer des essais de convenance.
                  </TableCell>
                </TableRow>
              ) : isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : !echantillons || echantillons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun essai de convenance pour cette formulation
                  </TableCell>
                </TableRow>
              ) : (
                echantillons.map((e: any) => (
                  <TableRow key={e.id} className="border-border">
                    <TableCell className="font-medium text-foreground">
                      <span className="text-primary">EC</span>-{String(e.numero).padStart(3, "0")}
                    </TableCell>
                    <TableCell className="text-foreground">{e.clients?.nom ?? "-"}</TableCell>
                    <TableCell className="text-foreground">{e.chantiers?.nom ?? "-"}</TableCell>
                    <TableCell className="text-foreground">{e.ouvrage ?? "-"}</TableCell>
                    <TableCell className="text-foreground">
                      {e.date_coulage ? format(new Date(e.date_coulage), "dd/MM/yyyy", { locale: fr }) : "-"}
                    </TableCell>
                    <TableCell className="text-center">{getStatutBadge(e.statut)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-primary hover:bg-primary/10"
                          onClick={() => navigate(`/essais/beton/beton-durci/compression/${e.id}`)}
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          Détails
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-primary hover:bg-primary/10"
                          onClick={() => navigate(`/essais/beton/beton-durci/compression/${e.id}/rapport`)}
                        >
                          <FileBarChart className="w-3.5 h-3.5" />
                          Rapport
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default ConvenanceStep;
