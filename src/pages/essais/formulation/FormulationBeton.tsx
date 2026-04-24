import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FlaskConical, Plus, Loader2, Search, Building2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCentralesBeton } from "@/hooks/useCentralesBeton";

function useAllFormulationsWithDetails() {
  return useQuery({
    queryKey: ["formulations-all-details"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formulations")
        .select("*")
        .order("nom", { ascending: true });

      if (error) throw error;

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

const FormulationBeton = () => {
  const navigate = useNavigate();
  const { data: formulations = [], isLoading } = useAllFormulationsWithDetails();
  const { data: centrales = [] } = useCentralesBeton();
  const [search, setSearch] = useState("");
  const [selectedCentrale, setSelectedCentrale] = useState<string>("all");

  const filtered = formulations.filter((f: any) => {
    const matchSearch = f.nom.toLowerCase().includes(search.toLowerCase()) ||
      f.centrale_nom.toLowerCase().includes(search.toLowerCase());
    const matchCentrale = selectedCentrale === "all" || f.centrale_id === selectedCentrale;
    return matchSearch && matchCentrale;
  });

  const handleNewFormulation = () => {
    navigate("/essais/beton/formulation/nouveau");
  };

  return (
    <>
      <EssaiBreadcrumb items={[{ label: "Béton", path: "/essais/beton" }, { label: "Formulation" }]} />

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton to="/essais/beton" />
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">
                Formulation de <span className="text-primary text-glow">Béton</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestion des formulations de béton par centrale
              </p>
            </div>
          </div>
          <Button onClick={handleNewFormulation} className="gap-2 gradient-primary text-primary-foreground">
            <Plus className="w-4 h-4" />
            Nouvelle formule
          </Button>
        </div>
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
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FlaskConical className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Aucune formulation trouvée</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Cliquez sur "Nouvelle formule" pour créer votre première formulation
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-2xl font-bold text-primary">{filtered.length}</div>
              <div className="text-xs text-muted-foreground">Formulations</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-primary">
                {new Set(filtered.map((f: any) => f.centrale_id)).size}
              </div>
              <div className="text-xs text-muted-foreground">Centrales</div>
            </Card>
          </div>

          {/* Formulation Widgets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((f: any) => {
              const total = calculateTotals(f);
              const { gs, ec } = calculateRatios(f);

              return (
                <Card
                  key={f.id}
                  className="cursor-pointer group border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 hover:shadow-lg transition-all"
                  onClick={() => navigate(`/intervenant/producteurs/centrale/${f.centrale_id}/formulation/${f.id}/modifier`)}
                >
                  <CardContent className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FlaskConical className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-base">{f.nom}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Building2 className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{f.centrale_nom}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ratios */}
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1 bg-primary/10 rounded-lg px-3 py-2 text-center">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">G/S</div>
                        <div className="text-sm font-bold text-primary">{gs}</div>
                      </div>
                      <div className="flex-1 bg-primary/10 rounded-lg px-3 py-2 text-center">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">E/C</div>
                        <div className="text-sm font-bold text-primary">{ec}</div>
                      </div>
                      <div className="flex-1 bg-accent/50 rounded-lg px-3 py-2 text-center">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</div>
                        <div className="text-sm font-bold text-foreground">{total.toFixed(1)} kg</div>
                      </div>
                    </div>

                    {/* Key ingredients summary */}
                    <div className="flex flex-wrap gap-1.5">
                      {f.ciment_quantite && (
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          Ciment: {f.ciment_quantite} kg
                        </Badge>
                      )}
                      {f.eau_quantite && (
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          Eau: {f.eau_quantite} L
                        </Badge>
                      )}
                      {f.adjuvant_quantite && (
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          Adj: {f.adjuvant_quantite} kg
                        </Badge>
                      )}
                    </div>

                    {/* Date + Action */}
                    <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground">
                        Créée le {new Date(f.created_at).toLocaleDateString("fr-FR")}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1.5 text-primary hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/essais/beton/formulation/${f.id}/rapport`);
                        }}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Rapport
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

    </>
  );
};

export default FormulationBeton;
