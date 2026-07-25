import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Save, ShieldCheck, Info } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { useEchantillonCarottage } from "@/hooks/useEchantillonsCarottage";
import {
  useEvaluationsNormatives,
  useCreateEvaluationNormative,
} from "@/hooks/useEvaluationsNormativesCarottage";
import {
  OBJECTIFS,
  NORMES,
  CLASSES_BETON_EVAL,
  MOTIFS_EXCLUSION,
  VERDICT_LABELS,
  STATUT_LABELS,
  evaluateNormative,
  getNorme,
  getObjectif,
  getProcedure,
  type CarotteEvaluee,
  type ObjectifCode,
  type StatutCarotte,
} from "@/lib/essais/normativeCoreEvaluation";
import type { Json } from "@/integrations/supabase/types";

const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return isFinite(n) ? n : null;
};

const fmt = (v: number | null | undefined, d = 2) =>
  v === null || v === undefined || !isFinite(v) ? "—" : v.toFixed(d);

const CarottageEvaluationNormative = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const basePath = "/essais/beton/destructif/carottage";
  const { data: echantillon, isLoading } = useEchantillonCarottage(id || "");
  const { data: historique } = useEvaluationsNormatives(id || "");
  const createMutation = useCreateEvaluationNormative();

  const [objectif, setObjectif] = useState<ObjectifCode | "">("");
  const [normeCode, setNormeCode] = useState<string>("");
  const [procedureCode, setProcedureCode] = useState<string>("");
  const [classeBeton, setClasseBeton] = useState<string>("");
  const [dmax, setDmax] = useState<string>("");
  const [carottes, setCarottes] = useState<CarotteEvaluee[]>([]);

  // ── Récupération des résultats VALIDÉS du Mode A (aucun recalcul) ──
  useEffect(() => {
    if (!echantillon) return;
    const r = echantillon.resultats as Record<string, unknown> | null;
    if (echantillon.classe_resistance) setClasseBeton(echantillon.classe_resistance);
    if (r && typeof r.classe_beton === "string") setClasseBeton(r.classe_beton);
    if (r && r.dmax != null) setDmax(String(r.dmax));

    type RawCarotte = Record<string, unknown>;
    let raw: { element: string; c: RawCarotte }[] = [];
    if (r && Array.isArray(r.elements)) {
      raw = (r.elements as { element_coule?: string; carottes?: RawCarotte[] }[]).flatMap((e) =>
        (e.carottes || []).map((c) => ({ element: e.element_coule || "", c })),
      );
    } else if (r && Array.isArray(r.carottes)) {
      raw = (r.carottes as RawCarotte[]).map((c) => ({ element: "", c }));
    }

    setCarottes(
      raw.map(({ element, c }, i) => ({
        // Priorité 7 — identifiant permanent, jamais l'index
        id: String(c.id ?? `${echantillon.id}-${c.reference ?? i}`),
        reference: String(c.reference || `C${i + 1}`),
        emplacement: element || echantillon.localisation || "—",
        diametre: num(c.diametre_D),
        longueur: num(c.hauteur_L),
        // Priorité 8 — valeurs brutes prioritaires sur les chaînes arrondies
        ld: num(c.ld_raw ?? c.elancement),
        section: num(c.section_mm2_raw ?? c.section),
        charge: num(c.charge),
        fcore: num(c.fcore_raw ?? c.resistance),
        k: num(c.k_raw ?? c.k_ld),
        k_methode: (r?.k_methode as string) ?? null,
        k_methode_version: (r?.k_methode_version as string) ?? null,
        fcorr: num(c.fcorr_raw ?? c.resistance_corrigee),
        masse_volumique: num(c.masse_volumique_raw ?? c.masse_volumique),
        date_essai: echantillon.date_essai ?? null,
        armature: false,
        // Priorité 10 — statut initial « à examiner » : la validation est un acte explicite
        statut: (c.hors_domaine ? "hors_domaine" : "a_examiner") as StatutCarotte,
        motifs_domaine: c.hors_domaine && c.motif_domaine ? [String(c.motif_domaine)] : [],
      })),
    );
  }, [echantillon]);

  const norme = getNorme(normeCode);
  const objectifDef = getObjectif(objectif || null);
  const proceduresDispo = useMemo(
    () => (norme && objectif ? norme.procedures.filter((p) => p.objectifs.includes(objectif)) : []),
    [norme, objectif],
  );

  const setStatut = (cid: string, statut: StatutCarotte) =>
    setCarottes((prev) =>
      prev.map((c) => (c.id === cid ? { ...c, statut, motif_exclusion: statut === "exclue" ? c.motif_exclusion : undefined } : c)),
    );

  const setMotif = (cid: string, motif: string) =>
    setCarottes((prev) => prev.map((c) => (c.id === cid ? { ...c, motif_exclusion: motif } : c)));

  const setArmature = (cid: string, armature: boolean) =>
    setCarottes((prev) => prev.map((c) => (c.id === cid ? { ...c, armature } : c)));

  const resultat = useMemo(() => {
    if (!objectif || !normeCode || !procedureCode) return null;
    return evaluateNormative({
      objectif: objectif as ObjectifCode,
      normeCode,
      procedureCode,
      classeBeton: classeBeton || null,
      dmax: num(dmax),
      carottes,
    });
  }, [objectif, normeCode, procedureCode, classeBeton, dmax, carottes]);

  const exclusionsSansMotif = carottes.some((c) => c.statut === "exclue" && !c.motif_exclusion);


  const handleSave = async () => {
    if (!id || !resultat || !objectif) return;
    if (exclusionsSansMotif) {
      toast.error("Chaque carotte exclue doit être justifiée");
      return;
    }
    const procedure = getProcedure(normeCode, procedureCode);
    try {
      await createMutation.mutateAsync({
        echantillon_id: id,
        reference: echantillon ? `CR-${String(echantillon.numero).padStart(3, "0")}` : null,
        objectif,
        objectif_label: OBJECTIFS.find((o) => o.code === objectif)?.label ?? null,
        norme_code: normeCode,
        norme_nom: norme?.nom ?? null,
        norme_version: norme?.version ?? null,
        norme_date: norme?.date ?? null,
        procedure_code: procedureCode,
        procedure_label: procedure ? `${procedure.label} — ${procedure.clause}` : null,
        classe_beton: classeBeton || null,
        fck_cyl: resultat.fckCyl,
        fck_cube: resultat.fckCube,
        // Priorité 6 — archivage intégral des données brutes de chaque carotte (statuts résolus)
        carottes: [
          ...resultat.carottesValides,
          ...resultat.carottesAExaminer,
          ...resultat.carottesHorsDomaine,
          ...resultat.carottesExclues,
        ] as unknown as Json,
        statistiques: {
          ...(resultat.statistiques ?? {}),
          type_analyse: resultat.typeAnalyse,
          estimation_seule: resultat.estimationSeule,
          dmax: num(dmax),
          fck_is: resultat.fckIs,
          fck_is_detail: resultat.fckIsDetail,
          seuil_85: resultat.seuil85,
          seuil_85_detail: resultat.seuil85Detail,
          avertissements: resultat.avertissements,
          donnees_manquantes: resultat.donneesManquantes,
          hors_domaine: resultat.carottesHorsDomaine.map((c) => ({ reference: c.reference, motifs: c.motifs_domaine })),
        } as unknown as Json,
        criteres: resultat.criteres as unknown as Json,
        verdict: resultat.verdict,
        conclusion: resultat.conclusion,
        figee: true,
      });
      toast.success("Évaluation normative enregistrée (figée dans l'historique)");
    } catch {
      toast.error("Erreur lors de l'enregistrement de l'évaluation");
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!echantillon) {
    return <div className="text-center py-12 text-muted-foreground">Échantillon non trouvé</div>;
  }

  const ref = `CR-${String(echantillon.numero).padStart(3, "0")}`;
  const verdictInfo = resultat ? VERDICT_LABELS[resultat.verdict] : null;
  const stats = resultat?.statistiques ?? null;

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb
        items={[
          { label: "Béton", path: "/essais/beton" },
          { label: "Destructif", path: "/essais/beton/destructif" },
          { label: "Carottage", path: basePath },
          { label: ref, path: `${basePath}/${id}` },
          { label: "Évaluation normative" },
        ]}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3 sm:gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(`${basePath}/${id}`)}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50 shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">
              Évaluation <span className="text-primary">normative</span> — {ref}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Mode B — Évaluation de la résistance du béton à partir des résultats de carottage
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={!resultat || createMutation.isPending} className="w-full sm:w-auto">
          {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Enregistrer l'évaluation
        </Button>
      </div>

      {/* ÉTAPE 1 — Objectif */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Étape 1 — Objectif de l'évaluation</h2>
        <Select value={objectif} onValueChange={(v) => { setObjectif(v as ObjectifCode); setProcedureCode(""); }}>
          <SelectTrigger><SelectValue placeholder="Sélectionner l'objectif..." /></SelectTrigger>
          <SelectContent>
            {OBJECTIFS.map((o) => (
              <SelectItem key={o.code} value={o.code}>{o.code} — {o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {objectifDef && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{objectifDef.description}</p>
            <Badge variant="outline" className={objectifDef.mode === "conformite" ? "bg-primary/10 text-primary border-primary/40" : "bg-sky-500/15 text-sky-500 border-sky-500/40"}>
              {objectifDef.mode === "conformite" ? "Analyse de CONFORMITÉ — classe spécifiée obligatoire" : "Analyse d'ESTIMATION — conformité évaluée uniquement si une classe est renseignée"}
            </Badge>
            {objectifDef.classeObligatoire && !classeBeton && (
              <p className="text-sm text-destructive">Classe de béton spécifiée requise pour cet objectif (étape 2).</p>
            )}
          </div>
        )}
      </div>

      {/* ÉTAPE 2 — Norme / procédure */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Étape 2 — Référentiel normatif et procédure</h2>
        <p className="text-xs text-muted-foreground">
          Le référentiel choisi est appliqué seul : aucune formule, aucun seuil ni aucune clause d'une autre version n'est utilisé dans la même évaluation.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Référentiel (norme + version) *</Label>
            <Select value={normeCode} onValueChange={(v) => { setNormeCode(v); setProcedureCode(""); }}>
              <SelectTrigger className={!normeCode ? "border-destructive" : ""}>
                <SelectValue placeholder="Sélectionner le référentiel..." />
              </SelectTrigger>
              <SelectContent>
                {NORMES.map((n) => (
                  <SelectItem key={n.code} value={n.code}>EN 13791 — version {n.version}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Procédure applicable</Label>
            <Select value={procedureCode} onValueChange={setProcedureCode} disabled={!objectif || !normeCode}>
              <SelectTrigger><SelectValue placeholder={!normeCode ? "Choisir d'abord un référentiel" : objectif ? "Sélectionner..." : "Choisir d'abord un objectif"} /></SelectTrigger>
              <SelectContent>
                {proceduresDispo.map((p) => (
                  <SelectItem key={p.code} value={p.code}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>
              Classe de béton spécifiée {objectifDef?.classeObligatoire ? "*" : "(optionnelle)"}
            </Label>
            <Select value={classeBeton} onValueChange={setClasseBeton}>
              <SelectTrigger className={objectifDef?.classeObligatoire && !classeBeton ? "border-destructive" : ""}>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CLASSES_BETON_EVAL).map(([code, v]) => (
                  <SelectItem key={code} value={code}>{code} — fck cyl {v.cyl} / cube {v.cube} MPa</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Dmax du granulat (mm)</Label>
            <Input type="number" value={dmax} onChange={(e) => setDmax(e.target.value)} placeholder="ex. 20" />
            <p className="text-[11px] text-muted-foreground">Contrôle du domaine : Ø carotte ≥ 3 × Dmax.</p>
          </div>
        </div>
        {procedureCode && (
          <p className="text-xs text-muted-foreground flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            {norme?.nom} — version {norme?.version} • Clause(s) : {getProcedure(normeCode, procedureCode)?.clause}
          </p>
        )}
      </div>

      {/* ÉTAPE 3 — Campagne */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Étape 3 — Constitution de la campagne</h2>
        {carottes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun résultat de carotte saisi dans le Mode A pour cette campagne.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-2">Carotte</th>
                  <th className="text-left p-2">Emplacement</th>
                  <th className="text-right p-2">Ø (mm)</th>
                  <th className="text-right p-2">L (mm)</th>
                  <th className="text-right p-2">L/D</th>
                  <th className="text-right p-2">fcore (MPa)</th>
                  <th className="text-right p-2">K</th>
                  <th className="text-right p-2">fcorr 16×32 (MPa)</th>
                  <th className="text-left p-2">Statut</th>
                  <th className="text-left p-2">Justification</th>
                </tr>
              </thead>
              <tbody>
                {carottes.map((c) => (
                  <tr key={c.id} className="border-b border-border/50">
                    <td className="p-2 font-medium">{c.reference}</td>
                    <td className="p-2">{c.emplacement}</td>
                    <td className="p-2 text-right">{fmt(c.diametre, 0)}</td>
                    <td className="p-2 text-right">{fmt(c.longueur, 0)}</td>
                    <td className="p-2 text-right">{fmt(c.ld, 3)}</td>
                    <td className="p-2 text-right">{fmt(c.fcore)}</td>
                    <td className="p-2 text-right">{fmt(c.k, 3)}</td>
                    <td className="p-2 text-right font-semibold">{fmt(c.fcorr)}</td>
                    <td className="p-2">
                      <Select value={c.statut} onValueChange={(v) => setStatut(c.id, v as StatutCarotte)}>
                        <SelectTrigger className="h-8 w-[130px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="valide">Valide</SelectItem>
                          <SelectItem value="a_examiner">À examiner</SelectItem>
                          <SelectItem value="exclue">Exclue</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      {c.statut === "exclue" ? (
                        <div className="flex flex-col gap-1">
                          <Select value={MOTIFS_EXCLUSION.includes(c.motif_exclusion || "") ? c.motif_exclusion : c.motif_exclusion ? "Autre" : ""}
                            onValueChange={(v) => setMotif(c.id, v)}>
                            <SelectTrigger className={`h-8 w-[190px] ${!c.motif_exclusion ? "border-destructive" : ""}`}>
                              <SelectValue placeholder="Motif requis *" />
                            </SelectTrigger>
                            <SelectContent>
                              {MOTIFS_EXCLUSION.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          {c.motif_exclusion === "Autre" && (
                            <Input className="h-8 w-[190px]" placeholder="Préciser..." onChange={(e) => setMotif(c.id, e.target.value)} />
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RÉSULTATS */}
      {resultat && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-6" data-ref="report">
          <div className="text-center">
            <h2 className="text-lg font-bold uppercase">Évaluation normative de la résistance du béton</h2>
            <p className="text-sm text-muted-foreground">
              {echantillon.chantiers?.nom || "—"} • {echantillon.ouvrage || "—"} • {echantillon.partie_ouvrage || "—"} • {ref} •{" "}
              {format(new Date(), "dd/MM/yyyy", { locale: fr })}
            </p>
          </div>

          {/* Identification / procédure */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p><span className="text-muted-foreground">Projet / Client : </span>{echantillon.clients?.nom || "—"}</p>
              <p><span className="text-muted-foreground">Zone : </span>{echantillon.localisation || "—"}</p>
              <p><span className="text-muted-foreground">Classe spécifiée : </span>{classeBeton || "—"}</p>
              <p><span className="text-muted-foreground">fck cylindre / cube : </span>{fmt(resultat.fckCyl, 0)} / {fmt(resultat.fckCube, 0)} MPa</p>
            </div>
            <div className="space-y-1">
              <p><span className="text-muted-foreground">Objectif : </span>{OBJECTIFS.find((o) => o.code === objectif)?.label}</p>
              <p><span className="text-muted-foreground">Norme : </span>{resultat.norme?.code} — version {resultat.norme?.version}</p>
              <p><span className="text-muted-foreground">Méthode : </span>{resultat.procedure?.label}</p>
              <p><span className="text-muted-foreground">Clause(s) : </span>{resultat.procedure?.clause}</p>
            </div>
          </div>

          {/* Niveau 1 */}
          <div>
            <h3 className="font-semibold mb-2">Niveau 1 — Essais individuels</h3>
            <ul className="text-sm space-y-1">
              {resultat.niveau1.map((n) => (
                <li key={n.reference} className="flex flex-wrap gap-2">
                  <span className="font-medium">{n.reference} :</span>
                  <span>{n.statut}</span>
                  <span className="text-muted-foreground">— {n.commentaire}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Niveau 2 */}
          <div>
            <h3 className="font-semibold mb-2">Niveau 2 — Campagne de carottage</h3>
            {stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="rounded-lg border border-border p-3"><p className="text-muted-foreground text-xs">Carottes valides</p><p className="font-semibold">{stats.n}</p></div>
                <div className="rounded-lg border border-border p-3"><p className="text-muted-foreground text-xs">Moyenne</p><p className="font-semibold">{fmt(stats.moyenne)} MPa</p></div>
                <div className="rounded-lg border border-border p-3"><p className="text-muted-foreground text-xs">Minimum</p><p className="font-semibold">{fmt(stats.min)} MPa</p></div>
                <div className="rounded-lg border border-border p-3"><p className="text-muted-foreground text-xs">Maximum</p><p className="font-semibold">{fmt(stats.max)} MPa</p></div>
                <div className="rounded-lg border border-border p-3"><p className="text-muted-foreground text-xs">Médiane</p><p className="font-semibold">{fmt(stats.mediane)} MPa</p></div>
                <div className="rounded-lg border border-border p-3"><p className="text-muted-foreground text-xs">Écart-type</p><p className="font-semibold">{fmt(stats.ecartType)} MPa</p></div>
                <div className="rounded-lg border border-border p-3"><p className="text-muted-foreground text-xs">Coef. variation</p><p className="font-semibold">{fmt(stats.coefVariation, 1)} %</p></div>
                <div className="rounded-lg border border-border p-3"><p className="text-muted-foreground text-xs">Dispersion (étendue)</p><p className="font-semibold">{fmt(stats.etendue)} MPa</p></div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune carotte valide exploitable.</p>
            )}
            {resultat.seuil85 !== null && (
              <p className="mt-3 text-sm font-semibold">
                Seuil de conformité : {resultat.seuil85.toFixed(2)} MPa
                <span className="font-normal text-muted-foreground"> ({resultat.seuil85Detail})</span>
              </p>
            )}
            {resultat.fckIs !== null && (
              <p className="text-sm">
                Résistance caractéristique in situ estimée fck,is = <strong>{resultat.fckIs.toFixed(2)} MPa</strong>
                <span className="text-muted-foreground"> — {resultat.fckIsDetail}</span>
              </p>
            )}
          </div>

          {/* Critères */}
          <div>
            <h3 className="font-semibold mb-2">Critères normatifs appliqués</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left p-2">Critère</th>
                    <th className="text-left p-2">Formule</th>
                    <th className="text-right p-2">Valeur calculée</th>
                    <th className="text-right p-2">Valeur exigée</th>
                    <th className="text-center p-2">Résultat</th>
                    <th className="text-left p-2">Norme / version / clause</th>
                  </tr>
                </thead>
                <tbody>
                  {resultat.criteres.map((c, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="p-2">{c.libelle}</td>
                      <td className="p-2 text-xs">{c.formule}</td>
                      <td className="p-2 text-right">{fmt(c.valeurCalculee)} {c.unite}</td>
                      <td className="p-2 text-right">{c.valeurExigee === null ? "—" : `${c.valeurExigee.toFixed(2)} ${c.unite}`}</td>
                      <td className="p-2 text-center">{c.resultat === "ok" ? "✓" : c.resultat === "ko" ? "✗" : "—"}</td>
                      <td className="p-2 text-xs text-muted-foreground">{c.norme}:{c.version} {c.clause}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Données manquantes */}
          {resultat.donneesManquantes.length > 0 && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
              <p className="font-semibold text-amber-500">Évaluation impossible / données insuffisantes</p>
              <ul className="list-disc pl-5 mt-1">
                {resultat.donneesManquantes.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          )}

          {/* Niveau 3 */}
          <div>
            <h3 className="font-semibold mb-2">Niveau 3 — Évaluation normative</h3>
            {verdictInfo && (
              <Badge variant="outline" className={`text-sm px-3 py-1 ${verdictInfo.className}`}>
                {verdictInfo.emoji} {verdictInfo.label}
              </Badge>
            )}
            <p className="mt-3 text-sm font-semibold uppercase">Conclusion de l'évaluation</p>
            <p className="text-sm">{resultat.conclusion}</p>
          </div>
        </div>
      )}

      {/* Historique / traçabilité */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" /> Historique des évaluations (figées)
        </h2>
        {!historique || historique.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune évaluation normative enregistrée pour cette campagne.</p>
        ) : (
          <div className="space-y-2 text-sm">
            {historique.map((h) => (
              <div key={h.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
                <span>
                  {format(new Date(h.created_at), "dd/MM/yyyy HH:mm", { locale: fr })} • {h.norme_code} {h.norme_version} • Objectif {h.objectif} •{" "}
                  {h.created_by_nom || "—"}
                </span>
                <Badge variant="outline" className={VERDICT_LABELS[(h.verdict as keyof typeof VERDICT_LABELS) || "non_concluant"]?.className}>
                  {VERDICT_LABELS[(h.verdict as keyof typeof VERDICT_LABELS) || "non_concluant"]?.label}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CarottageEvaluationNormative;
