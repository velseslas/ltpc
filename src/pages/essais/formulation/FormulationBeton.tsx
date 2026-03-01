import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FlaskConical, Plus, Pencil, Trash2, Loader2, Search, Building2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDeleteFormulation, FormulationWithDetails } from "@/hooks/useFormulations";
import { useCentralesBeton } from "@/hooks/useCentralesBeton";

// Fetch all formulations with enriched data
function useAllFormulationsWithDetails() {
  return useQuery({
    queryKey: ["formulations-all-details"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formulations")
        .select("*")
        .order("nom", { ascending: true });

      if (error) throw error;

      // Fetch centrale names
      const centraleIds = [...new Set(data.map((f: any) => f.centrale_id))];
      const { data: centrales } = await supabase
        .from("centrales_beton")
        .select("id, nom")
        .in("id", centraleIds);

      const centraleMap = new Map((centrales || []).map((c: any) => [c.id, c.nom]));

      return data.map((f: any) => ({
        ...f,
        centrale_nom: centraleMap.get(f.centrale_id) || "Centrale inconnue",
      }));
    },
  });
}

function calculateTotals(f: any) {
  return (
    (f.sable_concasse_quantite || 0) +
    (f.sable_fin_quantite || 0) +
    (f.gravillons1_quantite || 0) +
    (f.gravier2_quantite || 0) +
    (f.gravier3_quantite || 0) +
    (f.ciment_quantite || 0) +
    (f.adjuvant_quantite || 0) +
    (f.eau_quantite || 0)
  );
}

function calculateRatios(f: any) {
  const sables = (f.sable_concasse_quantite || 0) + (f.sable_fin_quantite || 0);
  const graviers = (f.gravillons1_quantite || 0) + (f.gravier2_quantite || 0) + (f.gravier3_quantite || 0);
  const eau = f.eau_quantite || 0;
  const ciment = f.ciment_quantite || 0;
  return {
    gs: sables > 0 ? (graviers / sables).toFixed(2) : "-",
    ec: ciment > 0 ? (eau / ciment).toFixed(2) : "-",
  };
}

function IngredientPill({ label, quantite, unite }: { label: string; quantite: number | null; unite: string }) {
  if (!quantite) return null;
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/50 rounded-md text-xs">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-semibold text-foreground">{quantite} {unite}</span>
    </div>
  );
}

