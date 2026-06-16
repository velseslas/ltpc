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

function formatScalar(v: any): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Oui" : "Non";
  if (typeof v === "object") {
    const s = JSON.stringify(v);
    return s.length > 80 ? s.slice(0, 80) + "…" : s;
  }
  const s = String(v);
  return s.length > 120 ? s.slice(0, 120) + "…" : s;
}

function isPlainObject(v: any): boolean {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function getJsonDiff(oldVal: any, newVal: any): { key: string; oldV: any; newV: any }[] | null {
  // Show a per-field diff if at least one side is a plain object (JSONB column like `resultats`)
  if (!isPlainObject(oldVal) && !isPlainObject(newVal)) return null;
  const oldObj = isPlainObject(oldVal) ? oldVal : {};
  const newObj = isPlainObject(newVal) ? newVal : {};
  const keys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));
  const diffs = keys
    .filter((k) => JSON.stringify(oldObj[k]) !== JSON.stringify(newObj[k]))
    .map((k) => ({ key: k, oldV: oldObj[k], newV: newObj[k] }));
  return diffs.length > 0 ? diffs : null;
}

function ValueBadge({ value, variant }: { value: any; variant: "old" | "new" }) {
  const cls =
    variant === "old"
      ? "px-2 py-0.5 rounded bg-destructive/10 text-destructive line-through max-w-full break-all whitespace-pre-wrap"
      : "px-2 py-0.5 rounded bg-primary/10 text-primary max-w-full break-all whitespace-pre-wrap";
  return <span className={cls}>{formatScalar(value)}</span>;
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

  // Flatten: each JSON sub-field becomes its own entry
  type FlatEntry = {
    key: string;
    parentEntry: ModificationEntry;
    fieldLabel: string;
    oldV: any;
    newV: any;
    isSubField: boolean;
    subKey?: string;
  };

  const flatEntries: FlatEntry[] = [];
  for (const entry of entries) {
    const diffs = getJsonDiff(entry.old_value, entry.new_value);
    if (diffs) {
      for (const d of diffs) {
        flatEntries.push({
          key: `${entry.id}-${d.key}`,
          parentEntry: entry,
          fieldLabel: `${entry.field_name}.${d.key}`,
          oldV: d.oldV,
          newV: d.newV,
          isSubField: true,
          subKey: d.key,
        });
      }
    } else {
      flatEntries.push({
        key: entry.id,
        parentEntry: entry,
        fieldLabel: entry.field_name,
        oldV: entry.old_value,
        newV: entry.new_value,
        isSubField: false,
      });
    }
  }

  const handleRestore = (f: FlatEntry) => {
    if (f.isSubField && f.subKey) {
      const newObj = isPlainObject(f.parentEntry.new_value) ? f.parentEntry.new_value : {};
      const restoredObj = { ...newObj, [f.subKey]: f.oldV };
      restore.mutate({ ...f.parentEntry, old_value: restoredObj });
    } else {
      restore.mutate(f.parentEntry);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" />
          Historique des modifications
          <Badge variant="secondary">{flatEntries.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {flatEntries.map((f) => {
          const entry = f.parentEntry;
          return (
            <div
              key={f.key}
              className="flex flex-col md:flex-row md:items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 min-w-0"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="font-mono text-xs">
                    {f.fieldLabel}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    par <strong>{entry.modified_by_name || "Système"}</strong> le{" "}
                    {format(new Date(entry.modified_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                  </span>
                </div>
                <div className="text-sm flex items-center gap-2 flex-wrap min-w-0">
                  <ValueBadge value={f.oldV} variant="old" />
                  <span className="text-muted-foreground">→</span>
                  <ValueBadge value={f.newV} variant="new" />
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
                          Le champ <strong>{f.fieldLabel}</strong> reprendra la valeur :{" "}
                          <em>{formatScalar(f.oldV)}</em>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRestore(f)}>
                          Restaurer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
