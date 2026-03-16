import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { 
  useEchantillonGranulatById, 
  useUpdateEchantillonGranulatByType,
  formatNumero,
  getPrefix
} from "@/hooks/useEchantillonsGranulatFactory";
import { Json } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

// Import form components for each test type
import EquivalentSableForm from "./forms/EquivalentSableForm";
import BleuMethyleneForm from "./forms/BleuMethyleneForm";
import MatiereOrganiqueForm from "./forms/MatiereOrganiqueForm";
import GranulometrieForm from "./forms/GranulometrieForm";
import MasseVolumiqueForm from "./forms/MasseVolumiqueForm";
import FormeGranulatsForm from "./forms/FormeGranulatsForm";
import TeneurEauForm from "./forms/TeneurEauForm";
import LosAngelesForm from "./forms/LosAngelesForm";
import MicroDevalForm from "./forms/MicroDevalForm";
import EcrasementForm from "./forms/EcrasementForm";
import FriabiliteForm from "./forms/FriabiliteForm";

interface GranulatDataEntryProps {
  essaiType: string;
  essaiTitle: string;
  basePath: string;
}

// Configuration des catégories pour le breadcrumb
const breadcrumbConfig: Record<string, { categoryPath: string; categoryLabel: string }> = {
  "equivalent-sable": { categoryPath: "/essais/granulat/proprete", categoryLabel: "Propreté" },
  "bleu-methylene": { categoryPath: "/essais/granulat/proprete", categoryLabel: "Propreté" },
  "matiere-organique": { categoryPath: "/essais/granulat/proprete", categoryLabel: "Propreté" },
  "granulometrie": { categoryPath: "/essais/granulat/physiques", categoryLabel: "Physiques" },
  "masse-volumique": { categoryPath: "/essais/granulat/physiques", categoryLabel: "Physiques" },
  "forme-granulats": { categoryPath: "/essais/granulat/physiques", categoryLabel: "Physiques" },
  "teneur-eau": { categoryPath: "/essais/granulat/physiques", categoryLabel: "Physiques" },
  "los-angeles": { categoryPath: "/essais/granulat/mecaniques", categoryLabel: "Mécaniques" },
  "micro-deval": { categoryPath: "/essais/granulat/mecaniques", categoryLabel: "Mécaniques" },
  "ecrasement": { categoryPath: "/essais/granulat/mecaniques", categoryLabel: "Mécaniques" },
  "friabilite": { categoryPath: "/essais/granulat/mecaniques", categoryLabel: "Mécaniques" },
};

const formComponents: Record<string, React.ComponentType<{ resultats: Record<string, unknown>; onChange: (data: Record<string, unknown>) => void }>> = {
  "equivalent-sable": EquivalentSableForm,
  "bleu-methylene": BleuMethyleneForm,
  "matiere-organique": MatiereOrganiqueForm,
  "granulometrie": GranulometrieForm,
  "masse-volumique": MasseVolumiqueForm,
  "forme-granulats": FormeGranulatsForm,
  "teneur-eau": TeneurEauForm,
  "los-angeles": LosAngelesForm,
  "micro-deval": MicroDevalForm,
  "ecrasement": EcrasementForm,
  "friabilite": FriabiliteForm,
};

export default function GranulatDataEntry({ essaiType, essaiTitle, basePath }: GranulatDataEntryProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: echantillon, isLoading } = useEchantillonGranulatById(essaiType, id);
  const updateEchantillon = useUpdateEchantillonGranulatByType(essaiType);
  const [resultats, setResultats] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (echantillon?.resultats) {
      setResultats(echantillon.resultats as Record<string, unknown>);
    }
  }, [echantillon]);

  const handleSave = async () => {
    if (!id) return;
    
    try {
      // Determine status based on whether there are results
      const hasResults = Object.keys(resultats).length > 0 && 
        Object.values(resultats).some(v => v !== null && v !== undefined && v !== "");
      
      await updateEchantillon.mutateAsync({
        id,
        resultats: resultats as Json,
        statut: hasResults ? "termine" : "en-cours",
      });
      
      toast.success("Données enregistrées avec succès");
      navigate(basePath);
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const FormComponent = formComponents[essaiType];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!echantillon) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Échantillon non trouvé
      </div>
    );
  }

  const config = breadcrumbConfig[essaiType];
  const breadcrumbItems = config ? [
    { label: "Granulat", path: "/essais/granulat" },
    { label: config.categoryLabel, path: config.categoryPath },
    { label: essaiTitle, path: basePath },
    { 
      label: (
        <>
          <span className="text-primary">{getPrefix(essaiType)}</span>-{String(echantillon.numero).padStart(3, "0")}
        </>
      ), 
      path: `${basePath}/${id}` 
    },
    { label: "Saisie" }
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <EssaiBreadcrumb items={breadcrumbItems} />

      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton to={`${basePath}/${id}`} />
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Saisie de Données - <span className="text-primary">{getPrefix(essaiType)}-{String(echantillon.numero).padStart(3, "0")}</span>
          </h1>
          <p className="text-muted-foreground mt-1">{essaiTitle}</p>
        </div>
      </div>

      {/* Informations Échantillon */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Informations Échantillon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Carrière</p>
              <p className="font-medium text-foreground">{echantillon.carrieres?.nom || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Produit</p>
              <p className="font-medium text-foreground">{echantillon.produit}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date de réception</p>
              <p className="font-medium text-foreground">
                {format(new Date(echantillon.date_reception), "dd/MM/yyyy", { locale: fr })}
              </p>
            </div>
            {echantillon.observations && (
              <div className="md:col-span-3">
                <p className="text-sm text-muted-foreground">Observations</p>
                <p className="font-medium text-foreground">{echantillon.observations}</p>
              </div>
            )}
          </div>
          {essaiType === "ecrasement" && (
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              <p className="text-sm font-medium text-foreground">Mentions à afficher sur le rapport :</p>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="info_client"
                  checked={!!resultats.mention_info_client}
                  onCheckedChange={(checked) => setResultats(prev => ({ ...prev, mention_info_client: !!checked }))}
                />
                <label htmlFor="info_client" className="text-sm text-foreground cursor-pointer">
                  Informations fournies par le client
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="eprouvette_client"
                  checked={!!resultats.mention_eprouvette_client}
                  onCheckedChange={(checked) => setResultats(prev => ({ ...prev, mention_eprouvette_client: !!checked }))}
                />
                <label htmlFor="eprouvette_client" className="text-sm text-foreground cursor-pointer">
                  Éprouvette confectionnée par le client
                </label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulaire spécifique */}
      {FormComponent ? (
        essaiType === "masse-volumique" ? (
          <MasseVolumiqueForm resultats={resultats} onChange={setResultats} produit={echantillon.produit} />
        ) : essaiType === "granulometrie" ? (
          <GranulometrieForm resultats={resultats} onChange={setResultats} produit={echantillon.produit} />
        ) : (
          <FormComponent resultats={resultats} onChange={setResultats} />
        )
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="py-8 text-center text-muted-foreground">
            Formulaire de saisie non disponible pour ce type d'essai
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate(basePath)}>
          Annuler
        </Button>
        <Button
          onClick={handleSave}
          disabled={updateEchantillon.isPending}
          className="gradient-primary text-primary-foreground"
        >
          {updateEchantillon.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Sauvegarder
        </Button>
      </div>
    </div>
  );
}