const FormulationBeton = () => {
  const navigate = useNavigate();
  const { data: formulations = [], isLoading } = useAllFormulationsWithDetails();
  const { data: centrales = [] } = useCentralesBeton();
  const deleteFormulation = useDeleteFormulation();
  const [search, setSearch] = useState("");
  const [selectedCentrale, setSelectedCentrale] = useState<string>("all");
  const [expandedCentrales, setExpandedCentrales] = useState<Set<string>>(new Set());

  const toggleCentrale = (centraleId: string) => {
    setExpandedCentrales((prev) => {
      const next = new Set(prev);
      if (next.has(centraleId)) next.delete(centraleId);
      else next.add(centraleId);
      return next;
    });
  };

  const filtered = formulations.filter((f: any) => {
    const matchSearch = f.nom.toLowerCase().includes(search.toLowerCase()) ||
      f.centrale_nom.toLowerCase().includes(search.toLowerCase());
    const matchCentrale = selectedCentrale === "all" || f.centrale_id === selectedCentrale;
    return matchSearch && matchCentrale;
  });

  // Group by centrale
  const grouped = filtered.reduce((acc: Record<string, { nom: string; formulations: any[] }>, f: any) => {
    if (!acc[f.centrale_id]) {
      acc[f.centrale_id] = { nom: f.centrale_nom, formulations: [] };
    }
    acc[f.centrale_id].formulations.push(f);
    return acc;
  }, {});

  // Auto-expand all groups
  const allCentraleIds = Object.keys(grouped);
  if (expandedCentrales.size === 0 && allCentraleIds.length > 0) {
    // On first render, expand all
    allCentraleIds.forEach((id) => expandedCentrales.add(id));
  }

  const handleDelete = async (id: string, centraleId: string) => {
    try {
      await deleteFormulation.mutateAsync({ id, centraleId });
      toast.success("Formulation supprimée");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <>
      <EssaiBreadcrumb items={[{ label: "Béton", path: "/essais/beton" }, { label: "Formulation" }]} />

      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/essais/beton")}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Formulation de <span className="text-primary text-glow">Béton</span>
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 ml-14">
          Gestion des formulations de béton par centrale
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une formulation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCentrale} onValueChange={setSelectedCentrale}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Toutes les centrales" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les centrales</SelectItem>
            {centrales.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FlaskConical className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Aucune formulation trouvée</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Créez des formulations depuis les détails d'une centrale à béton
            </p>
            <Button
              className="mt-4 gap-2"
              onClick={() => navigate("/intervenant/producteurs/centrale")}
            >
              <Building2 className="w-4 h-4" />
              Aller aux centrales
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
            <Card className="p-4">
              <div className="text-2xl font-bold text-primary">{filtered.length}</div>
              <div className="text-xs text-muted-foreground">Formulations</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-primary">{Object.keys(grouped).length}</div>
              <div className="text-xs text-muted-foreground">Centrales</div>
            </Card>
          </div>

          {Object.entries(grouped).map(([centraleId, group]: [string, any]) => {
            const isExpanded = expandedCentrales.has(centraleId);
            return (
              <div key={centraleId} className="space-y-2">
                {/* Centrale header */}
                <button
                  onClick={() => toggleCentrale(centraleId)}
                  className="flex items-center gap-3 w-full text-left py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <Building2 className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground">{group.nom}</span>
                  <Badge variant="secondary" className="ml-2">{group.formulations.length}</Badge>
                </button>

                {isExpanded && (
                  <div className="space-y-3 pl-4">
                    {group.formulations.map((f: any) => {
                      const total = calculateTotals(f);
                      const { gs, ec } = calculateRatios(f);

                      return (
                        <Card
                          key={f.id}
                          className="group border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <FlaskConical className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-foreground">{f.nom}</h3>
                                  <p className="text-xs text-muted-foreground">
                                    Créée le {new Date(f.created_at).toLocaleDateString("fr-FR")}
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-2 items-center">
                                <div className="hidden sm:flex gap-2">
                                  <div className="bg-primary/10 rounded-lg px-3 py-1.5 text-center">
                                    <div className="text-[10px] text-muted-foreground uppercase">G/S</div>
                                    <div className="text-sm font-bold text-primary">{gs}</div>
                                  </div>
                                  <div className="bg-primary/10 rounded-lg px-3 py-1.5 text-center">
                                    <div className="text-[10px] text-muted-foreground uppercase">E/C</div>
                                    <div className="text-sm font-bold text-primary">{ec}</div>
                                  </div>
                                  <div className="bg-accent/50 rounded-lg px-3 py-1.5 text-center">
                                    <div className="text-[10px] text-muted-foreground uppercase">Total</div>
                                    <div className="text-sm font-bold text-foreground">{total.toFixed(1)} kg</div>
                                  </div>
                                </div>

                                <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                                    onClick={() => navigate(`/intervenant/producteurs/centrale/${f.centrale_id}/formulation/${f.id}/modifier`)}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Supprimer la formulation</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Êtes-vous sûr de vouloir supprimer "{f.nom}" ? Cette action est irréversible.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDelete(f.id, f.centrale_id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Supprimer
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </div>

                            {/* Ingredients pills */}
                            <div className="flex flex-wrap gap-2">
                              <IngredientPill label="Sable conc." quantite={f.sable_concasse_quantite} unite="kg" />
                              <IngredientPill label="Sable fin" quantite={f.sable_fin_quantite} unite="kg" />
                              <IngredientPill label="Grav. 1" quantite={f.gravillons1_quantite} unite="kg" />
                              <IngredientPill label="Gravier 2" quantite={f.gravier2_quantite} unite="kg" />
                              <IngredientPill label="Gravier 3" quantite={f.gravier3_quantite} unite="kg" />
                              <IngredientPill label="Ciment" quantite={f.ciment_quantite} unite="kg" />
                              <IngredientPill label="Adjuvant" quantite={f.adjuvant_quantite} unite="kg" />
                              <IngredientPill label="Eau" quantite={f.eau_quantite} unite="L" />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default FormulationBeton;
