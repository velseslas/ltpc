// Phase 8 — Toaster discret pour transitions online/offline.
// Utilise le Sonner déjà monté dans App.tsx. Jamais bloquant.
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useOnlineStatus } from "@/lib/pwa/networkStatus";

export function NetworkStatusToaster() {
  const online = useOnlineStatus();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (online) {
      toast.success("Connexion rétablie", {
        description: "Synchronisation des modifications en cours…",
        duration: 3000,
      });
    } else {
      toast.warning("Mode hors ligne", {
        description: "Vos modifications seront synchronisées au retour du réseau.",
        duration: 4000,
      });
    }
  }, [online]);
  return null;
}
