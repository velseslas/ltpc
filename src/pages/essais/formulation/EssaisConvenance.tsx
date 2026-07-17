import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, FileText, Plus, MoreHorizontal, Eye, Pencil, Copy, Loader2, FileBarChart, ClipboardList, ClipboardEdit } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

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

const EssaisConvenance = () => {
  const navigate = useNavigate();
  const { formulationId } = useParams<{ formulationId: string }>();

  const { data: formulation } = useQuery({
    queryKey: ["formulation-meta", formulationId],
    queryFn: async () => {
      if (!formulationId) return null;
      const { data, error } = await supabase
        .from("formulations")
        .select("id, nom, client_id, chantier_id")
        .eq("id", formulationId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!formulationId,
  });

  const { data: echantillons, isLoading } = useQuery({
    queryKey: ["echantillons-compression-convenance-page", formulationId],
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
    if (formulation?.client_id) params.set("clientId", formulation.client_id);
    if (formulation?.chantier_id) params.set("chantierId", formulation.chantier_id);
    navigate(`/essais/beton/beton-durci/compression/nouveau?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb
        items={[
          { label: "Béton", path: "/essais/beton" },
          { label: "Formulation", path: "/essais/beton/formulation" },
          { label: formulation?.nom || "Formulation", path: `/essais/beton/formulation/${formulationId}/modifier-etude` },
          { label: "Essai de convenance" },
        ]}
      />

      <div className="flex items-start gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/essais/beton/formulation")}
          className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Essai de <span className="text-primary text-glow">Convenance</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {formulation?.nom ? `Formulation : ${formulation.nom}` : "Sélection des essais de compression de convenance"}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-end">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => navigate(`/essais/beton/formulation/${formulationId}/modifier-etude`)}
          >
            <FileText className="h-4 w-4" />
            Étude de formulation
          </Button>
          <Button className="flex items-center gap-2" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Nouveau échantillon
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium">N°</TableHead>
              <TableHead className="text-muted-foreground font-medium">Client</TableHead>
              <TableHead className="text-muted-foreground font-medium">Chantier</TableHead>
              <TableHead className="text-muted-foreground font-medium">Ouvrage</TableHead>
              <TableHead className="text-muted-foreground font-medium">Partie de l'ouvrage</TableHead>
              <TableHead className="text-muted-foreground font-medium">Date de coulage</TableHead>
              <TableHead className="text-muted-foreground font-medium text-center">Statut</TableHead>
              <TableHead className="text-muted-foreground font-medium text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : !echantillons || echantillons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                  <TableCell className="text-foreground">{e.usage ?? "-"}</TableCell>
                  <TableCell className="text-foreground">
                    {e.date_coulage ? format(new Date(e.date_coulage), "dd/MM/yyyy", { locale: fr }) : "-"}
                  </TableCell>
                  <TableCell className="text-center">{getStatutBadge(e.statut)}</TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate(`/essais/beton/beton-durci/compression/${e.id}`)}>
                          <Eye className="h-4 w-4" />
                          Détails
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate(`/essais/beton/beton-durci/compression/${e.id}/saisie`)}>
                          <ClipboardEdit className="h-4 w-4" />
                          Saisie de données
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate(`/essais/beton/beton-durci/compression/${e.id}/bulletin`)}>
                          <ClipboardList className="h-4 w-4" />
                          Bulletin d'échantillonnage
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate(`/essais/beton/beton-durci/compression/${e.id}/rapport`)}>
                          <FileBarChart className="h-4 w-4" />
                          Rapport
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate(`/essais/beton/beton-durci/compression/${e.id}/modifier`)}>
                          <Pencil className="h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default EssaisConvenance;
