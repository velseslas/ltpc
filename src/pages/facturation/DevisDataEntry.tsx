import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { useDevisDetail, useUpdateDevis } from "@/hooks/useFacturation";
import { usePrixEssais } from "@/hooks/usePrixEssais";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type LigneDevis = {
  id?: string;
  code_essai: string;
  description: string;
  quantite: number;
  prix_unitaire: number;
  montant: number;
};

export default function DevisDataEntry() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: devis, isLoading } = useDevisDetail(id);
  const { data: prixEssais } = usePrixEssais();
  const updateDevis = useUpdateDevis();
  const qc = useQueryClient();

  const [lignes, setLignes] = useState<LigneDevis[]>([
    { code_essai: "", description: "", quantite: 1, prix_unitaire: 0, montant: 0 },
  ]);
  const [tauxTva, setTauxTva] = useState(19);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (devis) {
      setTauxTva(Number(devis.taux_tva) || 19);
      const existing = (devis as any).lignes_devis;
      if (existing && existing.length > 0) {
        setLignes(
          existing
            .sort((a: any, b: any) => a.ordre - b.ordre)
            .map((l: any) => ({
              id: l.id,
              code_essai: l.code_essai || "",
              description: l.description,
              quantite: Number(l.quantite),
              prix_unitaire: Number(l.prix_unitaire),
              montant: Number(l.montant),
            }))
        );
      }
    }
  }, [devis]);

  const handleSelectEssai = (idx: number, essaiId: string) => {
    const essai = prixEssais?.find((e: any) => e.id === essaiId);
    if (!essai) return;
    const updated = [...lignes];
    updated[idx].code_essai = essai.code_essai || "";
    updated[idx].description = essai.nom_essai || "";
    updated[idx].prix_unitaire = Number(essai.prix_unitaire) || 0;
    updated[idx].montant = Math.round(updated[idx].quantite * updated[idx].prix_unitaire * 100) / 100;
    setLignes(updated);
  };

  const updateLigne = (idx: number, field: keyof LigneDevis, value: string | number) => {
    const updated = [...lignes];
    (updated[idx] as any)[field] = value;
    if (field === "quantite" || field === "prix_unitaire") {
      updated[idx].montant = Math.round(updated[idx].quantite * updated[idx].prix_unitaire * 100) / 100;
    }
    setLignes(updated);
  };

  const addLigne = () => {
    setLignes([...lignes, { code_essai: "", description: "", quantite: 1, prix_unitaire: 0, montant: 0 }]);
  };

  const removeLigne = (idx: number) => {
    if (lignes.length <= 1) return;
    setLignes(lignes.filter((_, i) => i !== idx));
  };

  const montantHT = lignes.reduce((s, l) => s + l.montant, 0);
  const montantTVA = Math.round(montantHT * tauxTva / 100 * 100) / 100;
  const montantTTC = Math.round((montantHT + montantTVA) * 100) / 100;

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const { data: oldLines } = await supabase
        .from("lignes_devis")
        .select("id")
        .eq("devis_id", id);
      if (oldLines) {
        for (const ol of oldLines) {
          await supabase.from("lignes_devis").delete().eq("id", ol.id);
        }
      }

      for (let i = 0; i < lignes.length; i++) {
        const l = lignes[i];
        await supabase.from("lignes_devis").insert({
          devis_id: id,
          description: l.description,
          quantite: l.quantite,
          prix_unitaire: l.prix_unitaire,
          montant: l.montant,
          ordre: i + 1,
        });
      }

      await updateDevis.mutateAsync({
        id,
        montant_ht: montantHT,
        taux_tva: tauxTva,
        montant_tva: montantTVA,
        montant_ttc: montantTTC,
      });

      qc.invalidateQueries({ queryKey: ["devis"] });
      toast.success("Données du devis enregistrées");
      navigate(`/facturation/devis/${id}`);
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div data-essai-mobile className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Facturation", path: "/facturation" },
        { label: "Devis", path: "/facturation/devis" },
        { label: devis?.numero || "...", path: `/facturation/devis/${id}` },
        { label: "Saisie de données" },
      ]} />

      <div className="flex items-start gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(`/facturation/devis/${id}`)} className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Saisie <span className="text-primary text-glow">{devis?.numero}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Saisir les lignes du devis</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="hidden md:grid md:grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          <div className="col-span-3">Code essai</div>
          <div className="col-span-3">Désignation</div>
          <div className="col-span-1 text-center">Qté</div>
          <div className="col-span-2 text-center">Prix unit. (DA)</div>
          <div className="col-span-2 text-center">Total HT (DA)</div>
          <div className="col-span-1"></div>
        </div>

        {lignes.map((ligne, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end rounded-lg border border-border p-3 bg-muted/30">
            <div className="md:col-span-3 space-y-1">
              <Label className="md:hidden text-xs">Code essai</Label>
              <Select
                value={prixEssais?.find((e: any) => e.code_essai === ligne.code_essai)?.id || ""}
                onValueChange={(val) => handleSelectEssai(idx, val)}
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="Sélectionner un essai" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {prixEssais?.map((e: any) => (
                    <SelectItem key={e.id} value={e.id} className="text-xs">
                      <span className="font-mono font-semibold">{e.code_essai}</span>
                      <span className="text-muted-foreground ml-1">– {e.nom_essai}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3 space-y-1">
              <Label className="md:hidden text-xs">Désignation</Label>
              <Input
                value={ligne.description}
                onChange={(e) => updateLigne(idx, "description", e.target.value)}
                placeholder="Désignation"
                className="text-xs"
              />
            </div>

            <div className="md:col-span-1 space-y-1">
              <Label className="md:hidden text-xs">Qté</Label>
              <Input
                type="number"
                min={1}
                value={ligne.quantite || ""}
                onChange={(e) => updateLigne(idx, "quantite", parseFloat(e.target.value) || 0)}
                className="text-center text-xs"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <Label className="md:hidden text-xs">Prix unit.</Label>
              <Input
                type="number"
                min={0}
                value={ligne.prix_unitaire || ""}
                onChange={(e) => updateLigne(idx, "prix_unitaire", parseFloat(e.target.value) || 0)}
                className="text-center text-xs"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <Label className="md:hidden text-xs">Total HT</Label>
              <Input
                value={ligne.montant.toLocaleString()}
                readOnly
                className="text-center text-xs font-semibold bg-muted/50"
              />
            </div>

            <div className="md:col-span-1 flex justify-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeLigne(idx)}
                disabled={lignes.length <= 1}
                className="text-destructive hover:bg-destructive/10 h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        <Button variant="outline" onClick={addLigne} className="w-full flex items-center justify-center gap-2 border-dashed border-primary/40 text-primary hover:bg-primary/5">
          <Plus className="h-4 w-4" />Ajouter une ligne
        </Button>

        <div className="border-t border-border pt-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="rounded-lg border border-border p-4 text-center">
              <span className="text-xs text-muted-foreground">Nb lignes</span>
              <p className="text-xl font-bold">{lignes.length}</p>
            </div>
            <div className="rounded-lg border border-border p-4 text-center">
              <span className="text-xs text-muted-foreground">Montant HT</span>
              <p className="text-xl font-bold">{montantHT.toLocaleString()} DA</p>
            </div>
            <div className="rounded-lg border border-border p-4 text-center space-y-1">
              <span className="text-xs text-muted-foreground">Taux TVA</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={tauxTva || ""}
                onChange={(e) => setTauxTva(parseFloat(e.target.value) || 0)}
                className="text-center text-sm h-8"
              />
            </div>
            <div className="rounded-lg bg-primary/10 border border-primary/30 p-4 text-center">
              <span className="text-xs text-muted-foreground">TVA ({tauxTva}%)</span>
              <p className="text-xl font-bold text-primary">{montantTVA.toLocaleString()} DA</p>
            </div>
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 text-center">
              <span className="text-xs text-muted-foreground">Montant TTC</span>
              <p className="text-xl font-bold text-emerald-500">{montantTTC.toLocaleString()} DA</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => navigate(`/facturation/devis/${id}`)}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}
