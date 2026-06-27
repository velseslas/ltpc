import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types
export interface TauxTVA {
  id: string;
  nom: string;
  taux: number;
  description: string | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface ParametresFacturation {
  id: string;
  prefixe_facture: string;
  prochain_numero_facture: number;
  prefixe_devis: string;
  prochain_numero_devis: number;
  delai_paiement: number;
  penalite_retard: number;
  mention_legale: string | null;
  conditions_paiement: string | null;
  banque_nom: string | null;
  banque_iban: string | null;
  banque_bic: string | null;
  banque_rib: string | null;
}

export interface ParametresSecurite {
  id: string;
  longueur_mot_passe: number;
  exiger_majuscule: boolean;
  exiger_chiffre: boolean;
  exiger_special: boolean;
  duree_session: number;
  tentatives_max: number;
  duree_blocage: number;
  activer_2fa: boolean;
  journal_connexions: boolean;
  journal_modifications: boolean;
}

export interface ParametresNotifications {
  id: string;
  email_nouveaux_essais: boolean;
  email_resultats: boolean;
  email_alertes: boolean;
  email_rapports: boolean;
  push_nouveaux_essais: boolean;
  push_resultats: boolean;
  push_alertes: boolean;
  push_rappels: boolean;
  sms_alertes_critiques: boolean;
  sms_rappels_urgents: boolean;
}

export interface ParametresSignature {
  id: string;
  signature_auto: boolean;
  cachet_auto: boolean;
  position_signature: string;
  position_cachet: string;
  inclure_date: boolean;
  inclure_nom: boolean;
}

export interface ParametresQRCode {
  id: string;
  activer_qrcode: boolean;
  taille_qrcode: string;
  position_qrcode: string;
  inclure_logo: boolean;
  couleur_qrcode: string;
  url_base: string | null;
}

export interface ParametresSysteme {
  id: string;
  langue: string;
  fuseau_horaire: string;
  format_date: string;
  format_nombre: string;
  theme: string;
  couleur_accent: string;
  logo_header: boolean;
  nom_application: string | null;
}

export interface JournalAudit {
  id: string;
  utilisateur_id: string | null;
  utilisateur_nom: string | null;
  action: string;
  type: string;
  cible: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface Utilisateur {
  id: string;
  user_id: string | null;
  nom: string;
  email: string;
  role: string;
  statut: string;
  derniere_connexion: string | null;
  poste_id: string | null;
  intervenant_id: string | null;
  created_at: string;
  updated_at: string;
}

// Taux TVA hooks
export function useTauxTVA() {
  return useQuery({
    queryKey: ["taux_tva"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("taux_tva")
        .select("*")
        .order("taux", { ascending: true });
      if (error) throw error;
      return data as TauxTVA[];
    },
  });
}

export function useCreateTauxTVA() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tva: Omit<TauxTVA, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("taux_tva").insert(tva).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taux_tva"] });
      toast.success("Taux TVA créé avec succès");
    },
    onError: () => toast.error("Erreur lors de la création"),
  });
}

export function useUpdateTauxTVA() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TauxTVA> & { id: string }) => {
      const { data, error } = await supabase.from("taux_tva").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taux_tva"] });
      toast.success("Taux TVA mis à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });
}

export function useDeleteTauxTVA() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("taux_tva").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taux_tva"] });
      toast.success("Taux TVA supprimé");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });
}

// Parametres Facturation hooks
export function useParametresFacturation() {
  return useQuery({
    queryKey: ["parametres_facturation"],
    queryFn: async () => {
      const { data, error } = await supabase.from("parametres_facturation").select("*").single();
      if (error && error.code !== "PGRST116") throw error;
      return data as ParametresFacturation | null;
    },
  });
}

export function useUpsertParametresFacturation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: Partial<ParametresFacturation>) => {
      const { data: existing } = await supabase.from("parametres_facturation").select("id").single();
      if (existing) {
        const { data, error } = await supabase.from("parametres_facturation").update(params).eq("id", existing.id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from("parametres_facturation").insert(params).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parametres_facturation"] });
      toast.success("Paramètres de facturation enregistrés");
    },
    onError: () => toast.error("Erreur lors de l'enregistrement"),
  });
}

// Parametres Securite hooks
export function useParametresSecurite() {
  return useQuery({
    queryKey: ["parametres_securite"],
    queryFn: async () => {
      const { data, error } = await supabase.from("parametres_securite").select("*").single();
      if (error && error.code !== "PGRST116") throw error;
      return data as ParametresSecurite | null;
    },
  });
}

export function useUpsertParametresSecurite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: Partial<ParametresSecurite>) => {
      const { data: existing } = await supabase.from("parametres_securite").select("id").single();
      if (existing) {
        const { data, error } = await supabase.from("parametres_securite").update(params).eq("id", existing.id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from("parametres_securite").insert(params).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parametres_securite"] });
      toast.success("Paramètres de sécurité enregistrés");
    },
    onError: () => toast.error("Erreur lors de l'enregistrement"),
  });
}

