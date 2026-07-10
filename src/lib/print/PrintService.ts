/**
 * PrintService — moteur d'impression unique LTPC ERP.
 *
 * Objectif : centraliser tous les appels à `window.print()` derrière un
 * service unique afin de préparer la suppression progressive de
 * html2canvas / jsPDF (image) au profit du pipeline navigateur natif
 * (Microsoft Print to PDF, Save as PDF, imprimante physique).
 *
 * ⚠️  Cette phase ne migre AUCUN rapport. Elle crée uniquement
 *     l'architecture commune utilisée par les futurs lots de migration.
 *
 * Utilisation cible (post-migration) :
 *   import { PrintService } from "@/lib/print/PrintService";
 *   PrintService.printCurrentReport({ title, orientation: "portrait" });
 *
 * Aucune dépendance serveur, aucune capture DOM, compatible PWA offline.
 */

export type PrintOrientation = "portrait" | "landscape";

export interface PrintTemplateMeta {
  /** Identifiant stable du template (ex: "compression-report"). */
  id: string;
  /** Titre technique du rapport (utilisé pour document.title lors de l'impression). */
  title: string;
  /** Orientation A4 par défaut. */
  orientation?: PrintOrientation;
  /** Classe CSS additionnelle appliquée au <html> pendant l'impression. */
  htmlClass?: string;
}

type Listener = () => void | Promise<void>;

const registry = new Map<string, PrintTemplateMeta>();
const beforeListeners = new Set<Listener>();
const afterListeners = new Set<Listener>();

let installed = false;

/**
 * Installe les écouteurs globaux `beforeprint` / `afterprint`.
 * Idempotent — appelé automatiquement au premier `print()`.
 */
function ensureInstalled() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("beforeprint", () => {
    for (const cb of beforeListeners) {
      try { void cb(); } catch (e) { console.error("[PrintService] beforePrint listener", e); }
    }
  });
  window.addEventListener("afterprint", () => {
    for (const cb of afterListeners) {
      try { void cb(); } catch (e) { console.error("[PrintService] afterPrint listener", e); }
    }
  });
}

export const PrintService = {
  /**
   * Enregistre un template d'impression. Non obligatoire pour imprimer,
   * sert de catalogue pour l'inventaire et les outils de debug.
   */
  registerTemplate(meta: PrintTemplateMeta): void {
    registry.set(meta.id, meta);
  },

  getTemplate(id: string): PrintTemplateMeta | undefined {
    return registry.get(id);
  },

  listTemplates(): PrintTemplateMeta[] {
    return Array.from(registry.values());
  },

  /**
   * Enregistre un callback exécuté juste avant l'ouverture de la boîte
   * d'impression du navigateur. Retourne une fonction de désabonnement.
   */
  beforePrint(cb: Listener): () => void {
    ensureInstalled();
    beforeListeners.add(cb);
    return () => beforeListeners.delete(cb);
  },

  /**
   * Enregistre un callback exécuté après fermeture du dialogue d'impression.
   */
  afterPrint(cb: Listener): () => void {
    ensureInstalled();
    afterListeners.add(cb);
    return () => afterListeners.delete(cb);
  },

  /**
   * Lance l'impression du rapport actuellement affiché.
   * Le navigateur gère nativement l'aperçu ET l'export PDF
   * (Microsoft Print to PDF / Enregistrer en PDF).
   */
  print(options?: { title?: string; orientation?: PrintOrientation; htmlClass?: string }): void {
    if (typeof window === "undefined") return;
    ensureInstalled();

    const html = document.documentElement;
    const previousTitle = document.title;
    const orientation = options?.orientation ?? "portrait";
    const orientationClass = `print-orientation-${orientation}`;
    const extraClass = options?.htmlClass;

    html.classList.add("print-mode", orientationClass);
    if (extraClass) html.classList.add(extraClass);
    if (options?.title) document.title = options.title;

    const cleanup = () => {
      html.classList.remove("print-mode", orientationClass);
      if (extraClass) html.classList.remove(extraClass);
      if (options?.title) document.title = previousTitle;
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);

    // Laisse un tick au navigateur pour appliquer les classes CSS
    // avant d'ouvrir le dialogue d'impression.
    window.requestAnimationFrame(() => {
      try { window.print(); } finally { /* cleanup via afterprint */ }
    });
  },

  /**
   * Alias sémantique — l'aperçu et l'impression partagent la même
   * boîte de dialogue navigateur (Chrome/Edge). Réservé pour clarifier
   * l'intention côté appelant.
   */
  preview(options?: Parameters<typeof PrintService.print>[0]): void {
    PrintService.print(options);
  },

  /**
   * Imprime le rapport courant en s'appuyant sur les métadonnées
   * enregistrées. Fallback sur `print()` si aucun template n'est fourni.
   */
  printCurrentReport(input?: string | (PrintTemplateMeta & { title?: string })): void {
    if (!input) return PrintService.print();
    if (typeof input === "string") {
      const meta = registry.get(input);
      return PrintService.print(meta ? { title: meta.title, orientation: normalize(meta.orientation), htmlClass: meta.htmlClass } : undefined);
    }
    PrintService.print({
      title: input.title,
      orientation: normalize(input.orientation),
      htmlClass: input.htmlClass,
    });
  },
};

function normalize(o?: PrintOrientation): PrintOrientation {
  return o === "landscape" ? "landscape" : "portrait";
}

export default PrintService;
