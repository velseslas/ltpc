import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export type PDFOrientation = "portrait" | "landscape";

export interface DownloadPDFOptions {
  orientation?: PDFOrientation;
  marginMm?: number;
  scale?: number;
}

/**
 * Generates a real downloadable PDF from a DOM element using html2canvas + jsPDF.
 * Uses scale: 1 and JPEG quality 0.85 to keep file size under ~2MB.
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

    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" });
    const pageWidthMm = orientation === "portrait" ? 210 : 297;
    const pageHeightMm = orientation === "portrait" ? 297 : 210;
    const contentWidthMm = pageWidthMm - marginMm * 2;
    const contentHeightMm = pageHeightMm - marginMm * 2;

    const pxPerMm = canvas.width / contentWidthMm;
    const sliceHeightPx = Math.floor(contentHeightMm * pxPerMm);

    let renderedPx = 0;
    let pageIndex = 0;

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
        0,
        renderedPx,
        canvas.width,
        currentSlicePx,
        0,
        0,
        canvas.width,
        currentSlicePx
      );

      const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.85);
      const sliceHeightMm = currentSlicePx / pxPerMm;

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(sliceData, "JPEG", marginMm, marginMm, contentWidthMm, sliceHeightMm);

      renderedPx += currentSlicePx;
      pageIndex++;
    }

    pdf.save(`${filename}.pdf`);
  } finally {
    document.title = previousTitle;
  }
}
