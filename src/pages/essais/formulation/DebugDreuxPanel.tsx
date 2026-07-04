/**
 * Debug Dreux-Gorisse — Panneau de transparence du moteur de calcul.
 *
 * Ce composant N'EXÉCUTE AUCUN calcul propre : il ne fait que LIRE et AFFICHER
 * les valeurs intermédiaires déjà produites par `calculateMixDesign` (et
 * éventuellement par le moteur graphique `gravelSplit` en lecture seule).
 *
 * Objectif : permettre au laboratoire de vérifier manuellement chaque étape
 * du moteur avant validation définitive.
 *
 * Aucun calcul, aucune formule, aucun algorithme du moteur n'est modifié.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Bug, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import type {
  CalculationInputs,
  CalculationResult,
} from "./dreuxGorisseCalculation";
import { calculateXA } from "./engine/pointAxAbscissa";

interface DebugDreuxPanelProps {
  inputs: CalculationInputs;
  result: CalculationResult;
}

function fmt(n: number | null | undefined, digits = 3): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

function Row({
  label,
  formula,
  values,
  result,
  unit,
}: {
  label: string;
  formula?: string;
  values?: string;
  result: string;
  unit?: string;
}) {
  return (
    <div className="grid grid-cols-12 gap-2 py-1.5 text-xs border-b border-border/40 last:border-0">
      <div className="col-span-3 font-medium text-foreground">{label}</div>
      <div className="col-span-4 font-mono text-muted-foreground">{formula ?? "—"}</div>
      <div className="col-span-3 font-mono text-muted-foreground">{values ?? "—"}</div>
      <div className="col-span-2 font-mono font-semibold text-right text-foreground">
        {result} {unit && <span className="text-muted-foreground font-normal">{unit}</span>}
      </div>
    </div>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {ok ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
      )}
      <span className={ok ? "text-foreground" : "text-destructive font-medium"}>{label}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground border-b border-border/60 pb-1 mb-1">
        {title}
      </div>
      {children}
    </div>
  );
}

export default function DebugDreuxPanel({ inputs, result }: DebugDreuxPanelProps) {
  const {
    eau,
    ciment,
    ratioGS,
    airOcclus,
    coeffGranulaire,
    coeffCompacite,
    densiteCiment,
    mfCible,
    granulats,
  } = inputs;

  const dCim = densiteCiment && densiteCiment > 0 ? densiteCiment : 3110;

  const { volumes, moduleFinesse, pointA, dMaxReel, masses, volumeErrors, warnings, physicalChecks, convergenceReport, curveQuality, gravelSplit } =
    result;

  const activeSables = granulats.filter(g => g.active && g.isSable);
  const activeGraviers = granulats.filter(g => g.active && !g.isSable);

  // --- Étape 8/9 : Point A + OAB (équations affichées en log10 d) -----------
  const O = { x: Math.log10(0.08), y: 0 };
  const A = { x: Math.log10(pointA.dA), y: pointA.pA };
  const B = { x: Math.log10(dMaxReel), y: 100 };
  const slopeOA = (A.y - O.y) / (A.x - O.x);
  const slopeAB = (B.y - A.y) / (B.x - A.x);

  // Phase 6 — Lignes de partage : LECTURE PURE de result.gravelSplit (moteur).
  // Aucun splitGravels local, aucun recalcul. Le Debug n'est qu'un afficheur.

  // --- Contrôles -----------------------------------------------------------
  const sumVol = volumes.eau + volumes.ciment + volumes.air + volumes.granulatsTotal;
  const sumMasses = Object.values(masses).reduce((s, v) => s + v, 0);
  const allPositive = Object.values(masses).every(m => m >= 0);
  const sumFractionVol = Object.values(volumes.detail).reduce((s, v) => s + v, 0);

  return (
    <Card className="border-2 border-amber-500/40 bg-amber-50/30 dark:bg-amber-950/10">
      <CardContent className="p-0">
        <Accordion type="single" collapsible>
          <AccordionItem value="debug" className="border-0">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <Bug className="w-5 h-5 text-amber-600" />
                <div className="text-left">
                  <div className="font-bold text-foreground">Debug Dreux-Gorisse — Panneau Laboratoire</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    Transparence totale du moteur — aucune valeur modifiée. Replié par défaut.
                  </div>
                </div>
                <Badge variant="outline" className="ml-3 text-[10px]">LECTURE SEULE</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 space-y-5">

              {/* En-tête : légende colonnes */}
              <div className="grid grid-cols-12 gap-2 text-[10px] uppercase tracking-wide text-muted-foreground border-b pb-1">
                <div className="col-span-3">Étape / Grandeur</div>
                <div className="col-span-4">Formule</div>
                <div className="col-span-3">Valeurs</div>
                <div className="col-span-2 text-right">Résultat</div>
              </div>

              {/* ÉTAPE 1 : Données utilisateur */}
              <Section title="Étape 1 — Lecture des données utilisateur">
                <Row label="Eau" formula="entrée utilisateur" values="—" result={fmt(eau, 1)} unit="kg/m³" />
                <Row label="Ciment" formula="entrée utilisateur" values="—" result={fmt(ciment, 1)} unit="kg/m³" />
                <Row label="Densité ciment" formula="entrée ou défaut 3110" values={densiteCiment ? "saisie" : "défaut"} result={fmt(dCim, 0)} unit="kg/m³" />
                <Row label="G/S" formula="entrée manuelle (jamais modifié)" values="—" result={fmt(ratioGS, 3)} unit="" />
                <Row label="Coef. granulaire G'" formula="K" values="—" result={fmt(coeffGranulaire, 3)} unit="" />
                <Row label="Coef. compacité γ" formula="entrée" values="—" result={fmt(coeffCompacite, 3)} unit="" />
                <Row label="Air occlus" formula="entrée" values="—" result={fmt(airOcclus, 1)} unit="L/m³" />
                <Row label="MF cible" formula="entrée (optionnel)" values="—" result={fmt(mfCible, 2)} unit="" />
                <Row label="Granulats actifs" formula="filtrage active=true" values={`${activeSables.length} sable(s) / ${activeGraviers.length} gravier(s)`} result={`${activeSables.length + activeGraviers.length}`} unit="" />
              </Section>

              {/* ÉTAPE 2-4 : Volumes */}
              <Section title="Étapes 2 → 4 — Calcul des volumes (m³)">
                <Row label="Ve (eau)" formula="Eau / 1000" values={`${fmt(eau, 1)} / 1000`} result={fmt(volumes.eau, 4)} unit="m³" />
                <Row label="Vc (ciment)" formula="Ciment / ρciment" values={`${fmt(ciment, 1)} / ${fmt(dCim, 0)}`} result={fmt(volumes.ciment, 4)} unit="m³" />
                <Row label="Vair" formula="airOcclus / 1000" values={`${fmt(airOcclus, 1)} / 1000`} result={fmt(volumes.air, 4)} unit="m³" />
                <Row label="Vgranulats" formula="1 − (Ve + Vc + Vair)" values={`1 − ${fmt(volumes.eau + volumes.ciment + volumes.air, 4)}`} result={fmt(volumes.granulatsTotal, 4)} unit="m³" />
              </Section>

              {/* ÉTAPE 5-6 : Vsable / Vgravier */}
              <Section title="Étapes 5 → 6 — Répartition sable / gravier">
                <Row label="Vsable" formula="Vgranulats / (1 + G/S)" values={`${fmt(volumes.granulatsTotal, 4)} / (1 + ${fmt(ratioGS, 3)})`} result={fmt(volumes.sable, 4)} unit="m³" />
                <Row label="Vgravier" formula="Vgranulats − Vsable" values={`${fmt(volumes.granulatsTotal, 4)} − ${fmt(volumes.sable, 4)}`} result={fmt(volumes.gravier, 4)} unit="m³" />
              </Section>

              {/* ÉTAPE 7 : Répartition des sables */}
              <Section title="Étape 7 — Répartition des sables">
                {activeSables.length === 0 && <div className="text-xs text-muted-foreground py-2">Aucun sable actif.</div>}
                {activeSables.map(s => {
                  const v = volumes.detail[s.key] ?? 0;
                  const m = masses[s.key] ?? 0;
                  const mf = moduleFinesse.perSand[s.key];
                  const pct = volumes.sable > 0 ? (v / volumes.sable) * 100 : 0;
                  return (
                    <Row
                      key={s.key}
                      label={s.label}
                      formula="V × ρ"
                      values={`MF=${fmt(mf, 2)} • ρ=${fmt(s.densite, 0)} • ${fmt(pct, 1)}%`}
                      result={`${fmt(v, 4)} m³ → ${fmt(m, 1)}`}
                      unit="kg"
                    />
                  );
                })}
                <Row
                  label="MF mélange"
                  formula="Σ (MFᵢ × Vᵢ) / ΣVᵢ"
                  values={`MF cible = ${fmt(mfCible, 2)}`}
                  result={fmt(moduleFinesse.melange, 2)}
                  unit=""
                />
              </Section>

              {/* ÉTAPE 8-9 : Point A et OAB */}
              <Section title="Étapes 8 → 9 — Point A et courbe de référence OAB">
                {(() => {
                  const xaInfo = calculateXA(dMaxReel);
                  const ancienXA = dMaxReel / 2;
                  const ecart = pointA.dA - ancienXA;
                  return (
                    <>
                      <Row label="Dmax réel" formula="max(Dmax granulats actifs)" values="—" result={fmt(dMaxReel, 1)} unit="mm" />
                      <Row label="Module(Dmax)" formula="sieveToModule(Dmax)" values="—" result={fmt(xaInfo.moduleDmax, 2)} unit="" />
                      <Row label="Module(XA)" formula={dMaxReel <= 20 ? "sieveToModule(Dmax/2)" : "(Module(Dmax) + 38) / 2"} values="—" result={fmt(xaInfo.moduleXA, 2)} unit="" />
                      <Row label="XA (nouveau)" formula="règle Dreux-Gorisse unique" values={xaInfo.method} result={fmt(pointA.dA, 2)} unit="mm" />
                      <Row label="XA (ancien = Dmax/2)" formula="ancienne règle (supprimée)" values={`${fmt(dMaxReel, 1)} / 2`} result={fmt(ancienXA, 2)} unit="mm" />
                      <Row label="Écart XA nouveau − ancien" formula="XA_new − Dmax/2" values={dMaxReel <= 20 ? "identique par définition" : "bascule module AFNOR"} result={fmt(ecart, 3)} unit="mm" />
                      <Row label="Méthode utilisée" formula={dMaxReel <= 20 ? "Cas 1 (Dmax ≤ 20)" : "Cas 2 (Dmax > 20, module AFNOR)"} values="—" result={dMaxReel <= 20 ? "Dmax/2" : "Module AFNOR"} unit="" />
                      <Row label="pA (moteur principal)" formula={dMaxReel <= 20 ? "50 − √Dmax + K" : "38 + 12·G' + 4·(MF−2), borné [38,50]"} values={`G'=${fmt(coeffGranulaire, 3)} • MF=${fmt(moduleFinesse.melange, 2)}`} result={fmt(pointA.pA, 2)} unit="%" />
                      <Row label="O (origine)" formula="(log₁₀ 0.08, 0)" values={`log₁₀(0.08) = ${fmt(O.x, 4)}`} result={`(${fmt(O.x, 4)}, 0)`} unit="" />
                      <Row label="A" formula="(log₁₀(XA), pA)" values={`log₁₀(${fmt(pointA.dA, 2)})`} result={`(${fmt(A.x, 4)}, ${fmt(A.y, 2)})`} unit="" />
                      <Row label="B" formula="(log₁₀(Dmax), 100)" values={`log₁₀(${fmt(dMaxReel, 1)})`} result={`(${fmt(B.x, 4)}, 100)`} unit="" />
                      <Row label="Pente OA" formula="(pA − 0) / (xA − xO)" values={`${fmt(A.y, 2)} / ${fmt(A.x - O.x, 4)}`} result={fmt(slopeOA, 3)} unit="" />
                      <Row label="Pente AB" formula="(100 − pA) / (xB − xA)" values={`${fmt(100 - A.y, 2)} / ${fmt(B.x - A.x, 4)}`} result={fmt(slopeAB, 3)} unit="" />
                    </>
                  );
                })()}
              </Section>

              {/* ÉTAPES 10-12 : Lignes de partage (LECTURE PURE du moteur) */}
              <Section title="Étapes 10 → 12 — Lignes de partage 95/5 et intersections OAB (lecture de result.gravelSplit)">
                {gravelSplit.partitionLines.length === 0 && (
                  <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-100/40 dark:bg-amber-900/20 p-2 rounded">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>Méthode graphique non applicable ({activeGraviers.length} gravillon(s) actif(s)).</span>
                  </div>
                )}
                {gravelSplit.partitionLines.map((line, i) => (
                  <div key={i} className="text-xs space-y-0.5 border-l-2 border-amber-400 pl-2 my-2">
                    <div className="font-medium">{line.pair}</div>
                    <div className="font-mono text-muted-foreground">
                      P95 = ({fmt(Math.log10(line.from.d_mm), 4)}, {fmt(line.from.y_pct, 1)}) → d95 = {fmt(line.from.d_mm, 3)} mm
                    </div>
                    <div className="font-mono text-muted-foreground">
                      P05 = ({fmt(Math.log10(line.to.d_mm), 4)}, {fmt(line.to.y_pct, 1)}) → d05 = {fmt(line.to.d_mm, 3)} mm
                    </div>
                    <div className="font-mono text-muted-foreground">
                      Intersection OAB = ({fmt(Math.log10(line.intersection.d_mm), 4)}, {fmt(line.intersection.y_pct, 2)}) → ordonnée retenue = <span className="font-bold text-foreground">{fmt(line.intersection.y_pct, 2)} %</span>
                    </div>
                  </div>
                ))}
                {gravelSplit.proportions.length > 0 && (
                  <div className="text-[10px] text-muted-foreground italic mt-2">
                    Proportions moteur : {gravelSplit.proportions.map(p => `${p.label} = ${fmt(p.pct, 2)}%`).join(" · ")}
                  </div>
                )}
                {gravelSplit.warnings.map((w, i) => (
                  <div key={i} className="text-[10px] text-amber-700 dark:text-amber-400">⚠ {w}</div>
                ))}
              </Section>

              {/* ÉTAPE 13-14 : Volumes et masses des fractions */}
              <Section title="Étapes 13 → 14 — Volumes et masses finales">
                {[...activeSables, ...activeGraviers].map(g => {
                  const v = volumes.detail[g.key] ?? 0;
                  const m = masses[g.key] ?? 0;
                  return (
                    <Row
                      key={g.key}
                      label={g.label}
                      formula="m = V × ρ"
                      values={`V=${fmt(v, 4)} m³ • ρ=${fmt(g.densite, 0)} kg/m³`}
                      result={fmt(m, 1)}
                      unit="kg/m³"
                    />
                  );
                })}
                <Row label="Eau" formula="entrée" values="—" result={fmt(eau, 1)} unit="kg/m³" />
                <Row label="Ciment" formula="entrée" values="—" result={fmt(ciment, 1)} unit="kg/m³" />
                <Row label="Σ masses (densité théorique du béton)" formula="Σ (mᵢ) + eau + ciment" values={`fractions = ${fmt(Object.values(masses).reduce((s, v) => s + v, 0), 1)}`} result={fmt(sumMasses + eau + ciment, 1)} unit="kg/m³" />
              </Section>

              {/* Contrôles */}
              <Section title="Contrôles automatiques">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1.5 gap-x-4">
                  <Check ok={Math.abs(sumVol - 1.0) < 0.001} label={`Bilan volumique : Ve + Vc + Vair + Vgranulats = ${fmt(sumVol, 4)} m³ (cible 1.000)`} />
                  <Check ok={Math.abs(sumFractionVol - volumes.granulatsTotal) < 0.01} label={`Σ Vfractions = ${fmt(sumFractionVol, 4)} ≈ Vgranulats = ${fmt(volumes.granulatsTotal, 4)} m³`} />
                  <Check ok={allPositive} label="Toutes les masses sont positives ou nulles" />
                  <Check ok={volumes.sable > 0 && volumes.gravier >= 0} label={`Vsable = ${fmt(volumes.sable, 4)} m³ • Vgravier = ${fmt(volumes.gravier, 4)} m³`} />
                  {gravelSplit.out && (
                    <Check
                      ok={Math.abs(gravelSplit.out.proportions.reduce((s, p) => s + p.pct, 0) - 100) < 1e-6}
                      label={`Σ proportions graphiques = ${fmt(gravelSplit.out.proportions.reduce((s, p) => s + p.pct, 0), 4)} %`}
                    />
                  )}
                  <Check ok={volumeErrors.length === 0} label={volumeErrors.length === 0 ? "Aucune incohérence détectée par le moteur" : `${volumeErrors.length} incohérence(s) — voir détails`} />
                </div>
                {volumeErrors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {volumeErrors.map((e, i) => (
                      <div key={i} className="text-xs text-destructive flex items-start gap-1">
                        <XCircle className="w-3 h-3 mt-0.5 shrink-0" /> {e}
                      </div>
                    ))}
                  </div>
                )}
                {warnings && warnings.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {warnings.map((w, i) => (
                      <div key={i} className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1">
                        <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> {w}
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* Diagnostics complémentaires */}
              {(convergenceReport || curveQuality || physicalChecks) && (
                <Section title="Diagnostics moteur (informatifs)">
                  {convergenceReport && (
                    <>
                      <Row label="Itérations MF" formula="boucle de convergence" values={`MF init = ${fmt(convergenceReport.mfInitial, 2)} → final = ${fmt(convergenceReport.mfFinal, 2)}`} result={`${convergenceReport.iterations}`} unit="" />
                      <Row label="Δ MF final" formula="|MFn − MFn-1|" values="—" result={fmt(convergenceReport.mfDelta, 4)} unit="" />
                      <Row label="Durée calcul" formula="performance.now()" values="—" result={fmt(convergenceReport.durationMs, 2)} unit="ms" />
                    </>
                  )}
                  {curveQuality && (
                    <>
                      <Row label="RMSE courbe mélange" formula="√(Σ(mix − ref)² / n)" values={`grade = ${curveQuality.grade}`} result={fmt(curveQuality.rmse, 2)} unit="%" />
                      <Row label="Écart max courbe" formula="max |mix − ref|" values="—" result={fmt(curveQuality.maxDeviation, 2)} unit="%" />
                      <Row label="Contrôle Point A" formula="mix(dA) vs pA" values={`mix=${fmt(curveQuality.pointACheck.mix, 2)} • ref=${fmt(curveQuality.pointACheck.ref, 2)}`} result={fmt(curveQuality.pointACheck.deviation, 2)} unit="%" />
                    </>
                  )}
                  {physicalChecks && (
                    <>
                      <Row label="Masse totale béton" formula="eau + ciment + Σ granulats" values="—" result={fmt(physicalChecks.masseTotale, 1)} unit="kg/m³" />
                      <Row label="Volume pâte" formula="Ve + Vc + Vadjuvant" values="—" result={fmt(physicalChecks.volumePate, 4)} unit="m³" />
                      <Row label="Ratio pâte / granulats" formula="Vpâte / Vgranulats" values="—" result={fmt(physicalChecks.ratioPateGranulats, 3)} unit="" />
                    </>
                  )}
                </Section>
              )}

              <div className="text-[10px] text-muted-foreground italic border-t pt-2">
                Ce panneau n'effectue aucun calcul : il lit uniquement les valeurs produites par <code>calculateMixDesign</code> et, pour les lignes de partage, invoque le moteur graphique <code>splitGravels</code> en lecture seule. Les algorithmes, formules et résultats du moteur principal restent strictement inchangés.
              </div>

            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
