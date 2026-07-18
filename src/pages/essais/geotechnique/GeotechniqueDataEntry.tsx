import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useEchantillonGeotechniqueById,
  useUpdateEchantillonGeotechniqueByType,
  getGeoPrefix
} from "@/hooks/useEchantillonsGeotechniqueFactory";
import { Json } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

interface GeotechniqueDataEntryProps {
  essaiType: string;
  essaiTitle: string;
  basePath: string;
  categoryPath: string;
  categoryLabel: string;
}

export default function GeotechniqueDataEntry({ essaiType, essaiTitle, basePath, categoryPath, categoryLabel }: GeotechniqueDataEntryProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: echantillon, isLoading } = useEchantillonGeotechniqueById(essaiType, id);
  const updateEchantillon = useUpdateEchantillonGeotechniqueByType(essaiType);
  const [resultats, setResultats] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (echantillon?.resultats) {
      setResultats(echantillon.resultats as Record<string, unknown>);
    }
  }, [echantillon]);

  const handleChange = (key: string, value: string) => {
    setResultats(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      const hasResults = Object.keys(resultats).length > 0 &&
        Object.values(resultats).some(v => v !== null && v !== undefined && v !== "");

      await updateEchantillon.mutateAsync({
        id,
        resultats: resultats as Json,
        statut: hasResults ? "termine" : "en-cours",
      });
      toast.success("Données enregistrées avec succès");
      navigate(basePath);
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!echantillon) {
    return <div className="text-center py-8 text-muted-foreground">Échantillon non trouvé</div>;
  }

  const prefix = getGeoPrefix(essaiType);

  return (
    <div data-essai-mobile className="space-y-6 animate-fade-in">
      <EssaiBreadcrumb items={[
        { label: "Géotechnique", path: "/essais/geotechnique" },
        { label: categoryLabel, path: categoryPath },
        { label: essaiTitle, path: basePath },
        { label: <><span className="text-primary">{prefix}</span>-{String(echantillon.numero).padStart(3, "0")}</>, path: `${basePath}/${id}` },
        { label: "Saisie" }
      ]} />

      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Saisie de Données - <span className="text-primary">{prefix}-{String(echantillon.numero).padStart(3, "0")}</span>
        </h1>
        <p className="text-muted-foreground mt-1">{essaiTitle}</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Informations Échantillon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="font-medium text-foreground">{echantillon.clients?.nom || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Chantier</p>
              <p className="font-medium text-foreground">{echantillon.chantiers?.nom || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type de sol</p>
              <p className="font-medium text-foreground">{echantillon.type_sol}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Profondeur</p>
              <p className="font-medium text-foreground">{echantillon.profondeur || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date de prélèvement</p>
              <p className="font-medium text-foreground">
                {format(new Date(echantillon.date_prelevement), "dd/MM/yyyy", { locale: fr })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Résultats d'essai</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Valeur 1</Label>
              <Input
                value={(resultats.valeur_1 as string) || ""}
                onChange={(e) => handleChange("valeur_1", e.target.value)}
                placeholder="Saisir la valeur..."
                className="bg-background border-border"
              />
            </div>
            <div>
              <Label>Valeur 2</Label>
              <Input
                value={(resultats.valeur_2 as string) || ""}
                onChange={(e) => handleChange("valeur_2", e.target.value)}
                placeholder="Saisir la valeur..."
                className="bg-background border-border"
              />
            </div>
            <div>
              <Label>Valeur 3</Label>
              <Input
                value={(resultats.valeur_3 as string) || ""}
                onChange={(e) => handleChange("valeur_3", e.target.value)}
                placeholder="Saisir la valeur..."
                className="bg-background border-border"
              />
            </div>
            <div>
              <Label>Valeur 4</Label>
              <Input
                value={(resultats.valeur_4 as string) || ""}
                onChange={(e) => handleChange("valeur_4", e.target.value)}
                placeholder="Saisir la valeur..."
                className="bg-background border-border"
              />
            </div>
          </div>
          <div>
            <Label>Notes / Commentaires</Label>
            <Textarea
              value={(resultats.notes as string) || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Notes sur les résultats..."
              className="bg-background border-border min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate(basePath)}>Annuler</Button>
        <Button onClick={handleSave} disabled={updateEchantillon.isPending} className="gradient-primary text-primary-foreground">
          {updateEchantillon.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Sauvegarder
        </Button>
      </div>
    </div>
  );
}
