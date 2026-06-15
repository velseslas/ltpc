import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Printer, X } from "lucide-react";

type PaperSize = "A4" | "A3" | "Letter";
type Orientation = "portrait" | "landscape";

interface Ctx {
  openPreview: () => void;
}
const PrintPreviewContext = createContext<Ctx>({ openPreview: () => window.print() });

export const usePrintPreview = () => useContext(PrintPreviewContext);

const PAGE_STYLE_ID = "__print-preview-page-style";

function buildPrintCss(size: PaperSize, orientation: Orientation, scale: number) {
  return `
    @page { size: ${size} ${orientation}; margin: 10mm; }
    @media print {
      [data-ref="report"] {
        zoom: ${scale / 100};
      }
    }
  `;
}

export function PrintPreviewProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<PaperSize>("A4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [scale, setScale] = useState(100);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const originalPrintRef = useRef<typeof window.print | null>(null);

  const openPreview = useCallback(() => {
    setOpen(true);
  }, []);

  // Monkey-patch window.print globally so every existing caller routes through the preview.
  useEffect(() => {
    originalPrintRef.current = window.print.bind(window);
    (window as any).__nativePrint = originalPrintRef.current;
    window.print = () => setOpen(true);
    return () => {
      if (originalPrintRef.current) window.print = originalPrintRef.current;
    };
  }, []);

  // Build preview iframe contents from the current [data-ref="report"] element.
  const previewHtml = useMemo(() => {
    if (!open) return "";
    const report = document.querySelector('[data-ref="report"]');
    if (!report) {
      return `<html><body style="font-family:sans-serif;padding:24px;color:#666;">Aucun contenu imprimable trouvé sur cette page (data-ref="report" manquant).</body></html>`;
    }
    // Collect existing stylesheets and inline styles from the host document.
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join("\n");
    const dimensions: Record<PaperSize, { w: string; h: string }> = {
      A4: { w: "210mm", h: "297mm" },
      A3: { w: "297mm", h: "420mm" },
      Letter: { w: "216mm", h: "279mm" },
    };
    const dim = dimensions[size];
    const pageW = orientation === "portrait" ? dim.w : dim.h;
    const pageH = orientation === "portrait" ? dim.h : dim.w;
    return `<!doctype html><html><head><meta charset="utf-8" />${styles}
      <style>
        html, body { margin: 0; padding: 0; background: #525659; }
        .page-shell { display: flex; justify-content: center; padding: 24px; }
        .page {
          width: ${pageW};
          min-height: ${pageH};
          background: white;
          color: #111;
          box-shadow: 0 4px 18px rgba(0,0,0,0.4);
          padding: 10mm;
          box-sizing: border-box;
          zoom: ${scale / 100};
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      </style>
    </head><body><div class="page-shell"><div class="page">${(report as HTMLElement).outerHTML}</div></div></body></html>`;
  }, [open, size, orientation, scale]);

  useEffect(() => {
    if (!open || !iframeRef.current) return;
    const iframe = iframeRef.current;
    iframe.srcdoc = previewHtml;
  }, [previewHtml, open]);

  const handlePrint = () => {
    // Inject @page rules and zoom scaling, then call the real print.
    let styleEl = document.getElementById(PAGE_STYLE_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = PAGE_STYLE_ID;
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = buildPrintCss(size, orientation, scale);

    const cleanup = () => {
      window.removeEventListener("afterprint", cleanup);
      styleEl?.remove();
    };
    window.addEventListener("afterprint", cleanup);

    setOpen(false);
    // Small delay to let the dialog close before opening the system print dialog.
    setTimeout(() => {
      originalPrintRef.current?.();
    }, 150);
  };

  return (
    <PrintPreviewContext.Provider value={{ openPreview }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 flex flex-col gap-0">
          <DialogHeader className="px-6 py-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-primary" />
              Aperçu avant impression
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-1 min-h-0">
            {/* Toolbar */}
            <div className="w-64 border-r border-border p-4 space-y-5 overflow-y-auto bg-card">
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground">Taille du papier</Label>
                <Select value={size} onValueChange={(v) => setSize(v as PaperSize)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                    <SelectItem value="A3">A3 (297 × 420 mm)</SelectItem>
                    <SelectItem value="Letter">Letter (216 × 279 mm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground">Orientation</Label>
                <Select value={orientation} onValueChange={(v) => setOrientation(v as Orientation)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Paysage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase text-muted-foreground">Échelle</Label>
                  <span className="text-sm font-medium text-primary">{scale}%</span>
                </div>
                <Slider
                  value={[scale]}
                  onValueChange={(v) => setScale(v[0])}
                  min={50}
                  max={150}
                  step={5}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>50%</span><span>100%</span><span>150%</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border space-y-2">
                <Button onClick={handlePrint} className="w-full gap-2">
                  <Printer className="w-4 h-4" />
                  Imprimer
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)} className="w-full gap-2">
                  <X className="w-4 h-4" />
                  Annuler
                </Button>
              </div>
            </div>

            {/* Preview iframe */}
            <div className="flex-1 bg-[#525659] min-h-0">
              <iframe
                ref={iframeRef}
                title="Aperçu d'impression"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PrintPreviewContext.Provider>
  );
}
