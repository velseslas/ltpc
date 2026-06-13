import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export type PDFOrientation = "portrait" | "landscape";

export interface DownloadPDFOptions {
  orientation?: PDFOrientation;
  marginMm?: number;
  scale?: number;
}

const TARGET_PX_WIDTH = 793; // ~210mm at 96dpi

async function captureElement(el: HTMLElement, scale: number): Promise<HTMLCanvasElement> {
  const original = {
    width: el.style.width,
    maxWidth: el.style.maxWidth,
    margin: el.style.margin,
  };
  el.style.width = `${TARGET_PX_WIDTH}px`;
  el.style.maxWidth = "none";
  el.style.margin = "0";
  try {
    return await html2canvas(el, {
      scale,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: TARGET_PX_WIDTH,
    });
  } finally {
    el.style.width = original.width;
    el.style.maxWidth = original.maxWidth;
    el.style.margin = original.margin;
  }
}

/**
 * Generates a downloadable PDF from a DOM element using html2canvas + jsPDF.
 * Captures each [data-pdf-page] section separately for clean pagination;
 * falls back to single-element capture if no sections found.
 */
export async function downloadReportAsPDF(
  element: HTMLElement | null,
  filename: string,
  options: DownloadPDFOptions = {}
): Promise<void> {
  if (!element) {
    window.print();
    return;
  }

  const orientation: PDFOrientation = options.orientation ?? "portrait";
  const marginMm = options.marginMm ?? 15;
  const scale = options.scale ?? 1;

  const previousTitle = document.title;
  document.title = filename;

  try {
    await (document as any).fonts?.ready;

    const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" });
    const pageWidthMm = orientation === "portrait" ? 210 : 297;
    const pageHeightMm = orientation === "portrait" ? 297 : 210;
    const contentWidthMm = pageWidthMm - marginMm * 2;
    const contentHeightMm = pageHeightMm - marginMm * 2;

    const sections = Array.from(
      element.querySelectorAll<HTMLElement>("[data-pdf-page]")
    );
    const targets = sections.length > 0 ? sections : [element];

    for (let i = 0; i < targets.length; i++) {
      const canvas = await captureElement(targets[i], scale);

      // Compute rendered dimensions (fit width to contentWidthMm, center horizontally)
      const renderedWidthMm = contentWidthMm;
      const pxPerMm = canvas.width / renderedWidthMm;
      const xOffset = (pageWidthMm - renderedWidthMm) / 2;
      const sliceHeightPx = Math.floor(contentHeightMm * pxPerMm);

      let renderedPx = 0;
      let firstSliceOfSection = true;

      while (renderedPx < canvas.height) {
        const currentSlicePx = Math.min(sliceHeightPx, canvas.height - renderedPx);

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = currentSlicePx;
        const ctx = sliceCanvas.getContext("2d");
        if (!ctx) break;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(
          canvas,
          0, renderedPx, canvas.width, currentSlicePx,
          0, 0, canvas.width, currentSlicePx
        );

        const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.85);
        const sliceHeightMm = currentSlicePx / pxPerMm;

        if (!(i === 0 && firstSliceOfSection)) pdf.addPage();
        pdf.addImage(sliceData, "JPEG", xOffset, marginMm, renderedWidthMm, sliceHeightMm);

        renderedPx += currentSlicePx;
        firstSliceOfSection = false;
      }
    }

    pdf.save(`${filename}.pdf`);
  } finally {
    document.title = previousTitle;
  }
}
