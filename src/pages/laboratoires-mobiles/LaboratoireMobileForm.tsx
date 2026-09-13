import { useState, useEffect, useMemo, useRef } from "react";
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
import { DateTextField } from "@/components/ui/date-text-field";

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

  const effectiveClientId = formData.client_id || (isEditing ? labo?.client_id || "" : "");
  const effectiveChantierId = formData.chantier_id || (
    isEditing && effectiveClientId === (labo?.client_id || "") ? labo?.chantier_id || "" : ""
  );
  const effectiveResponsableId = formData.responsable_id || (isEditing ? labo?.responsable_id || "" : "");

  const currentChantierOption = useMemo(() => {
    if (!effectiveChantierId) return null;
    const existing = allChantiers?.find(c => c.id === effectiveChantierId);
    if (existing) return existing;
    if (labo?.chantiers?.id === effectiveChantierId) {
      return {
        id: labo.chantiers.id,
        client_id: effectiveClientId || labo.client_id || null,
        nom: labo.chantiers.nom,
        adresse: null,
        ville: labo.chantiers.ville ?? null,
        contact: null,
        telephone: null,
        description: null,
        statut: labo.statut || "en_cours",
        date_debut: labo.date_debut,
        date_fin: labo.date_fin,
        created_at: "",
        updated_at: "",
      };
    }
    return null;
  }, [allChantiers, effectiveChantierId, effectiveClientId, labo]);

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
    if (!effectiveClientId) return [];
    const list = allChantiers?.filter(c => c.client_id === effectiveClientId) ?? [];
    if (currentChantierOption && !list.some(c => c.id === currentChantierOption.id)) {
      return [...list, currentChantierOption];
    }
    return list;
  }, [allChantiers, effectiveClientId, currentChantierOption]);

  // Filter technicians only
  const techniciens = useMemo(() => {
    if (!intervenants) return [];
    return intervenants.filter(i => 
      i.postes?.nom?.toLowerCase().includes("technicien")
    );
  }, [intervenants]);

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!labo || hasInitializedRef.current) return;
    // Wait for chantiers so we can prefer the chantier's persisted statut/dates
    if (isEditing && !allChantiers) return;
    const chantier = allChantiers?.find(c => c.id === labo.chantier_id);
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
    hasInitializedRef.current = true;
  }, [labo, allChantiers, isEditing]);

  // Reset chantier when client changes (only after initial load, and only if user changes it manually)
  useEffect(() => {
    if (!hasInitializedRef.current) return;
    // Skip if current chantier still belongs to the selected client
    if (!formData.client_id) return;
    if (!formData.chantier_id) return;
    const currentChantier = allChantiers?.find(c => c.id === formData.chantier_id);
    if (currentChantier && currentChantier.client_id !== formData.client_id) {
      setFormData(prev => ({ ...prev, chantier_id: "" }));
    }
  }, [formData.client_id, formData.chantier_id, allChantiers]);

  // Auto-import date_debut + date_affectation from chantier
  useEffect(() => {
    if (effectiveChantierId && allChantiers) {
      const selectedChantier = allChantiers.find(c => c.id === effectiveChantierId);
      if (selectedChantier?.date_debut) {
        const d = new Date(selectedChantier.date_debut as string);
        setFormData(prev => ({
          ...prev,
          date_debut: prev.date_debut ?? d,
          date_affectation: prev.date_affectation ?? d,
        }));
      }
    }
  }, [effectiveChantierId, allChantiers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!effectiveClientId || !effectiveChantierId) {
      toast({ 
        title: "Erreur", 
        description: "Veuillez sélectionner un client et un chantier", 
        variant: "destructive" 
      });
      return;
    }

    try {
      const clientId = effectiveClientId;
      const chantierId = effectiveChantierId;
      const responsableId = effectiveResponsableId;

      // Generate nom from client and chantier
      const selectedClient = clients?.find(c => c.id === clientId) || labo?.clients;
      const selectedChantier = allChantiers?.find(c => c.id === chantierId) || currentChantierOption || labo?.chantiers;
      const nom = `${selectedClient?.nom || ""} - ${selectedChantier?.nom || ""}`;

      const dataToSubmit: any = {
        nom,
        client_id: clientId,
        chantier_id: chantierId,
        date_debut: formData.date_debut ? format(formData.date_debut, "yyyy-MM-dd") : null,
        date_fin: formData.date_fin ? format(formData.date_fin, "yyyy-MM-dd") : null,
        statut: formData.statut,
        responsable_id: responsableId || null,
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

      // Sync statut + dates on the chantier so the widget reflects the choice
      if (chantierId) {
        await supabase
          .from("chantiers")
          .update({
            statut: formData.statut,
            date_debut: dataToSubmit.date_debut,
            date_fin: dataToSubmit.date_fin,
          })
          .eq("id", chantierId);
        queryClient.invalidateQueries({ queryKey: ["chantiers"] });
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
                  value={effectiveClientId} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, client_id: v, chantier_id: prev.client_id === v ? prev.chantier_id : "" }))}
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
                  key={`chantier-${effectiveClientId}-${effectiveChantierId}`}
                  value={effectiveChantierId} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, chantier_id: v }))}
                  disabled={!effectiveClientId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={effectiveClientId ? "Sélectionner un chantier" : "Sélectionner d'abord un client"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredChantiers?.map((chantier) => {
                      const isCurrent = chantier.id === effectiveChantierId;
                      const inCompression = chantiersInCompression.has(chantier.id);
                      const isDisabled = inCompression && !isCurrent;
                      const disabledReason = inCompression && !isCurrent ? "(Utilisé en compression)" : "";

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
                <DateTextField value={formData.date_debut || undefined} onSelect={(date) => setFormData({ ...formData, date_debut: date || null })} />
              </div>
              <div className="space-y-2">
                <Label>Date fin</Label>
                <DateTextField value={formData.date_fin || undefined} onSelect={(date) => setFormData({ ...formData, date_fin: date || null })} />
              </div>
            </div>

            {/* Statut et Technicien */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="statut">Statut</Label>
                <Select 
                  value={formData.statut} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, statut: v }))}
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
                  key={`technicien-${effectiveResponsableId}`}
                  value={effectiveResponsableId} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, responsable_id: v }))}
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
                  <DateTextField value={formData.date_affectation || undefined} onSelect={(d) => setFormData({ ...formData, date_affectation: d || null })} />
                </div>
                <div className="space-y-2">
                  <Label>Date de fin d'affectation</Label>
                  <DateTextField value={formData.date_fin_affectation || undefined} onSelect={(d) => setFormData({ ...formData, date_fin_affectation: d || null })} />
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