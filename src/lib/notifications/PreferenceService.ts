// Phase 9 — Service unique de préférences de notifications
import { supabase } from "@/integrations/supabase/client";
import type { NotificationPreferences, NotificationCategory } from "./types";

const DEFAULTS: Omit<NotificationPreferences, "user_id"> = {
  push_enabled: true,
  inapp_enabled: true,
  email_enabled: false,
  sms_enabled: false,
  frequency: "immediat",
  disabled_categories: [],
  quiet_hours_start: null,
  quiet_hours_end: null,
};

export const PreferenceService = {
  async get(): Promise<NotificationPreferences | null> {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return null;
    const { data } = await supabase.from("notification_preferences" as never)
      .select("*").eq("user_id", uid).maybeSingle();
    if (!data) return { user_id: uid, ...DEFAULTS };
    return data as unknown as NotificationPreferences;
  },

  async save(patch: Partial<Omit<NotificationPreferences, "user_id">>): Promise<NotificationPreferences | null> {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return null;
    const current = (await this.get()) ?? { user_id: uid, ...DEFAULTS };
    const next = { ...current, ...patch, user_id: uid };
    const { data, error } = await supabase.from("notification_preferences" as never)
      .upsert(next, { onConflict: "user_id" }).select().single();
    if (error) { console.warn("[PreferenceService] save failed", error); return null; }
    return data as unknown as NotificationPreferences;
  },

  isCategoryEnabled(prefs: NotificationPreferences | null, cat: NotificationCategory): boolean {
    if (!prefs) return true;
    return !prefs.disabled_categories.includes(cat);
  },
};
