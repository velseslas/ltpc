import { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Printer, Download, Share2, FileSignature, ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useLettresEngagement } from "@/hooks/useDocuments";
import { useEngagementArticles, DEFAULT_ENGAGEMENT_ARTICLES } from "@/hooks/useEngagementArticles";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const EngagementPreviewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  const { data: entreprise } = useEntreprise();
  const { query } = useLettresEngagement();
  const { data: savedArticles } = useEngagementArticles(id || "");

  const engagement = query.data?.find((c: any) => c.id === id);

  if (!engagement) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <p>Lettre d'engagement introuvable</p>
      </div>
    );
  }

  const clientName = engagement.clients?.nom || "—";
  const chantierName = engagement.chantiers?.nom || "—";
  const representant = engagement.clients?.representant || "—";
  const clientAdresse = engagement.clients?.adresse || "";
  const clientVille = engagement.clients?.ville || "";
  const clientLocalisation = [clientAdresse, clientVille].filter(Boolean).join(", ");
  const dateDoc = engagement.date_document
    ? format(new Date(engagement.date_document), "dd MMMM yyyy", { locale: fr })
    : format(new Date(), "dd MMMM yyyy", { locale: fr });

  const labName = entreprise?.nom || "LABS.CAM";
  const labSiege = entreprise?.siege_social || "";

  const getArticleContent = (num: number) => {
    const saved = savedArticles?.find((a) => a.article_number === num);
    if (saved) return saved.contenu;
    const def = DEFAULT_ENGAGEMENT_ARTICLES.find((a) => a.number === num);
    return def?.contenu || "";
  };

  const getArticleTitle = (num: number) => {
    const saved = savedArticles?.find((a) => a.article_number === num);
    if (saved) return saved.titre;
    const def = DEFAULT_ENGAGEMENT_ARTICLES.find((a) => a.number === num);
    return def?.titre || "";
  };

  const replaceVars = (text: string) => {
    return text
      .replace(/\{\{labName\}\}/g, labName)
      .replace(/\{\{clientName\}\}/g, clientName)
      .replace(/\{\{chantierName\}\}/g, chantierName);
  };

  const sectionStyle = { fontFamily: "'Times New Roman', Georgia, serif" } as const;

  const renderArticleContent = (num: number) => {
    const raw = replaceVars(getArticleContent(num));
    const paragraphs = raw.split("\n").filter((l) => l.trim());

    return paragraphs.map((p, i) => {
      if (p.trim().startsWith("- ")) {
        return (
          <li key={i} style={{ fontSize: "12px", lineHeight: "2", marginLeft: "20px", ...sectionStyle }}>
            {p.trim().substring(2)}
          </li>
        );
      }
      return (
        <p key={i} style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", marginTop: i > 0 ? "8px" : "0", ...sectionStyle }}>
          {p}
        </p>
      );
    });
  };

  const handlePrint = () => {
    const printContent = reportRef.current;
    if (!printContent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>${engagement.titre}</title>
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

      pdf.save(`${engagement.titre || "engagement"}.pdf`);
      toast.success("PDF téléchargé avec succès");
    } catch {
      toast.error("Erreur lors du téléchargement");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: engagement.titre, text: `Engagement: ${engagement.titre}` });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(`Engagement: ${engagement.titre} - Client: ${clientName} - Chantier: ${chantierName}`);
      toast.success("Informations copiées dans le presse-papiers");
    }
  };

  const articleNumbers = [1, 2, 3, 4, 5];

  return (
    <>
      <AppBreadcrumb items={[
        { label: "Documents", path: "/documents" },
        { label: "Lettres d'engagement", path: "/documents/lettres-engagement" },
        { label: engagement.titre },
      ]} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
            onClick={() => navigate("/documents/lettres-engagement")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <FileSignature className="w-5 h-5 text-blue-500" />
              </div>
              {engagement.titre}
            </h1>
            {engagement.numero && <p className="text-sm text-muted-foreground font-mono ml-14">N° {engagement.numero}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/documents/lettres-engagement/${id}/edit`)}
            className="gap-2 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            <Pencil className="w-4 h-4" />
            Modifier
          </Button>
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

      {/* Engagement content */}
      <div className="bg-secondary/30 rounded-xl p-4 sm:p-6">
        <div
          ref={reportRef}
          className="bg-white text-black shadow-xl mx-auto"
          style={{ maxWidth: "800px", width: "100%", padding: "40px 50px", ...sectionStyle }}
        >
          {/* Couverture */}
          <div data-pdf-section>
            <div style={{ textAlign: "center", borderBottom: "3px double #1a5276", paddingBottom: "12px", marginBottom: "50px" }}>
              <p style={{ fontSize: "15px", fontWeight: "bold", letterSpacing: "1.5px", color: "#1a5276", marginBottom: "3px", ...sectionStyle }}>
                LABORATOIRE DES TRAVAUX PUBLICS ET DE CONSTRUCTION
              </p>
              <p style={{ fontSize: "12px", fontWeight: "bold", color: "#1a5276", ...sectionStyle }}>
                {labName}{labSiege ? `, SIS À ${labSiege.toUpperCase()}` : ""}
              </p>
              <p style={{ fontSize: "10px", color: "#555", marginTop: "4px", ...sectionStyle }}>
                {entreprise?.telephone ? `TEL- FAX ${entreprise.telephone}` : ""}
                {entreprise?.email ? ` | Mail : ${entreprise.email}` : ""}
              </p>
            </div>

            <div style={{ textAlign: "center", margin: "60px 0" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#1a5276", marginBottom: "14px", letterSpacing: "1px", ...sectionStyle }}>
                ENGAGEMENT D'ASSISTANCE TECHNIQUE
              </h2>
              <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#2c3e50", ...sectionStyle }}>
                « TRAVAUX DE LABORATOIRE »
              </h3>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#2c3e50", marginTop: "8px", ...sectionStyle }}>
                CONTRÔLE ET SUIVI DE LA QUALITÉ DES BÉTONS
              </h3>
            </div>

            <div style={{ margin: "50px 0", padding: "20px 24px", border: "1px solid #ccc", borderLeft: "4px solid #1a5276", background: "#f8fafc" }}>
              <p style={{ fontSize: "13px", marginBottom: "10px", lineHeight: "1.6", ...sectionStyle }}>
                <strong style={{ textDecoration: "underline" }}>Client</strong> : Entreprise <strong>{clientName}</strong>
                {clientLocalisation && <span>, sis à {clientLocalisation}</span>}
              </p>
              <p style={{ fontSize: "13px", marginBottom: "10px", lineHeight: "1.6", ...sectionStyle }}>
                <strong style={{ textDecoration: "underline" }}>Projet</strong> : <strong>{chantierName}</strong>
              </p>
            </div>

            <p style={{ fontSize: "11px", textAlign: "right", color: "#666", margin: "20px 0", ...sectionStyle }}>
              Fait le {dateDoc}
            </p>
          </div>

          {/* Conclue entre */}
          <div data-pdf-section style={{ marginTop: "40px", borderTop: "2px solid #e5e7eb", paddingTop: "30px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "24px", color: "#1a5276", ...sectionStyle }}>
              Conclu entre :
            </h3>
            <p style={{ fontSize: "13px", lineHeight: "2", marginBottom: "8px", textAlign: "justify", ...sectionStyle }}>
              L'Entreprise <strong>{clientName}</strong>
              {clientLocalisation && <>, sis à {clientLocalisation}</>}
              {" "}représentée par son Directeur Général Monsieur{" "}
              <strong>{representant}</strong>
            </p>
            <p style={{ fontSize: "14px", fontWeight: "bold", textAlign: "right", margin: "30px 0", color: "#333", ...sectionStyle }}>
              D'une part,
            </p>
            <p style={{ fontSize: "13px", lineHeight: "2", marginBottom: "8px", textAlign: "justify", ...sectionStyle }}>
              Laboratoire <strong>{labName}</strong>
              {labSiege && <>, {labSiege}</>}
              , représenté par son directeur
            </p>
            <p style={{ fontSize: "14px", fontWeight: "bold", textAlign: "right", margin: "30px 0", color: "#333", ...sectionStyle }}>
              D'autre part,
            </p>
            <p style={{ fontSize: "13px", lineHeight: "2", textAlign: "center", fontStyle: "italic", marginTop: "20px", ...sectionStyle }}>
              Il a été arrêté ce qui suit :
            </p>
          </div>

          {/* Articles */}
          {articleNumbers.map((num) => (
            <div key={num} data-pdf-section style={{ marginTop: "30px", ...(num === 1 ? { borderTop: "2px solid #e5e7eb", paddingTop: "30px" } : {}) }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1a5276", marginBottom: "16px", textDecoration: "underline", ...sectionStyle }}>
                ARTICLE {String(num).padStart(2, "0")} : {getArticleTitle(num)}
              </h3>
              <div>{renderArticleContent(num)}</div>
            </div>
          ))}

          {/* VISA */}
          <div data-pdf-section style={{ marginTop: "60px", display: "flex", justifyContent: "space-between" }}>
            <div style={{ textAlign: "center", width: "40%" }}>
              <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "50px", ...sectionStyle }}>VISA DU LABORATOIRE</p>
              <div style={{ borderTop: "1px solid #999", paddingTop: "8px" }}>
                <p style={{ fontSize: "11px", fontWeight: "bold", ...sectionStyle }}>{labName}</p>
              </div>
            </div>
            <div style={{ textAlign: "center", width: "40%" }}>
              <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "50px", ...sectionStyle }}>Le Client</p>
              <div style={{ borderTop: "1px solid #999", paddingTop: "8px" }}>
                <p style={{ fontSize: "11px", fontWeight: "bold", ...sectionStyle }}>{clientName}</p>
                <p style={{ fontSize: "10px", color: "#666", marginTop: "2px", ...sectionStyle }}>{representant}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EngagementPreviewPage;
