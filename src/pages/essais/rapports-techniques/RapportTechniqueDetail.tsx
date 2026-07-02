import { useState } from "react";
import { useParams } from "react-router-dom";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { BackButton } from "@/components/ui/back-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, HelpCircle, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  useRapportTechnique,
  STATUT_LABELS,
  STATUT_COLORS,
} from "@/hooks/useRapportsTechniques";
import {
  useAnalyzeRapport,
  useGenerateAIQuestions,
  useGenerateDraftReport,
  useAIQuestions,
  useAnswerAIQuestion,
} from "@/hooks/useRapportAI";
import type { AIAnalyse, AIRapportContenu } from "@/lib/ai/aiProvider";
import { toast } from "@/hooks/use-toast";

export default function RapportTechniqueDetail() {
  const { id = "" } = useParams();
  const { data: r, isLoading } = useRapportTechnique(id);
  const analyzeM = useAnalyzeRapport();
  const questionsM = useGenerateAIQuestions();
  const generateM = useGenerateDraftReport();
  const { data: questions = [] } = useAIQuestions(id);
  const answerM = useAnswerAIQuestion();

  const analyse = (r?.analyse_ia ?? null) as unknown as AIAnalyse | null;
  const contenu = (r?.contenu_rapport ?? null) as unknown as AIRapportContenu | null;

  const handleAnalyze = async () => {
    try {
      await analyzeM.mutateAsync(id);
      toast({ title: "Analyse terminée", description: "L'IA a analysé le problème." });
    } catch (e) {
      toast({ title: "Erreur analyse", description: e instanceof Error ? e.message : "Échec", variant: "destructive" });
    }
  };
  const handleQuestions = async () => {
    try {
      const res = await questionsM.mutateAsync(id);
      toast({ title: "Questions générées", description: `${res.questions.length} question(s).` });
    } catch (e) {
      toast({ title: "Erreur", description: e instanceof Error ? e.message : "Échec", variant: "destructive" });
    }
  };
  const handleGenerate = async () => {
    try {
      await generateM.mutateAsync(id);
      toast({ title: "Rapport généré", description: "Brouillon prêt pour révision." });
    } catch (e) {
      toast({ title: "Erreur génération", description: e instanceof Error ? e.message : "Échec", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: "Essais", path: "/essais" },
          { label: "Assistant IA", path: "/essais/redaction-rapport-technique" },
          { label: r?.numero || r?.titre || "Rapport" },
        ]}
      />
      <div className="flex items-center gap-3">
        <BackButton to="/essais/redaction-rapport-technique" />
        <h1 className="text-2xl font-bold">{r?.numero || r?.titre || "Rapport technique"}</h1>
        {r && <Badge className={STATUT_COLORS[r.statut]} variant="outline">{STATUT_LABELS[r.statut]}</Badge>}
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6 text-muted-foreground">Chargement…</CardContent></Card>
      ) : !r ? (
        <Card><CardContent className="p-6 text-muted-foreground">Rapport introuvable.</CardContent></Card>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle>Description du problème</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-wrap text-sm">{r.description_probleme}</p></CardContent>
          </Card>

          {/* Actions IA */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleAnalyze} disabled={analyzeM.isPending}>
              {analyzeM.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Analyser avec l'IA
            </Button>
            <Button variant="outline" onClick={handleQuestions} disabled={!analyse || questionsM.isPending}>
              {questionsM.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <HelpCircle className="h-4 w-4 mr-2" />}
              Questions intelligentes
            </Button>
            <Button variant="outline" onClick={handleGenerate} disabled={!analyse || generateM.isPending}>
              {generateM.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
              Générer le brouillon
            </Button>
          </div>

          {/* Analyse IA */}
          {analyse && <AnalyseCard analyse={analyse} />}

          {/* Questions IA */}
          {questions.length > 0 && (
            <QuestionsPanel
              questions={questions}
              onAnswer={(qid, rep) => answerM.mutate({ id: qid, reponse: rep, rapportId: id })}
              onReanalyze={handleAnalyze}
            />
          )}

          {/* Brouillon */}
          {contenu && <BrouillonCard contenu={contenu} />}
        </>
      )}
    </div>
  );
}

function AnalyseCard({ analyse }: { analyse: AIAnalyse }) {
  const graviteColor: Record<string, string> = {
    Faible: "bg-emerald-100 text-emerald-800",
    Moyenne: "bg-amber-100 text-amber-800",
    Élevée: "bg-orange-100 text-orange-800",
    Critique: "bg-red-100 text-red-800",
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
            <Textarea
              placeholder="Votre réponse…"
              defaultValue={q.reponse_utilisateur ?? ""}
              onChange={(e) => setDrafts(d => ({ ...d, [q.id]: e.target.value }))}
              rows={2}
            />
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => onAnswer(q.id, drafts[q.id] ?? q.reponse_utilisateur ?? "")}>
                Enregistrer
              </Button>
            </div>
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <Button size="sm" onClick={onReanalyze}>
            <Sparkles className="h-4 w-4 mr-2" /> Relancer l'analyse
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BrouillonCard({ contenu }: { contenu: AIRapportContenu }) {
  const s = contenu.sections;
  const sections: Array<[string, string]> = [
    ["Objet", s.objet], ["Contexte", s.contexte], ["Constatations", s.constatations],
    ["Analyse technique", s.analyse_technique], ["Conséquences", s.consequences],
    ["Recommandations", s.recommandations], ["Conclusion", s.conclusion],
  ];
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> {contenu.titre || "Brouillon du rapport"}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {sections.map(([title, body]) => (
          <div key={title}>
            <h3 className="font-semibold text-sm mb-1">{title}</h3>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{body || "Information non disponible."}</p>
          </div>
        ))}
        {contenu.faits?.length ? <ListBlock title="Faits" items={contenu.faits} /> : null}
        {contenu.hypotheses?.length ? <ListBlock title="Hypothèses" items={contenu.hypotheses} /> : null}
        {contenu.recommandations_synthese?.length ? <ListBlock title="Recommandations (synthèse)" items={contenu.recommandations_synthese} /> : null}
        <p className="text-xs text-muted-foreground pt-2">Éditeur riche + workflow validation + PDF officiel arriveront en Phase 4 & 5.</p>
      </CardContent>
    </Card>
  );
}
