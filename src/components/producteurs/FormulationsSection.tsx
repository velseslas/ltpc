import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FlaskConical, Trash2, Loader2, Pencil, FileText } from "lucide-react";
import { useFormulations, useDeleteFormulation, FormulationWithDetails } from "@/hooks/useFormulations";
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
import { toast } from "sonner";
import { AdminOnly } from "@/components/common/AdminOnly";

interface FormulationsSectionProps {
  centraleId: string;
}

function calculateTotals(formulation: FormulationWithDetails) {
  const total = 
    (formulation.sable_concasse_quantite || 0) +
    (formulation.sable_fin_quantite || 0) +
    (formulation.gravillons1_quantite || 0) +
    (formulation.gravier2_quantite || 0) +
    (formulation.gravier3_quantite || 0) +
    (formulation.ciment_quantite || 0) +
    (formulation.adjuvant_quantite || 0) +
    (formulation.eau_quantite || 0);
  
  return total;
}

function calculateRatios(formulation: FormulationWithDetails) {
  const sables = (formulation.sable_concasse_quantite || 0) + (formulation.sable_fin_quantite || 0);
  const graviers = (formulation.gravillons1_quantite || 0) + (formulation.gravier2_quantite || 0) + (formulation.gravier3_quantite || 0);
  const eau = formulation.eau_quantite || 0;
  const ciment = formulation.ciment_quantite || 0;

  const gs = sables > 0 ? (graviers / sables).toFixed(2) : "-";
  const ec = ciment > 0 ? (eau / ciment).toFixed(2) : "-";

  return { gs, ec };
}

interface IngredientDisplayProps {
  label: string;
  quantite: number | null;
  unite: string;
  producteur?: { nom: string } | null;
  produit?: { nom: string } | null;
}

function IngredientDisplay({ label, quantite, unite, producteur, produit }: IngredientDisplayProps) {
  if (!quantite) return null;
  
  return (
    <div className="flex flex-col items-center text-center p-3 bg-muted/30 rounded-lg min-w-[100px]">
      <span className="text-xs text-muted-foreground uppercase font-medium">{label}</span>
      <span className="text-base font-bold text-foreground">{quantite} {unite}</span>
      {(producteur || produit) && (
        <div className="text-[10px] text-muted-foreground/70 mt-1 truncate max-w-full">
          {producteur?.nom && <span>{producteur.nom}</span>}
          {produit?.nom && <span className="text-primary/70 block">{produit.nom}</span>}
        </div>
      )}
    </div>
  );
}

export function FormulationsSection({ centraleId }: FormulationsSectionProps) {
  const navigate = useNavigate();
  const { data: formulations = [], isLoading } = useFormulations(centraleId);
  const deleteFormulation = useDeleteFormulation();

  const handleDelete = async (id: string) => {
    try {
      await deleteFormulation.mutateAsync({ id, centraleId });
      toast.success("Formulation supprimée");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Formulations</h2>
        <Button
          onClick={() => navigate(`/intervenant/producteurs/centrale/${centraleId}/formulation/nouveau`)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouvelle Formulation
        </Button>
      </div>

      {formulations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <FlaskConical className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Aucune formulation enregistrée</p>
            <p className="text-sm text-muted-foreground/70">
              Cliquez sur "Nouvelle Formulation" pour en ajouter une
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {formulations.map((formulation) => {
            const total = calculateTotals(formulation);
            const { gs, ec } = calculateRatios(formulation);
            
            return (
              <Card
                key={formulation.id}
                className="group border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FlaskConical className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{formulation.nom}</h3>
                        <p className="text-xs text-muted-foreground">
                          Créée le {new Date(formulation.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    
                    {/* Ratios et Total */}
                    <div className="flex gap-3 items-center">
                      <div className="bg-primary/10 rounded-lg px-4 py-2 text-center">
                        <div className="text-[10px] text-muted-foreground uppercase">G/S</div>
                        <div className="text-sm font-bold text-primary">{gs}</div>
                      </div>
                      <div className="bg-primary/10 rounded-lg px-4 py-2 text-center">
                        <div className="text-[10px] text-muted-foreground uppercase">E/C</div>
                        <div className="text-sm font-bold text-primary">{ec}</div>
                      </div>
                      <div className="bg-accent/50 rounded-lg px-4 py-2 text-center">
                        <div className="text-[10px] text-muted-foreground uppercase">Total</div>
                        <div className="text-sm font-bold text-foreground">{total.toFixed(1)} kg</div>
                      </div>
                      
                      <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          onClick={() => navigate(`/intervenant/producteurs/centrale/${centraleId}/formulation/${formulation.id}/modifier`)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <AdminOnly><AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer la formulation</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer "{formulation.nom}" ? Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(formulation.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog></AdminOnly>
                      </div>
                    </div>
                  </div>

                  {/* Ligne 1: Agrégats */}
                  <div className="flex flex-wrap gap-3 mb-3">
                    <IngredientDisplay
                      label="Sable concassé"
                      quantite={formulation.sable_concasse_quantite}
                      unite="kg"
                      producteur={formulation.sable_concasse_producteur}
                      produit={formulation.sable_concasse_produit}
                    />
                    <IngredientDisplay
                      label="Sable fin"
                      quantite={formulation.sable_fin_quantite}
                      unite="kg"
                      producteur={formulation.sable_fin_producteur}
                      produit={formulation.sable_fin_produit}
                    />
                    <IngredientDisplay
                      label="Gravillons 1"
                      quantite={formulation.gravillons1_quantite}
                      unite="kg"
                      producteur={formulation.gravillons1_producteur}
                      produit={formulation.gravillons1_produit}
                    />
                    <IngredientDisplay
                      label="Gravier 2"
                      quantite={formulation.gravier2_quantite}
                      unite="kg"
                      producteur={formulation.gravier2_producteur}
                      produit={formulation.gravier2_produit}
                    />
                    <IngredientDisplay
                      label="Gravier 3"
                      quantite={formulation.gravier3_quantite}
                      unite="kg"
                      producteur={formulation.gravier3_producteur}
                      produit={formulation.gravier3_produit}
                    />
                  </div>
                  
                  {/* Ligne 2: Ciment, Adjuvant, Eau */}
                  <div className="flex flex-wrap gap-3">
                    <IngredientDisplay
                      label="Ciment"
                      quantite={formulation.ciment_quantite}
                      unite="kg"
                      producteur={formulation.ciment_producteur}
                      produit={formulation.ciment_produit}
                    />
                    <IngredientDisplay
                      label="Adjuvant"
                      quantite={formulation.adjuvant_quantite}
                      unite="kg"
                      producteur={formulation.adjuvant_producteur}
                      produit={formulation.adjuvant_produit}
                    />
                    <IngredientDisplay
                      label="Eau"
                      quantite={formulation.eau_quantite}
                      unite="L"
                      producteur={formulation.eau_producteur}
                      produit={formulation.eau_produit}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
