import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { BackButton } from "@/components/ui/back-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Loader2, Sparkles, HelpCircle, FileText, AlertTriangle, CheckCircle2, History, Send,
  CheckCircle, XCircle, RotateCcw, Save, Archive, Upload, Eye, Printer,
} from "lucide-react";
import {
  useRapportTechnique,
  STATUT_LABELS,
  STATUT_COLORS,
  type RapportStatut,
} from "@/hooks/useRapportsTechniques";
import {
  useAnalyzeRapport, useGenerateAIQuestions, useGenerateDraftReport,
  useAIQuestions, useAnswerAIQuestion,
  useReviewRapport, useAIReviews,
} from "@/hooks/useRapportAI";
import {
  useRapportVersions, useSaveVersion, useRestoreVersion,
  useWorkflowEvents, useWorkflowTransition, type WorkflowAction,
} from "@/hooks/useRapportWorkflow";
import { useDocumentArchives, useGenerateOfficialDocument, getSignedArchiveUrl } from "@/hooks/useDocumentArchives";
import { useEntreprise } from "@/hooks/useEntreprise";
import type { AIAnalyse, AIRapportContenu } from "@/lib/ai/aiProvider";
import { renderTemplate } from "@/lib/rapports/templateEngine";
import { toast } from "@/hooks/use-toast";
import RichTextEditor from "@/components/rapports/RichTextEditor";
import AISuggestionDialog from "@/components/rapports/AISuggestionDialog";
import type { Editor } from "@tiptap/react";
import { sanitizeHtml, escapeHtml } from "@/lib/sanitize";

function contenuToHtml(c: AIRapportContenu | null): string {
  if (!c) return "";
  const s = c.sections ?? ({} as Partial<NonNullable<AIRapportContenu["sections"]>>);
  const sections: Array<[string, string | undefined]> = [
    ["Objet", s.objet], ["Contexte", s.contexte], ["Constatations", s.constatations],
    ["Analyse technique", s.analyse_technique], ["Conséquences", s.consequences],
    ["Recommandations", s.recommandations], ["Conclusion", s.conclusion],
  ];
  const body = sections.map(([t, b]) => `<h2>${escapeHtml(t)}</h2><p>${escapeHtml(b || "Information non disponible.").replace(/\n/g, "<br/>")}</p>`).join("");
  const faits = c.faits?.length ? `<h3>Faits</h3><ul>${c.faits.map(f => `<li>${escapeHtml(f)}</li>`).join("")}</ul>` : "";
  const hyps = c.hypotheses?.length ? `<h3>Hypothèses</h3><ul>${c.hypotheses.map(f => `<li>${escapeHtml(f)}</li>`).join("")}</ul>` : "";
  const reco = c.recommandations_synthese?.length ? `<h3>Recommandations (synthèse)</h3><ul>${c.recommandations_synthese.map(f => `<li>${escapeHtml(f)}</li>`).join("")}</ul>` : "";
  return `<h1>${escapeHtml(c.titre || "Rapport technique")}</h1>${body}${faits}${hyps}${reco}`;
}

