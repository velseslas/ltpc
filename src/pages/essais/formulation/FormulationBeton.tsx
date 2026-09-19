import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FlaskConical, Plus, Loader2, Search, Building2, FileText, Pencil, ClipboardCheck, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { ConfirmDelete } from "@/components/common/ConfirmDelete";
import { NotTechnicien } from "@/components/common/NotTechnicien";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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

      const centraleIds = [...new Set(data.map((f: any) => f.centrale_id).filter(Boolean))];
      const produitIds = [...new Set(
        data.flatMap((f: any) => [
          f.ciment_produit_id, f.eau_produit_id, f.adjuvant_produit_id,
          f.sable_concasse_produit_id, f.sable_fin_produit_id,
          f.gravillons1_produit_id, f.gravier2_produit_id, f.gravier3_produit_id,
        ]).filter(Boolean)
      )];
      const carriereIds = [...new Set(
        data.flatMap((f: any) => [
          f.sable_concasse_producteur_id, f.sable_fin_producteur_id,
          f.gravillons1_producteur_id, f.gravier2_producteur_id, f.gravier3_producteur_id,
        ]).filter(Boolean)
      )];
      const cimenterieIds = [...new Set(data.map((f: any) => f.ciment_producteur_id).filter(Boolean))];
      const clientIds = [...new Set(data.map((f: any) => f.client_id).filter(Boolean))];
      const chantierIds = [...new Set(data.map((f: any) => f.chantier_id).filter(Boolean))];
      const sourceEauIds = [...new Set(data.map((f: any) => f.eau_producteur_id).filter(Boolean))];
      const adjuvantIds = [...new Set(data.map((f: any) => f.adjuvant_producteur_id).filter(Boolean))];

      const [centrales, produits, carrieres, cimenteries, sourcesEau, adjuvants, clients, chantiers] = await Promise.all([
        centraleIds.length ? supabase.from("centrales_beton").select("id, nom").in("id", centraleIds) : Promise.resolve({ data: [] as any[] }),
        produitIds.length ? supabase.from("produits").select("id, nom").in("id", produitIds) : Promise.resolve({ data: [] as any[] }),
        carriereIds.length ? supabase.from("carrieres").select("id, nom").in("id", carriereIds) : Promise.resolve({ data: [] as any[] }),
        cimenterieIds.length ? supabase.from("cimenteries").select("id, nom").in("id", cimenterieIds) : Promise.resolve({ data: [] as any[] }),
        sourceEauIds.length ? supabase.from("sources_eau").select("id, nom").in("id", sourceEauIds) : Promise.resolve({ data: [] as any[] }),
        adjuvantIds.length ? supabase.from("adjuvants").select("id, nom").in("id", adjuvantIds) : Promise.resolve({ data: [] as any[] }),
        clientIds.length ? supabase.from("clients").select("id, nom").in("id", clientIds) : Promise.resolve({ data: [] as any[] }),
        chantierIds.length ? supabase.from("chantiers").select("id, nom").in("id", chantierIds) : Promise.resolve({ data: [] as any[] }),
      ]);

      // Fallback techniciens : la table clients peut être inaccessible, on passe par clients_scoped()
      let clientRows: any[] = clients.data || [];
      if (clientIds.length && clientRows.length === 0) {
        const { data: scoped } = await supabase.rpc("clients_scoped");
        clientRows = ((scoped as any[]) || []).filter((c) => clientIds.includes(c.id));
      }

      const centraleMap = new Map((centrales.data || []).map((c: any) => [c.id, c.nom]));
      const produitMap = new Map((produits.data || []).map((c: any) => [c.id, c.nom]));
      const carriereMap = new Map((carrieres.data || []).map((c: any) => [c.id, c.nom]));
      const cimenterieMap = new Map((cimenteries.data || []).map((c: any) => [c.id, c.nom]));
      const sourceEauMap = new Map((sourcesEau.data || []).map((c: any) => [c.id, c.nom]));
      const adjuvantMap = new Map((adjuvants.data || []).map((c: any) => [c.id, c.nom]));
      const clientMap = new Map(clientRows.map((c: any) => [c.id, c.nom]));
      const chantierMap = new Map(((chantiers as any).data || []).map((c: any) => [c.id, c.nom]));

      return data.map((f: any) => ({
        ...f,
        centrale_nom: centraleMap.get(f.centrale_id) || "Centrale inconnue",
        client_nom: clientMap.get(f.client_id) || null,
        chantier_nom: chantierMap.get(f.chantier_id) || null,
        details: {
          ciment: { producteur: cimenterieMap.get(f.ciment_producteur_id) || null, produit: produitMap.get(f.ciment_produit_id) || null },
          eau: { producteur: sourceEauMap.get(f.eau_producteur_id) || null, produit: produitMap.get(f.eau_produit_id) || null },
          adjuvant: { producteur: adjuvantMap.get(f.adjuvant_producteur_id) || null, produit: produitMap.get(f.adjuvant_produit_id) || null },
          sable_concasse: { producteur: carriereMap.get(f.sable_concasse_producteur_id) || null, produit: produitMap.get(f.sable_concasse_produit_id) || null },
          sable_fin: { producteur: carriereMap.get(f.sable_fin_producteur_id) || null, produit: produitMap.get(f.sable_fin_produit_id) || null },
          gravillons1: { producteur: carriereMap.get(f.gravillons1_producteur_id) || null, produit: produitMap.get(f.gravillons1_produit_id) || null },
          gravier2: { producteur: carriereMap.get(f.gravier2_producteur_id) || null, produit: produitMap.get(f.gravier2_produit_id) || null },
          gravier3: { producteur: carriereMap.get(f.gravier3_producteur_id) || null, produit: produitMap.get(f.gravier3_produit_id) || null },
        },
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
  const queryClient = useQueryClient();
  const { data: formulations = [], isLoading } = useAllFormulationsWithDetails();
  const { data: centrales = [] } = useCentralesBeton();
  const [search, setSearch] = useState("");
  const [selectedCentrale, setSelectedCentrale] = useState<string>("all");

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("formulations").delete().eq("id", id);
    if (error) {
      toast.error("Erreur lors de la suppression : " + error.message);
      return;
    }
    toast.success("Formulation supprimée");
    queryClient.invalidateQueries({ queryKey: ["formulations-all-details"] });
  };

  const filtered = formulations.filter((f: any) => {
    const q = search.toLowerCase();
    const matchSearch =
      (f.nom || "").toLowerCase().includes(q) ||
      (f.centrale_nom || "").toLowerCase().includes(q) ||
      (f.client_nom || "").toLowerCase().includes(q) ||
      (f.chantier_nom || "").toLowerCase().includes(q);
    const matchCentrale = selectedCentrale === "all" || f.centrale_id === selectedCentrale;
    return matchSearch && matchCentrale;
  });

  const handleNewFormulation = () => {
    navigate("/essais/beton/formulation/nouveau");
  };

  return (
    <>
      <EssaiBreadcrumb items={[{ label: "Béton", path: "/essais/beton" }, { label: "Formulation" }]} />

      <div data-essai-mobile className="mb-8">
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
            <Plus className="hidden md:inline-block w-4 h-4" />
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

          {/* Formulation Widgets Grid - 2 par ligne */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((f: any) => {
              const total = calculateTotals(f);
              const { gs, ec } = calculateRatios(f);
              const d = f.details || {};

              const ingredients = [
                { key: "sable_concasse", label: "SABLE CONCASSÉ", qty: f.sable_concasse_quantite, unit: "kg", info: d.sable_concasse },
                { key: "sable_fin", label: "SABLE FIN", qty: f.sable_fin_quantite, unit: "kg", info: d.sable_fin },
                { key: "gravillons1", label: "GRAVILLONS 1", qty: f.gravillons1_quantite, unit: "kg", info: d.gravillons1 },
                { key: "gravier2", label: "GRAVIER 2", qty: f.gravier2_quantite, unit: "kg", info: d.gravier2 },
                { key: "gravier3", label: "GRAVIER 3", qty: f.gravier3_quantite, unit: "kg", info: d.gravier3 },
                { key: "ciment", label: "CIMENT", qty: f.ciment_quantite, unit: "kg", info: d.ciment },
                { key: "eau", label: "EAU", qty: f.eau_quantite, unit: "L", info: d.eau },
                { key: "adjuvant", label: "ADJUVANT", qty: f.adjuvant_quantite, unit: "kg", info: d.adjuvant },
              ].filter((i) => i.qty);

              return (
                <Card
                  key={f.id}
                  className="cursor-pointer group border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 hover:shadow-lg transition-all"
                  onClick={() => navigate(`/intervenant/producteurs/centrale/${f.centrale_id}/formulation/${f.id}/modifier`)}
                >
                  <CardContent className="p-5">
                    {/* Header : Icône + Nom + Date | Ratios à droite */}
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                          <FlaskConical className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-foreground text-lg leading-tight truncate">{f.nom}</h3>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Créée le {new Date(f.created_at).toLocaleDateString("fr-FR")}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Building2 className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground truncate">{f.centrale_nom}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <div className="bg-primary/10 border border-primary/30 rounded-lg px-3 py-1.5 text-center min-w-[60px]">
                          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">G/S</div>
                          <div className="text-sm font-bold text-primary">{gs}</div>
                        </div>
                        <div className="bg-primary/10 border border-primary/30 rounded-lg px-3 py-1.5 text-center min-w-[60px]">
                          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">E/C</div>
                          <div className="text-sm font-bold text-primary">{ec}</div>
                        </div>
                        <div className="bg-primary/20 border border-primary/40 rounded-lg px-3 py-1.5 text-center min-w-[80px]">
                          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Total</div>
                          <div className="text-sm font-bold text-primary">{total.toFixed(1)} kg</div>
                        </div>
                      </div>
                    </div>

                    {/* Ingrédients - tuiles sombres */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {ingredients.map((ing) => (
                        <div key={ing.key} className="rounded-lg bg-muted/40 border border-border/40 p-3 text-center">
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{ing.label}</div>
                          <div className="text-base font-bold text-foreground mt-0.5">
                            {Number(ing.qty).toFixed(1)} {ing.unit}
                          </div>
                          {ing.info?.producteur && (
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1.5 truncate">
                              {ing.info.producteur}
                            </div>
                          )}
                          {ing.info?.produit && (
                            <div className="text-[10px] text-primary font-medium mt-0.5 truncate">
                              {ing.info.produit}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-border/50 flex items-center justify-end flex-wrap gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1.5 text-primary hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/essais/beton/formulation/${f.id}/modifier-etude`);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Modifier étude
                      </Button>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1.5 text-primary hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/essais/beton/formulation/nouveau?duplicateFrom=${f.id}`);
                        }}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Dupliquer
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1.5 text-primary hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/essais/beton/formulation/${f.id}/convenance`);
                        }}
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        Convenance
                      </Button>
                      <NotTechnicien>
                        <div onClick={(e) => e.stopPropagation()}>
                          <ConfirmDelete
                            trigger={
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Supprimer
                              </Button>
                            }
                            title="Supprimer la formulation"
                            description={`Voulez-vous vraiment supprimer la formulation « ${f.nom} » ? Cette action est irréversible.`}
                            onConfirm={() => handleDelete(f.id)}
                          />
                        </div>
                      </NotTechnicien>
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
