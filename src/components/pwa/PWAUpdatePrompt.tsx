// Phase 8 — Notification de mise à jour PWA (non silencieuse).
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { onUpdateAvailable } from "@/lib/pwa/serviceWorkerRegistration";

export function PWAUpdatePrompt() {
  const [reg, setReg] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => onUpdateAvailable((r) => setReg(r)), []);

  useEffect(() => {
    if (!reg) return;
    toast("Nouvelle version disponible", {
      description: "Rechargez pour bénéficier des dernières améliorations.",
      duration: Infinity,
      action: {
        label: "Recharger",
        onClick: () => {
          try {
            reg.waiting?.postMessage({ type: "SKIP_WAITING" });
          } catch { /* noop */ }
          // Petit délai pour laisser le SW activer skipWaiting proprement.
          setTimeout(() => window.location.reload(), 250);
        },
      },
    });
  }, [reg]);

  return null;
}
