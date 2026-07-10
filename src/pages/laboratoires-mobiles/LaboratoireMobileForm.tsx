import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Truck, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  useLaboratoireMobile, 
  useCreateLaboratoireMobile, 
  useUpdateLaboratoireMobile,
  useLaboratoiresMobiles
} from "@/hooks/useLaboratoiresMobiles";
import { useIntervenants } from "@/hooks/useIntervenants";
import { useClients } from "@/hooks/useClients";
import { useChantiers } from "@/hooks/useChantiers";
import { useEchantillonsCompression } from "@/hooks/useEchantillonsCompression";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function LaboratoireMobileForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEditing = !!id;

  const { data: labo, isLoading: laboLoading } = useLaboratoireMobile(id || "");
  const { data: intervenants } = useIntervenants();
  const { data: clients } = useClients();
  const { data: allChantiers } = useChantiers();
  const { data: echantillonsCompression } = useEchantillonsCompression();
  const { data: allLabosMobiles } = useLaboratoiresMobiles();
  const createMutation = useCreateLaboratoireMobile();
  const updateMutation = useUpdateLaboratoireMobile();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    client_id: "",
    chantier_id: "",
    date_debut: null as Date | null,
    date_fin: null as Date | null,
    statut: "en_cours",
    responsable_id: "",
    date_affectation: null as Date | null,
    date_fin_affectation: null as Date | null,
    notes_affectation: "",
  });

  // Get chantiers used in compression tests
  const chantiersInCompression = useMemo(() => {
    if (!echantillonsCompression) return new Set<string>();
    return new Set(
      echantillonsCompression
        .filter(e => e.chantier_id)
        .map(e => e.chantier_id as string)
    );
  }, [echantillonsCompression]);

  // Get chantiers already used in other laboratoires mobiles
  const chantiersInLaboMobile = useMemo(() => {
    if (!allLabosMobiles) return new Set<string>();
    return new Set(
      allLabosMobiles
        .filter(l => l.chantier_id && l.id !== id) // Exclude current labo if editing
        .map(l => l.chantier_id as string)
    );
  }, [allLabosMobiles, id]);

  // Filter chantiers by selected client
  const filteredChantiers = useMemo(() => {
    if (!allChantiers || !formData.client_id) return [];
    return allChantiers.filter(c => c.client_id === formData.client_id);
  }, [allChantiers, formData.client_id]);

  // Filter technicians only
  const techniciens = useMemo(() => {
    if (!intervenants) return [];
    return intervenants.filter(i => 
      i.postes?.nom?.toLowerCase().includes("technicien")
    );
  }, [intervenants]);

  useEffect(() => {
    if (labo) {
      const chantier = allChantiers?.find(c => c.id === labo.chantier_id);
      // Prefer chantier status when it's already normalized to en_cours/termine
      const chantierStatut = chantier?.statut;
      const rawStatut = (chantierStatut === "en_cours" || chantierStatut === "termine")
        ? chantierStatut
        : (labo.statut === "termine" ? "termine" : "en_cours");
      setFormData({
        client_id: labo.client_id || "",
        chantier_id: labo.chantier_id || "",
        date_debut: labo.date_debut ? new Date(labo.date_debut) : (chantier?.date_debut ? new Date(chantier.date_debut) : null),
        date_fin: labo.date_fin ? new Date(labo.date_fin) : (chantier?.date_fin ? new Date(chantier.date_fin) : null),
        statut: rawStatut,
        responsable_id: labo.responsable_id || "",
        date_affectation: (labo as any).date_affectation ? new Date((labo as any).date_affectation) : null,
        date_fin_affectation: (labo as any).date_fin_affectation ? new Date((labo as any).date_fin_affectation) : null,
        notes_affectation: (labo as any).notes_affectation || "",
      });
    }
  }, [labo, allChantiers]);

  // Reset chantier when client changes
  useEffect(() => {
    if (!isEditing && formData.client_id) {
      setFormData(prev => ({ ...prev, chantier_id: "" }));
    }
  }, [formData.client_id, isEditing]);

  // Auto-import date_debut + date_affectation from chantier
  useEffect(() => {
    if (formData.chantier_id && allChantiers) {
      const selectedChantier = allChantiers.find(c => c.id === formData.chantier_id);
      if (selectedChantier?.date_debut) {
        const d = new Date(selectedChantier.date_debut as string);
        setFormData(prev => ({
          ...prev,
          date_debut: prev.date_debut ?? d,
          date_affectation: prev.date_affectation ?? d,
        }));
      }
    }
  }, [formData.chantier_id, allChantiers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_id || !formData.chantier_id) {
      toast({ 
        title: "Erreur", 
        description: "Veuillez sélectionner un client et un chantier", 
        variant: "destructive" 
      });
      return;
    }

    try {
      // Generate nom from client and chantier
      const selectedClient = clients?.find(c => c.id === formData.client_id);
      const selectedChantier = allChantiers?.find(c => c.id === formData.chantier_id);
      const nom = `${selectedClient?.nom || ""} - ${selectedChantier?.nom || ""}`;

      const dataToSubmit: any = {
        nom,
        client_id: formData.client_id,
        chantier_id: formData.chantier_id,
        date_debut: formData.date_debut ? format(formData.date_debut, "yyyy-MM-dd") : null,
        date_fin: formData.date_fin ? format(formData.date_fin, "yyyy-MM-dd") : null,
        statut: formData.statut,
        responsable_id: formData.responsable_id || null,
        date_affectation: formData.date_affectation ? format(formData.date_affectation, "yyyy-MM-dd") : null,
        date_fin_affectation: formData.date_fin_affectation ? format(formData.date_fin_affectation, "yyyy-MM-dd") : null,
        notes_affectation: formData.notes_affectation || null,
      };

      if (isEditing) {
        await updateMutation.mutateAsync({
          id,
          ...dataToSubmit,
        });
        toast({ title: "Succès", description: "Laboratoire mobile mis à jour" });
      } else {
        await createMutation.mutateAsync(dataToSubmit);
        toast({ title: "Succès", description: "Laboratoire mobile créé" });
      }
      navigate("/laboratoires-mobiles");
    } catch (error) {
      toast({ 
        title: "Erreur", 
        description: "Une erreur est survenue", 
        variant: "destructive" 
      });
    }
  };

  if (isEditing && laboLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/laboratoires-mobiles")} className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? "Modifier le laboratoire" : "Nouveau laboratoire mobile"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Modifier les informations du laboratoire" : "Ajouter un nouveau laboratoire mobile"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Informations du laboratoire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Client et Chantier */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select 
                  value={formData.client_id} 
                  onValueChange={(v) => setFormData({ ...formData, client_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="chantier">Chantier *</Label>
                <Select 
                  value={formData.chantier_id} 
                  onValueChange={(v) => setFormData({ ...formData, chantier_id: v })}
                  disabled={!formData.client_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.client_id ? "Sélectionner un chantier" : "Sélectionner d'abord un client"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredChantiers?.map((chantier) => {
                      const inCompression = chantiersInCompression.has(chantier.id);
                      const isDisabled = inCompression;
                      const disabledReason = inCompression ? "(Utilisé en compression)" : "";

                      return (
                        <SelectItem 
                          key={chantier.id} 
                          value={chantier.id}
                          disabled={isDisabled}
                          className={cn(isDisabled && "opacity-50")}
                        >
                          {chantier.nom} {disabledReason}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Date début *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date_debut && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date_debut ? (
                        format(formData.date_debut, "PPP", { locale: fr })
                      ) : (
                        <span>Sélectionner une date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date_debut || undefined}
                      onSelect={(date) => setFormData({ ...formData, date_debut: date || null })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Date fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date_fin && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date_fin ? (
                        format(formData.date_fin, "PPP", { locale: fr })
                      ) : (
                        <span>Sélectionner une date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date_fin || undefined}
                      onSelect={(date) => setFormData({ ...formData, date_fin: date || null })}
                      disabled={(date) => formData.date_debut ? date < formData.date_debut : false}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Statut et Technicien */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="statut">Statut</Label>
                <Select 
                  value={formData.statut} 
                  onValueChange={(v) => setFormData({ ...formData, statut: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="termine">Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="technicien">Technicien affecté</Label>
                <Select 
                  value={formData.responsable_id} 
                  onValueChange={(v) => setFormData({ ...formData, responsable_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un technicien" />
                  </SelectTrigger>
                  <SelectContent>
                    {techniciens?.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.prenom} {tech.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Détails de l'affectation du technicien */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground">Affectation du technicien</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Date d'affectation</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.date_affectation && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date_affectation
                          ? format(formData.date_affectation, "PPP", { locale: fr })
                          : <span>Sélectionner une date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date_affectation || undefined}
                        onSelect={(d) => setFormData({ ...formData, date_affectation: d || null })}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Date de fin d'affectation</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.date_fin_affectation && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date_fin_affectation
                          ? format(formData.date_fin_affectation, "PPP", { locale: fr })
                          : <span>Sélectionner une date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date_fin_affectation || undefined}
                        onSelect={(d) => setFormData({ ...formData, date_fin_affectation: d || null })}
                        disabled={(date) => formData.date_affectation ? date < formData.date_affectation : false}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes_affectation">Notes d'affectation</Label>
                <Textarea
                  id="notes_affectation"
                  rows={3}
                  placeholder="Instructions spéciales, équipements requis..."
                  value={formData.notes_affectation}
                  onChange={(e) => setFormData({ ...formData, notes_affectation: e.target.value })}
                />
              </div>
            </div>


            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate("/laboratoires-mobiles")}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? "Enregistrer" : "Créer"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}