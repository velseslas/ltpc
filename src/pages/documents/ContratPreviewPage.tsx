import { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Printer, Download, Share2, FileText, ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useContratsDocuments } from "@/hooks/useDocuments";
import { useContratArticles, DEFAULT_ARTICLES } from "@/hooks/useContratArticles";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { DocumentPageHeader } from "@/components/documents/DocumentPageHeader";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PrintService } from "@/lib/print/PrintService";

// LOT 9 — Template Contrat (portrait).
PrintService.registerTemplate({ id: "contrat-document", title: "Contrat", orientation: "portrait" });

const sectionStyle = { fontFamily: "'Times New Roman', Georgia, serif" } as const;
const pageStyle: React.CSSProperties = {
  padding: "40px 50px",
  minHeight: "1100px",
  ...sectionStyle,
};

const ContratPreviewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  const { data: entreprise } = useEntreprise();
  const { query } = useContratsDocuments();
  const { data: savedArticles } = useContratArticles(id || "");

  const contrat = query.data?.find((c: any) => c.id === id);

  if (!contrat) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <p>Contrat introuvable</p>
      </div>
    );
  }

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
  const labRepresentant = entreprise?.representant || "Le Directeur";

  const getArticleContent = (num: number) => {
    const saved = savedArticles?.find((a) => a.article_number === num);
    if (saved) return saved.contenu;
    const def = DEFAULT_ARTICLES.find((a) => a.number === num);
    return def?.contenu || "";
  };

  const getArticleTitle = (num: number) => {
    const saved = savedArticles?.find((a) => a.article_number === num);
    if (saved) return saved.titre;
    const def = DEFAULT_ARTICLES.find((a) => a.number === num);
    return def?.titre || "";
  };

  const replaceVars = (text: string) => {
    return text
      .replace(/\{\{labName\}\}/g, labName)
      .replace(/\{\{clientName\}\}/g, clientName)
      .replace(/\{\{chantierName\}\}/g, chantierName);
  };

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
        <p key={i} style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", marginTop: i > 0 ? "12px" : "0", ...sectionStyle }}>
          {p}
        </p>
      );
    });
  };

  const doPrint = () =>
    PrintService.print({ title: contrat.titre || "Contrat", orientation: "portrait" });
  const handlePrint = doPrint;
  const handleDownload = doPrint;

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

  const articleNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const qrData = `Contrat: ${contrat.titre} | Client: ${clientName} | Chantier: ${chantierName} | Date: ${dateDoc}`;

  return (
    <>
      <div className="print:hidden">
        <AppBreadcrumb items={[
          { label: "Documents", path: "/documents" },
          { label: "Contrats chantier", path: "/documents/contrats" },
          { label: contrat.titre },
        ]} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">

        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50" onClick={() => navigate("/documents/contrats")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/15 flex items-center justify-center">
                <FileText className="w-5 h-5 text-destructive" />
              </div>
              {contrat.titre}
            </h1>
            {contrat.numero && <p className="text-sm text-muted-foreground font-mono ml-14">N° {contrat.numero}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/documents/contrats/${id}/edit`)} className="gap-2 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
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

      {/* Contract content */}
      <div className="bg-secondary/30 rounded-xl p-4 sm:p-6 print:bg-transparent print:p-0">
        <div
          ref={reportRef}
          data-print-root
          data-print-template="contrat-document"
          data-ref="report"
          className="mx-auto flex flex-col gap-8"
          style={{ maxWidth: "800px", width: "100%" }}
        >
          {/* ============ PAGE 1 : PAGE DE GARDE ============ */}
          <div data-pdf-page className="bg-white text-black shadow-xl" style={{ ...pageStyle, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <DocumentPageHeader
                entreprise={entreprise}
                qrData={qrData}
                title="CONVENTION D'ASSISTANCE TECHNIQUE"
                subtitle="« CONTRÔLE ET SUIVI DE LA QUALITÉ DES BÉTONS »"
              />
            </div>

            {/* Info client */}
            <div style={{ margin: "40px 0", padding: "20px 24px", border: "1px solid #ccc", borderLeft: "4px solid #1a5276", background: "#f8fafc" }}>
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

            {/* Date */}
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "11px", color: "#666", ...sectionStyle }}>
                Fait le {dateDoc}
              </p>
            </div>
          </div>

          {/* ============ PAGE 2 : CONCLUE ENTRE + SOMMAIRE ============ */}
          <div data-pdf-page className="bg-white text-black shadow-xl" style={pageStyle}>
            <DocumentPageHeader
              entreprise={entreprise}
              qrData={qrData}
              title="CONVENTION D'ASSISTANCE TECHNIQUE"
              subtitle={contrat.titre}
            />

            {/* Conclue entre */}
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
              <strong>{labRepresentant}</strong>
            </p>
            <p style={{ fontSize: "14px", fontWeight: "bold", textAlign: "right", margin: "30px 0", color: "#333", ...sectionStyle }}>
              D'autre part.
            </p>

            {/* Sommaire */}
            <div style={{ marginTop: "40px", borderTop: "2px solid #e5e7eb", paddingTop: "30px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", textAlign: "center", marginBottom: "24px", color: "#1a5276", textDecoration: "underline", ...sectionStyle }}>
                SOMMAIRE
              </h3>
              {articleNumbers.map((num) => (
                <p key={num} style={{ fontSize: "12px", padding: "8px 0", borderBottom: "1px dotted #ccc", ...sectionStyle }}>
                  <strong>ARTICLE {String(num).padStart(2, "0")} - {getArticleTitle(num)}</strong>
                </p>
              ))}
            </div>
          </div>

          {/* ============ PAGES ARTICLES (groupés par pages) ============ */}
          {[[1, 2, 3], [4, 5], [6, 7, 8]].map((group, gi) => (
            <div key={gi} data-pdf-page className="bg-white text-black shadow-xl" style={pageStyle}>
              <DocumentPageHeader
                entreprise={entreprise}
                qrData={qrData}
                title="CONVENTION D'ASSISTANCE TECHNIQUE"
                subtitle={`Articles ${String(group[0]).padStart(2, "0")} à ${String(group[group.length - 1]).padStart(2, "0")}`}
              />

              {group.map((num, idx) => (
                <div key={num} style={{ marginTop: idx === 0 ? "10px" : "30px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1a5276", marginBottom: "16px", textDecoration: "underline", ...sectionStyle }}>
                    ARTICLE {String(num).padStart(2, "0")} : {getArticleTitle(num)}
                  </h3>
                  <div>{renderArticleContent(num)}</div>
                </div>
              ))}
            </div>
          ))}

          {/* ============ PAGE FINALE : ARTICLES 09-11 + SIGNATURES ============ */}
          <div data-pdf-page className="bg-white text-black shadow-xl" style={{ ...pageStyle, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <DocumentPageHeader
                entreprise={entreprise}
                qrData={qrData}
                title="CONVENTION D'ASSISTANCE TECHNIQUE"
                subtitle="Articles 09 à 11 — Visa et Signatures"
              />

              {[9, 10, 11].map((num, idx) => (
                <div key={num} style={{ marginTop: idx === 0 ? "10px" : "30px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1a5276", marginBottom: "16px", textDecoration: "underline", ...sectionStyle }}>
                    ARTICLE {String(num).padStart(2, "0")} : {getArticleTitle(num)}
                  </h3>
                  <div>{renderArticleContent(num)}</div>
                  {num === 11 && (
                    <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "right", marginTop: "16px", ...sectionStyle }}>
                      Fait le {dateDoc}
                    </p>
                  )}
                </div>
              ))}

              {contrat.observations && (
                <div style={{ marginTop: "20px", padding: "16px 20px", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "4px" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "8px", color: "#1a5276", ...sectionStyle }}>Observations :</h4>
                  <p style={{ fontSize: "12px", lineHeight: "1.8", ...sectionStyle }}>{contrat.observations}</p>
                </div>
              )}
            </div>

            {/* Signatures */}
            <div style={{ marginTop: "40px", display: "flex", justifyContent: "space-between" }}>
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
                  <p style={{ fontSize: "10px", color: "#666", marginTop: "2px", ...sectionStyle }}>{labRepresentant}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContratPreviewPage;
