// LOT 15.1 — Enregistrement vocal (MediaRecorder natif, aucune dépendance externe).
import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, X, Trash2, Send, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { MAX_AUDIO_SECONDS, pickAudioMimeType, formatDuration } from "@/lib/messagerie/audio";

interface Props {
  disabled?: boolean;
  sending?: boolean;
  onSend: (blob: Blob, durationSec: number, mimeType: string) => void;
  onRecordingChange?: (recording: boolean) => void;
}

export function VoiceRecorder({ disabled, sending, onSend, onRecordingChange }: Props) {
  const [supported] = useState(() => pickAudioMimeType() !== null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [preview, setPreview] = useState<{ blob: Blob; url: string; duration: number; mime: string } | null>(null);
  const [playing, setPlaying] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /** Libère micro + timer dans tous les cas (arrêt, annulation, erreur, démontage). */
  const releaseMic = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => () => {
    releaseMic();
    if (preview) URL.revokeObjectURL(preview.url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // « actif » = enregistrement en cours OU aperçu en attente d'envoi.
  useEffect(() => { onRecordingChange?.(recording || !!preview); }, [recording, preview, onRecordingChange]);

  const stop = useCallback((cancel: boolean) => {
    cancelledRef.current = cancel;
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    else { releaseMic(); setRecording(false); }
  }, [releaseMic]);

  const start = useCallback(async () => {
    if (recording || preview) return;
    const mime = pickAudioMimeType();
    if (!mime || !navigator.mediaDevices?.getUserMedia) {
      toast({ title: "L'enregistrement vocal n'est pas disponible sur ce navigateur.", variant: "destructive" });
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      const name = (e as DOMException)?.name;
      toast({
        title: name === "NotAllowedError" || name === "SecurityError"
          ? "Microphone refusé"
          : "Microphone indisponible",
        description: name === "NotAllowedError" || name === "SecurityError"
          ? "Accès au microphone refusé. Autorisez le microphone dans les paramètres du navigateur pour enregistrer un message vocal."
          : "Aucun microphone utilisable n'a été détecté.",
        variant: "destructive",
      });
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];
    cancelledRef.current = false;
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(stream, { mimeType: mime });
    } catch {
      releaseMic();
      toast({ title: "L'enregistrement vocal n'est pas disponible sur ce navigateur.", variant: "destructive" });
      return;
    }
    recorderRef.current = rec;

    rec.ondataavailable = (ev) => { if (ev.data.size > 0) chunksRef.current.push(ev.data); };
    rec.onerror = () => {
      releaseMic();
      setRecording(false);
      toast({ title: "Erreur d'enregistrement", variant: "destructive" });
    };
    rec.onstop = () => {
      const elapsed = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      const chunks = chunksRef.current;
      chunksRef.current = [];
      releaseMic();
      setRecording(false);
      setSeconds(0);
      if (cancelledRef.current || chunks.length === 0) return;
      const blob = new Blob(chunks, { type: mime });
      setPreview({ blob, url: URL.createObjectURL(blob), duration: Math.min(elapsed, MAX_AUDIO_SECONDS), mime });
    };

    const startedAt = Date.now();
    rec.start();
    setRecording(true);
    setSeconds(0);
    timerRef.current = window.setInterval(() => {
      const s = Math.round((Date.now() - startedAt) / 1000);
      setSeconds(s);
      if (s >= MAX_AUDIO_SECONDS) {
        toast({ title: "Durée maximale atteinte." });
        stop(false);
      }
    }, 250);
  }, [recording, preview, releaseMic, stop]);

  const discard = () => {
    if (preview) URL.revokeObjectURL(preview.url);
    audioRef.current?.pause();
    setPlaying(false);
    setPreview(null);
  };

  if (!supported && !recording && !preview) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-full"
        aria-label="Enregistrement vocal indisponible"
        onClick={() =>
          toast({ title: "L'enregistrement vocal n'est pas disponible sur ce navigateur.", variant: "destructive" })
        }
      >
        <Mic className="w-4 h-4 opacity-50" />
      </Button>
    );
  }

  if (recording) {
    return (
      <div className="flex flex-1 items-center gap-2">
        <span className="flex items-center gap-1.5 text-sm text-destructive">
          <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
          Enregistrement… {formatDuration(seconds)}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button type="button" size="icon" variant="ghost" className="h-9 w-9 rounded-full"
            aria-label="Annuler" onClick={() => stop(true)}>
            <X className="w-4 h-4" />
          </Button>
          <Button type="button" size="icon" className="h-9 w-9 rounded-full"
            aria-label="Arrêter" onClick={() => stop(false)}>
            <Square className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (preview) {
    return (
      <div className="flex flex-1 items-center gap-2">
        <audio
          ref={audioRef}
          src={preview.url}
          onEnded={() => setPlaying(false)}
          onPause={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
          className="hidden"
        />
        <Button type="button" size="icon" variant="secondary" className="h-9 w-9 rounded-full"
          aria-label={playing ? "Pause" : "Écouter"}
          onClick={() => { const a = audioRef.current; if (!a) return; playing ? a.pause() : void a.play(); }}>
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <span className="text-sm tabular-nums">{formatDuration(preview.duration)}</span>
        <div className="ml-auto flex items-center gap-1">
          <Button type="button" size="icon" variant="ghost" className="h-9 w-9 rounded-full"
            aria-label="Supprimer le vocal" onClick={discard} disabled={sending}>
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button type="button" size="icon" className="h-9 w-9 rounded-full"
            aria-label="Envoyer le vocal" disabled={sending}
            onClick={() => { const p = preview; discard(); onSend(p.blob, p.duration, p.mime); }}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full"
      aria-label="Enregistrer un message vocal" disabled={disabled} onClick={start}>
      <Mic className="w-4 h-4" />
    </Button>
  );
}
