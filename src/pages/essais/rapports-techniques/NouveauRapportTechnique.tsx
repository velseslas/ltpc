import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  File as FileIcon,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Building2,
  HardHat,
  FlaskConical,
  Save,
} from "lucide-react";
import { useChantiers } from "@/hooks/useChantiers";
import {
  useRapportCategories,
  useRapportModeles,
  useCreateRapportTechnique,
  useUpdateRapportTechnique,
  useContexteChantier,
  usePiecesJointes,
  useUploadPieceJointe,
  useDeletePieceJointe,
  GRAVITE_LABELS,
  GRAVITE_COLORS,
  type RapportGravite,
  type PieceJointe,
} from "@/hooks/useRapportsTechniques";

const STEPS = [
  { key: "contexte", label: "Contexte", icon: HardHat },
  { key: "categorie", label: "Catégorie", icon: FlaskConical },
  { key: "description", label: "Problème", icon: Sparkles },
  { key: "pieces", label: "Pièces jointes", icon: UploadCloud },
  { key: "recap", label: "Récapitulatif", icon: CheckCircle2 },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

const GRAVITES: RapportGravite[] = ["faible", "moderee", "elevee", "critique"];

export default function NouveauRapportTechnique() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialModeleId = params.get("modele");

  const [step, setStep] = useState<StepKey>("contexte");
  const [showErrors, setShowErrors] = useState(false);
  const [rapportId, setRapportId] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [chantierId, setChantierId] = useState<string | null>(null);
  const [clientNom, setClientNom] = useState("");
  const [entreprise, setEntreprise] = useState("");
  const [projet, setProjet] = useState("");
  const [dateProbleme, setDateProbleme] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [categorieId, setCategorieId] = useState<string | null>(null);
  const [modeleId, setModeleId] = useState<string | null>(initialModeleId);
  const [gravite, setGravite] = useState<RapportGravite>("moderee");
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [materiau, setMateriau] = useState("");

  // Data
  const { data: chantiers = [] } = useChantiers();
  const { data: categories = [] } = useRapportCategories();
  const { data: modeles = [] } = useRapportModeles(categorieId);
  const { data: contexte } = useContexteChantier(chantierId);
  const { data: pieces = [] } = usePiecesJointes(rapportId);
  const createRapport = useCreateRapportTechnique();
  const updateRapport = useUpdateRapportTechnique();
  const uploadPiece = useUploadPieceJointe();
  const deletePiece = useDeletePieceJointe();

  // Auto-populate context when chantier changes
  useEffect(() => {
    if (!contexte) return;
    if (contexte.client_nom) setClientNom(contexte.client_nom);
    if (contexte.entreprise) setEntreprise(contexte.entreprise);
    if (contexte.projet) setProjet(contexte.projet);
  }, [contexte]);

  // Pre-select modele's categorie
  useEffect(() => {
    if (!initialModeleId || categorieId) return;
    // fetch all models to find its category — reuse modeles hook w/ null
  }, [initialModeleId, categorieId]);

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  // Build payload
  const buildPayload = useCallback(() => {
    return {
      titre: titre || null,
      description_probleme: description,
      prompt_utilisateur: description,
      categorie_id: categorieId,
      modele_id: modeleId,
      chantier_id: chantierId,
      client_id: contexte?.client_id ?? null,
      entreprise: entreprise || null,
      projet: projet || null,
      materiau: materiau || null,
      date_probleme: dateProbleme || null,
      gravite,
      statut: "brouillon" as const,
      contexte_auto: contexte
        ? (contexte as unknown as Record<string, unknown>)
        : null,
      metadonnees: {
        step_courant: step,
        version_form: 2,
      },
    };
  }, [titre, description, categorieId, modeleId, chantierId, contexte, entreprise, projet, materiau, dateProbleme, gravite, step]);

  // Save draft (create or update)
  const saveDraft = useCallback(async (silent = false) => {
    if (!description.trim() && !chantierId && !categorieId) return null;
    setIsSaving(true);
    try {
      const payload = buildPayload();
      if (rapportId) {
        await updateRapport.mutateAsync({ id: rapportId, ...payload, last_autosave_at: new Date().toISOString() });
      } else {
        const created = await createRapport.mutateAsync({ ...payload, description_probleme: payload.description_probleme || "(brouillon)" });
        setRapportId(created.id);
      }
      setLastSavedAt(new Date());
      if (!silent) toast({ title: "Brouillon enregistré" });
      return true;
    } catch (e) {
      if (!silent) toast({ title: "Erreur de sauvegarde", description: (e as Error).message, variant: "destructive" });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [buildPayload, rapportId, description, chantierId, categorieId, createRapport, updateRapport]);

  // Autosave every 30s
  const saveDraftRef = useRef(saveDraft);
  saveDraftRef.current = saveDraft;
  useEffect(() => {
    const id = window.setInterval(() => {
      saveDraftRef.current(true);
    }, 30_000);
    return () => window.clearInterval(id);
  }, []);

  // Validation
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!chantierId) e.chantierId = "Sélectionnez un chantier";
    if (!categorieId) e.categorieId = "Choisissez une catégorie";
    if (!description.trim() || description.trim().length < 20)
      e.description = "Décrivez le problème (min. 20 caractères)";
    return e;
  }, [chantierId, categorieId, description]);

  const canGoNext = (): boolean => {
    if (step === "contexte") return !!chantierId;
    if (step === "categorie") return !!categorieId;
    if (step === "description") return description.trim().length >= 20;
    return true;
  };

  const goNext = async () => {
    setShowErrors(true);
    if (!canGoNext()) return;
    setShowErrors(false);
    const idx = STEPS.findIndex((s) => s.key === step);
    // Create draft as soon as we leave step 1
    if (step === "contexte" && !rapportId) {
      await saveDraft(true);
    }
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    const idx = STEPS.findIndex((s) => s.key === step);
    if (idx > 0) setStep(STEPS[idx - 1].key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFinish = async () => {
    setShowErrors(true);
    if (Object.keys(errors).length > 0) {
      toast({ title: "Formulaire incomplet", description: "Corrigez les champs signalés", variant: "destructive" });
      return;
    }
    const ok = await saveDraft(false);
    if (ok && rapportId) navigate(`/essais/rapports-techniques/${rapportId}`);
  };

  // Drag & drop uploader
  const [dragOver, setDragOver] = useState(false);
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!rapportId) {
      const created = await saveDraft(true);
      if (!created) return;
    }
    const targetId = rapportId ?? (await (async () => {
      const created = await saveDraft(true);
      return created ? rapportId : null;
    })());
    if (!targetId) {
      toast({ title: "Enregistrement requis avant l'upload", variant: "destructive" });
      return;
    }
    for (const file of Array.from(files)) {
      try {
        await uploadPiece.mutateAsync({ rapportId: targetId, file });
      } catch (e) {
        toast({ title: `Échec upload ${file.name}`, description: (e as Error).message, variant: "destructive" });
      }
    }
  };

  const errClass = (has: boolean) => (showErrors && has ? "animate-border-blink border-red-500" : "");

  return (
    <div className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: "Essais", path: "/essais" },
          { label: "Assistant IA", path: "/essais/redaction-rapport-technique" },
          { label: "Nouveau rapport" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton to="/essais/redaction-rapport-technique" />
          <div>
            <h1 className="text-2xl font-bold leading-tight">Nouveau rapport technique</h1>
            <p className="text-sm text-muted-foreground">Assistant IA — préparation des données pour analyse automatique</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {isSaving ? (
            <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Sauvegarde…</span>
          ) : lastSavedAt ? (
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Enregistré {lastSavedAt.toLocaleTimeString()}</span>
          ) : (
            <span>Brouillon local</span>
          )}
          <Button size="sm" variant="outline" onClick={() => saveDraft(false)}>
            <Save className="h-4 w-4 mr-1" /> Enregistrer
          </Button>
        </div>
      </div>

      {/* Stepper */}
      <div className="space-y-3">
        <Progress value={progress} className="h-1.5" />
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = s.key === step;
            const done = i < stepIndex;
            return (
              <button
                key={s.key}
                onClick={() => (done || active) && setStep(s.key)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs whitespace-nowrap transition",
                  active && "bg-violet-600 text-white",
                  done && !active && "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200",
                  !done && !active && "bg-muted text-muted-foreground",
                )}
              >
                <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold", active ? "bg-white/20" : "bg-white/60 dark:bg-black/20")}>
                  {done ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                </span>
                <Icon className="h-3.5 w-3.5" />
                <span className="font-medium">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {(() => {
              const Icon = STEPS[stepIndex].icon;
              return <Icon className="h-5 w-5 text-violet-500" />;
            })()}
            Étape {stepIndex + 1} — {STEPS[stepIndex].label}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === "contexte" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Chantier <span className="text-red-500">*</span></Label>
                <Select value={chantierId ?? ""} onValueChange={(v) => setChantierId(v || null)}>
                  <SelectTrigger className={errClass(!chantierId)}>
                    <SelectValue placeholder="Sélectionner un chantier" />
                  </SelectTrigger>
                  <SelectContent>
                    {chantiers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Les informations client, entreprise, projet et matériaux sont récupérées automatiquement.</p>
              </div>

              {contexte && (
                <div className="md:col-span-2">
                  <Alert className="border-violet-200 bg-violet-50 dark:bg-violet-950/30">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                    <AlertDescription className="space-y-1 text-sm">
                      <div className="font-medium text-violet-900 dark:text-violet-200">Contexte récupéré automatiquement</div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {contexte.client_nom && <Badge variant="secondary"><Building2 className="h-3 w-3 mr-1" />{contexte.client_nom}</Badge>}
                        {contexte.formulations.length > 0 && <Badge variant="secondary">{contexte.formulations.length} formulation(s)</Badge>}
                        {contexte.essais_disponibles.map((e) => (
                          <Badge key={e.type} variant="secondary">{e.count} {e.type}</Badge>
                        ))}
                        {contexte.materiaux.length > 0 && contexte.materiaux.slice(0, 5).map((m) => (
                          <Badge key={m} variant="outline">{m}</Badge>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <div>
                <Label>Client</Label>
                <Input value={clientNom} onChange={(e) => setClientNom(e.target.value)} placeholder="Auto-rempli" />
              </div>
              <div>
                <Label>Entreprise</Label>
                <Input value={entreprise} onChange={(e) => setEntreprise(e.target.value)} />
              </div>
              <div>
                <Label>Projet</Label>
                <Input value={projet} onChange={(e) => setProjet(e.target.value)} />
              </div>
              <div>
                <Label>Date du problème</Label>
                <Input type="date" value={dateProbleme} onChange={(e) => setDateProbleme(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>Matériau concerné (facultatif)</Label>
                <Input value={materiau} onChange={(e) => setMateriau(e.target.value)} placeholder="Ex : Sable 0/4, Béton C25/30…" />
              </div>
            </div>
          )}

          {step === "categorie" && (
            <div className="space-y-4">
              <div>
                <Label>Catégorie <span className="text-red-500">*</span></Label>
                <div className={cn("grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 rounded-md p-1", errClass(!categorieId))}>
                  {categories.map((c) => {
                    const active = categorieId === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => { setCategorieId(c.id); setModeleId(null); }}
                        className={cn(
                          "text-left rounded-lg border p-3 transition",
                          active ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" : "border-border hover:border-violet-300",
                        )}
                      >
                        <div className="font-medium text-sm">{c.nom}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {categorieId && (
                <div>
                  <Label>Modèle (facultatif — guide la structure du rapport)</Label>
                  <Select value={modeleId ?? ""} onValueChange={(v) => setModeleId(v || null)}>
                    <SelectTrigger><SelectValue placeholder="Aucun modèle" /></SelectTrigger>
                    <SelectContent>
                      {modeles.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.titre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Niveau de gravité</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {GRAVITES.map((g) => (
                    <button
                      key={g}
                      onClick={() => setGravite(g)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium border transition",
                        gravite === g ? GRAVITE_COLORS[g] + " border-transparent" : "border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {GRAVITE_LABELS[g]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "description" && (
            <div className="space-y-4">
              <div>
                <Label>Titre (facultatif)</Label>
                <Input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex : Sable de la carrière X non conforme au fuseau" />
              </div>
              <div>
                <Label>Description libre du problème <span className="text-red-500">*</span></Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={`Décrivez le problème avec vos mots, comme si vous parliez à un ingénieur.\n\nExemple : "L'entreprise a remplacé le sable sans nous prévenir. La granulométrie ne correspond plus au matériau validé pour la formulation F-25. Le béton a déjà été coulé sur la dalle du 3e étage."`}
                  rows={10}
                  className={cn("resize-none", errClass(description.trim().length < 20))}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Minimum 20 caractères — plus vous êtes précis, meilleur sera le rapport IA.</span>
                  <span>{description.length}</span>
                </div>
              </div>
              {contexte && (
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    L'IA disposera automatiquement du contexte du chantier <strong>{contexte.chantier_nom}</strong>, {contexte.formulations.length} formulation(s) et {contexte.essais_disponibles.reduce((s, e) => s + e.count, 0)} essai(s). Inutile de les rappeler.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {step === "pieces" && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                className={cn(
                  "rounded-xl border-2 border-dashed p-8 text-center transition",
                  dragOver ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" : "border-border",
                )}
              >
                <UploadCloud className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">Glissez-déposez vos fichiers ici</p>
                <p className="text-xs text-muted-foreground mb-4">Photos, PDF, résultats d'essais (Excel/CSV), documents Word…</p>
                <label className="inline-flex">
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                  />
                  <span className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-violet-600 text-white px-4 py-2 text-sm hover:bg-violet-700">
                    <UploadCloud className="h-4 w-4" /> Parcourir
                  </span>
                </label>
              </div>

              {pieces.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {pieces.map((p) => (
                    <PieceCard key={p.id} piece={p} onDelete={() => deletePiece.mutate(p)} />
                  ))}
                </div>
              )}
              {uploadPiece.isPending && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Upload en cours…
                </p>
              )}
            </div>
          )}

          {step === "recap" && (
            <div className="space-y-4">
              {Object.keys(errors).length > 0 && showErrors && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc pl-4 text-sm">
                      {Object.entries(errors).map(([k, v]) => <li key={k}>{v}</li>)}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              <RecapRow label="Chantier" value={contexte?.chantier_nom ?? "—"} />
              <RecapRow label="Client" value={clientNom || "—"} />
              <RecapRow label="Entreprise" value={entreprise || "—"} />
              <RecapRow label="Projet" value={projet || "—"} />
              <RecapRow label="Catégorie" value={categories.find((c) => c.id === categorieId)?.nom ?? "—"} />
              <RecapRow label="Modèle" value={modeles.find((m) => m.id === modeleId)?.titre ?? "—"} />
              <RecapRow label="Gravité" value={<Badge className={GRAVITE_COLORS[gravite]}>{GRAVITE_LABELS[gravite]}</Badge>} />
              <RecapRow label="Date" value={dateProbleme} />
              <RecapRow label="Description" value={<span className="text-sm whitespace-pre-wrap">{description || "—"}</span>} />
              <RecapRow label="Pièces jointes" value={`${pieces.length} fichier(s)`} />
              <Alert className="border-violet-200 bg-violet-50 dark:bg-violet-950/30">
                <Sparkles className="h-4 w-4 text-violet-600" />
                <AlertDescription className="text-sm">
                  Les données sont prêtes. À l'étape suivante (Phase 3), l'IA analysera automatiquement le problème, posera des questions complémentaires si nécessaire et rédigera un projet de rapport structuré.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nav buttons */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={goBack} disabled={stepIndex === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
        </Button>
        {step !== "recap" ? (
          <Button onClick={goNext} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
            Suivant <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleFinish} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
            <CheckCircle2 className="h-4 w-4 mr-1" /> Enregistrer le brouillon
          </Button>
        )}
      </div>
    </div>
  );
}

function RecapRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2 border-b last:border-0">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="col-span-2 text-sm">{value}</div>
    </div>
  );
}

function PieceCard({ piece, onDelete }: { piece: PieceJointe; onDelete: () => void }) {
  const Icon = piece.type === "photo" ? ImageIcon : piece.type === "pdf" ? FileText : piece.type === "essai" ? FileSpreadsheet : FileIcon;
  const isImage = piece.type === "photo" && piece.url;
  return (
    <div className="group relative rounded-lg border overflow-hidden bg-muted/30">
      {isImage ? (
        <img src={piece.url!} alt={piece.nom} className="w-full h-32 object-cover" />
      ) : (
        <div className="h-32 flex items-center justify-center">
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
      )}
      <div className="p-2 text-xs truncate" title={piece.nom}>{piece.nom}</div>
      <button
        onClick={onDelete}
        className="absolute top-1 right-1 rounded-full bg-red-500 text-white p-1 opacity-0 group-hover:opacity-100 transition"
        title="Supprimer"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
