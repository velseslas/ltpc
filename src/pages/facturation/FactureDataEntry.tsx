import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { useFacture, useUpdateFacture, useCreateLigneFacture, useDeleteLigneFacture } from "@/hooks/useFacturation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useQueryClient } from "@tanstack/react-query";

type LigneFacture = {
  id?: string;
  description: string;
  quantite: number;
  prix_unitaire: number;
  montant: number;
};

export default function FactureDataEntry() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: facture, isLoading } = useFacture(id);
  const updateFacture = useUpdateFacture();
  const qc = useQueryClient();

  const [lignes, setLignes] = useState<LigneFacture[]>([
    { description: "", quantite: 1, prix_unitaire: 0, montant: 0 },
  ]);
  const [tauxTva, setTauxTva] = useState(19);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (facture) {
      setTauxTva(Number(facture.taux_tva) || 19);
      const existing = (facture as any).lignes_facture;
      if (existing && existing.length > 0) {
        setLignes(
          existing
            .sort((a: any, b: any) => a.ordre - b.ordre)
            .map((l: any) => ({
              id: l.id,
              description: l.description,
              quantite: Number(l.quantite),
              prix_unitaire: Number(l.prix_unitaire),
              montant: Number(l.montant),
            }))
        );
      }
    }
  }, [facture]);

  const updateLigne = (idx: number, field: keyof LigneFacture, value: string | number) => {
    const updated = [...lignes];
    (updated[idx] as any)[field] = value;
    if (field === "quantite" || field === "prix_unitaire") {
      updated[idx].montant = Math.round(updated[idx].quantite * updated[idx].prix_unitaire * 100) / 100;
    }
    setLignes(updated);
  };

  const addLigne = () => {
    setLignes([...lignes, { description: "", quantite: 1, prix_unitaire: 0, montant: 0 }]);
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
      // Delete old lines
      const { data: oldLines } = await supabase
        .from("lignes_facture")
        .select("id")
        .eq("facture_id", id);
      if (oldLines) {
        for (const ol of oldLines) {
          await supabase.from("lignes_facture").delete().eq("id", ol.id);
        }
      }

      // Insert new lines
      for (let i = 0; i < lignes.length; i++) {
        const l = lignes[i];
        await supabase.from("lignes_facture").insert({
          facture_id: id,
          description: l.description,
          quantite: l.quantite,
          prix_unitaire: l.prix_unitaire,
          montant: l.montant,
          ordre: i + 1,
        });
      }

      // Update facture totals
      await updateFacture.mutateAsync({
        id,
        montant_ht: montantHT,
        taux_tva: tauxTva,
        montant_tva: montantTVA,
        montant_ttc: montantTTC,
      });

      qc.invalidateQueries({ queryKey: ["factures"] });
      toast.success("Données de facturation enregistrées");
      navigate(`/facturation/factures/${id}`);
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Facturation", path: "/facturation" },
        { label: "Factures", path: "/facturation/factures" },
        { label: facture?.numero || "...", path: `/facturation/factures/${id}` },
        { label: "Saisie de données" },
      ]} />

      <div className="flex items-start gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(`/facturation/factures/${id}`)} className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Saisie <span className="text-primary text-glow">{facture?.numero}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Saisir les lignes de facturation</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        {/* Invoice lines */}
        {lignes.map((ligne, idx) => (
          <div key={idx} className="space-y-4">
            {idx > 0 && <div className="border-t border-border" />}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Ligne {idx + 1}</h2>
              {lignes.length > 1 && (
                <Button variant="outline" size="sm" onClick={() => removeLigne(idx)} className="flex items-center gap-1 text-destructive border-destructive/30 hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />Supprimer
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label>Désignation</Label>
                <Textarea
                  placeholder="Description de la prestation ou du produit..."
                  value={ligne.description}
                  onChange={(e) => updateLigne(idx, "description", e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Quantité</Label>
                <Input
                  type="number"
                  min={0}
                  value={ligne.quantite || ""}
                  onChange={(e) => updateLigne(idx, "quantite", parseFloat(e.target.value) || 0)}
                  className="text-center"
                />
              </div>
              <div className="space-y-2">
                <Label>Prix unitaire (DA)</Label>
                <Input
                  type="number"
                  min={0}
                  value={ligne.prix_unitaire || ""}
                  onChange={(e) => updateLigne(idx, "prix_unitaire", parseFloat(e.target.value) || 0)}
                  className="text-center"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <div className="rounded-lg border border-border px-4 py-2 text-sm">
                Montant : <span className="font-bold">{ligne.montant.toLocaleString()} DA</span>
              </div>
            </div>
          </div>
        ))}

        <Button variant="outline" onClick={addLigne} className="w-full flex items-center justify-center gap-2 border-dashed border-primary/40 text-primary hover:bg-primary/5">
          <Plus className="h-4 w-4" />Ajouter une ligne
        </Button>

        {/* TVA */}
        <div className="border-t border-border pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Taux TVA (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={tauxTva || ""}
                onChange={(e) => setTauxTva(parseFloat(e.target.value) || 0)}
                className="text-center"
              />
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-border pt-6">
          <h2 className="text-lg font-semibold mb-4">Récapitulatif</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border p-4 text-center">
              <span className="text-sm text-muted-foreground">Nb lignes</span>
              <p className="text-2xl font-bold">{lignes.length}</p>
            </div>
            <div className="rounded-lg border border-border p-4 text-center">
              <span className="text-sm text-muted-foreground">Montant HT</span>
              <p className="text-2xl font-bold">{montantHT.toLocaleString()} DA</p>
            </div>
            <div className="rounded-lg bg-primary/10 border border-primary/30 p-4 text-center">
              <span className="text-sm text-muted-foreground">TVA ({tauxTva}%)</span>
              <p className="text-2xl font-bold text-primary">{montantTVA.toLocaleString()} DA</p>
            </div>
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 text-center">
              <span className="text-sm text-muted-foreground">Montant TTC</span>
              <p className="text-2xl font-bold text-emerald-500">{montantTTC.toLocaleString()} DA</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => navigate(`/facturation/factures/${id}`)}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}
