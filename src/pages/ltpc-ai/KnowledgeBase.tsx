import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Database, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { BackButton } from "@/components/ui/back-button";
import { KnowledgeService, type IndexableSource } from "@/lib/ltpc-ai/KnowledgeService";

const SOURCES: { key: IndexableSource; label: string; description: string }[] = [
  { key: "rapport_technique", label: "Rapports techniques", description: "Rapports validés et brouillons du module Rédaction." },
  { key: "formulation", label: "Formulations béton", description: "Fiches Dreux-Gorisse et compositions enregistrées." },
  { key: "essai_compression", label: "Essais compression", description: "Résultats d'écrasement 7j / 28j sur éprouvettes." },
];

export default function KnowledgeBase() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof KnowledgeService.stats>>>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Awaited<ReturnType<typeof KnowledgeService.hybridSearch>>>([]);
  const [searching, setSearching] = useState(false);
  const [note, setNote] = useState({ titre: "", contenu: "" });

  const refresh = async () => setStats(await KnowledgeService.stats());
  useEffect(() => { refresh(); }, []);

  const reindex = async (source: IndexableSource) => {
    setBusy(source);
    try {
      const r = await KnowledgeService.reindex(source, { full: true });
      toast.success(`${source} : ${r.indexed} source(s), ${r.chunks} extrait(s) indexé(s).`);
      await refresh();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(null); }
  };

  const addNote = async () => {
    if (!note.contenu.trim()) { toast.error("Contenu obligatoire"); return; }
    setBusy("note");
    try {
      const r = await KnowledgeService.reindex("note", { note: { titre: note.titre, contenu: note.contenu } });
      toast.success(`Note indexée (${r.chunks} extraits).`);
      setNote({ titre: "", contenu: "" });
      await refresh();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(null); }
  };

  const doSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try { setResults(await KnowledgeService.hybridSearch(query, { topK: 10 })); }
    catch (e) { toast.error((e as Error).message); }
    finally { setSearching(false); }
  };

  const countFor = (k: string) => stats.find((s) => s.source_type === k);

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <BackButton to="/ltpc-ai" />
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Database className="h-6 w-6" /> Base de connaissance LTPC AI</h1>
          <p className="text-sm text-muted-foreground">Indexation vectorielle des sources internes du laboratoire — utilisée par le copilote pour répondre avec citations.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {SOURCES.map((s) => {
          const c = countFor(s.key);
          return (
            <Card key={s.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  {s.label}
                  <Badge variant="secondary">{c?.sources ?? 0} src · {c?.chunks ?? 0} extraits</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">{s.description}</p>
                <Button size="sm" onClick={() => reindex(s.key)} disabled={busy === s.key} className="w-full">
                  {busy === s.key ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Réindexer
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Plus className="h-4 w-4" /> Ajouter une note libre</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Titre (optionnel)" value={note.titre} onChange={(e) => setNote({ ...note, titre: e.target.value })} />
          <Textarea placeholder="Note technique, procédure, retour d'expérience…" rows={5} value={note.contenu} onChange={(e) => setNote({ ...note, contenu: e.target.value })} />
          <Button onClick={addNote} disabled={busy === "note" || !note.contenu.trim()}>
            {busy === "note" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Indexer la note
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Search className="h-4 w-4" /> Recherche sémantique</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="Ex. dérive résistance C25/30, dosage ciment, module de finesse…" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doSearch()} />
            <Button onClick={doSearch} disabled={searching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          <div className="space-y-2">
            {results.map((r) => (
              <div key={r.id} className="p-3 rounded-md border bg-muted/30">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs">{r.source_type}</Badge>
                  {typeof r.score === "number" && <span className="text-xs text-muted-foreground">score {r.score.toFixed(3)}</span>}
                </div>
                <p className="text-sm">{r.contenu}</p>
              </div>
            ))}
            {!searching && query && results.length === 0 && <p className="text-sm text-muted-foreground">Aucun résultat.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
