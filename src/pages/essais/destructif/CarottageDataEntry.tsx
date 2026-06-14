import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { useEchantillonCarottage, useUpdateEchantillonCarottage } from "@/hooks/useEchantillonsCarottage";
import { toast } from "sonner";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import type { Json } from "@/integrations/supabase/types";

interface CarotteResult {
  id: string;
  reference: string;
  hauteur_L: string;       // Hauteur L (mm)
  diametre_D: string;      // Diamètre D (mm)
  elancement: string;      // L/D
  k_ld: string;            // K(L/D)
  poids: string;           // kg
  volume: string;          // m³
  masse_volumique: string; // t/m³
  charge: string;          // kN
  section: string;         // mm²
  resistance: string;      // MPa
  resistance_corrigee: string; // MPa avec K
}

interface ElementTest {
  element_coule: string;
  carottes: CarotteResult[];
}

const emptyCarotte = (): CarotteResult => ({
  id: crypto.randomUUID(),
  reference: "",
  hauteur_L: "",
  diametre_D: "",
  elancement: "",
  k_ld: "",
  poids: "",
  volume: "",
  masse_volumique: "",
  charge: "",
  section: "",
  resistance: "",
  resistance_corrigee: "",
});

// Coefficient K(L/D) selon NF P18-418 — interpolation linéaire
// L/D : 1.00 → 0.87 ; 1.25 → 0.94 ; 1.50 → 0.96 ; 1.75 → 0.98 ; 2.00 → 1.00
const computeK = (ld: number): number => {
  const table = [
    { ld: 1.0, k: 0.87 },
    { ld: 1.25, k: 0.94 },
    { ld: 1.5, k: 0.96 },
    { ld: 1.75, k: 0.98 },
    { ld: 2.0, k: 1.0 },
  ];
  if (ld <= 1.0) return 0.87;
  if (ld >= 2.0) return 1.0;
  for (let i = 0; i < table.length - 1; i++) {
    const a = table[i], b = table[i + 1];
    if (ld >= a.ld && ld <= b.ld) {
      const t = (ld - a.ld) / (b.ld - a.ld);
      return a.k + t * (b.k - a.k);
    }
  }
  return 1.0;
};

const computeCarotte = (c: CarotteResult): CarotteResult => {
  const u = { ...c };
  const L = parseFloat(u.hauteur_L);
  const D = parseFloat(u.diametre_D);
  const P = parseFloat(u.poids);
  const F = parseFloat(u.charge);

  // L/D
  if (!isNaN(L) && !isNaN(D) && D > 0) {
    const ld = L / D;
    u.elancement = ld.toFixed(2);
    u.k_ld = computeK(ld).toFixed(3);
  } else {
    u.elancement = "";
    u.k_ld = "";
  }

  // Volume m³ et section mm²
  let volume_m3 = NaN;
  let section_mm2 = NaN;
  if (!isNaN(D) && D > 0) {
    section_mm2 = (Math.PI * D * D) / 4;
    u.section = section_mm2.toFixed(2);
    if (!isNaN(L) && L > 0) {
      volume_m3 = (Math.PI * (D / 2) ** 2 * L) / 1e9; // mm³ → m³
      u.volume = volume_m3.toExponential(3);
    }
  }

  // Masse volumique t/m³ = (kg/m³) / 1000
  if (!isNaN(P) && !isNaN(volume_m3) && volume_m3 > 0) {
    u.masse_volumique = (P / volume_m3 / 1000).toFixed(3);
  }

  // Résistance MPa = F(kN)*1000 / Section(mm²)
  if (!isNaN(F) && !isNaN(section_mm2) && section_mm2 > 0) {
    const rc = (F * 1000) / section_mm2;
    u.resistance = rc.toFixed(2);
    const k = parseFloat(u.k_ld);
    if (!isNaN(k)) {
      u.resistance_corrigee = (rc * k).toFixed(2);
    }
  }

  return u;
};

