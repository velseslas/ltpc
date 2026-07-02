import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { useImproveText } from "@/hooks/useRapportWorkflow";
import type { ImproveAction } from "@/lib/ai/aiProvider";
import { toast } from "@/hooks/use-toast";

const ACTIONS: Array<{ key: ImproveAction; label: string }> = [
  { key: "ameliorer", label: "Améliorer" },
  { key: "reformuler", label: "Reformuler" },
  { key: "raccourcir", label: "Raccourcir" },
  { key: "developper", label: "Développer" },
  { key: "corriger_style", label: "Corriger le style" },
  { key: "corriger_grammaire", label: "Corriger la grammaire" },
  { key: "plus_technique", label: "Rendre plus technique" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedText: string;
  rapportId?: string;
  onApply: (newText: string) => void;
}

export default function AISuggestionDialog({ open, onOpenChange, selectedText, rapportId, onApply }: Props) {
  const [action, setAction] = useState<ImproveAction | null>(null);
  const [suggestion, setSuggestion] = useState<string>("");
  const improve = useImproveText();

  const run = async (a: ImproveAction) => {
    setAction(a);
    setSuggestion("");
    try {
      const res = await improve.mutateAsync({ texte: selectedText, action: a, rapportId });
      setSuggestion(res.texte);
    } catch (e) {
      toast({ title: "Erreur IA", description: e instanceof Error ? e.message : "Échec", variant: "destructive" });
    }
  };

  const apply = () => {
    if (!suggestion) return;
    onApply(suggestion);
    onOpenChange(false);
    setSuggestion("");
    setAction(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Suggestions IA</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold mb-1 text-muted-foreground">Texte sélectionné</div>
            <div className="text-sm border rounded p-2 bg-muted/30 max-h-32 overflow-auto whitespace-pre-wrap">{selectedText}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {ACTIONS.map(a => (
              <Button key={a.key} size="sm" variant={action === a.key ? "default" : "outline"} disabled={improve.isPending} onClick={() => run(a.key)}>
                {improve.isPending && action === a.key && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                {a.label}
              </Button>
            ))}
          </div>
          {suggestion && (
            <div>
              <div className="text-xs font-semibold mb-1 text-primary">Aperçu de la suggestion</div>
              <div className="text-sm border-2 border-primary/40 rounded p-2 bg-primary/5 max-h-64 overflow-auto whitespace-pre-wrap">{suggestion}</div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={apply} disabled={!suggestion}>Appliquer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