// Parametres Notifications hooks
export function useParametresNotifications() {
  return useQuery({
    queryKey: ["parametres_notifications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("parametres_notifications").select("*").single();
      if (error && error.code !== "PGRST116") throw error;
      return data as ParametresNotifications | null;
    },
  });
}

export function useUpsertParametresNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: Partial<ParametresNotifications>) => {
      const { data: existing } = await supabase.from("parametres_notifications").select("id").single();
      if (existing) {
        const { data, error } = await supabase.from("parametres_notifications").update(params).eq("id", existing.id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from("parametres_notifications").insert(params).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parametres_notifications"] });
      toast.success("Paramètres de notifications enregistrés");
    },
    onError: () => toast.error("Erreur lors de l'enregistrement"),
  });
}

// Parametres Signature hooks
export function useParametresSignature() {
  return useQuery({
    queryKey: ["parametres_signature"],
    queryFn: async () => {
      const { data, error } = await supabase.from("parametres_signature").select("*").single();
      if (error && error.code !== "PGRST116") throw error;
      return data as ParametresSignature | null;
    },
  });
}

export function useUpsertParametresSignature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: Partial<ParametresSignature>) => {
      const { data: existing } = await supabase.from("parametres_signature").select("id").single();
      if (existing) {
        const { data, error } = await supabase.from("parametres_signature").update(params).eq("id", existing.id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from("parametres_signature").insert(params).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parametres_signature"] });
      toast.success("Paramètres de signature enregistrés");
    },
    onError: () => toast.error("Erreur lors de l'enregistrement"),
  });
}

// Parametres QRCode hooks
export function useParametresQRCode() {
  return useQuery({
    queryKey: ["parametres_qrcode"],
    queryFn: async () => {
      const { data, error } = await supabase.from("parametres_qrcode").select("*").single();
      if (error && error.code !== "PGRST116") throw error;
      return data as ParametresQRCode | null;
    },
  });
}

export function useUpsertParametresQRCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: Partial<ParametresQRCode>) => {
      const { data: existing } = await supabase.from("parametres_qrcode").select("id").single();
      if (existing) {
        const { data, error } = await supabase.from("parametres_qrcode").update(params).eq("id", existing.id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from("parametres_qrcode").insert(params).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parametres_qrcode"] });
      queryClient.invalidateQueries({ queryKey: ["parametres_qrcode_public"] });
      toast.success("Paramètres QR Code enregistrés");
    },
    onError: () => toast.error("Erreur lors de l'enregistrement"),
  });
}

// Parametres Systeme hooks
export function useParametresSysteme() {
  return useQuery({
    queryKey: ["parametres_systeme"],
    queryFn: async () => {
      const { data, error } = await supabase.from("parametres_systeme").select("*").single();
      if (error && error.code !== "PGRST116") throw error;
      return data as ParametresSysteme | null;
    },
  });
}

export function useUpsertParametresSysteme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: Partial<ParametresSysteme>) => {
      const { data: existing } = await supabase.from("parametres_systeme").select("id").single();
      if (existing) {
        const { data, error } = await supabase.from("parametres_systeme").update(params).eq("id", existing.id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from("parametres_systeme").insert(params).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parametres_systeme"] });
      toast.success("Paramètres système enregistrés");
    },
    onError: () => toast.error("Erreur lors de l'enregistrement"),
  });
}

// Journal Audit hooks
export function useJournalAudit(filters?: { type?: string; search?: string }) {
  return useQuery({
    queryKey: ["journal_audit", filters],
    queryFn: async () => {
      let query = supabase
        .from("journal_audit")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (filters?.type && filters.type !== "all") {
        query = query.eq("type", filters.type);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as JournalAudit[];
    },
  });
}

export function useCreateAuditLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: Omit<JournalAudit, "id" | "created_at">) => {
      const { data, error } = await supabase.from("journal_audit").insert(log).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal_audit"] });
    },
  });
}

// Utilisateurs hooks
export function useUtilisateurs() {
  return useQuery({
    queryKey: ["utilisateurs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("utilisateurs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Utilisateur[];
    },
  });
}

export function useCreateUtilisateur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (utilisateur: Omit<Utilisateur, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("utilisateurs").insert(utilisateur).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utilisateurs"] });
      toast.success("Utilisateur créé avec succès");
    },
    onError: () => toast.error("Erreur lors de la création de l'utilisateur"),
  });
}

export function useUpdateUtilisateur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Utilisateur> & { id: string }) => {
      const { data, error } = await supabase.from("utilisateurs").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utilisateurs"] });
      toast.success("Utilisateur mis à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });
}

export function useDeleteUtilisateur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("utilisateurs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utilisateurs"] });
      toast.success("Utilisateur supprimé");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });
}
