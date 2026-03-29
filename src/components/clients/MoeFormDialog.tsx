import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMaitresOeuvre } from "@/hooks/useMaitresOeuvre";
import { useAddClientMaitreOeuvre } from "@/hooks/useClientMaitresOeuvre";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  existingIds: string[];
}

export function MoeFormDialog({ open, onOpenChange, clientId, existingIds }: Props) {
  const [selectedId, setSelectedId] = useState("");
  const { data: allMoe, isLoading } = useMaitresOeuvre();
  const addMoe = useAddClientMaitreOeuvre();

  const availableMoe = allMoe?.filter((m: any) => !existingIds.includes(m.id)) || [];

  const handleSubmit = async () => {
    if (!selectedId) return;
    try {
      await addMoe.mutateAsync({ clientId, maitreOeuvreId: selectedId });
      toast.success("Maître d'œuvre ajouté");
      setSelectedId("");
      onOpenChange(false);
    } catch {
      toast.error("Erreur lors de l'ajout");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>Associer un Maître d'œuvre</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>
        ) : availableMoe.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Aucun maître d'œuvre disponible. Créez-en un d'abord.</p>
        ) : (
          <div className="space-y-4">
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>
                {availableMoe.map((m: any) => (
                  <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button onClick={handleSubmit} disabled={!selectedId || addMoe.isPending}>
                {addMoe.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Ajouter
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
