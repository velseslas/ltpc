import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { useMessagerieActions, useSearchMessagingUsers } from "@/hooks/useMessagerie";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewConversationDialog({ open, onOpenChange }: Props) {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const { data: users = [], isLoading } = useSearchMessagingUsers(term);
  const { openDirectConversation } = useMessagerieActions();

  const pick = (userId: string) => {
    openDirectConversation.mutate(userId, {
      onSuccess: (id) => {
        onOpenChange(false);
        setTerm("");
        navigate(`/messagerie/${id}`);
      },
      onError: (e) =>
        toast({ title: "Impossible d'ouvrir la conversation", description: (e as Error).message, variant: "destructive" }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle conversation</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          placeholder="Rechercher un utilisateur…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <ScrollArea className="h-72">
          {isLoading && <p className="p-3 text-sm text-muted-foreground">Recherche…</p>}
          {!isLoading && users.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">Aucun utilisateur trouvé.</p>
          )}
          <ul className="space-y-1">
            {users.map((u) => (
              <li key={u.user_id}>
                <button
                  onClick={() => pick(u.user_id)}
                  disabled={openDirectConversation.isPending}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-left"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {(u.nom ?? "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{u.nom ?? "Utilisateur"}</p>
                    {u.role && <p className="text-xs text-muted-foreground truncate">{u.role}</p>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
