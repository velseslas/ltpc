import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { wilayas } from "@/data/wilayas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateChantier } from "@/hooks/useChantiers";
import { toast } from "sonner";

const chantierSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  adresse: z.string().optional(),
  ville: z.string().optional(),
  statut: z.string().default("actif"),
  date_debut: z.string().optional(),
  date_fin: z.string().optional(),
});

type ChantierFormData = z.infer<typeof chantierSchema>;

interface ChantierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

export function ChantierFormDialog({ open, onOpenChange, clientId }: ChantierFormDialogProps) {
  const createChantier = useCreateChantier();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ChantierFormData>({
    resolver: zodResolver(chantierSchema),
    defaultValues: {
      nom: "",
      adresse: "",
      ville: "",
      statut: "actif",
      date_debut: "",
      date_fin: "",
    },
  });

  const onSubmit = async (data: ChantierFormData) => {
    try {
      await createChantier.mutateAsync({
        client_id: clientId,
        nom: data.nom,
        adresse: data.adresse || null,
        ville: data.ville || null,
        description: null,
        statut: data.statut,
        date_debut: data.date_debut || null,
        date_fin: data.date_fin || null,
      });
      toast.success("Chantier ajouté avec succès");
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error("Erreur lors de l'ajout du chantier");
    }
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Nouveau chantier</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Nom du chantier */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">
              Nom du chantier <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register("nom")}
              placeholder="Ex: Construction Tour Alger"
              className="bg-secondary border-0 text-foreground placeholder:text-muted-foreground"
            />
            {errors.nom && (
              <p className="text-sm text-destructive">{errors.nom.message}</p>
            )}
          </div>

          {/* Adresse */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Adresse</Label>
            <Input
              {...register("adresse")}
              placeholder="Numéro et nom de rue"
              className="bg-secondary border-0 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Ville */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Wilaya</Label>
            <Select onValueChange={(value) => setValue("ville", value)}>
              <SelectTrigger className="bg-secondary border-0 text-foreground">
                <SelectValue placeholder="Sélectionnez une wilaya" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border max-h-60">
                {wilayas.map((wilaya) => (
                  <SelectItem key={wilaya.code} value={wilaya.nom}>
                    {wilaya.code} - {wilaya.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date de début
              </Label>
              <Input
                {...register("date_debut")}
                type="date"
                className="bg-secondary border-0 text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date de fin
              </Label>
              <Input
                {...register("date_fin")}
                type="date"
                className="bg-secondary border-0 text-foreground"
              />
            </div>
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Statut</Label>
            <Select 
              defaultValue="actif"
              onValueChange={(value) => setValue("statut", value)}
            >
              <SelectTrigger className="bg-secondary border-0 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="actif">En cours</SelectItem>
                <SelectItem value="planifie">Planifié</SelectItem>
                <SelectItem value="en_pause">En pause</SelectItem>
                <SelectItem value="termine">Terminé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              className="text-foreground hover:bg-secondary"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createChantier.isPending}
              className="bg-primary/80 hover:bg-primary text-primary-foreground gap-2"
            >
              <MapPin className="w-4 h-4" />
              Ajouter le chantier
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
