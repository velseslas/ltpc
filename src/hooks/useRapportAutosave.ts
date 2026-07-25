// P2/15 — Autosave robuste de l'éditeur de rapport technique.
// Principes :
//  - debounce (pas une requête par frappe) ;
//  - sauvegarde du HTML de l'éditeur + `last_autosave_at` ;
//  - reprise après rechargement : brouillon local (localStorage) restauré si plus récent ;
//  - état réseau explicite (hors connexion / erreur / enregistré) ;
//  - jamais d'autosave sur un rapport officiel (valide / archive).
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AutosaveState = "idle" | "dirty" | "saving" | "saved" | "error" | "offline";

const DEBOUNCE_MS = 2500;
const localKey = (id: string) => `ltpc:rapport-draft:${id}`;

export interface LocalDraft {
  html: string;
  at: string;
}

export function readLocalDraft(rapportId: string): LocalDraft | null {
  try {
    const raw = localStorage.getItem(localKey(rapportId));
    return raw ? (JSON.parse(raw) as LocalDraft) : null;
  } catch {
    return null;
  }
}

export function clearLocalDraft(rapportId: string) {
  try { localStorage.removeItem(localKey(rapportId)); } catch { /* stockage indisponible */ }
}

export function useRapportAutosave(opts: {
  rapportId: string;
  html: string;
  enabled: boolean;
  /** HTML de référence tel que persisté en base (évite un enregistrement inutile au chargement). */
  baseline: string;
}) {
  const { rapportId, html, enabled, baseline } = opts;
  const [state, setState] = useState<AutosaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const savedRef = useRef<string>(baseline);
  const timerRef = useRef<number | null>(null);

  useEffect(() => { savedRef.current = baseline; }, [baseline]);

  const save = useCallback(async (value: string) => {
    if (!enabled || !rapportId) return;
    if (value === savedRef.current) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setState("offline");
      try { localStorage.setItem(localKey(rapportId), JSON.stringify({ html: value, at: new Date().toISOString() })); } catch { /* ignore */ }
      return;
    }
    setState("saving");
    const { error: err } = await supabase
      .from("rapports_techniques")
      .update({ editor_html: value, last_autosave_at: new Date().toISOString() } as never)
      .eq("id", rapportId);
    if (err) {
      setError(err.message);
      setState("error");
      try { localStorage.setItem(localKey(rapportId), JSON.stringify({ html: value, at: new Date().toISOString() })); } catch { /* ignore */ }
      return;
    }
    savedRef.current = value;
    clearLocalDraft(rapportId);
    setError(null);
    setLastSavedAt(new Date());
    setState("saved");
  }, [enabled, rapportId]);

  // Debounce sur les changements de contenu
  useEffect(() => {
    if (!enabled || !rapportId) return;
    if (html === savedRef.current) return;
    setState("dirty");
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => { void save(html); }, DEBOUNCE_MS);
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [html, enabled, rapportId, save]);

  // Filet réseau + fermeture d'onglet
  useEffect(() => {
    if (!enabled) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (html !== savedRef.current) {
        try { localStorage.setItem(localKey(rapportId), JSON.stringify({ html, at: new Date().toISOString() })); } catch { /* ignore */ }
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const onOnline = () => { if (html !== savedRef.current) void save(html); };
    const onOffline = () => setState("offline");
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [enabled, html, rapportId, save]);

  return { state, lastSavedAt, error, saveNow: () => save(html) };
}

export function autosaveLabel(state: AutosaveState, lastSavedAt: Date | null): string {
  switch (state) {
    case "saving": return "Enregistrement…";
    case "saved": return `Enregistré à ${(lastSavedAt ?? new Date()).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
    case "error": return "Erreur d'enregistrement";
    case "offline": return "Hors connexion — brouillon conservé localement";
    case "dirty": return "Modifications non enregistrées…";
    default: return lastSavedAt ? `Enregistré à ${lastSavedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : "Aucune modification";
  }
}
