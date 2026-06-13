// PDF generation now delegates to the browser's native print pipeline,
// which produces vector (selectable) text rather than rasterized images.
// Signature kept backward-compatible with existing callers:
//   downloadReportAsPDF(element, filename, options?)
//   downloadReportAsPDF(filename)

export type PDFOrientation = "portrait" | "landscape";

export interface DownloadPDFOptions {
  orientation?: PDFOrientation;
  marginMm?: number;
  scale?: number;
}

export function downloadReportAsPDF(
  arg1: HTMLElement | null | string,
  arg2?: string,
  _options?: DownloadPDFOptions
): void {
  const filename = typeof arg1 === "string" ? arg1 : (arg2 ?? "rapport");
  const prev = document.title;
  document.title = filename;
  window.print();
  setTimeout(() => {
    document.title = prev;
  }, 1000);
}
