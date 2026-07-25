import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Loader2, Plus, Trash2, Info } from "lucide-react";
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
  masse_volumique: string; // kg/m³
  charge: string;          // kN
  section: string;         // mm²
  resistance: string;      // MPa
  resistance_corrigee: string; // MPa avec K
  // ── Valeurs numériques BRUTES (priorité 8) : aucune troncature ──
  ld_raw?: number | null;
  k_raw?: number | null;
  section_mm2_raw?: number | null;
  volume_m3_raw?: number | null;
  masse_volumique_raw?: number | null;
  fcore_raw?: number | null;
  fcorr_raw?: number | null;
  // ── Domaine d'application (priorités 4 & 5) ──
  hors_domaine?: boolean;
  motif_domaine?: string | null;
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
  ld_raw: null,
  k_raw: null,
  section_mm2_raw: null,
  volume_m3_raw: null,
  masse_volumique_raw: null,
  fcore_raw: null,
  fcorr_raw: null,
  hors_domaine: false,
  motif_domaine: null,
});

// ─────────────────────────────────────────────────────────────
// Référentiel normatif du coefficient d'élancement K(L/D)
// Méthode active : NF P18-418 (interpolation linéaire autorisée)
//
// A-4 — CONTINUITÉ : la table est appliquée telle quelle sur tout
// son domaine, y compris en L/D = 2,00 (K = 1,03). Aucun cas
// particulier « K = 1 si L/D = 2 » n'est appliqué : il créait une
// rupture artificielle de 3 % entre L/D = 1,999 et L/D = 2,000.
//
// A-5 — DOMAINE : la table ne couvre que 1,00 ≤ L/D ≤ 2,00.
// Hors de ce domaine, AUCUNE valeur n'est extrapolée ni « clampée » :
// la carotte est déclarée HORS DOMAINE et aucune fcorr n'est produite.
// ─────────────────────────────────────────────────────────────
const K_METHOD = {
  code: "NF P18-418",
  version: "1989",
  label: "NF P18-418 — Correction d'élancement L/D vers cylindre 16×32",
  allowInterpolation: true,
  ldMin: 1.0,
  ldMax: 2.0,
  table: [
    { ld: 1.0, k: 0.90 },
    { ld: 1.25, k: 0.96 },
    { ld: 1.5, k: 1.00 },
    { ld: 1.75, k: 1.02 },
    { ld: 2.0, k: 1.03 },
  ],
};

/** Retourne K(L/D) ou null si L/D est hors du domaine de la méthode. */
const computeK = (ld: number): number | null => {
  const t = K_METHOD.table;
  if (!isFinite(ld)) return null;
  if (ld < K_METHOD.ldMin - 1e-9 || ld > K_METHOD.ldMax + 1e-9) return null;
  if (ld <= t[0].ld) return t[0].k;
  if (ld >= t[t.length - 1].ld) return t[t.length - 1].k;
  for (let i = 0; i < t.length - 1; i++) {
    const a = t[i], b = t[i + 1];
    if (ld >= a.ld && ld <= b.ld) {
      if (!K_METHOD.allowInterpolation) return a.k;
      const r = (ld - a.ld) / (b.ld - a.ld);
      return a.k + r * (b.k - a.k);
    }
  }
  return null;
};

// Classes béton EN 206 — fck cylindre et fck cube (MPa)
const CLASSES_BETON: Record<string, { cyl: number; cube: number }> = {
  "C12/15": { cyl: 12, cube: 15 },
  "C16/20": { cyl: 16, cube: 20 },
  "C20/25": { cyl: 20, cube: 25 },
  "C25/30": { cyl: 25, cube: 30 },
  "C30/37": { cyl: 30, cube: 37 },
  "C35/45": { cyl: 35, cube: 45 },
  "C40/50": { cyl: 40, cube: 50 },
  "C45/55": { cyl: 45, cube: 55 },
  "C50/60": { cyl: 50, cube: 60 },
};

// Seuils INDICATIFS internes (fraction de fck cyl) — aucune valeur normative.
// Le verdict normatif officiel est produit exclusivement par le Mode B.
const VERDICT_THRESHOLDS = { conforme: 1.0, marginal: 0.9 };

