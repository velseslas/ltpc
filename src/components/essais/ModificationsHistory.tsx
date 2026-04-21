import { useModificationsHistory, useRestoreField, ModificationEntry } from "@/hooks/useModificationsHistory";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Undo2, History, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  tableName: string;
  recordId: string;
}

function formatValue(v: any): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") {
    const str = JSON.stringify(v);
    return str.length > 120 ? str.slice(0, 120) + "…" : str;
  }
  if (typeof v === "boolean") return v ? "Oui" : "Non";
  const s = String(v);
  return s.length > 200 ? s.slice(0, 200) + "…" : s;
}

export function ModificationsHistory({ tableName, recordId }: Props) {
  const { data: entries, isLoading } = useModificationsHistory(tableName, recordId);
  const isAdmin = useIsAdmin();
  const restore = useRestoreField();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <History className="h-10 w-10 mx-auto mb-2 opacity-40" />
          Aucune modification enregistrée
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" />
          Historique des modifications
          <Badge variant="secondary">{entries.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.map((entry: ModificationEntry) => (
          <div
            key={entry.id}
            className="flex flex-col md:flex-row md:items-start gap-3 p-3 rounded-lg border border-border bg-muted/30 min-w-0"
          >
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="font-mono text-xs">
                  {entry.field_name}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  par <strong>{entry.modified_by_name || "Système"}</strong> le{" "}
                  {format(new Date(entry.modified_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                </span>
              </div>
              <div className="text-sm flex items-start gap-2 flex-wrap min-w-0">
                <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive line-through max-w-full break-all whitespace-pre-wrap">
                  {formatValue(entry.old_value)}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary max-w-full break-all whitespace-pre-wrap">
                  {formatValue(entry.new_value)}
                </span>
              </div>
            </div>
            {entry.restored_at ? (
              <Badge variant="secondary" className="gap-1 whitespace-nowrap">
                <Undo2 className="h-3 w-3" />
                Restauré le {format(new Date(entry.restored_at), "dd/MM/yy HH:mm", { locale: fr })}
                {entry.restored_by_name ? ` par ${entry.restored_by_name}` : ""}
              </Badge>
            ) : (
              isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Undo2 className="h-4 w-4" />
                      Restaurer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Restaurer la modification ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Le champ <strong>{entry.field_name}</strong> reprendra la valeur :{" "}
                        <em>{formatValue(entry.old_value)}</em>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => restore.mutate(entry)}>
                        Restaurer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
