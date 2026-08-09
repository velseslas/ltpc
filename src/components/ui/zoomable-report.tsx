import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 3;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

interface ZoomableReportProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Conteneur d'aperçu zoomable (molette + Ctrl, pincement tactile, boutons +/-).
 * Le zoom est neutralisé à l'impression.
 */
export function ZoomableReport({ children, className }: ZoomableReportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  zoomRef.current = zoom;

  const applyZoomAt = useCallback((next: number, clientX?: number, clientY?: number) => {
    const el = containerRef.current;
    const current = zoomRef.current;
    const target = clamp(next, MIN_ZOOM, MAX_ZOOM);
    if (!el || target === current) return;
    const rect = el.getBoundingClientRect();
    const px = (clientX ?? rect.left + rect.width / 2) - rect.left + el.scrollLeft;
    const py = (clientY ?? rect.top + rect.height / 2) - rect.top + el.scrollTop;
    const k = target / current;
    setZoom(target);
    requestAnimationFrame(() => {
      el.scrollLeft += px * (k - 1);
      el.scrollTop += py * (k - 1);
    });
  }, []);

  const applyRef = useRef(applyZoomAt);
  applyRef.current = applyZoomAt;

  // Molette (Ctrl/pinch trackpad) — listener natif non passif
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      applyRef.current(zoomRef.current * Math.exp(-dy * 0.0015), e.clientX, e.clientY);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Pincement tactile à deux doigts
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let startDist = 0;
    let startZoom = 1;

    const dist = (t: TouchList) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        startDist = dist(e.touches);
        startZoom = zoomRef.current;
      }
    };
    const onMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && startDist > 0) {
        e.preventDefault();
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        applyRef.current((startZoom * dist(e.touches)) / startDist, cx, cy);
      }
    };
    const onEnd = () => { startDist = 0; };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, []);

  return (
    <div className={className}>
      <div className="flex items-center justify-end gap-2 mb-2 print:hidden">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => applyZoomAt(zoom - 0.2)} aria-label="Dézoomer">
          <Minus className="h-4 w-4" />
        </Button>
        <span className="text-xs tabular-nums w-12 text-center text-muted-foreground">{Math.round(zoom * 100)}%</span>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => applyZoomAt(zoom + 0.2)} aria-label="Zoomer">
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => applyZoomAt(1)} aria-label="Réinitialiser le zoom">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={containerRef}
        className="w-full overflow-auto print:overflow-visible"
        style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}
      >
        <div
          className="origin-top-left w-fit print:!transform-none"
          style={{ transform: `scale(${zoom})` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
