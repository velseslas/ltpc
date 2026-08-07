// LOT 15.1 — Lecteur vocal : URL signée générée à la demande (jamais stockée en base).
import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/messagerie/audio";

const BUCKET = "message-audio";

interface Props { path: string; duration: number | null; mine: boolean }

export function VoiceMessage({ path, duration, mine }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Réinitialise si le message change.
  useEffect(() => { setUrl(null); setPlaying(false); setProgress(0); setError(null); }, [path]);

  const ensureUrl = useCallback(async (): Promise<string | null> => {
    if (url) return url;
    setLoading(true);
    const { data, error: e } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
    setLoading(false);
    if (e || !data?.signedUrl) { setError("Audio indisponible"); return null; }
    setUrl(data.signedUrl);
    return data.signedUrl;
  }, [path, url]);

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); return; }
    const src = await ensureUrl();
    if (!src) return;
    if (a.src !== src) a.src = src;
    try { await a.play(); } catch { setError("Lecture impossible"); }
  };

  const total = duration ?? 0;

  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0); }}
        onError={() => { setError("Audio indisponible"); setUrl(null); setPlaying(false); }}
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          const d = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : total;
          setProgress(d ? Math.min(100, (el.currentTime / d) * 100) : 0);
        }}
        className="hidden"
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Écouter le message vocal"}
        className={cn(
          "h-8 w-8 shrink-0 rounded-full grid place-items-center",
          mine ? "bg-primary-foreground/20" : "bg-background"
        )}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" />
          : playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
      <div className="flex-1 min-w-[80px]">
        <div className={cn("h-1.5 rounded-full overflow-hidden", mine ? "bg-primary-foreground/25" : "bg-border")}>
          <div
            className={cn("h-full transition-[width]", mine ? "bg-primary-foreground" : "bg-primary")}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <span className="text-[11px] tabular-nums shrink-0">
        {error ?? formatDuration(total)}
      </span>
    </div>
  );
}
