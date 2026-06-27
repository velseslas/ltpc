// Persistance et application des préférences UI locales (paramètres > Système)

export type UIPrefs = {
  compactMode: boolean;
  animations: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundNotifications: boolean;
  notifEssais: boolean;
  notifFacturation: boolean;
  notifMateriel: boolean;
  notifRH: boolean;
  debugMode: boolean;
  autoBackup: boolean;
  backupFrequency: string;
  dataRetention: string;
  paginationDefault: string;
  sessionTimeout: string;
  autoSave: boolean;
  theme: string;
  couleurAccent: string;
};

const KEY = "ui_prefs_v1";

export const DEFAULT_PREFS: UIPrefs = {
  compactMode: false,
  animations: true,
  emailNotifications: true,
  pushNotifications: false,
  soundNotifications: true,
  notifEssais: true,
  notifFacturation: true,
  notifMateriel: true,
  notifRH: false,
  debugMode: false,
  autoBackup: true,
  backupFrequency: "daily",
  dataRetention: "365",
  paginationDefault: "25",
  sessionTimeout: "30",
  autoSave: true,
  theme: "dark",
  couleurAccent: "cyan",
};

export function loadPrefs(): UIPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: Partial<UIPrefs>) {
  try {
    const current = loadPrefs();
    const next = { ...current, ...prefs };
    localStorage.setItem(KEY, JSON.stringify(next));
    applyPrefs(next);
    window.dispatchEvent(new Event("ui-prefs-change"));
  } catch {
    /* noop */
  }
}

export function applyPrefs(prefs: UIPrefs = loadPrefs()) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Thème
  const sysDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  const isDark = prefs.theme === "dark" || (prefs.theme === "system" && sysDark);
  root.classList.toggle("dark", isDark);
  root.classList.toggle("light", !isDark);

  // Densité & animations (consommables via CSS au besoin)
  root.dataset.compact = prefs.compactMode ? "on" : "off";
  root.dataset.animations = prefs.animations ? "on" : "off";
  if (!prefs.animations) {
    root.style.setProperty("--app-animation-duration", "0s");
  } else {
    root.style.removeProperty("--app-animation-duration");
  }
  root.dataset.debug = prefs.debugMode ? "on" : "off";
}

export function clearAppCache(): { keysCleared: number } {
  let cleared = 0;
  try {
    // Préserver l'auth Supabase et les prefs critiques
    const preserveKeys = Object.keys(localStorage).filter(
      (k) => k.startsWith("sb-") || k === "app_maintenance_mode" || k === KEY
    );
    const preserved: Record<string, string> = {};
    for (const k of preserveKeys) preserved[k] = localStorage.getItem(k) ?? "";

    cleared = localStorage.length - preserveKeys.length;
    localStorage.clear();
    for (const [k, v] of Object.entries(preserved)) localStorage.setItem(k, v);

    sessionStorage.clear();
  } catch {
    /* noop */
  }
  return { keysCleared: Math.max(0, cleared) };
}
