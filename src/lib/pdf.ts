import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export type PDFOrientation = "portrait" | "landscape";

export interface DownloadPDFOptions {
  orientation?: PDFOrientation;
  marginMm?: number;
  scale?: number;
}

/**
 * Generates a real multi-page A4 PDF from a DOM element and triggers a browser download.
 * Preserves colors, borders and table layouts via html2canvas, then slices the rendered
 * canvas across as many A4 pages as needed.
 */
export async function downloadReportAsPDF(
  element: HTMLElement | null,
  filename: string,
  options: DownloadPDFOptions = {}
): Promise<void> {
  if (!element) throw new Error("downloadReportAsPDF: element is null");

  const { orientation = "portrait", marginMm = 15, scale = 2 } = options;

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: element.scrollWidth,
  });

  const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - marginMm * 2;
  const contentHeight = pageHeight - marginMm * 2;

  // Total image height in mm at content width
  const imgHeight = (canvas.height * contentWidth) / canvas.width;

  if (imgHeight <= contentHeight) {
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", marginMm, marginMm, contentWidth, imgHeight);
  } else {
    // Slice canvas into A4-content-sized chunks
    const pxPerMm = canvas.width / contentWidth;
    const sliceHeightPx = Math.floor(contentHeight * pxPerMm);
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
      const sliceData = sliceCanvas.toDataURL("image/png");
      const sliceHeightMm = (currentSlicePx / canvas.width) * contentWidth;
      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(sliceData, "PNG", marginMm, marginMm, contentWidth, sliceHeightMm);
      renderedPx += currentSlicePx;
      pageIndex += 1;
    }
  }

  const safeName = filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`;
  pdf.save(safeName);
}
