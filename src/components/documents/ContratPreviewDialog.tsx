import { useRef } from "react";
import { Printer, Download, Share2, FileText } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEntreprise } from "@/hooks/useEntreprise";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { downloadReportAsPDF } from "@/lib/pdf";

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

  const handlePrint = () => window.print();

  const handleDownload = () => {
    downloadReportAsPDF(contrat.titre || "contrat");
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
            data-ref="report"
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
                La présente convention a pour objet de définir des prestations assurées par le laboratoire <strong>{labName}</strong> dans le cadre de l'assistance technique de l'entreprise <strong>{clientName}</strong>, dans le cadre du projet de la réalisation du chantier <strong>{chantierName}</strong>.
              </p>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", marginTop: "12px", ...sectionStyle }}>
                Les prestations consistent à l'assistance technique, aux travaux de laboratoire pour le contrôle et le suivi de la qualité des bétons confectionnés pour le projet.
              </p>
            </div>

            {/* Article 02 */}
            <div data-pdf-section style={{ marginTop: "30px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1a5276", marginBottom: "16px", textDecoration: "underline", ...sectionStyle }}>
                ARTICLE 02 : MODE DE PASSATION DE LA CONVENTION
              </h3>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", ...sectionStyle }}>
                La présente convention est passée de gré à gré conformément à la réglementation en vigueur régissant les marchés publics.
              </p>
            </div>

            {/* Article 03 */}
            <div data-pdf-section style={{ marginTop: "30px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1a5276", marginBottom: "16px", textDecoration: "underline", ...sectionStyle }}>
                ARTICLE 03 : INTERVENTION DU LABORATOIRE
              </h3>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", ...sectionStyle }}>
                L'intervention du laboratoire <strong>{labName}</strong> consiste, à la demande de l'entreprise <strong>{clientName}</strong>, à l'assistance, études, essais et analyses de qualité des matériaux de construction utilisés dans la réalisation du projet ainsi que le suivi et le contrôle des productions de béton.
              </p>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", marginTop: "12px", ...sectionStyle }}>
                Les travaux de laboratoire portent notamment sur ce qui suit :
              </p>
              <ul style={{ fontSize: "12px", lineHeight: "2", marginLeft: "20px", marginTop: "8px", listStyleType: "disc", ...sectionStyle }}>
                <li>Etudes et formulations des compositions de béton.</li>
                <li>Les essais et analyse des sables : équivalent de sable, mesure du taux d'humidité, granulométrie.</li>
                <li>Analyse granulométrique des agrégats.</li>
                <li>Les essais d'écrasement sur éprouvettes de béton.</li>
                <li>Prélèvement, gâchage des éprouvettes pour essais ainsi que la conservation dans des bassins de maturation.</li>
                <li>Vérification, contrôle et correction des compositions au niveau de la centrale à béton.</li>
                <li>S'assurer que les moyens mis en œuvre (centrales à béton), doivent permettre de confectionner les bétons aux qualités souhaitées, conformes aux normes et études préalables de formulation de composition du béton.</li>
                <li>Assistance technique dans le cadre des bétons prescrits.</li>
                <li>Auto contrôle de l'entreprise pour une qualité continue des matériaux et béton.</li>
              </ul>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", marginTop: "12px", ...sectionStyle }}>
                Du point de vue suivi et contrôle de la qualité des matériaux, le laboratoire mettra au service de l'entreprise l'assistance technique ainsi que son expérience par le biais d'un ingénieur de laboratoire qualifié, ainsi qu'un staff technique de soutien pour rechercher les solutions aux problèmes techniques pouvant être rencontrés en cours de la réalisation des travaux.
              </p>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", marginTop: "12px", ...sectionStyle }}>
                L'ingénieur de laboratoire sera mobilisé en permanence sur site, un ingénieur responsable qualité effectuera des visites périodiques du chantier afin de contrôler le bon déroulement du suivi de la qualité des bétons ainsi que la conformité des moyens de production.
              </p>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", marginTop: "12px", ...sectionStyle }}>
                Le directeur technique responsable, assistera aux réunions périodiques tenues au niveau du chantier, en qualité de représentant du laboratoire et de l'entreprise concernant la qualité des bétons.
              </p>
            </div>

            {/* Article 04 */}
            <div data-pdf-section style={{ marginTop: "30px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1a5276", marginBottom: "16px", textDecoration: "underline", ...sectionStyle }}>
                ARTICLE 04 : MATÉRIEL À MOBILISER SUR SITE
              </h3>
              <ul style={{ fontSize: "12px", lineHeight: "2", marginLeft: "20px", listStyleType: "disc", ...sectionStyle }}>
                <li>Une presse à béton de 1500 KN de type semi-automatique dûment étalonnée par un organisme qualifié.</li>
                <li>Un dispositif d'essai d'équivalent de sable</li>
                <li>Une balance de précision 8Kg/0.2grs</li>
                <li>Une balance standard 30Kg/5grs</li>
                <li>Deux cônes d'Abrams pour les mesures d'affaissement</li>
                <li>Des thermomètres pour le béton frais</li>
                <li>Éprouvettes cubiques 15x15x15 normalisées</li>
                <li>01 mini compresseur pour le démoulage des éprouvettes</li>
                <li>Deux thermoplongeurs pour le maintien de la température de conservation des éprouvettes.</li>
                <li>Les bassins de conservation seront aménagés par l'entreprise, sur site, à proximité des locaux provisoires du laboratoire.</li>
                <li>Une chambre de permanence est à prévoir sur site pour assurer les coulages du soir.</li>
              </ul>
            </div>

            {/* Article 05 */}
            <div data-pdf-section style={{ marginTop: "30px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1a5276", marginBottom: "16px", textDecoration: "underline", ...sectionStyle }}>
                ARTICLE 05 : MISSION DU LABORATOIRE
              </h3>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", ...sectionStyle }}>
                Le laboratoire <strong>{labName}</strong> a pour mission de procéder aux essais de laboratoire et de suivre la qualité des matériaux à mettre en œuvre, dans le cadre du projet de l'entreprise, et de contribuer avec l'entreprise, pour s'assurer que toutes les conditions sont réunies pour obtenir les performances et la régularité de la qualité des matériaux exigés par les études et le client.
              </p>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", marginTop: "12px", ...sectionStyle }}>
                Le laboratoire <strong>{labName}</strong>, en collaboration avec l'entreprise <strong>{clientName}</strong>, doit s'assurer que les constituants entrant dans les formulations et la fabrication du béton sont conformes aux prescriptions de l'étude de charge, des normes et règlements en la matière. (Normes Algériennes)
              </p>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", marginTop: "12px", ...sectionStyle }}>
                En particulier s'assurer que les moyens de la centrale à béton, doivent permettre de confectionner les bétons aux qualités souhaitées, conformes aux essais de convenance et étude préalables de formulation et de composition du béton.
              </p>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", marginTop: "12px", ...sectionStyle }}>
                Le laboratoire est seul responsable de la gestion technique et administrative des prestations en travaux d'analyse et contrôle des matériaux.
              </p>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", marginTop: "12px", ...sectionStyle }}>
                Pour cela le laboratoire doit disposer de tous les pouvoirs qui lui seront délégués par l'entreprise <strong>{clientName}</strong> signataire de la présente convention, pour faire respecter les recommandations relatives à la qualité des matériaux de construction mis en œuvre dans le cadre des projets visés.
              </p>
            </div>

            {/* Article 06 */}
            <div data-pdf-section style={{ marginTop: "30px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1a5276", marginBottom: "16px", textDecoration: "underline", ...sectionStyle }}>
                ARTICLE 06 : NOMBRE ET FRÉQUENCE DES ESSAIS À EFFECTUER
              </h3>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", ...sectionStyle }}>
                Le nombre et la fréquence des essais à effectuer seront définis en commun accord entre l'entreprise et le laboratoire <strong>{labName}</strong>, en conformité avec le cahier technique après avis de l'organisme de contrôle technique dans le cadre de la garantie décennale.
              </p>
            </div>

            {/* Article 07 */}
            <div data-pdf-section style={{ marginTop: "30px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1a5276", marginBottom: "16px", textDecoration: "underline", ...sectionStyle }}>
                ARTICLE 07 : HONORAIRES DU LABORATOIRE
              </h3>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", ...sectionStyle }}>
                Les prestations fournies pour le contrôle de la qualité des bétons produits pour le chantier et selon un programme d'essais établi en commun accord, feront l'objet d'une facturation forfaitaire mensuelle fixe quel que soit le nombre d'essais effectués.
              </p>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", marginTop: "12px", ...sectionStyle }}>
                Ce montant sera majoré d'une TVA applicable le jour de la facturation.
              </p>
            </div>

            {/* Article 08 */}
            <div data-pdf-section style={{ marginTop: "30px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1a5276", marginBottom: "16px", textDecoration: "underline", ...sectionStyle }}>
                ARTICLE 08 : MODALITÉ DE PAIEMENT
              </h3>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", ...sectionStyle }}>
                Le règlement des honoraires du laboratoire doit s'effectuer mensuellement dans un délai maximum de 30 jours après réception de la facture par l'entreprise.
              </p>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", marginTop: "12px", ...sectionStyle }}>
                Le règlement se fera par espèce ou par chèque bancaire au nom de {labName}.
              </p>
            </div>

            {/* Article 09 */}
            <div data-pdf-section style={{ marginTop: "30px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1a5276", marginBottom: "16px", textDecoration: "underline", ...sectionStyle }}>
                ARTICLE 09 : DURÉE DE VALIDITÉ DE LA CONVENTION
              </h3>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", ...sectionStyle }}>
                La présente convention est valide jusqu'à l'achèvement total des travaux de béton.
              </p>
            </div>

            {/* Article 10 */}
            <div data-pdf-section style={{ marginTop: "30px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1a5276", marginBottom: "16px", textDecoration: "underline", ...sectionStyle }}>
                ARTICLE 10 : RÉSILIATION DE LA CONVENTION
              </h3>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", ...sectionStyle }}>
                La présente convention peut être résiliée par l'une ou l'autre des deux parties en cas de non-respect des termes du contrat.
              </p>
            </div>

            {/* Article 11 */}
            <div data-pdf-section style={{ marginTop: "30px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#1a5276", marginBottom: "16px", textDecoration: "underline", ...sectionStyle }}>
                ARTICLE 11 : ENTRÉE EN VIGUEUR
              </h3>
              <p style={{ fontSize: "12px", lineHeight: "2", textAlign: "justify", ...sectionStyle }}>
                La présente convention est valable et définitive, dès l'approbation par les deux parties. Elle prendra effet dès le démarrage des prestations du laboratoire.
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
