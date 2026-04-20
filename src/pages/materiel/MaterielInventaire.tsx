import { useRef, useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Printer, Download, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useMaterielList } from "@/hooks/useMaterielLaboratoire";
import { useEntreprise } from "@/hooks/useEntreprise";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const etatLabel = (etat: string) => {
  switch (etat) {
    case "operationnel": return "Opérationnel";
    case "hors_service": return "Hors service";
    case "en_reparation": return "En réparation";
    default: return etat;
  }
};

export default function MaterielInventaire() {
  const { data: materiels, isLoading } = useMaterielList();
  const { data: entreprise } = useEntreprise();
  const printRef = useRef<HTMLDivElement>(null);
  const today = format(new Date(), "dd MMMM yyyy", { locale: fr });
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!entreprise?.logo_url) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        setLogoDataUrl(canvas.toDataURL("image/png"));
      }
    };
    img.onerror = () => setLogoDataUrl(null);
    img.src = entreprise.logo_url;
  }, [entreprise?.logo_url]);

  const data = materiels || [];

  const stats = {
    total: data.length,
    operationnel: data.filter(m => m.etat === "operationnel").length,
    hors_service: data.filter(m => m.etat === "hors_service").length,
    en_reparation: data.filter(m => m.etat === "en_reparation").length,
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Veuillez autoriser les popups");
      return;
    }
    printWindow.document.write(`
      <html><head><title>Inventaire Matériel</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #111; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11px; }
        th, td { border: 1px solid #444; padding: 6px 8px; text-align: left; }
        th { background: #f1f5f9; font-weight: 600; }
        .header { text-align: center; margin-bottom: 16px; }
        @page { size: landscape; margin: 10mm; }
        @media print { body { margin: 0; } }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 400);
  };

  const handleDownloadPDF = async () => {
    const content = printRef.current;
    if (!content) return;
    toast.info("Génération du PDF...");
    try {
      const canvas = await html2canvas(content, { scale: 2, backgroundColor: "#fff", useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      pdf.save(`inventaire-materiel-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("PDF téléchargé");
    } catch {
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire", path: "/materiel" },
        { label: "Liste Matériel", path: "/materiel/liste" },
        { label: "Inventaire" },
      ]} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton to="/materiel/liste" />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="h-6 w-6" />
              Inventaire du Matériel
            </h1>
            <p className="text-muted-foreground">État complet du matériel de laboratoire</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Imprimer
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4" /> Télécharger PDF
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div data-ref="report" ref={printRef} style={{ padding: "24px", background: "#fff", color: "#111", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderRadius: "4px" }}>
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            {entreprise?.nom && (
              <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 4px" }}>{entreprise.nom}</h2>
            )}
            {entreprise?.numero_autorisation && (
              <p style={{ fontSize: "11px", margin: "0 0 2px", color: "#555" }}>
                Agrément N° {entreprise.numero_autorisation}
              </p>
            )}
            <h3 style={{ fontSize: "14px", fontWeight: 600, margin: "12px 0 4px", textDecoration: "underline" }}>
              INVENTAIRE DU MATÉRIEL DE LABORATOIRE
            </h3>
            <p style={{ fontSize: "11px", color: "#555" }}>Date : {today}</p>
          </div>

          <div style={{ display: "flex", gap: "16px", marginBottom: "12px", fontSize: "12px", flexWrap: "wrap" }}>
            <span><strong>Total :</strong> {stats.total}</span>
            <span style={{ color: "#16a34a" }}>● Opérationnel : {stats.operationnel}</span>
            <span style={{ color: "#ef4444" }}>● Hors service : {stats.hors_service}</span>
            <span style={{ color: "#f59e0b" }}>● En réparation : {stats.en_reparation}</span>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <thead>
              <tr>
                {["N°", "Désignation", "Référence", "Catégorie", "Marque", "Modèle", "N° Série", "État", "Localisation"].map(h => (
                  <th key={h} style={{ border: "1px solid #444", padding: "6px 8px", background: "#f1f5f9", fontWeight: 600, textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((m, i) => (
                <tr key={m.id}>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "center" }}>{i + 1}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px", fontWeight: 500 }}>{m.nom}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{m.reference || "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px", textTransform: "capitalize" }}>{m.categorie?.replace("_", " ") || "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{m.marque || "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{m.modele || "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{m.numero_serie || "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{etatLabel(m.etat)}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{m.localisation || "—"}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ border: "1px solid #ccc", padding: "16px", textAlign: "center", color: "#888" }}>
                    Aucun matériel enregistré
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
