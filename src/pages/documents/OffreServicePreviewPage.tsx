import { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Printer, Download, Share2, Briefcase, ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useOffresService } from "@/hooks/useDocuments";
import {
  useOffreServiceArticles,
  DEFAULT_OFFRE_ARTICLES,
} from "@/hooks/useOffreServiceArticles";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { DocumentPageHeader } from "@/components/documents/DocumentPageHeader";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { downloadReportAsPDF } from "@/lib/pdf";

const sectionStyle = { fontFamily: "'Times New Roman', Georgia, serif" } as const;
const pageStyle: React.CSSProperties = {
  padding: "40px 50px",
  minHeight: "1100px",
  ...sectionStyle,
};

const OffreServicePreviewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  const { data: entreprise } = useEntreprise();
  const { query } = useOffresService();
  const { data: savedArticles } = useOffreServiceArticles(id || "");

  const offre = query.data?.find((o: any) => o.id === id);

  if (!offre) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <p>Offre de service introuvable</p>
      </div>
    );
  }

  const clientName = (offre as any).clients?.nom || "—";
  const chantierName = (offre as any).chantiers?.nom || "—";
  const representant = (offre as any).clients?.representant || "—";
  const clientAdresse = (offre as any).clients?.adresse || "";
  const clientVille = (offre as any).clients?.ville || "";
  const clientLocalisation = [clientAdresse, clientVille].filter(Boolean).join(", ");
  const dateDoc = offre.date_document
    ? format(new Date(offre.date_document), "dd MMMM yyyy", { locale: fr })
    : format(new Date(), "dd MMMM yyyy", { locale: fr });

  const labName = entreprise?.nom || "LTPC BENMALEK";
  const labSiege = entreprise?.siege_social || "Ain El Bey Constantine";
  const labRepresentant = entreprise?.representant || "Le Directeur";

  const getArticleContent = (num: number) => {
    const saved = savedArticles?.find((a) => a.article_number === num);
    if (saved) return saved.contenu;
    const def = DEFAULT_OFFRE_ARTICLES.find((a) => a.number === num);
    return def?.contenu || "";
  };

  const getArticleTitle = (num: number) => {
    const saved = savedArticles?.find((a) => a.article_number === num);
    if (saved) return saved.titre;
    const def = DEFAULT_OFFRE_ARTICLES.find((a) => a.number === num);
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
          <li key={i} style={{ fontSize: "12px", lineHeight: "1.9", marginLeft: "20px", ...sectionStyle }}>
            {p.trim().substring(2)}
          </li>
        );
      }
      return (
        <p
          key={i}
          style={{
            fontSize: "12px",
            lineHeight: "2",
            textAlign: "justify",
            marginTop: i > 0 ? "12px" : "0",
            ...sectionStyle,
          }}
        >
          {p}
        </p>
      );
    });
  };
  const handlePrint = () => window.print();

  const handleDownload = () => {
    downloadReportAsPDF(offre.titre || "offre-de-service");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: offre.titre, text: `Offre de service: ${offre.titre}` });
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard.writeText(
        `Offre de service: ${offre.titre} - Client: ${clientName} - Chantier: ${chantierName}`,
      );
      toast.success("Informations copiées dans le presse-papiers");
    }
  };

  const articleNumbers = DEFAULT_OFFRE_ARTICLES.map((a) => a.number);
  const qrData = `Offre: ${offre.titre} | Client: ${clientName} | Chantier: ${chantierName} | Date: ${dateDoc}`;

  return (
    <>
      <div className="print:hidden">
        <AppBreadcrumb
          items={[
            { label: "Documents", path: "/documents" },
            { label: "Offres de service", path: "/documents/offres-service" },
            { label: offre.titre },
          ]}
        />
      </div>

      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
            onClick={() => navigate("/documents/offres-service")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-emerald-500" />
              </div>
              {offre.titre}
            </h1>
            {offre.numero && (
              <p className="text-sm text-muted-foreground font-mono ml-14">N° {offre.numero}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/documents/offres-service/${id}/edit`)}
            className="gap-2 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            <Pencil className="w-4 h-4" />
            Modifier
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            className="gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimer</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Télécharger</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Partager</span>
          </Button>
        </div>
      </div>

      <div className="bg-secondary/30 rounded-xl p-4 sm:p-6">
        <div ref={reportRef} className="mx-auto flex flex-col gap-8" style={{ maxWidth: "800px", width: "100%" }}>
          {/* ============ PAGE 1 : PAGE DE GARDE ============ */}
          <div
            data-pdf-page
            className="bg-white text-black shadow-xl"
            style={{ ...pageStyle, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
          >
            <div>
              <DocumentPageHeader
                entreprise={entreprise}
                qrData={qrData}
                title="OFFRE DE SERVICE"
                subtitle="« CONTRÔLE ET SUIVI DE LA QUALITÉ DES BÉTONS »"
              />
            </div>

            <div
              style={{
                margin: "40px 0",
                padding: "20px 24px",
                border: "1px solid #ccc",
                borderLeft: "4px solid #059669",
                background: "#f8fafc",
              }}
            >
              <p style={{ fontSize: "13px", marginBottom: "10px", lineHeight: "1.6", ...sectionStyle }}>
                <strong style={{ textDecoration: "underline" }}>Destinataire</strong> : Entreprise{" "}
                <strong>{clientName}</strong>
                {clientLocalisation && <span>, sis à {clientLocalisation}</span>}
              </p>
              <p style={{ fontSize: "13px", marginBottom: "10px", lineHeight: "1.6", ...sectionStyle }}>
                <strong style={{ textDecoration: "underline" }}>Chantier</strong> :{" "}
                <strong>{chantierName}</strong>
              </p>
              <p style={{ fontSize: "13px", lineHeight: "1.6", ...sectionStyle }}>
                <strong style={{ textDecoration: "underline" }}>À l'attention de</strong> : Monsieur{" "}
                <strong>{representant}</strong>
              </p>
            </div>

            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "11px", color: "#666", ...sectionStyle }}>Fait le {dateDoc}</p>
            </div>
          </div>

          {/* ============ PAGE 2 : SOMMAIRE ============ */}
          <div data-pdf-page className="bg-white text-black shadow-xl" style={pageStyle}>
            <DocumentPageHeader
              entreprise={entreprise}
              qrData={qrData}
              title="OFFRE DE SERVICE"
              subtitle={offre.titre}
            />

            <p style={{ fontSize: "13px", lineHeight: "2", marginBottom: "8px", textAlign: "justify", ...sectionStyle }}>
              <strong>Objet :</strong> Offre de services
            </p>
            <p style={{ fontSize: "13px", lineHeight: "2", marginBottom: "16px", textAlign: "justify", ...sectionStyle }}>
              Monsieur,
            </p>
            <p style={{ fontSize: "13px", lineHeight: "2", marginBottom: "16px", textAlign: "justify", ...sectionStyle }}>
              Le laboratoire <strong>{labName}</strong>, sis à {labSiege}, représenté par son Directeur{" "}
              <strong>{labRepresentant}</strong>, a l'honneur de vous soumettre la présente offre de service relative
              au contrôle et au suivi de la qualité des bétons pour votre chantier{" "}
              <strong>{chantierName}</strong>.
            </p>

            <div style={{ marginTop: "40px", borderTop: "2px solid #e5e7eb", paddingTop: "30px" }}>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  textAlign: "center",
                  marginBottom: "24px",
                  color: "#059669",
                  textDecoration: "underline",
                  ...sectionStyle,
                }}
              >
                SOMMAIRE
              </h3>
              {articleNumbers.map((num) => (
                <p
                  key={num}
                  style={{
                    fontSize: "12px",
                    padding: "8px 0",
                    borderBottom: "1px dotted #ccc",
                    ...sectionStyle,
                  }}
                >
                  <strong>
                    ARTICLE {String(num).padStart(2, "0")} - {getArticleTitle(num)}
                  </strong>
                </p>
              ))}
            </div>
          </div>

          {/* ============ PAGES ARTICLES (1 article par page) ============ */}
          {articleNumbers.map((num, idx) => {
            const isLast = idx === articleNumbers.length - 1;
            return (
              <div
                key={num}
                data-pdf-page
                className="bg-white text-black shadow-xl"
                style={{
                  ...pageStyle,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: isLast ? "space-between" : "flex-start",
                }}
              >
                <div>
                  <DocumentPageHeader
                    entreprise={entreprise}
                    qrData={qrData}
                    title="OFFRE DE SERVICE"
                    subtitle={`Article ${String(num).padStart(2, "0")}`}
                  />

                  <div style={{ marginTop: "10px" }}>
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "#059669",
                        marginBottom: "16px",
                        textDecoration: "underline",
                        ...sectionStyle,
                      }}
                    >
                      ARTICLE {String(num).padStart(2, "0")} : {getArticleTitle(num)}
                    </h3>
                    <div>{renderArticleContent(num)}</div>
                  </div>

                  {isLast && offre.observations && (
                    <div
                      style={{
                        marginTop: "20px",
                        padding: "16px 20px",
                        background: "#f8fafc",
                        border: "1px solid #e5e7eb",
                        borderRadius: "4px",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "13px",
                          fontWeight: "bold",
                          marginBottom: "8px",
                          color: "#059669",
                          ...sectionStyle,
                        }}
                      >
                        Observations :
                      </h4>
                      <p style={{ fontSize: "12px", lineHeight: "1.8", ...sectionStyle }}>{offre.observations}</p>
                    </div>
                  )}
                </div>

                {isLast && (
                  <div style={{ marginTop: "40px" }}>
                    <p
                      style={{
                        fontSize: "12px",
                        lineHeight: "2",
                        textAlign: "right",
                        marginBottom: "30px",
                        ...sectionStyle,
                      }}
                    >
                      Fait le {dateDoc}
                    </p>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <div style={{ textAlign: "center", width: "45%" }}>
                        <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "60px", ...sectionStyle }}>
                          Le Laboratoire
                        </p>
                        <div style={{ borderTop: "1px solid #999", paddingTop: "8px" }}>
                          <p style={{ fontSize: "11px", fontWeight: "bold", ...sectionStyle }}>{labName}</p>
                          <p style={{ fontSize: "10px", color: "#666", marginTop: "2px", ...sectionStyle }}>
                            {labRepresentant}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default OffreServicePreviewPage;