export default function RapportTechniqueDetail() {
  const { id = "" } = useParams();
  const { data: r, isLoading } = useRapportTechnique(id);
  const analyzeM = useAnalyzeRapport();
  const questionsM = useGenerateAIQuestions();
  const generateM = useGenerateDraftReport();
  const { data: questions = [] } = useAIQuestions(id);
  const answerM = useAnswerAIQuestion();
  const { data: versions = [] } = useRapportVersions(id);
  const { data: wfEvents = [] } = useWorkflowEvents(id);
  const saveVersion = useSaveVersion();
  const restoreVersion = useRestoreVersion();
  const transition = useWorkflowTransition();

  const analyse = (r?.analyse_ia ?? null) as unknown as AIAnalyse | null;
  const contenu = (r?.contenu_rapport ?? null) as unknown as AIRapportContenu | null;

  const [html, setHtml] = useState<string>("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiSel, setAiSel] = useState<{ text: string; editor: Editor | null }>({ text: "", editor: null });
  const [wfDialog, setWfDialog] = useState<{ action: WorkflowAction; label: string } | null>(null);
  const [wfComment, setWfComment] = useState("");
  const [saveComment, setSaveComment] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);

  useEffect(() => {
    if (!r) return;
    if (r.editor_html) setHtml(r.editor_html);
    else if (contenu) setHtml(contenuToHtml(contenu));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r?.id, r?.editor_html]);

  const handleAnalyze = async () => {
    try { await analyzeM.mutateAsync(id); toast({ title: "Analyse terminée" }); }
    catch (e) { toast({ title: "Erreur", description: e instanceof Error ? e.message : "Échec", variant: "destructive" }); }
  };
  const handleQuestions = async () => {
    try { const res = await questionsM.mutateAsync(id); toast({ title: "Questions générées", description: `${res.questions.length} question(s)` }); }
    catch (e) { toast({ title: "Erreur", description: e instanceof Error ? e.message : "Échec", variant: "destructive" }); }
  };
  const handleGenerate = async () => {
    try { const res = await generateM.mutateAsync(id); setHtml(contenuToHtml(res.contenu)); toast({ title: "Brouillon généré" }); }
    catch (e) { toast({ title: "Erreur", description: e instanceof Error ? e.message : "Échec", variant: "destructive" }); }
  };
  const handleSave = async () => {
    try {
      await saveVersion.mutateAsync({ rapportId: id, editor_html: html, commentaire: saveComment || undefined, titre: r?.titre ?? undefined, contenu: (contenu ?? null) as never });
      toast({ title: "Version enregistrée", description: `Version ${(r?.version_courante ?? 0) + 1}` });
      setSaveOpen(false); setSaveComment("");
    } catch (e) { toast({ title: "Erreur", description: e instanceof Error ? e.message : "Échec", variant: "destructive" }); }
  };
  const handleWorkflow = async () => {
    if (!wfDialog || !r) return;
    try {
      await transition.mutateAsync({ rapportId: id, ancienStatut: r.statut, action: wfDialog.action, commentaire: wfComment || undefined });
      toast({ title: wfDialog.label + " ✓" });
      setWfDialog(null); setWfComment("");
    } catch (e) { toast({ title: "Erreur", description: e instanceof Error ? e.message : "Échec", variant: "destructive" }); }
  };

  const previewHtml = () => renderTemplate(html, {
    chantier: (r as never as { chantiers?: { nom?: string } } | null)?.chantiers?.nom ?? null,
    client: (r as never as { clients?: { nom?: string } } | null)?.clients?.nom ?? null,
    entreprise: r?.entreprise ?? null,
    projet: r?.projet ?? null,
    numero_rapport: r?.numero ?? null,
    titre: r?.titre ?? null,
  });

  const isValide = r?.statut === "valide" || r?.statut === "archive";

  return (
    <div data-essai-mobile className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Essais", path: "/essais" },
        { label: "Assistant IA", path: "/essais/redaction-rapport-technique" },
        { label: r?.numero || r?.titre || "Rapport" },
      ]} />
      <div className="flex items-center gap-3 flex-wrap">
        <BackButton to="/essais/redaction-rapport-technique" />
        <h1 className="text-2xl font-bold">{r?.numero || r?.titre || "Rapport technique"}</h1>
        {r && <Badge className={STATUT_COLORS[r.statut]} variant="outline">{STATUT_LABELS[r.statut]}</Badge>}
        {r && <Badge variant="outline">v{r.version_courante ?? 1}</Badge>}
        {r && (
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={() => window.open(`/reports/rapport-technique/${r.id}/print`, "_blank")}>
              <Eye className="h-4 w-4 mr-1" /> Aperçu impression
            </Button>
            <Button size="sm" onClick={() => window.open(`/reports/rapport-technique/${r.id}/print?auto=1`, "_blank")}>
              <Printer className="h-4 w-4 mr-1" /> Imprimer / PDF
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6 text-muted-foreground">Chargement…</CardContent></Card>
      ) : !r ? (
        <Card><CardContent className="p-6 text-muted-foreground">Rapport introuvable.</CardContent></Card>
      ) : (
        <Tabs defaultValue="editeur">
          <TabsList>
            <TabsTrigger value="editeur"><FileText className="h-4 w-4 mr-1" /> Éditeur</TabsTrigger>
            <TabsTrigger value="ia"><Sparkles className="h-4 w-4 mr-1" /> Analyse IA</TabsTrigger>
            <TabsTrigger value="validation"><CheckCircle className="h-4 w-4 mr-1" /> Validation</TabsTrigger>
            <TabsTrigger value="historique"><History className="h-4 w-4 mr-1" /> Historique ({versions.length + wfEvents.length})</TabsTrigger>
          </TabsList>

          {/* --- ÉDITEUR --- */}
          <TabsContent value="editeur" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle>Rédaction du rapport</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSaveOpen(true)} disabled={isValide}>
                      <Save className="h-4 w-4 mr-1" /> Enregistrer version
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleGenerate} disabled={generateM.isPending || isValide}>
                      {generateM.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                      Générer avec IA
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isValide ? (
                  <div className="border rounded p-4 prose prose-sm max-w-none bg-muted/20" dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewHtml()) }} />
                ) : (
                  <RichTextEditor
                    value={html}
                    onChange={setHtml}
                    onAIAction={(text, editor) => { setAiSel({ text, editor }); setAiOpen(true); }}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Eye className="h-4 w-4" /> Aperçu variables résolues</CardTitle></CardHeader>
              <CardContent>
                <div className="border rounded p-4 prose prose-sm max-w-none bg-background" dangerouslySetInnerHTML={{ __html: previewHtml() }} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- IA --- */}
          <TabsContent value="ia" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Description du problème</CardTitle></CardHeader>
              <CardContent><p className="whitespace-pre-wrap text-sm">{r.description_probleme}</p></CardContent>
            </Card>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleAnalyze} disabled={analyzeM.isPending}>
                {analyzeM.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Analyser
              </Button>
              <Button variant="outline" onClick={handleQuestions} disabled={!analyse || questionsM.isPending}>
                {questionsM.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <HelpCircle className="h-4 w-4 mr-2" />}
                Questions intelligentes
              </Button>
            </div>
            {analyse && <AnalyseCard analyse={analyse} />}
            {questions.length > 0 && (
              <QuestionsPanel questions={questions} onAnswer={(qid, rep) => answerM.mutate({ id: qid, reponse: rep, rapportId: id })} onReanalyze={handleAnalyze} />
            )}
          </TabsContent>

          {/* --- VALIDATION --- */}
          <TabsContent value="validation" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Workflow de validation</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <WorkflowActions statut={r.statut} onAction={(action, label) => setWfDialog({ action, label })} />
                <Separator />
                <div className="text-sm text-muted-foreground">
                  <p>Statut courant : <strong>{STATUT_LABELS[r.statut]}</strong></p>
                  {r.soumis_at && <p>Soumis le : {new Date(r.soumis_at).toLocaleString("fr-FR")}</p>}
                  {r.valide_at && <p>Validé le : {new Date(r.valide_at).toLocaleString("fr-FR")}</p>}
                  {r.refuse_at && <p>Refusé le : {new Date(r.refuse_at).toLocaleString("fr-FR")} — Motif : {r.motif_refus}</p>}
                  {r.publie_at && <p>Publié le : {new Date(r.publie_at).toLocaleString("fr-FR")}</p>}
                </div>
              </CardContent>
            </Card>

            <OfficialDocumentPanel rapport={r} html={html} previewHtml={previewHtml()} />
          </TabsContent>

          {/* --- HISTORIQUE --- */}
          <TabsContent value="historique" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Versions du document</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {versions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune version enregistrée.</p>
                ) : versions.map(v => (
                  <div key={v.id} className="border rounded p-3 flex items-center gap-3">
                    <Badge variant="outline">v{v.version}</Badge>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{v.commentaire || v.event_type}</div>
                      <div className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString("fr-FR")}</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">{v.event_type}</Badge>
                    {!isValide && (
                      <Button size="sm" variant="outline" onClick={() => restoreVersion.mutate({ rapportId: id, version: v })}>
                        <RotateCcw className="h-3 w-3 mr-1" /> Restaurer
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Journal du workflow</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {wfEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun événement.</p>
                ) : wfEvents.map(e => (
                  <div key={e.id} className="border rounded p-3">
                    <div className="text-sm flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{e.action}</Badge>
                      <span>{e.ancien_statut ?? "—"} → <strong>{e.nouveau_statut}</strong></span>
                      <span className="text-xs text-muted-foreground ml-auto">{new Date(e.created_at).toLocaleString("fr-FR")}</span>
                    </div>
                    {e.commentaire && <p className="text-sm text-muted-foreground mt-1">{e.commentaire}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <AISuggestionDialog
        open={aiOpen}
        onOpenChange={setAiOpen}
        selectedText={aiSel.text}
        rapportId={id}
        onApply={(newText) => {
          if (!aiSel.editor) return;
          aiSel.editor.chain().focus().deleteSelection().insertContent(newText).run();
        }}
      />

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enregistrer une version</DialogTitle></DialogHeader>
          <Input placeholder="Commentaire (optionnel)" value={saveComment} onChange={(e) => setSaveComment(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saveVersion.isPending}>
              {saveVersion.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!wfDialog} onOpenChange={(o) => { if (!o) { setWfDialog(null); setWfComment(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{wfDialog?.label}</DialogTitle></DialogHeader>
          <Textarea placeholder="Observations / motif (optionnel sauf refus)" value={wfComment} onChange={(e) => setWfComment(e.target.value)} rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setWfDialog(null)}>Annuler</Button>
            <Button onClick={handleWorkflow} disabled={transition.isPending || (wfDialog?.action === "refuser" && !wfComment.trim())}>
              {transition.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WorkflowActions({ statut, onAction }: { statut: RapportStatut; onAction: (a: WorkflowAction, label: string) => void }) {
  const buttons: Array<{ action: WorkflowAction; label: string; icon: React.ReactNode; variant?: "default" | "outline" | "destructive"; show: boolean }> = [
    { action: "soumettre", label: "Soumettre pour validation", icon: <Send className="h-4 w-4 mr-1" />, show: ["brouillon", "en_cours", "a_completer"].includes(statut) },
    { action: "approuver", label: "Approuver", icon: <CheckCircle className="h-4 w-4 mr-1" />, show: statut === "en_attente_validation" },
    { action: "demander_correction", label: "Demander des corrections", icon: <RotateCcw className="h-4 w-4 mr-1" />, variant: "outline", show: statut === "en_attente_validation" },
    { action: "refuser", label: "Refuser", icon: <XCircle className="h-4 w-4 mr-1" />, variant: "destructive", show: statut === "en_attente_validation" },
    { action: "publier", label: "Publier", icon: <Upload className="h-4 w-4 mr-1" />, show: statut === "valide" },
    { action: "archiver", label: "Archiver", icon: <Archive className="h-4 w-4 mr-1" />, variant: "outline", show: !["archive", "brouillon"].includes(statut) },
  ];
  const visible = buttons.filter(b => b.show);
  if (!visible.length) return <p className="text-sm text-muted-foreground">Aucune action disponible dans ce statut.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {visible.map(b => (
        <Button key={b.action} variant={b.variant ?? "default"} onClick={() => onAction(b.action, b.label)}>
          {b.icon}{b.label}
        </Button>
      ))}
    </div>
  );
}

function AnalyseCard({ analyse }: { analyse: AIAnalyse }) {
  const graviteColor: Record<string, string> = {
    Faible: "bg-emerald-100 text-emerald-800", Moyenne: "bg-amber-100 text-amber-800",
    Élevée: "bg-orange-100 text-orange-800", Critique: "bg-red-100 text-red-800",
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> Analyse IA
          <Badge variant="outline" className="ml-auto">Confiance {analyse.niveauConfiance ?? 0}%</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium">Type :</span>
          <Badge variant="secondary">{analyse.typeProbleme || "N/A"}</Badge>
          {analyse.gravite && <Badge className={graviteColor[analyse.gravite] || ""}>Gravité : {analyse.gravite}</Badge>}
        </div>
        <ListBlock title="Matériaux concernés" items={analyse.materiauxConcernes} />
        <ListBlock title="Essais recommandés" items={analyse.essaisRecommandes} />
        <ListBlock title="Normes applicables" items={analyse.normesApplicables ?? []} />
        <ListBlock title="Causes probables" items={analyse.causesProbables} />
        <ListBlock title="Risques" items={analyse.risques} icon={<AlertTriangle className="h-4 w-4 text-orange-500" />} />
        <ListBlock title="Informations manquantes" items={analyse.informationsManquantes} icon={<HelpCircle className="h-4 w-4 text-blue-500" />} />
      </CardContent>
    </Card>
  );
}

function ListBlock({ title, items, icon }: { title: string; items: string[]; icon?: React.ReactNode }) {
  if (!items?.length) return null;
  return (
    <div>
      <div className="text-sm font-semibold mb-1 flex items-center gap-2">{icon}{title}</div>
      <ul className="text-sm space-y-1 pl-5 list-disc text-muted-foreground">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}

function QuestionsPanel({ questions, onAnswer, onReanalyze }: {
  questions: Array<{ id: string; question: string; reponse_utilisateur: string | null }>;
  onAnswer: (id: string, rep: string) => void;
  onReanalyze: () => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const answered = questions.filter(q => q.reponse_utilisateur).length;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" /> Questions intelligentes
          <Badge variant="outline" className="ml-auto">{answered}/{questions.length} répondues</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="border rounded-lg p-3 space-y-2 bg-muted/30">
            <div className="flex items-start gap-2">
              {q.reponse_utilisateur ? <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" /> : <HelpCircle className="h-4 w-4 text-muted-foreground mt-0.5" />}
              <p className="text-sm font-medium flex-1">{q.question}</p>
            </div>
            <Textarea placeholder="Votre réponse…" defaultValue={q.reponse_utilisateur ?? ""} onChange={(e) => setDrafts(d => ({ ...d, [q.id]: e.target.value }))} rows={2} />
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => onAnswer(q.id, drafts[q.id] ?? q.reponse_utilisateur ?? "")}>Enregistrer</Button>
            </div>
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <Button size="sm" onClick={onReanalyze}><Sparkles className="h-4 w-4 mr-2" /> Relancer l'analyse</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== Phase 5 — Génération documentaire officielle ====================
function OfficialDocumentPanel({ rapport, html, previewHtml }: {
  rapport: { id: string; numero: string | null; titre: string | null; statut: RapportStatut; entreprise: string | null; projet: string | null; valide_at: string | null };
  html: string;
  previewHtml: string;
}) {
  const { data: entreprise } = useEntreprise();
  const { data: archives = [] } = useDocumentArchives("rapport_technique", rapport.id);
  const { data: reviews = [] } = useAIReviews(rapport.id);
  const reviewM = useReviewRapport();
  const genM = useGenerateOfficialDocument();
  const lastReview = reviews[0] ?? null;
  const canGenerate = rapport.statut === "valide" || rapport.statut === "archive";

  const runReview = async () => {
    try { await reviewM.mutateAsync(rapport.id); toast({ title: "Revue IA terminée" }); }
    catch (e) { toast({ title: "Erreur", description: e instanceof Error ? e.message : "Échec", variant: "destructive" }); }
  };

  const runGenerate = async () => {
    try {
      const res = await genM.mutateAsync({
        document_type: "rapport_technique",
        document_id: rapport.id,
        numero: rapport.numero ?? null,
        template: {
          id: "",
          nom: "Template LTPC",
          couleur_primaire: "#1e5a7a",
          couleur_secondaire: "#d4e5f7",
          police: "Times New Roman, Georgia, serif",
          taille_titre: 18,
          taille_corps: 11,
          marge_mm: { top: 15, right: 15, bottom: 20, left: 15 },
          logo_url: entreprise?.logo_url ?? null,
          cachet_url: (entreprise as { cachet_url?: string | null } | null)?.cachet_url ?? null,
          orientation: "portrait",
          format: "A4",
        },
        variables: {
          numero_rapport: rapport.numero ?? null,
          date: rapport.valide_at ?? new Date().toISOString(),
          titre: rapport.titre ?? null,
          objet: rapport.titre ?? null,
          entreprise: rapport.entreprise ?? null,
          projet: rapport.projet ?? null,
          laboratoire: entreprise?.nom ?? "Laboratoire",
        },
        body_html: previewHtml || html,
        signature: {
          ingenieur_nom: (entreprise as { representant?: string | null } | null)?.representant ?? null,
          ingenieur_fonction: "Ingénieur validateur",
          cachet_url: (entreprise as { cachet_url?: string | null } | null)?.cachet_url ?? null,
          date_validation: rapport.valide_at ?? new Date().toISOString(),
        },
        qr_verification_base_url: `${window.location.origin}/verification`,
      });
      toast({ title: "PDF officiel généré", description: `Version ${res.version} archivée` });
      if (res.public_url) window.open(res.public_url, "_blank");
    } catch (e) { toast({ title: "Erreur", description: e instanceof Error ? e.message : "Échec", variant: "destructive" }); }
  };

  const openArchive = async (pdfPath: string) => {
    try { const url = await getSignedArchiveUrl(pdfPath, 3600); window.open(url, "_blank"); }
    catch (e) { toast({ title: "Erreur", description: e instanceof Error ? e.message : "Échec", variant: "destructive" }); }
  };

  const sevColor: Record<string, string> = {
    info: "bg-blue-100 text-blue-800",
    warning: "bg-amber-100 text-amber-800",
    critique: "bg-red-100 text-red-800",
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Revue IA avant génération
            {lastReview?.score !== null && lastReview?.score !== undefined && (
              <Badge variant="outline" className="ml-auto">Score {lastReview.score}/100</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            L'IA vérifie sections manquantes, incohérences, contradictions, recommandations non justifiées et références d'essais absentes.
            Elle n'écrit jamais dans le rapport — l'ingénieur décide.
          </p>
          <Button size="sm" variant="outline" onClick={runReview} disabled={reviewM.isPending}>
            {reviewM.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Lancer la revue IA
          </Button>
          {lastReview && (
            <div className="space-y-2">
              {lastReview.observations.length === 0 ? (
                <div className="flex items-center gap-2 text-emerald-700 text-sm"><CheckCircle2 className="h-4 w-4" /> Aucune observation — rapport conforme.</div>
              ) : lastReview.observations.map((o, i) => (
                <div key={i} className="border rounded p-2 flex items-start gap-2">
                  <Badge className={sevColor[o.severity] ?? ""}>{o.severity}</Badge>
                  <div className="text-sm">
                    <div className="font-medium">{o.category}</div>
                    <div className="text-muted-foreground">{o.message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Génération du PDF officiel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Génère un document PDF officiel avec en-tête, pied de page, pagination, QR code de vérification, signature et cachet.
            Chaque génération crée une nouvelle version archivée immuable avec empreinte SHA-256.
          </p>
          {!canGenerate && (
            <div className="flex items-center gap-2 text-amber-700 text-sm"><AlertTriangle className="h-4 w-4" /> Le rapport doit être validé avant génération officielle.</div>
          )}
          <Button onClick={runGenerate} disabled={!canGenerate || genM.isPending}>
            {genM.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Générer PDF officiel
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Archive className="h-4 w-4" /> Archives ({archives.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {archives.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune archive officielle générée.</p>
          ) : archives.map(a => (
            <div key={a.id} className="border rounded p-3 flex items-center gap-3 flex-wrap">
              <Badge variant="outline">v{a.version}</Badge>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{a.numero ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("fr-FR")} · {a.generated_by_nom ?? "—"} · {a.pdf_size ? `${Math.round(a.pdf_size / 1024)} Ko` : ""}</div>
                <div className="text-xs text-muted-foreground truncate font-mono">SHA-256 : {a.sha256.substring(0, 32)}…</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => openArchive(a.pdf_url)}><Eye className="h-4 w-4 mr-1" /> Ouvrir</Button>
              <Button size="sm" variant="ghost" asChild>
                <a href={`/verification/${a.qr_token}`} target="_blank" rel="noreferrer">Vérifier</a>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
