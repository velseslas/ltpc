import { useRef } from "react";
import { Printer, Download, Share2, FileText } from "lucide-react";
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
    clients?: { nom: string; representant?: string; adresse?: string; ville?: string } | null;
    chantiers?: { nom: string } | null;
    date_document?: string;
    date_debut?: string;
    date_fin?: string;
    numero?: string;
    statut?: string;
    observations?: string;
  } | null;
}

export function ContratPreviewDialog({ open, onOpenChange, contrat }: ContratPreviewDialogProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const { data: entreprise } = useEntreprise();

  if (!contrat) return null;

  const clientName = contrat.clients?.nom || "—";
  const chantierName = contrat.chantiers?.nom || "—";
  const representant = contrat.clients?.representant || "—";
  const clientAdresse = contrat.clients?.adresse || "";
  const clientVille = contrat.clients?.ville || "";
  const clientLocalisation = [clientAdresse, clientVille].filter(Boolean).join(", ");
  const dateDoc = contrat.date_document
    ? format(new Date(contrat.date_document), "dd MMMM yyyy", { locale: fr })
    : format(new Date(), "dd MMMM yyyy", { locale: fr });

  const labName = entreprise?.nom || "LTPC BENMALEK";
  const labSiege = entreprise?.siege_social || "Ain Ebey Constantine";

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
      const sections = Array.from(
        reportRef.current.querySelectorAll("[data-pdf-section]")
      ) as HTMLElement[];

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentW = pdfW - margin * 2;
      let currentY = margin;

      for (let i = 0; i < sections.length; i++) {
        const canvas = await html2canvas(sections[i], {
          scale: 3,
          useCORS: true,
          backgroundColor: "#ffffff",
        });
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const ratio = contentW / (canvas.width / 3);
        const imgH = (canvas.height / 3) * ratio;

        if (currentY + imgH > pdfH - margin && currentY > margin) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.addImage(imgData, "JPEG", margin, currentY, contentW, imgH);
        currentY += imgH + 2;
      }

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

  const sectionStyle = { fontFamily: "'Times New Roman', Georgia, serif" } as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 bg-card border-border flex flex-col overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-destructive/15 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-destructive" />
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

        {/* Contract content - scrollable */}
        <div className="flex-1 overflow-auto bg-secondary/30 p-4 sm:p-6">
          <div
            ref={reportRef}
            className="bg-white text-black shadow-xl mx-auto"
            style={{
              maxWidth: "800px",
              width: "100%",
              padding: "40px 50px",
              ...sectionStyle,
            }}
          >
            {/* PAGE 1 - Couverture */}
            <div data-pdf-section>
              {/* En-tête LTPC */}
              <div style={{ textAlign: "center", borderBottom: "3px double #1a5276", paddingBottom: "12px", marginBottom: "50px" }}>
                <p style={{ fontSize: "15px", fontWeight: "bold", letterSpacing: "1.5px", color: "#1a5276", marginBottom: "3px", ...sectionStyle }}>
                  LABORATOIRE DES TRAVAUX PUBLICS ET DE CONSTRUCTION
                </p>
                <p style={{ fontSize: "12px", fontWeight: "bold", color: "#1a5276", ...sectionStyle }}>
                  {labName}, SIS À {labSiege.toUpperCase()}
                </p>
                <p style={{ fontSize: "10px", color: "#555", marginTop: "4px", ...sectionStyle }}>
                  {entreprise?.telephone ? `TEL- FAX ${entreprise.telephone}` : "TEL- FAX 030 222 750"}
                  {" | "}
                  {entreprise?.email ? `Mail : ${entreprise.email}` : "Mail : LTPC Benmalek@gmail.com"}
                </p>
              </div>

              {/* Titre du contrat */}
              <div style={{ textAlign: "center", margin: "60px 0" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#1a5276", marginBottom: "14px", letterSpacing: "1px", ...sectionStyle }}>
                  CONVENTION D'ASSISTANCE TECHNIQUE
                </h2>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#2c3e50", ...sectionStyle }}>
                  « CONTRÔLE ET SUIVI DE LA QUALITÉ DES BÉTONS »
                </h3>
              </div>

              {/* Info client */}
              <div style={{ margin: "50px 0", padding: "20px 24px", border: "1px solid #ccc", borderLeft: "4px solid #1a5276", background: "#f8fafc" }}>
                <p style={{ fontSize: "13px", marginBottom: "10px", lineHeight: "1.6", ...sectionStyle }}>
                  <strong style={{ textDecoration: "underline" }}>Client</strong> : Entreprise <strong>{clientName}</strong>
                  {clientLocalisation && <span>, sis à {clientLocalisation}</span>}
                </p>
                <p style={{ fontSize: "13px", marginBottom: "10px", lineHeight: "1.6", ...sectionStyle }}>
                  <strong style={{ textDecoration: "underline" }}>Chantier</strong> : <strong>{chantierName}</strong>
                </p>
                <p style={{ fontSize: "13px", lineHeight: "1.6", ...sectionStyle }}>
                  <strong style={{ textDecoration: "underline" }}>Représentant</strong> : Monsieur <strong>{representant}</strong>
                </p>
              </div>

              <p style={{ fontSize: "11px", textAlign: "right", color: "#666", margin: "20px 0", ...sectionStyle }}>
                Fait le {dateDoc}
              </p>
            </div>

            {/* PAGE 2 - Conclue entre */}
            <div data-pdf-section style={{ marginTop: "40px", borderTop: "2px solid #e5e7eb", paddingTop: "30px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "24px", color: "#1a5276", ...sectionStyle }}>
                Conclue entre :
              </h3>

              <p style={{ fontSize: "13px", lineHeight: "2", marginBottom: "8px", textAlign: "justify", ...sectionStyle }}>
                L'Entreprise <strong>{clientName}</strong>
                {clientLocalisation && <>, sis à {clientLocalisation}</>}
                {" "}représentée par son Directeur Monsieur{" "}
                <strong>{representant}</strong>, représentant de l'entreprise.
              </p>

              <p style={{ fontSize: "14px", fontWeight: "bold", textAlign: "right", margin: "30px 0", color: "#333", ...sectionStyle }}>
                D'une part.
              </p>

              <p style={{ fontSize: "14px", fontWeight: "bold", margin: "24px 0", ...sectionStyle }}>et</p>

              <p style={{ fontSize: "13px", lineHeight: "2", marginBottom: "8px", textAlign: "justify", ...sectionStyle }}>
                Le <strong>Laboratoire</strong> des travaux publics et de construction{" "}
                <strong>{labName}</strong>, sis à {labSiege} représenté par son Directeur{" "}
                <strong>Benmalek Fayçal</strong>
              </p>

              <p style={{ fontSize: "14px", fontWeight: "bold", textAlign: "right", margin: "30px 0", color: "#333", ...sectionStyle }}>
                D'autre part.
              </p>
            </div>

            {/* PAGE 3 - Sommaire */}
            <div data-pdf-section style={{ marginTop: "40px", borderTop: "2px solid #e5e7eb", paddingTop: "30px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", textAlign: "center", marginBottom: "24px", color: "#1a5276", textDecoration: "underline", ...sectionStyle }}>
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
                <p key={article} style={{ fontSize: "12px", padding: "8px 0", borderBottom: "1px dotted #ccc", ...sectionStyle }}>
                  <strong>{article}</strong>
                </p>
              ))}
            </div>

            {/* Article 01 */}
            <div data-pdf-section style={{ marginTop: "40px", borderTop: "2px solid #e5e7eb", paddingTop: "30px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1a5276", marginBottom: "16px", textDecoration: "underline", ...sectionStyle }}>
                ARTICLE 01 : OBJET DE LA CONVENTION
              </h3>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", ...sectionStyle }}>
                La présente convention a pour objet de définir les conditions dans lesquelles le{" "}
                <strong>Laboratoire {labName}</strong> assure le contrôle
                et le suivi de la qualité des bétons pour le compte de l'Entreprise <strong>{clientName}</strong>{" "}
                sur le chantier <strong>{chantierName}</strong>.
              </p>
            </div>

            {/* Article 02 */}
            <div data-pdf-section style={{ marginTop: "30px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1a5276", marginBottom: "16px", textDecoration: "underline", ...sectionStyle }}>
                ARTICLE 02 : MODE DE PASSATION DE LA CONVENTION
              </h3>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", ...sectionStyle }}>
                La présente convention est passée de gré à gré entre les deux parties conformément à la réglementation en vigueur.
              </p>
            </div>

            {/* Article 03 */}
            <div data-pdf-section style={{ marginTop: "30px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1a5276", marginBottom: "16px", textDecoration: "underline", ...sectionStyle }}>
                ARTICLE 03 : INTERVENTION DU LABORATOIRE
              </h3>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", ...sectionStyle }}>
                Le laboratoire intervient sur le chantier <strong>{chantierName}</strong> pour effectuer les essais
                de contrôle et de suivi de la qualité des bétons selon les normes en vigueur.
              </p>
            </div>

            {/* Article 04 */}
            <div data-pdf-section style={{ marginTop: "30px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1a5276", marginBottom: "16px", textDecoration: "underline", ...sectionStyle }}>
                ARTICLE 04 : MATÉRIEL À MOBILISER SUR SITE
              </h3>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", ...sectionStyle }}>
                Le laboratoire mobilisera sur le site du chantier <strong>{chantierName}</strong> le matériel nécessaire à la réalisation des essais, notamment :
              </p>
              <ul style={{ fontSize: "12px", lineHeight: "2", marginLeft: "20px", marginTop: "8px", ...sectionStyle }}>
                <li>Moules d'éprouvettes cylindriques (16×32) et/ou cubiques (15×15×15)</li>
                <li>Cône d'Abrams pour essai d'affaissement</li>
                <li>Thermomètre pour mesure de la température du béton frais</li>
                <li>Table vibrante ou aiguille vibrante</li>
                <li>Matériel de prélèvement et d'identification des échantillons</li>
              </ul>
            </div>

            {/* Article 05 */}
            <div data-pdf-section style={{ marginTop: "30px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1a5276", marginBottom: "16px", textDecoration: "underline", ...sectionStyle }}>
                ARTICLE 05 : MISSION DU LABORATOIRE
              </h3>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", ...sectionStyle }}>
                La mission du laboratoire consiste à :
              </p>
              <ul style={{ fontSize: "12px", lineHeight: "2", marginLeft: "20px", marginTop: "8px", ...sectionStyle }}>
                <li>Le contrôle de la qualité du béton frais (affaissement, température, aspect visuel)</li>
                <li>La confection d'éprouvettes pour essais de résistance à la compression</li>
                <li>La conservation et le transport des éprouvettes au laboratoire</li>
                <li>L'écrasement des éprouvettes aux échéances prévues (7 jours, 28 jours)</li>
                <li>L'établissement des procès-verbaux d'essais et rapports de contrôle</li>
                <li>Le conseil et l'assistance technique en matière de qualité des bétons</li>
              </ul>
            </div>

            {/* Article 06 */}
            <div data-pdf-section style={{ marginTop: "30px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1a5276", marginBottom: "16px", textDecoration: "underline", ...sectionStyle }}>
                ARTICLE 06 : NOMBRE ET FRÉQUENCE DES ESSAIS À EFFECTUER
              </h3>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", ...sectionStyle }}>
                Le nombre et la fréquence des essais seront définis en fonction du volume de béton coulé et conformément aux normes en vigueur. En règle générale :
              </p>
              <ul style={{ fontSize: "12px", lineHeight: "2", marginLeft: "20px", marginTop: "8px", ...sectionStyle }}>
                <li>Un prélèvement par coulage ou par fraction de 50 m³ de béton</li>
                <li>Chaque prélèvement comprend au minimum 6 éprouvettes (3 à 7 jours et 3 à 28 jours)</li>
                <li>Un essai d'affaissement au cône d'Abrams par prélèvement</li>
                <li>Mesure de la température du béton frais à chaque prélèvement</li>
              </ul>
            </div>

            {/* Article 07 */}
            <div data-pdf-section style={{ marginTop: "30px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1a5276", marginBottom: "16px", textDecoration: "underline", ...sectionStyle }}>
                ARTICLE 07 : HONORAIRES DU LABORATOIRE
              </h3>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", ...sectionStyle }}>
                Les honoraires du laboratoire sont fixés d'un commun accord entre les deux parties selon le bordereau des prix unitaires annexé à la présente convention. Les prix sont fermes et non révisables pendant la durée de validité de la convention.
              </p>
            </div>

            {/* Article 08 */}
            <div data-pdf-section style={{ marginTop: "30px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1a5276", marginBottom: "16px", textDecoration: "underline", ...sectionStyle }}>
                ARTICLE 08 : MODALITÉ DE PAIEMENT
              </h3>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", ...sectionStyle }}>
                Le paiement des prestations du laboratoire s'effectuera par situations mensuelles établies sur la base des essais réellement exécutés. Le règlement sera effectué par virement bancaire dans un délai de trente (30) jours à compter de la réception de la facture.
              </p>
            </div>

            {/* Article 09 */}
            <div data-pdf-section style={{ marginTop: "30px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1a5276", marginBottom: "16px", textDecoration: "underline", ...sectionStyle }}>
                ARTICLE 09 : DURÉE DE VALIDITÉ DE LA CONVENTION
              </h3>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", ...sectionStyle }}>
                La présente convention prend effet à compter de sa date de signature
                {contrat.date_debut && (
                  <> le <strong>{format(new Date(contrat.date_debut), "dd MMMM yyyy", { locale: fr })}</strong></>
                )}
                {contrat.date_fin && (
                  <> et reste valable jusqu'au <strong>{format(new Date(contrat.date_fin), "dd MMMM yyyy", { locale: fr })}</strong></>
                )}
                . Elle couvre la durée des travaux du chantier <strong>{chantierName}</strong>.
              </p>
            </div>

            {/* Article 10 */}
            <div data-pdf-section style={{ marginTop: "30px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1a5276", marginBottom: "16px", textDecoration: "underline", ...sectionStyle }}>
                ARTICLE 10 : RÉSILIATION DE LA CONVENTION
              </h3>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", ...sectionStyle }}>
                La présente convention peut être résiliée par l'une ou l'autre des parties moyennant un préavis écrit de trente (30) jours. En cas de résiliation, le laboratoire sera rémunéré pour les prestations effectivement réalisées jusqu'à la date de résiliation. Toute résiliation anticipée ne donne droit à aucune indemnité compensatoire.
              </p>
            </div>

            {/* Article 11 */}
            <div data-pdf-section style={{ marginTop: "30px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1a5276", marginBottom: "16px", textDecoration: "underline", ...sectionStyle }}>
                ARTICLE 11 : ENTRÉE EN VIGUEUR
              </h3>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", ...sectionStyle }}>
                La présente convention entre en vigueur à compter de sa signature par les deux parties. Elle est établie en deux (02) exemplaires originaux, un pour chaque partie.
              </p>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "right", marginTop: "16px", ...sectionStyle }}>
                Fait à {labSiege}, le {dateDoc}
              </p>
            </div>

            {/* Observations */}
            {contrat.observations && (
              <div data-pdf-section style={{ marginTop: "30px", padding: "16px 20px", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "4px" }}>
                <h4 style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "8px", color: "#1a5276", ...sectionStyle }}>Observations :</h4>
                <p style={{ fontSize: "12px", lineHeight: "1.8", ...sectionStyle }}>{contrat.observations}</p>
              </div>
            )}

            {/* Signatures */}
            <div data-pdf-section style={{ marginTop: "60px", display: "flex", justifyContent: "space-between" }}>
              <div style={{ textAlign: "center", width: "40%" }}>
                <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "50px", ...sectionStyle }}>Le Client</p>
                <div style={{ borderTop: "1px solid #999", paddingTop: "8px" }}>
                  <p style={{ fontSize: "11px", fontWeight: "bold", ...sectionStyle }}>{clientName}</p>
                  <p style={{ fontSize: "10px", color: "#666", marginTop: "2px", ...sectionStyle }}>{representant}</p>
                </div>
              </div>
              <div style={{ textAlign: "center", width: "40%" }}>
                <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "50px", ...sectionStyle }}>Le Laboratoire</p>
                <div style={{ borderTop: "1px solid #999", paddingTop: "8px" }}>
                  <p style={{ fontSize: "11px", fontWeight: "bold", ...sectionStyle }}>{labName}</p>
                  <p style={{ fontSize: "10px", color: "#666", marginTop: "2px", ...sectionStyle }}>Benmalek Fayçal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