const getVerdict = (fcorr: number, fckCyl: number) => {
  if (!(fcorr > 0) || !(fckCyl > 0)) return null;
  const ratio = fcorr / fckCyl;
  if (ratio >= VERDICT_THRESHOLDS.conforme) return { label: "Au-dessus du seuil indicatif", tone: "ok" as const };
  if (ratio >= VERDICT_THRESHOLDS.marginal) return { label: "À examiner", tone: "warn" as const };
  return { label: "En dessous du seuil indicatif", tone: "ko" as const };
};

const computeCarotte = (c: CarotteResult): CarotteResult => {
  const u = { ...c };
  const L = parseFloat(u.hauteur_L);
  const D = parseFloat(u.diametre_D);
  const P = parseFloat(u.poids);
  const F = parseFloat(u.charge);

  u.hors_domaine = false;
  u.motif_domaine = null;

  // Rapport d'élancement L/D
  let ld = NaN;
  let k: number | null = null;
  if (!isNaN(L) && !isNaN(D) && D > 0) {
    ld = L / D;
    u.elancement = ld.toFixed(3);
    u.ld_raw = ld;
    k = computeK(ld);
    if (k === null) {
      u.k_ld = "";
      u.k_raw = null;
      u.hors_domaine = true;
      u.motif_domaine = `L/D = ${ld.toFixed(3)} hors du domaine de ${K_METHOD.code} (${K_METHOD.ldMin.toFixed(2)} – ${K_METHOD.ldMax.toFixed(2)})`;
    } else {
      u.k_ld = k.toFixed(3);
      u.k_raw = k;
    }
  } else {
    u.elancement = "";
    u.k_ld = "";
    u.ld_raw = null;
    u.k_raw = null;
  }

  // Section (mm²) et volume (m³)
  let volume_m3 = NaN;
  let section_mm2 = NaN;
  if (!isNaN(D) && D > 0) {
    section_mm2 = (Math.PI * D * D) / 4;
    u.section = section_mm2.toFixed(2);
    u.section_mm2_raw = section_mm2;
    if (!isNaN(L) && L > 0) {
      volume_m3 = (Math.PI * (D / 2) ** 2 * L) / 1e9; // mm³ → m³
      u.volume = volume_m3.toExponential(3);
      u.volume_m3_raw = volume_m3;
    }
  } else {
    u.section_mm2_raw = null;
    u.volume_m3_raw = null;
  }

  // Masse volumique (kg/m³) — indépendante de la résistance
  if (!isNaN(P) && !isNaN(volume_m3) && volume_m3 > 0) {
    const rho = P / volume_m3;
    u.masse_volumique = Math.round(rho).toString();
    u.masse_volumique_raw = rho;
  } else {
    u.masse_volumique_raw = null;
  }

  // Résistance brute : fcore = F(N) / A(mm²) = F(kN)·1000 / A → MPa
  if (!isNaN(F) && !isNaN(section_mm2) && section_mm2 > 0) {
    const rc = (F * 1000) / section_mm2;
    u.resistance = rc.toFixed(2);
    u.fcore_raw = rc;
    if (k !== null && k > 0) {
      // Résistance corrigée (référence 16×32) : fcorr = K(L/D) × fcore
      const fcorr = k * rc;
      u.resistance_corrigee = fcorr.toFixed(2);
      u.fcorr_raw = fcorr;
    } else {
      // Hors domaine : aucune résistance corrigée n'est produite (A-5)
      u.resistance_corrigee = "";
      u.fcorr_raw = null;
    }
  } else {
    u.fcore_raw = null;
    u.fcorr_raw = null;
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
  const [classeBeton, setClasseBeton] = useState<string>("");


  useEffect(() => {
    if (!echantillon) return;
    if (echantillon.date_essai) setDateEssai(echantillon.date_essai);
    if (echantillon.classe_resistance) setClasseBeton(echantillon.classe_resistance);
    const r = echantillon.resultats as any;
    if (r) {
      if (r.classe_beton && typeof r.classe_beton === "string") setClasseBeton(r.classe_beton);
      if (Array.isArray(r?.elements)) {
        setElements(
          r.elements.map((e: ElementTest) => ({
            ...e,
            carottes: (e.carottes || []).map((c: any) =>
              // Priorité 7 — identifiant permanent : jamais l'index du tableau
              computeCarotte({ ...emptyCarotte(), ...c, id: c?.id || crypto.randomUUID() })
            ),
          })),
        );
      } else if (Array.isArray(r)) {
        setElements([{ element_coule: "", carottes: (r as any[]).map((c) => computeCarotte({ ...emptyCarotte(), ...c, id: c?.id || crypto.randomUUID() })) }]);
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

  // Moyennes globales — priorité 8 : calculs sur valeurs BRUTES (aucun toFixed intermédiaire)
  const allCarottes = elements.flatMap((e) => e.carottes);
  const resistances = allCarottes
    .map((c) => (c.fcore_raw ?? parseFloat(c.resistance)))
    .filter((v) => typeof v === "number" && isFinite(v) && v > 0) as number[];
  const resistancesCorr = allCarottes
    .map((c) => (c.fcorr_raw ?? parseFloat(c.resistance_corrigee)))
    .filter((v) => typeof v === "number" && isFinite(v) && v > 0) as number[];
  const rcMoyenne = resistances.length > 0 ? resistances.reduce((a, b) => a + b, 0) / resistances.length : 0;
  const rcMoyenneCorr = resistancesCorr.length > 0 ? resistancesCorr.reduce((a, b) => a + b, 0) / resistancesCorr.length : 0;
  const nbHorsDomaine = allCarottes.filter((c) => c.hors_domaine).length;

  const classInfo = classeBeton ? CLASSES_BETON[classeBeton] : null;
  const fckCyl = classInfo?.cyl ?? 0;
  const verdictGlobal = getVerdict(rcMoyenneCorr, fckCyl);

  const handleSave = async () => {
    if (!id) return;
    try {
      const flat = elements.flatMap((e) => e.carottes);
      await updateMutation.mutateAsync({
        id,
        date_essai: dateEssai || null,
        classe_resistance: classeBeton || null,
        resultats: {
          elements,
          carottes: flat,
          rc_moyenne: rcMoyenne > 0 ? rcMoyenne : null,
          rc_moyenne_corrigee: rcMoyenneCorr > 0 ? rcMoyenneCorr : null,
          classe_beton: classeBeton || null,
          fck_cyl: fckCyl || null,
          fck_cube: classInfo?.cube ?? null,
          k_methode: K_METHOD.code,
          k_methode_version: K_METHOD.version,
          k_methode_domaine: { ld_min: K_METHOD.ldMin, ld_max: K_METHOD.ldMax },
          k_methode_table: K_METHOD.table,
          nb_hors_domaine: nbHorsDomaine,
          indication_interne: verdictGlobal?.label ?? null,
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
          <div className="space-y-2">
            <Label>Classe de béton cible</Label>
            <Select value={classeBeton} onValueChange={setClasseBeton}>
              <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>
                {Object.entries(CLASSES_BETON).map(([code, v]) => (
                  <SelectItem key={code} value={code}>{code} — fck cyl {v.cyl} MPa / cube {v.cube} MPa</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {classInfo && (
            <div className="space-y-2">
              <Label>Référence</Label>
              <div className="rounded-md bg-muted/40 border border-border px-3 py-2 text-sm">
                <span className="font-medium">{classeBeton}</span> — fck cylindre <span className="font-semibold text-primary">{classInfo.cyl} MPa</span> · fck cube {classInfo.cube} MPa
              </div>
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
          <span>Correction L/D selon : <span className="font-semibold text-foreground">{K_METHOD.label}</span>. Le coefficient K(L/D) ramène la résistance vers la référence cylindre 16×32 (L/D=2, K=1).</span>
        </div>


        {elements.map((elem, eIdx) => (
          <div key={eIdx} className="space-y-4">
            {eIdx > 0 && <div className="border-t border-border" />}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Élément {eIdx + 1}</h2>
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
                    <th className="p-2 text-center font-semibold">M. vol. (kg/m³)</th>
                    <th className="p-2 text-left font-semibold">Charge (kN)</th>
                    <th className="p-2 text-center font-semibold">Section (mm²)</th>
                    <th className="p-2 text-center font-semibold">fcore Rc (MPa)</th>
                    <th className="p-2 text-center font-semibold">fcorr 16×32 (MPa)</th>
                    <th className="p-2 text-center font-semibold">Indication</th>
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
                      <td className="p-1 text-center font-semibold text-primary">
                        {r.resistance_corrigee || "-"}
                        {r.hors_domaine && (
                          <div className="text-[10px] text-destructive font-normal">🔴 Hors domaine — {r.motif_domaine}</div>
                        )}
                      </td>
                      <td className="p-1 text-center">
                        {(() => {
                          const v = getVerdict(parseFloat(r.resistance_corrigee), fckCyl);
                          if (!v) return <span className="text-muted-foreground">-</span>;
                          const cls = v.tone === "ok" ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                            : v.tone === "warn" ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                            : "bg-destructive/15 text-destructive border-destructive/30";
                          return <Badge variant="outline" className={cls}>{v.label}</Badge>;
                        })()}
                      </td>
                      <td className="p-1">
                        <div className="flex items-center justify-center gap-1">
                          {elem.carottes.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeCarotte(eIdx, cIdx)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => addCarotte(eIdx)} title="Ajouter une carotte">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border p-4 text-center">
              <span className="text-sm text-muted-foreground">Nb de carottes</span>
              <p className="text-2xl font-bold">{resistances.length}</p>
            </div>
            <div className="rounded-lg bg-primary/10 border border-primary/30 p-4 text-center">
              <span className="text-sm text-muted-foreground">fcore moyenne</span>
              <p className="text-2xl font-bold text-primary">{rcMoyenne > 0 ? `${rcMoyenne.toFixed(2)} MPa` : "-"}</p>
            </div>
            <div className="rounded-lg bg-primary/15 border border-primary/40 p-4 text-center">
              <span className="text-sm text-muted-foreground">fcorr moyenne (16×32)</span>
              <p className="text-2xl font-bold text-primary">{rcMoyenneCorr > 0 ? `${rcMoyenneCorr.toFixed(2)} MPa` : "-"}</p>
            </div>
            <div className={`rounded-lg border p-4 text-center ${
              verdictGlobal?.tone === "ok" ? "bg-emerald-500/10 border-emerald-500/40"
              : verdictGlobal?.tone === "warn" ? "bg-amber-500/10 border-amber-500/40"
              : verdictGlobal?.tone === "ko" ? "bg-destructive/10 border-destructive/40"
              : "border-border"
            }`}>
              <span className="text-sm text-muted-foreground">Résultat indicatif {classeBeton ? `(vs fck cyl ${fckCyl} MPa)` : ""}</span>
              <p className={`text-2xl font-bold ${
                verdictGlobal?.tone === "ok" ? "text-emerald-500"
                : verdictGlobal?.tone === "warn" ? "text-amber-500"
                : verdictGlobal?.tone === "ko" ? "text-destructive"
                : "text-muted-foreground"
              }`}>{verdictGlobal?.label ?? "À interpréter"}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Indication interne — ne constitue pas une évaluation normative.</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-3 space-y-1">
            <p>* Section A = π·D²/4 (mm²) · Volume V = π·(D/2)²·L (m³) · Masse volumique ρ = m/V (kg/m³).</p>
            <p>* fcore = F(kN)·1000 / A(mm²) → MPa · fcorr = K(L/D) × fcore · L/D=2 ⇒ K=1 (aucune correction).</p>
            <p>* Correction L/D selon <span className="font-semibold text-foreground">{K_METHOD.code}</span> — interpolation linéaire (1.00→0.90 ; 1.25→0.96 ; 1.50→1.00 ; 1.75→1.02 ; 2.00→1.03).</p>
            <p>* Indication interne — ne constitue pas une évaluation normative : simple comparaison de fcorr à fck cylindre, sans application des règles statistiques d'acceptation de la norme. Le verdict normatif officiel (CONFORME / NON CONFORME / NON CONCLUANT / ESTIMATION) est délivré uniquement par le Mode B — Évaluation normative.</p>
          </div>
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
