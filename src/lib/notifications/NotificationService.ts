// Phase 9 — Point d'entrée unique pour émettre des notifications.
// Combine : persistance (NotificationRepository), préférences (PreferenceService),
// affichage in-app (Sonner toast), et Push Web (à venir côté serveur).
import { toast } from "sonner";
import { NotificationRepository } from "./NotificationRepository";
import { PreferenceService } from "./PreferenceService";
import type { NotificationInput, NotificationPriority } from "./types";

function toastFor(priority: NotificationPriority, title: string, message?: string) {
  const opts = { description: message };
  switch (priority) {
    case "success":  return toast.success(title, opts);
    case "warning":  return toast.warning(title, opts);
    case "urgent":   return toast.error(title, opts);
    case "critical": return toast.error(title, { ...opts, duration: 10000 });
    default:         return toast(title, opts);
  }
}

export const NotificationService = {
  /** Émet une notification pour l'utilisateur courant. Non-bloquant, tolérant aux erreurs. */
  async emit(input: NotificationInput): Promise<void> {
    try {
      const prefs = await PreferenceService.get();
      const cat = input.category ?? "systeme";
      if (prefs && !PreferenceService.isCategoryEnabled(prefs, cat)) return;

      // Persistance (toujours si inapp_enabled OU push_enabled)
      const shouldPersist = !prefs || prefs.inapp_enabled || prefs.push_enabled;
      if (shouldPersist) await NotificationRepository.create(input);

      // Affichage in-app immédiat
      if ((!prefs || prefs.inapp_enabled) && (prefs?.frequency ?? "immediat") === "immediat") {
        toastFor(input.priority ?? "info", input.title, input.message);
      }
    } catch (e) {
      console.warn("[NotificationService] emit failed", e);
    }
  },
};

// Helpers rapides (raccourcis conservés simples et non-métier)
export const notify = {
  info:     (title: string, message?: string, extra?: Partial<NotificationInput>) => NotificationService.emit({ type: "info",    priority: "info",    title, message, ...extra }),
  success:  (title: string, message?: string, extra?: Partial<NotificationInput>) => NotificationService.emit({ type: "success", priority: "success", title, message, ...extra }),
  warning:  (title: string, message?: string, extra?: Partial<NotificationInput>) => NotificationService.emit({ type: "warning", priority: "warning", title, message, ...extra }),
  urgent:   (title: string, message?: string, extra?: Partial<NotificationInput>) => NotificationService.emit({ type: "urgent",  priority: "urgent",  title, message, ...extra }),
  critical: (title: string, message?: string, extra?: Partial<NotificationInput>) => NotificationService.emit({ type: "critical",priority: "critical",title, message, ...extra }),
  ai:       (title: string, message?: string, extra?: Partial<NotificationInput>) => NotificationService.emit({ type: "ai",      priority: "info",    title, message, source: "ai", category: "ltpc_ai", ...extra }),
};
