// Phase 9 — Centre de Notifications : types unifiés
export type NotificationPriority = "info" | "success" | "warning" | "urgent" | "critical";

export type NotificationCategory =
  | "laboratoire" | "essais" | "compression" | "formulation" | "granulats"
  | "geotechnique" | "rapports" | "documents" | "facturation" | "materiel"
  | "etalonnage" | "intervenants" | "rh" | "ltpc_ai" | "pwa"
  | "administration" | "systeme";

export type NotificationFrequency =
  | "immediat" | "5min" | "15min" | "30min" | "quotidien" | "hebdomadaire";

export type NotificationSource = "system" | "ai" | "user" | "workflow" | "push";

export interface PersistedNotification {
  id: string;
  user_id: string;
  type: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string | null;
  icon: string | null;
  color: string | null;
  link: string | null;
  data: Record<string, unknown>;
  source: NotificationSource;
  role: string | null;
  is_read: boolean;
  is_archived: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationInput {
  user_id?: string;
  type: string;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  message?: string;
  icon?: string;
  color?: string;
  link?: string;
  data?: Record<string, unknown>;
  source?: NotificationSource;
  role?: string;
}

export interface NotificationPreferences {
  user_id: string;
  push_enabled: boolean;
  inapp_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  frequency: NotificationFrequency;
  disabled_categories: NotificationCategory[];
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export const PRIORITY_META: Record<NotificationPriority, { label: string; color: string; order: number; icon: string }> = {
  info:     { label: "Information", color: "text-blue-400",   order: 1, icon: "Info" },
  success:  { label: "Succès",      color: "text-emerald-400", order: 2, icon: "CheckCircle2" },
  warning:  { label: "Attention",   color: "text-yellow-400", order: 3, icon: "AlertTriangle" },
  urgent:   { label: "Urgent",      color: "text-orange-400", order: 4, icon: "AlertCircle" },
  critical: { label: "Critique",    color: "text-red-500",    order: 5, icon: "ShieldAlert" },
};

export const CATEGORY_META: Record<NotificationCategory, { label: string }> = {
  // LOT 14.4 — catégories Push dédiées (échéances compression + messages reçus).
  echeance_compression: { label: "Échéances compression (Push)" },
  message_recu:   { label: "Messages reçus (Push)" },
  laboratoire:    { label: "Laboratoire" },
  essais:         { label: "Essais" },
  compression:    { label: "Compression" },
  formulation:    { label: "Formulation" },
  granulats:      { label: "Granulats" },
  geotechnique:   { label: "Géotechnique" },
  rapports:       { label: "Rapports" },
  documents:      { label: "Documents" },
  facturation:    { label: "Facturation" },
  materiel:       { label: "Matériel" },
  etalonnage:     { label: "Étalonnage" },
  intervenants:   { label: "Intervenants" },
  rh:             { label: "RH" },
  ltpc_ai:        { label: "LTPC AI" },
  pwa:            { label: "PWA" },
  administration: { label: "Administration" },
  systeme:        { label: "Système" },
};
