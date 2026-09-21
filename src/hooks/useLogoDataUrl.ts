import { useEffect, useState } from "react";

/**
 * Charge le logo de l'entreprise et le convertit en data URL (impression/PDF).
 * Si la conversion échoue (CORS, canvas bloqué), on retombe sur l'URL d'origine
 * afin que le logo reste visible à l'écran et à l'impression.
 */
export function useLogoDataUrl(logoUrl?: string | null): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    setDataUrl(null);
    if (!logoUrl) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        setDataUrl(canvas.toDataURL("image/png"));
      } catch {
        setDataUrl(null);
      }
    };
    img.onerror = () => { if (!cancelled) setDataUrl(null); };
    img.src = logoUrl;
    return () => { cancelled = true; };
  }, [logoUrl]);

  return dataUrl || logoUrl || null;
}
