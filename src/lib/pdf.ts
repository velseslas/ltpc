export type PDFOrientation = "portrait" | "landscape";

export interface DownloadPDFOptions {
  orientation?: PDFOrientation;
  marginMm?: number;
  scale?: number;
}

/**
 * Triggers the browser's native print dialog so the user can save as PDF.
 * This produces clean vector PDFs (typically < 200KB) instead of rasterized
 * multi-megabyte files from html2canvas. Both "Imprimer" and "Télécharger PDF"
 * buttons route through here for consistency.
 */
export async function downloadReportAsPDF(
  _element: HTMLElement | null,
  _filename: string,
  _options: DownloadPDFOptions = {}
): Promise<void> {
  window.print();
}
