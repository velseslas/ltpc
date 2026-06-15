import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClients } from "@/hooks/useClients";
import { useChantiers } from "@/hooks/useChantiers";
import { useDuplicateEssai } from "@/hooks/useDuplicateEssai";

type IdentField =
  | "client_id"
  | "chantier_id"
  | "ouvrage"
  | "partie_ouvrage"
  | "localisation"
  | "date_prelevement"
  | "date_coulage"
  | "date_essai"
  | "date_reception"
  | "produit"
  | "type_sol"
  | "observations";

const FIELD_LABEL: Record<IdentField, string> = {
  client_id: "Client",
  chantier_id: "Chantier",
  ouvrage: "Ouvrage",
  partie_ouvrage: "Partie d'ouvrage",
  localisation: "Localisation",
  date_prelevement: "Date de prélèvement",
  date_coulage: "Date de coulage",
  date_essai: "Date d'essai",
  date_reception: "Date de réception",
  produit: "Produit",
  type_sol: "Type de sol",
  observations: "Observations",
};

const DATE_FIELDS = new Set<IdentField>(["date_prelevement", "date_coulage", "date_essai", "date_reception"]);
const TEXTAREA_FIELDS = new Set<IdentField>(["observations"]);

export interface DuplicateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  sourceId: string;
  reportRoute: (id: string) => string;
  invalidateKeys?: string[];
  title?: string;
}

export function DuplicateReportDialog({
  open,
  onOpenChange,
  tableName,
  sourceId,
  reportRoute,
  invalidateKeys,
  title = "Dupliquer le rapport",
}: DuplicateReportDialogProps) {
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<Record<string, any> | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});

  const { data: clients = [] } = useClients();
  const { data: chantiers = [] } = useChantiers();
  const { duplicate, isDuplicating } = useDuplicateEssai({ tableName, reportRoute, invalidateKeys });

  // Detect which identification fields exist on this table
  const fields = useMemo<IdentField[]>(() => {
    if (!source) return [];
    return (Object.keys(FIELD_LABEL) as IdentField[]).filter((f) => f in source);
  }, [source]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await (supabase as any).from(tableName).select("*").eq("id", sourceId).single();
      if (cancelled) return;
      if (error || !data) {
        setSource(null);
        setLoading(false);
        return;
      }
      setSource(data);
      // Pre-fill all identification fields except dates (let user pick fresh dates)
      const initial: Record<string, any> = {};
      for (const f of Object.keys(FIELD_LABEL) as IdentField[]) {
        if (f in data) initial[f] = data[f] ?? "";
      }
      setValues(initial);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, sourceId, tableName]);

  const filteredChantiers = useMemo(() => {
    const cid = values.client_id;
    if (!cid) return chantiers;
    return chantiers.filter((c: any) => c.client_id === cid);
  }, [chantiers, values.client_id]);

  const update = (k: string, v: any) => setValues((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    // Only include keys that exist on the table
    const overrides: Record<string, any> = {};
    for (const f of fields) {
      overrides[f] = values[f] === "" ? null : values[f];
    }
    await duplicate(sourceId, overrides);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Le N° d'échantillon sera attribué automatiquement. Tous les résultats d'analyse seront copiés.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !source ? (
          <p className="text-sm text-destructive py-6">Échantillon source introuvable.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            {fields.map((f) => {
              if (f === "client_id") {
                return (
                  <div key={f} className="space-y-2">
                    <Label>{FIELD_LABEL[f]}</Label>
                    <Select value={values.client_id || ""} onValueChange={(v) => { update("client_id", v); update("chantier_id", ""); }}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
                        {clients.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              }
              if (f === "chantier_id") {
                return (
                  <div key={f} className="space-y-2">
                    <Label>{FIELD_LABEL[f]}</Label>
                    <Select value={values.chantier_id || ""} onValueChange={(v) => update("chantier_id", v)}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
                        {filteredChantiers.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              }
              if (TEXTAREA_FIELDS.has(f)) {
                return (
                  <div key={f} className="space-y-2 md:col-span-2">
                    <Label>{FIELD_LABEL[f]}</Label>
                    <Textarea value={values[f] || ""} onChange={(e) => update(f, e.target.value)} />
                  </div>
                );
              }
              return (
                <div key={f} className="space-y-2">
                  <Label>{FIELD_LABEL[f]}</Label>
                  <Input
                    type={DATE_FIELDS.has(f) ? "date" : "text"}
                    value={values[f] ? (DATE_FIELDS.has(f) ? String(values[f]).slice(0, 10) : values[f]) : ""}
                    onChange={(e) => update(f, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDuplicating}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={loading || isDuplicating || !source} className="gradient-primary text-primary-foreground">
            {isDuplicating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
