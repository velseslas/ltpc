export function downloadReportAsPDF(filename: string) {
  const prev = document.title;
  document.title = filename;
  window.print();
  setTimeout(() => { document.title = prev; }, 1000);
}
