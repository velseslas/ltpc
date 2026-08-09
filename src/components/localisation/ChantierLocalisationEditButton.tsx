import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LocalisationPicker, type LocalisationValue } from "./LocalisationPicker";
import { usePermissionContext } from "@/hooks/usePermissionContext";
import { useUpdateChantier } from "@/hooks/useChantiers";
import type { ChantierLocalisation } from "@/lib/geo";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * LOT Localisation 15-21 — Modification de la localisation d'un chantier,
 * disponible à l'identique sur Mobile et Desktop.
 *
 * Source de vérité unique : la table `chantiers` via `useUpdateChantier`
 * (invalidation React Query existante → synchronisation Mobile ↔ Desktop).
 * Tant que « Enregistrer » n'est pas cliqué, aucune écriture en base :
 * la modification vit dans un brouillon local, « Annuler » le jette.
 */
export function ChantierLocalisationEditButton({
  chantierId,
  clientId,
  chantier,
  mode = "edit",
  size = "sm",
  className,
}: {
  chantierId?: string | null;
  clientId?: string | null;
  chantier?: ChantierLocalisation | null;
  /** "edit" = ✏️ Modifier la localisation, "add" = ➕ Ajouter la localisation */
  mode?: "edit" | "add";
  size?: "sm" | "default";
  className?: string;
}) {
  const { hasPermission } = usePermissionContext();
  const update = useUpdateChantier();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<LocalisationValue>({
    adresse_localisation: "",
    latitude: null,
    longitude: null,
  });

  // Brouillon (re)initialisé depuis la localisation enregistrée à chaque ouverture.
  useEffect(() => {
    if (!open) return;
    setDraft({
      adresse_localisation: chantier?.adresse_localisation ?? "",
      latitude: typeof chantier?.latitude === "number" ? chantier.latitude : null,
      longitude: typeof chantier?.longitude === "number" ? chantier.longitude : null,
    });
  }, [open, chantier?.adresse_localisation, chantier?.latitude, chantier?.longitude]);

  if (!chantierId || !hasPermission("chantiers.modifier")) return null;

  const cancel = () => {
    // Abandon : aucune écriture, l'ancienne position reste intacte.
    setOpen(false);
  };

  const save = async () => {
    try {
      await update.mutateAsync({
        id: chantierId,
        clientId: clientId ?? "",
        data: {
          adresse_localisation: draft.adresse_localisation?.trim() || null,
          latitude: draft.latitude,
          longitude: draft.longitude,
        },
      });
      toast.success("Localisation du chantier mise à jour");
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "Impossible d'enregistrer la localisation");
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={size}
        onClick={() => setOpen(true)}
        className={cn("min-h-[44px] gap-2", className)}
      >
        {mode === "add" ? <Plus className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
        {mode === "add" ? "Ajouter la localisation" : "Modifier la localisation"}
      </Button>

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : cancel())}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === "add" ? "Ajouter la localisation" : "Modifier la localisation"}
            </DialogTitle>
            <DialogDescription>
              Déplacez le marqueur, recherchez une adresse ou utilisez votre position
              actuelle. L'ancienne localisation est conservée tant que vous n'avez pas
              enregistré.
            </DialogDescription>
          </DialogHeader>

          <LocalisationPicker value={draft} onChange={setDraft} />

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={cancel}
              disabled={update.isPending}
              className="min-h-[44px] gap-2"
            >
              <X className="w-4 h-4" /> Annuler
            </Button>
            <Button
              type="button"
              onClick={save}
              disabled={update.isPending}
              className="min-h-[44px] gap-2 gradient-primary text-primary-foreground"
            >
              {update.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ChantierLocalisationEditButton;
