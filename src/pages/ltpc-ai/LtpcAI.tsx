import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Bot, Plus, Star, Archive, Trash2, Send, Loader2, ExternalLink, Sparkles, Search, MessageSquare, Bug, ChevronDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  useConversations, useMessages, useCreateConversation,
  useUpdateConversation, useDeleteConversation, useSendMessage, useCurrentContext,
} from "@/hooks/useLtpcAI";
import type { AIConversation, AIMessage, AICitation } from "@/lib/ltpc-ai/types";

const EXAMPLES = [
  "Quels rapports concernent un sable non conforme ?",
  "Quels chantiers utilisent la formulation BPS-C25/30 ?",
  "Combien de non-conformités avons-nous ce mois-ci ?",
  "Quels essais de compression sont hors spécifications ?",
];

export default function LtpcAI() {
  const [params, setParams] = useSearchParams();
  const activeId = params.get("c");
  const [tab, setTab] = useState<"active" | "favorite" | "archived">("active");
  const [search, setSearch] = useState("");
  const [debugMode, setDebugMode] = useState<boolean>(() => localStorage.getItem("ltpc-ai-debug") === "1");
  useEffect(() => { localStorage.setItem("ltpc-ai-debug", debugMode ? "1" : "0"); }, [debugMode]);

  const { data: conversations = [] } = useConversations(tab);
  const { data: messages = [], isLoading: loadingMessages } = useMessages(activeId);
  const createM = useCreateConversation();
  const updateM = useUpdateConversation();
  const deleteM = useDeleteConversation();
  const sendM = useSendMessage();
  const { context } = useCurrentContext();

  const filtered = useMemo(
    () => conversations.filter((c) => c.titre.toLowerCase().includes(search.toLowerCase())),
    [conversations, search],
  );

  useEffect(() => {
    if (!activeId && conversations.length > 0) setParams({ c: conversations[0].id }, { replace: true });
  }, [activeId, conversations, setParams]);

  const openConv = (id: string) => setParams({ c: id });
  const newConv = async () => {
    try {
      const c = await createM.mutateAsync(undefined);
      setParams({ c: c.id });
    } catch (e) { toast({ title: "Erreur", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-3 p-3">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 flex flex-col border rounded-lg bg-card">
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-sm">LTPC AI</div>
              <div className="text-[10px] text-muted-foreground">Copilote du laboratoire</div>
            </div>
          </div>
          <Button className="w-full" size="sm" onClick={newConv} disabled={createM.isPending}>
            <Plus className="h-4 w-4 mr-2" /> Nouvelle conversation
          </Button>
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2 top-2.5 text-muted-foreground" />
            <Input className="pl-7 h-8 text-xs" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-2 mt-2 grid grid-cols-3">
            <TabsTrigger value="active" className="text-xs">Actives</TabsTrigger>
            <TabsTrigger value="favorite" className="text-xs">Favoris</TabsTrigger>
            <TabsTrigger value="archived" className="text-xs">Archives</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-full">
              <ul className="px-2 pb-3 space-y-1">
                {filtered.length === 0 && <li className="text-xs text-muted-foreground p-3 text-center">Aucune conversation</li>}
                {filtered.map((c) => (
                  <ConversationRow key={c.id} conv={c} active={c.id === activeId}
                    onOpen={() => openConv(c.id)}
                    onFav={() => updateM.mutate({ id: c.id, patch: { is_favorite: !c.is_favorite } })}
                    onArchive={() => updateM.mutate({ id: c.id, patch: { is_archived: !c.is_archived } })}
                    onDelete={() => { if (confirm("Supprimer cette conversation ?")) deleteM.mutate(c.id); }} />
                ))}
              </ul>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </aside>

      {/* Chat */}
      <main className="flex-1 flex flex-col border rounded-lg bg-card overflow-hidden">
        <header className="border-b px-4 py-2 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm font-medium truncate flex-1">
            {conversations.find((c) => c.id === activeId)?.titre ?? "LTPC AI"}
          </div>
          {context?.entity_type && (
            <Badge variant="outline" className="text-[10px] capitalize">Contexte : {context.entity_type}</Badge>
          )}
        </header>

        <ScrollArea className="flex-1 p-4">
          {!activeId ? (
            <EmptyIntro onPick={async (q) => { const c = await createM.mutateAsync(undefined); setParams({ c: c.id }); setTimeout(() => sendM.mutate({ conversationId: c.id, content: q, context }), 100); }} />
          ) : loadingMessages ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : messages.length === 0 ? (
            <EmptyIntro onPick={(q) => sendM.mutate({ conversationId: activeId, content: q, context })} />
          ) : (
            <ul className="space-y-4 max-w-3xl mx-auto">
              {messages.map((m) => <MessageBubble key={m.id} msg={m} />)}
              {sendM.isPending && (
                <li className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> LTPC AI réfléchit…</li>
              )}
            </ul>
          )}
        </ScrollArea>

        <Composer disabled={sendM.isPending} onSend={async (text) => {
          let id = activeId;
          if (!id) {
            const c = await createM.mutateAsync(text.slice(0, 60));
            id = c.id;
            setParams({ c: id });
          }
          sendM.mutate({ conversationId: id, content: text, context });
        }} />
      </main>
    </div>
  );
}

function ConversationRow({ conv, active, onOpen, onFav, onArchive, onDelete }: {
  conv: AIConversation; active: boolean;
  onOpen: () => void; onFav: () => void; onArchive: () => void; onDelete: () => void;
}) {
  return (
    <li>
      <div className={`group rounded-md p-2 text-sm cursor-pointer flex items-start gap-2 ${active ? "bg-primary/10" : "hover:bg-muted"}`} onClick={onOpen}>
        <MessageSquare className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="truncate text-xs font-medium">{conv.titre}</div>
          <div className="text-[10px] text-muted-foreground">{new Date(conv.last_message_at).toLocaleDateString("fr-FR")}</div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button className="p-1 hover:text-amber-500" onClick={onFav} title="Favori"><Star className={`h-3 w-3 ${conv.is_favorite ? "fill-amber-500 text-amber-500" : ""}`} /></button>
          <button className="p-1 hover:text-blue-500" onClick={onArchive} title="Archiver"><Archive className="h-3 w-3" /></button>
          <button className="p-1 hover:text-red-500" onClick={onDelete} title="Supprimer"><Trash2 className="h-3 w-3" /></button>
        </div>
      </div>
    </li>
  );
}

function MessageBubble({ msg }: { msg: AIMessage }) {
  if (msg.role === "user") {
    return (
      <li className="flex justify-end">
        <div className="max-w-[85%] bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 text-sm whitespace-pre-wrap">{msg.content}</div>
      </li>
    );
  }
  return (
    <li className="flex gap-3">
      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Sparkles className="h-3.5 w-3.5 text-primary" /></div>
      <div className="flex-1 min-w-0">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{msg.content.replace(/\[ref:[a-z_]+:[0-9a-f-]{8,}\]/gi, "")}</ReactMarkdown>
        </div>
        {msg.citations && msg.citations.length > 0 && <Citations items={msg.citations} />}
        {msg.meta?.model && (
          <div className="text-[10px] text-muted-foreground mt-1">
            {msg.meta.model}{msg.meta.durationMs ? ` · ${(msg.meta.durationMs / 1000).toFixed(1)}s` : ""}{msg.meta.tokensTotal ? ` · ${msg.meta.tokensTotal} tok` : ""}
          </div>
        )}
      </div>
    </li>
  );
}

function Citations({ items }: { items: AICitation[] }) {
  return (
    <Card className="mt-2 p-2 bg-muted/40 border-dashed">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Sources ({items.length})</div>
      <ul className="space-y-1">
        {items.map((c, i) => (
          <li key={i} className="text-xs flex items-center gap-2">
            <Badge variant="outline" className="text-[9px] capitalize">{c.source_type.replace(/_/g, " ")}</Badge>
            {c.url ? (
              <Link to={c.url} className="text-primary hover:underline inline-flex items-center gap-1 truncate">
                {c.label}{c.reference && <span className="text-muted-foreground">({c.reference})</span>}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </Link>
            ) : (
              <span className="truncate">{c.label}{c.reference && <span className="text-muted-foreground"> ({c.reference})</span>}</span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function EmptyIntro({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="max-w-2xl mx-auto py-8 text-center space-y-6">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Bot className="h-7 w-7 text-primary" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold">LTPC AI</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Copilote intelligent du laboratoire — recherche, analyse et synthèse sur toutes vos données.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-2 text-left">
        {EXAMPLES.map((e) => (
          <button key={e} onClick={() => onPick(e)}
            className="border rounded-lg p-3 text-sm hover:border-primary hover:bg-primary/5 text-left transition-colors">
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

function Composer({ onSend, disabled }: { onSend: (text: string) => void; disabled: boolean }) {
  const [text, setText] = useState("");
  const submit = () => { const t = text.trim(); if (!t || disabled) return; onSend(t); setText(""); };
  return (
    <div className="border-t p-3">
      <div className="max-w-3xl mx-auto flex items-end gap-2">
        <Textarea
          value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder="Posez votre question à LTPC AI…"
          rows={2} className="resize-none"
        />
        <Button onClick={submit} disabled={disabled || !text.trim()}>
          {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
          Analyser
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground text-center mt-1">
        LTPC AI ne répond qu'à partir de vos données internes et cite ses sources. Vérifiez toujours les décisions critiques.
      </p>
    </div>
  );
}
