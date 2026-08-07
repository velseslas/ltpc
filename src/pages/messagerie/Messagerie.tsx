import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, MapPin, MessageSquarePlus, Search, Send, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import {
  conversationLabel,
  useConversationParticipants,
  useConversations,
  useMessagerieActions,
  useMessages,
  MESSAGE_MAX_LENGTH,
  type ConversationSummary,
} from "@/hooks/useMessagerie";
import { NewConversationDialog } from "@/components/messagerie/NewConversationDialog";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

function shortTime(iso: string) {
  const d = new Date(iso);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Hier";
  return format(d, "dd/MM/yy");
}

export default function Messagerie() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [newOpen, setNewOpen] = useState(false);

  const { data: conversations = [], isLoading } = useConversations();
  const { data: messages = [] } = useMessages(conversationId ?? null);
  const { data: names = {} } = useConversationParticipants(conversationId ?? null);
  const { sendMessage, markRead, archiveConversation } = useMessagerieActions();

  const active = useMemo(
    () => conversations.find((c) => c.id === conversationId) ?? null,
    [conversations, conversationId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const visible = conversations.filter((c) => !c.is_archived);
    if (!q) return visible;
    return visible.filter((c) =>
      [conversationLabel(c), c.chantier_nom ?? "", c.last_message_preview ?? ""]
        .join(" ").toLowerCase().includes(q)
    );
  }, [conversations, search]);

  // Marquage lu à l'ouverture d'une conversation.
  useEffect(() => {
    if (conversationId) markRead.mutate(conversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, messages.length]);

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, conversationId]);

  const handleSend = () => {
    const body = draft.trim();
    if (!body || !conversationId) return;
    setDraft("");
    sendMessage.mutate(
      { conversationId, content: body },
      {
        onError: (e) => {
          setDraft(body);
          toast({ title: "Envoi impossible", description: (e as Error).message, variant: "destructive" });
        },
      }
    );
  };

  const showList = !isMobile || !conversationId;
  const showThread = !isMobile || !!conversationId;

  const list = (
    <div className="flex flex-col h-full border-r border-border">
      <div className="p-3 space-y-3 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-semibold">Messagerie</h1>
          <Button size="sm" onClick={() => setNewOpen(true)}>
            <MessageSquarePlus className="w-4 h-4 mr-1.5" /> Nouvelle
          </Button>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Rechercher une conversation"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {isLoading && <p className="p-4 text-sm text-muted-foreground">Chargement…</p>}
        {!isLoading && filtered.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">Aucune conversation.</p>
        )}
        <ul>
          {filtered.map((c: ConversationSummary) => {
            const label = conversationLabel(c);
            const isActive = c.id === conversationId;
            return (
              <li key={c.id}>
                <button
                  onClick={() => navigate(`/messagerie/${c.id}`)}
                  className={cn(
                    "w-full text-left px-3 py-3 flex gap-3 items-center hover:bg-muted/60 transition-colors",
                    isActive && "bg-primary/10"
                  )}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="text-xs">
                      {c.type === "chantier" ? "📍" : initials(label)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{label}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {shortTime(c.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground truncate">
                        {c.last_message_preview || "Aucun message"}
                      </span>
                      {c.unread_count > 0 && (
                        <Badge className="h-5 min-w-5 justify-center px-1.5">{c.unread_count}</Badge>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </div>
  );

  const thread = (
    <div className="flex flex-col h-full min-w-0">
      {!active ? (
        <div className="flex-1 grid place-items-center text-sm text-muted-foreground p-6 text-center">
          Sélectionnez une conversation pour commencer.
        </div>
      ) : (
        <>
          <div className="p-3 border-b border-border flex items-center gap-2">
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => navigate("/messagerie")} aria-label="Retour">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{conversationLabel(active)}</p>
              {active.chantier_nom && (
                <button
                  className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary"
                  onClick={() => navigate(`/intervenant/chantiers/${active.chantier_id}`)}
                >
                  <MapPin className="w-3 h-3" /> {active.chantier_nom}
                </button>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Archiver la conversation"
              onClick={() =>
                archiveConversation.mutate(
                  { conversationId: active.id, archived: true },
                  { onSuccess: () => navigate("/messagerie") }
                )
              }
            >
              <Archive className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.map((m) => {
                const mine = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words",
                        mine ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}
                    >
                      {!mine && (
                        <p className="text-[11px] font-medium opacity-70 mb-0.5">
                          {names[m.sender_id] ?? "Utilisateur"}
                        </p>
                      )}
                      <p>{m.content}</p>
                      <p className={cn("text-[10px] mt-1", mine ? "opacity-70" : "text-muted-foreground")}>
                        {format(new Date(m.created_at), "dd/MM HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <div className="p-3 border-t border-border flex items-end gap-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MESSAGE_MAX_LENGTH))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Écrire un message…"
              rows={1}
              className="min-h-[42px] max-h-32 resize-none"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!draft.trim() || sendMessage.isPending}
              aria-label="Envoyer"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <div className="h-[calc(100dvh-11rem)] md:h-[calc(100dvh-7rem)] grid md:grid-cols-[320px_1fr] rounded-lg border border-border overflow-hidden bg-card">
        {showList && list}
        {showThread && thread}
      </div>
      <NewConversationDialog open={newOpen} onOpenChange={setNewOpen} />
    </>
  );
}
