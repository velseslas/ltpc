// Phase 8 — Préparation Phase 9 : surface d'API Push / Notifications /
// Permissions. AUCUNE souscription réelle n'est effectuée ici.

export const permissionManager = {
  isSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window;
  },
  current(): NotificationPermission | "unsupported" {
    if (!this.isSupported()) return "unsupported";
    return Notification.permission;
  },
  async request(): Promise<NotificationPermission | "unsupported"> {
    if (!this.isSupported()) return "unsupported";
    try { return await Notification.requestPermission(); }
    catch { return "denied"; }
  },
};

export const notificationManager = {
  isSupported(): boolean { return permissionManager.isSupported(); },
  /** Affichage local uniquement (pas de push serveur). Sans effet si permission absente. */
  async show(title: string, options?: NotificationOptions): Promise<boolean> {
    if (!this.isSupported()) return false;
    if (Notification.permission !== "granted") return false;
    try {
      const reg = await navigator.serviceWorker?.getRegistration?.();
      if (reg) { await reg.showNotification(title, options); return true; }
      new Notification(title, options);
      return true;
    } catch { return false; }
  },
};

export const pushManager = {
  isSupported(): boolean {
    return typeof window !== "undefined"
      && "serviceWorker" in navigator
      && "PushManager" in window;
  },
  /** Récupère l'abonnement Push existant (jamais de subscribe ici — voir Phase 9). */
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.isSupported()) return null;
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      return (await reg?.pushManager.getSubscription()) ?? null;
    } catch { return null; }
  },
  /** Réservé Phase 9. */
  async subscribe(_applicationServerKey: string | Uint8Array): Promise<PushSubscription | null> {
    void _applicationServerKey;
    return null;
  },
};
