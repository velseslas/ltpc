import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Building2, Search } from "lucide-react";
import { useCentralesByClient } from "@/hooks/useCentralesByClient";
import { useChantierCentrales, useAffectCentralesToChantier } from "@/hooks/useChantierCentrales";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clientId: string;
  chantierId: string;
}

export function AffectCentraleDialog({ open, onOpenChange, clientId, chantierId }: Props) {
  const { data: clientCentrales = [] } = useCentralesByClient(clientId);
  const { data: already = [] } = useChantierCentrales(chantierId);
  const affect = useAffectCentralesToChantier();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  const alreadyIds = useMemo(() => new Set(already.map((c) => c.id)), [already]);

  const available = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (clientCentrales as any[])
      .filter((c) => !alreadyIds.has(c.id))
      .filter((c) => !q || (c.nom ?? "").toLowerCase().includes(q) || (c.ville ?? "").toLowerCase().includes(q));
  }, [clientCentrales, alreadyIds, search]);

  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  const handleConfirm = async () => {
    const ids = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
    if (!ids.length) return;
    await affect.mutateAsync({ chantierId, centraleIds: ids });
    setSelected({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Affecter une centrale à béton</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-border rounded-md border border-border">
          {available.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {(clientCentrales as any[]).length === 0
                ? "Ce client n'a aucune centrale enregistrée."
                : "Toutes les centrales du client sont déjà affectées."}
            </div>
          ) : (
            available.map((c: any) => (
              <label key={c.id} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <Checkbox checked={!!selected[c.id]} onCheckedChange={() => toggle(c.id)} />
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{c.nom}</p>
                  {c.ville && <p className="text-xs text-muted-foreground truncate">{c.ville}</p>}
                </div>
              </label>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button
            onClick={handleConfirm}
            disabled={affect.isPending || !Object.values(selected).some(Boolean)}
            className="gradient-primary text-primary-foreground"
          >
            Affecter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
