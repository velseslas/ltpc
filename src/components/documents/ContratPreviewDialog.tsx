import { useRef } from "react";
import { Printer, Download, Share2, X, FileText } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEntreprise } from "@/hooks/useEntreprise";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ContratPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contrat: {
    titre: string;
    clients?: { nom: string } | null;
    chantiers?: { nom: string } | null;
    representant?: string;
    date_document?: string;
    date_debut?: string;
    date_fin?: string;
    numero?: string;
    statut?: string;
    observations?: string;
    client_adresse?: string;
    client_ville?: string;
  } | null;
}

export function ContratPreviewDialog({ open, onOpenChange, contrat }: ContratPreviewDialogProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const { data: entreprise } = useEntreprise();

  if (!contrat) return null;

  const clientName = contrat.clients?.nom || "—";
  const chantierName = contrat.chantiers?.nom || "—";
  const representant = contrat.representant || "—";
  const dateDoc = contrat.date_document
    ? format(new Date(contrat.date_document), "dd MMMM yyyy", { locale: fr })
    : format(new Date(), "dd MMMM yyyy", { locale: fr });

  const handlePrint = () => {
    const printContent = reportRef.current;
    if (!printContent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>${contrat.titre}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', serif; }
        @page { size: A4; margin: 15mm; }
      </style>
      </head><body>${printContent.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.onload = () => { printWindow.print(); printWindow.close(); };
  };

  const handleDownload = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);
      pdf.save(`${contrat.titre || "contrat"}.pdf`);
      toast.success("PDF téléchargé avec succès");
    } catch {
      toast.error("Erreur lors du téléchargement");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: contrat.titre, text: `Contrat: ${contrat.titre}` });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(`Contrat: ${contrat.titre} - Client: ${clientName} - Chantier: ${chantierName}`);
      toast.success("Informations copiées dans le presse-papiers");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 bg-card border-border flex flex-col overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-rose-500/15 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-rose-500" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">{contrat.titre}</h2>
              {contrat.numero && <p className="text-xs text-muted-foreground font-mono">N° {contrat.numero}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={handlePrint} className="gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10">
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimer</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownload} className="gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Télécharger</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleShare} className="gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10">
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Partager</span>
            </Button>
          </div>
        </div>

        {/* Contract content */}
        <div className="flex-1 overflow-auto bg-secondary/30 p-6 flex justify-center">
          <div
            ref={reportRef}
            className="bg-white text-black shadow-xl"
            style={{
              width: "210mm",
              minHeight: "297mm",
              padding: "20mm 25mm",
              fontFamily: "'Times New Roman', serif",
            }}
          >
            {/* En-tête LTPC */}
            <div style={{ textAlign: "center", borderBottom: "3px double #1a5276", paddingBottom: "15px", marginBottom: "40px" }}>
              <h1 style={{ fontSize: "16px", fontWeight: "bold", letterSpacing: "2px", color: "#1a5276", marginBottom: "4px" }}>
                LABORATOIRE DES TRAVAUX PUBLICS ET DE CONSTRUCTION
              </h1>
              <p style={{ fontSize: "13px", fontWeight: "bold", color: "#1a5276" }}>
                {entreprise?.nom || "LTPC BENMALEK"}, SIS À {entreprise?.siege_social?.toUpperCase() || "AIN EBEY CONSTANTINE"}
              </p>
              <p style={{ fontSize: "11px", color: "#444", marginTop: "4px" }}>
                {entreprise?.telephone ? `TEL- FAX ${entreprise.telephone}` : "TEL- FAX 030 222 750"}
              </p>
              <p style={{ fontSize: "11px", color: "#444" }}>
                {entreprise?.email ? `Mail : ${entreprise.email}` : "Mail : LTPC Benmalek@gmail.com"}
              </p>
            </div>

            {/* Titre du contrat */}
            <div style={{ textAlign: "center", margin: "50px 0 60px" }}>
              <h2 style={{ fontSize: "22px", fontWeight: "bold", color: "#1a5276", marginBottom: "12px", letterSpacing: "1px" }}>
                CONVENTION D'ASSISTANCE TECHNIQUE
              </h2>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#2c3e50" }}>
                « CONTRÔLE ET SUIVI DE LA QUALITÉ DES BÉTONS »
              </h3>
            </div>

            {/* Info client */}
            <div style={{ margin: "40px 0", padding: "20px", border: "1px solid #ddd", borderRadius: "4px", background: "#fafbfc" }}>
              <p style={{ fontSize: "13px", marginBottom: "8px" }}>
                <strong style={{ textDecoration: "underline" }}>Client</strong> : Entreprise <strong>{clientName}</strong>
              </p>
              <p style={{ fontSize: "13px", marginBottom: "8px" }}>
                <strong style={{ textDecoration: "underline" }}>Chantier</strong> : <strong>{chantierName}</strong>
              </p>
              <p style={{ fontSize: "13px" }}>
                <strong style={{ textDecoration: "underline" }}>Représentant</strong> : <strong>{representant}</strong>
              </p>
            </div>

            {/* Date */}
            <p style={{ fontSize: "12px", textAlign: "right", color: "#555", margin: "20px 0 50px" }}>
              Fait le {dateDoc}
            </p>

            {/* Page 2 - Conclue entre */}
            <div style={{ marginTop: "60px", borderTop: "1px solid #eee", paddingTop: "30px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "20px", color: "#1a5276" }}>
                Conclue entre :
              </h3>

              <p style={{ fontSize: "13px", lineHeight: "1.8", marginBottom: "10px" }}>
                L'Entreprise <strong>{clientName}</strong>, représentée par son Directeur Monsieur <strong>{representant}</strong>, représentant de l'entreprise.
              </p>

              <p style={{ fontSize: "14px", fontWeight: "bold", textAlign: "right", margin: "30px 0", color: "#333" }}>
                D'une part.
              </p>

              <p style={{ fontSize: "13px", fontWeight: "bold", margin: "20px 0" }}>et</p>

              <p style={{ fontSize: "13px", lineHeight: "1.8", marginBottom: "10px" }}>
                Le <strong>Laboratoire</strong> des travaux publics et de construction{" "}
                <strong>{entreprise?.nom || "LTPC BENMALEK"}</strong>, sis à{" "}
                {entreprise?.siege_social || "Ain Ebey Constantine"} représenté par son Directeur{" "}
                <strong>Benmalek Fayçal</strong>
              </p>

              <p style={{ fontSize: "14px", fontWeight: "bold", textAlign: "right", margin: "30px 0", color: "#333" }}>
                D'autre part.
              </p>
            </div>

            {/* Sommaire */}
            <div style={{ marginTop: "60px", borderTop: "1px solid #eee", paddingTop: "30px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", textAlign: "center", marginBottom: "30px", color: "#1a5276", textDecoration: "underline" }}>
                SOMMAIRE
              </h3>
              {[
                "ARTICLE 01 - Objet de la Convention",
                "ARTICLE 02 - Mode de passation de la Convention",
                "ARTICLE 03 - Intervention du Laboratoire",
                "ARTICLE 04 - Matériel à Mobiliser sur Site",
                "ARTICLE 05 - Mission du Laboratoire",
                "ARTICLE 06 - Nombre et Fréquence des Essais à Effectuer",
                "ARTICLE 07 - Honoraires du Laboratoire",
                "ARTICLE 08 - Modalité de Paiement",
                "ARTICLE 09 - Durée de Validité de la Convention",
                "ARTICLE 10 - Résiliation de la Convention",
                "ARTICLE 11 - Entrée en Vigueur",
              ].map((article) => (
                <p key={article} style={{ fontSize: "13px", padding: "6px 0", borderBottom: "1px dotted #ddd" }}>
                  <strong>{article}</strong>
                </p>
              ))}
            </div>

            {/* Article 01 */}
            <div style={{ marginTop: "50px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1a5276", marginBottom: "15px", textDecoration: "underline" }}>
                ARTICLE 01 : OBJET DE LA CONVENTION
              </h3>
              <p style={{ fontSize: "12px", lineHeight: "1.8", textAlign: "justify" }}>
                La présente convention a pour objet de définir les conditions dans lesquelles le{" "}
                <strong>Laboratoire {entreprise?.nom || "LTPC BENMALEK"}</strong> assure le contrôle
                et le suivi de la qualité des bétons pour le compte de l'Entreprise <strong>{clientName}</strong>{" "}
                sur le chantier <strong>{chantierName}</strong>.
              </p>
            </div>

            {/* Observations si disponibles */}
            {contrat.observations && (
              <div style={{ marginTop: "40px", padding: "15px", background: "#f9f9f9", border: "1px solid #eee", borderRadius: "4px" }}>
                <h4 style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "8px", color: "#1a5276" }}>Observations :</h4>
                <p style={{ fontSize: "12px", lineHeight: "1.6" }}>{contrat.observations}</p>
              </div>
            )}

            {/* Signatures */}
            <div style={{ marginTop: "80px", display: "flex", justifyContent: "space-between" }}>
              <div style={{ textAlign: "center", width: "40%" }}>
                <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "60px" }}>Le Client</p>
                <p style={{ fontSize: "11px", borderTop: "1px solid #999", paddingTop: "8px" }}>{clientName}</p>
              </div>
              <div style={{ textAlign: "center", width: "40%" }}>
                <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "60px" }}>Le Laboratoire</p>
                <p style={{ fontSize: "11px", borderTop: "1px solid #999", paddingTop: "8px" }}>{entreprise?.nom || "LTPC BENMALEK"}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
