// LOT 15.1 — Helpers purs pour les messages vocaux (aucune dépendance réseau).
export const MAX_AUDIO_SECONDS = 120;
export const MAX_AUDIO_BYTES = 5 * 1024 * 1024; // 5 Mo

/** Formats acceptés côté client ET vérifiés avant upload. */
export const ALLOWED_AUDIO_MIME = [
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/aac",
] as const;

const CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg",
  "audio/mp4",
];

/** Renvoie le premier format supporté par le navigateur, ou null si l'enregistrement est impossible. */
export function pickAudioMimeType(
  supports: (t: string) => boolean = (t) =>
    typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)
): string | null {
  return CANDIDATES.find((t) => {
    try { return supports(t); } catch { return false; }
  }) ?? null;
}

export function isAllowedAudioMime(mime: string): boolean {
  const base = mime.split(";")[0].trim().toLowerCase();
  return (ALLOWED_AUDIO_MIME as readonly string[]).includes(base);
}

export function audioExtension(mime: string): string {
  const base = mime.split(";")[0].trim().toLowerCase();
  if (base === "audio/ogg") return "ogg";
  if (base === "audio/mp4" || base === "audio/aac") return "m4a";
  if (base === "audio/mpeg") return "mp3";
  return "webm";
}

/** Validation avant upload : format, taille et durée. Renvoie null si tout est bon. */
export function validateAudioUpload(input: { mime: string; size: number; duration: number }): string | null {
  if (!isAllowedAudioMime(input.mime)) return "Format audio non supporté.";
  if (input.size <= 0) return "Enregistrement vide.";
  if (input.size > MAX_AUDIO_BYTES) return "Fichier audio trop volumineux.";
  if (!Number.isFinite(input.duration) || input.duration < 1) return "Enregistrement trop court.";
  if (input.duration > MAX_AUDIO_SECONDS) return "Durée maximale atteinte.";
  return null;
}

/** Chemin Storage : conversation_id/<uuid>.<ext> (contrôlé aussi côté serveur). */
export function buildAudioPath(conversationId: string, fileId: string, mime: string): string {
  return `${conversationId}/${fileId}.${audioExtension(mime)}`;
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