const CarottageDataEntry = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const basePath = "/essais/beton/destructif/carottage";
  const { data: echantillon, isLoading } = useEchantillonCarottage(id || "");
  const updateMutation = useUpdateEchantillonCarottage();

  const [elements, setElements] = useState<ElementTest[]>([
    { element_coule: "", carottes: [emptyCarotte()] },
  ]);
  const [dateEssai, setDateEssai] = useState("");

  useEffect(() => {
    if (!echantillon) return;
    if (echantillon.date_essai) setDateEssai(echantillon.date_essai);
    const r = echantillon.resultats as any;
    if (r) {
      if (Array.isArray(r?.elements)) {
        // re-compute to ensure derived fields are up to date
        setElements(
          r.elements.map((e: ElementTest) => ({
            ...e,
            carottes: (e.carottes || []).map((c: any) =>
              computeCarotte({ ...emptyCarotte(), ...c })
            ),
          })),
        );
      } else if (Array.isArray(r)) {
        setElements([{ element_coule: "", carottes: (r as any[]).map((c) => computeCarotte({ ...emptyCarotte(), ...c })) }]);
      }
    }
  }, [echantillon]);

  const updateElement = (eIdx: number, field: keyof ElementTest, value: string) => {
    const updated = [...elements];
    (updated[eIdx] as any)[field] = value;
    setElements(updated);
  };

  const updateCarotte = (eIdx: number, cIdx: number, field: keyof CarotteResult, value: string) => {
    const updated = [...elements];
    updated[eIdx].carottes[cIdx] = computeCarotte({ ...updated[eIdx].carottes[cIdx], [field]: value });
    setElements(updated);
  };

  const addCarotte = (eIdx: number) => {
    const updated = [...elements];
    updated[eIdx].carottes = [...updated[eIdx].carottes, emptyCarotte()];
    setElements(updated);
  };

  const removeCarotte = (eIdx: number, cIdx: number) => {
    const updated = [...elements];
    updated[eIdx].carottes = updated[eIdx].carottes.filter((_, i) => i !== cIdx);
    setElements(updated);
  };

  const addElement = () => {
    setElements([...elements, { element_coule: "", carottes: [emptyCarotte()] }]);
  };

  const removeElement = (eIdx: number) => {
    setElements(elements.filter((_, i) => i !== eIdx));
  };

  // Moyennes globales
  const allCarottes = elements.flatMap((e) => e.carottes);
  const resistances = allCarottes.map((c) => parseFloat(c.resistance)).filter((v) => !isNaN(v) && v > 0);
  const resistancesCorr = allCarottes.map((c) => parseFloat(c.resistance_corrigee)).filter((v) => !isNaN(v) && v > 0);
  const rcMoyenne = resistances.length > 0 ? resistances.reduce((a, b) => a + b, 0) / resistances.length : 0;
  const rcMoyenneCorr = resistancesCorr.length > 0 ? resistancesCorr.reduce((a, b) => a + b, 0) / resistancesCorr.length : 0;

  const handleSave = async () => {
    if (!id) return;
    try {
      const flat = elements.flatMap((e) => e.carottes);
      await updateMutation.mutateAsync({
        id,
        date_essai: dateEssai || null,
        resultats: {
          elements,
          carottes: flat,
          rc_moyenne: rcMoyenne > 0 ? Number(rcMoyenne.toFixed(2)) : null,
          rc_moyenne_corrigee: rcMoyenneCorr > 0 ? Number(rcMoyenneCorr.toFixed(2)) : null,
        } as unknown as Json,
        statut: "termine",
      });
      toast.success("Données enregistrées avec succès");
      navigate(`${basePath}/${id}`);
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!echantillon) {
    return <div className="text-center py-12 text-muted-foreground">Échantillon non trouvé</div>;
  }

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb
        items={[
          { label: "Béton", path: "/essais/beton" },
          { label: "Destructif", path: "/essais/beton/destructif" },
          { label: "Carottage", path: basePath },
          { label: `CR-${String(echantillon.numero).padStart(3, "0")}`, path: `${basePath}/${id}` },
          { label: "Saisie" },
        ]}
      />

      <div className="flex items-start gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(`${basePath}/${id}`)}
          className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Saisie <span className="text-primary text-glow">Carottage</span> — CR-{String(echantillon.numero).padStart(3, "0")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {echantillon.clients?.nom ?? "—"} • {echantillon.chantiers?.nom ?? "—"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Date de l'essai</Label>
            <Input type="date" value={dateEssai} onChange={(e) => setDateEssai(e.target.value)} />
          </div>
        </div>

        {elements.map((elem, eIdx) => (
          <div key={eIdx} className="space-y-4">
            {eIdx > 0 && <div className="border-t border-border" />}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Élément {eIdx + 1}</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => addCarotte(eIdx)} className="flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  Ajouter une carotte
                </Button>
                {elements.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeElement(eIdx)}
                    className="flex items-center gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Élément coulé</Label>
                <Input
                  placeholder="Ex: Poteau, Dalle, Poutre, Voile..."
                  value={elem.element_coule}
                  onChange={(e) => updateElement(eIdx, "element_coule", e.target.value)}
                />
              </div>
            </div>

            {/* Tableau de saisie */}
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="p-2 text-left font-semibold">Référence</th>
                    <th className="p-2 text-left font-semibold">Hauteur L (mm)</th>
                    <th className="p-2 text-left font-semibold">Diamètre D (mm)</th>
                    <th className="p-2 text-center font-semibold">L/D</th>
                    <th className="p-2 text-center font-semibold">K(L/D)</th>
                    <th className="p-2 text-left font-semibold">Poids (kg)</th>
                    <th className="p-2 text-center font-semibold">Volume (m³)</th>
                    <th className="p-2 text-center font-semibold">M. vol. (t/m³)</th>
                    <th className="p-2 text-left font-semibold">Charge (kN)</th>
                    <th className="p-2 text-center font-semibold">Section (mm²)</th>
                    <th className="p-2 text-center font-semibold">Rc (MPa)</th>
                    <th className="p-2 text-center font-semibold">Rc corr. 16×32 (MPa)</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {elem.carottes.map((r, cIdx) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="p-1">
                        <Input className="h-8" value={r.reference} onChange={(e) => updateCarotte(eIdx, cIdx, "reference", e.target.value)} placeholder="C1" />
                      </td>
                      <td className="p-1">
                        <Input className="h-8" type="number" value={r.hauteur_L} onChange={(e) => updateCarotte(eIdx, cIdx, "hauteur_L", e.target.value)} />
                      </td>
                      <td className="p-1">
                        <Input className="h-8" type="number" value={r.diametre_D} onChange={(e) => updateCarotte(eIdx, cIdx, "diametre_D", e.target.value)} />
                      </td>
                      <td className="p-1 text-center text-muted-foreground">{r.elancement || "-"}</td>
                      <td className="p-1 text-center text-muted-foreground">{r.k_ld || "-"}</td>
                      <td className="p-1">
                        <Input className="h-8" type="number" value={r.poids} onChange={(e) => updateCarotte(eIdx, cIdx, "poids", e.target.value)} />
                      </td>
                      <td className="p-1 text-center text-muted-foreground">{r.volume || "-"}</td>
                      <td className="p-1 text-center text-muted-foreground">{r.masse_volumique || "-"}</td>
                      <td className="p-1">
                        <Input className="h-8" type="number" value={r.charge} onChange={(e) => updateCarotte(eIdx, cIdx, "charge", e.target.value)} />
                      </td>
                      <td className="p-1 text-center text-muted-foreground">{r.section || "-"}</td>
                      <td className="p-1 text-center font-medium text-primary">{r.resistance || "-"}</td>
                      <td className="p-1 text-center font-semibold text-primary">{r.resistance_corrigee || "-"}</td>
                      <td className="p-1">
                        {elem.carottes.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeCarotte(eIdx, cIdx)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          onClick={addElement}
          className="w-full flex items-center justify-center gap-2 border-dashed border-primary/40 text-primary hover:bg-primary/5"
        >
          <Plus className="h-4 w-4" />
          Ajouter un élément
        </Button>

        <div className="border-t border-border pt-6">
          <h2 className="text-lg font-semibold mb-4">Résultats calculés</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-border p-4 text-center">
              <span className="text-sm text-muted-foreground">Nb de carottes</span>
              <p className="text-2xl font-bold">{resistances.length}</p>
            </div>
            <div className="rounded-lg bg-primary/10 border border-primary/30 p-4 text-center">
              <span className="text-sm text-muted-foreground">Rc moyenne</span>
              <p className="text-2xl font-bold text-primary">{rcMoyenne > 0 ? `${rcMoyenne.toFixed(2)} MPa` : "-"}</p>
            </div>
            <div className="rounded-lg bg-primary/15 border border-primary/40 p-4 text-center">
              <span className="text-sm text-muted-foreground">Rc moyenne corrigée L/D (16×32)</span>
              <p className="text-2xl font-bold text-primary">{rcMoyenneCorr > 0 ? `${rcMoyenneCorr.toFixed(2)} MPa` : "-"}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            * Section = π·D²/4 (mm²) · Volume = π·(D/2)²·L (m³) · Rc = F(kN)·1000/Section · K(L/D) interpolé selon NF P18-418 (1.00→0.87 ; 1.25→0.94 ; 1.50→0.96 ; 1.75→0.98 ; 2.00→1.00).
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => navigate(`${basePath}/${id}`)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="flex items-center gap-2">
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CarottageDataEntry;
