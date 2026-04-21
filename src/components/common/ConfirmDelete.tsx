import { ReactNode, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdminOnly } from "./AdminOnly";

interface ConfirmDeleteProps {
  /** Le déclencheur (Button, MenuItem, icône...) qui ouvre la boîte de confirmation. */
  trigger: ReactNode;
  /** Action à exécuter à la confirmation. */
  onConfirm: () => void | Promise<void>;
  /** Titre de la boîte de confirmation. */
  title?: string;
  /** Description / message. */
  description?: string;
  /** Libellé du bouton de confirmation. */
  confirmLabel?: string;
  /** Si vrai, accessible uniquement aux admins (sinon le trigger n'est pas rendu). Défaut: true. */
  adminOnly?: boolean;
}

/**
 * Wrapper standardisé pour toutes les suppressions de l'application :
 * - Masque le déclencheur si l'utilisateur n'est pas admin (par défaut).
 * - Affiche systématiquement une boîte de confirmation avant l'action.
 */
export function ConfirmDelete({
  trigger,
  onConfirm,
  title = "Confirmer la suppression",
  description = "Cette action est irréversible. Voulez-vous vraiment supprimer cet élément ?",
  confirmLabel = "Supprimer",
  adminOnly = true,
}: ConfirmDeleteProps) {
  const [open, setOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };

  const handleConfirm = async () => {
    await onConfirm();
    setOpen(false);
  };

  // On clone le trigger pour intercepter le onClick (ouvre le dialog au lieu d'exécuter directement)
  const wrappedTrigger = (
    <span onClick={handleClick} className="contents">
      {trigger}
    </span>
  );

  const content = (
    <>
      {wrappedTrigger}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  if (adminOnly) return <AdminOnly>{content}</AdminOnly>;
  return content;
}
