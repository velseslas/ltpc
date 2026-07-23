import { forwardRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { QRCodeSVG } from "qrcode.react";
import { buildQRContent } from "@/lib/qrContent";

interface DocumentPreviewProps {
  type: "attestation" | "certificat" | "avertissement" | "contrat";
  employe: {
    nom: string;
    prenom: string;
    date_naissance?: string | null;
    date_embauche?: string | null;
    poste?: string | null;
    cin?: string | null;
    adresse?: string | null;
    salaire?: number | null;
  };
  entreprise: {
    nom: string;
    siege_social?: string | null;
    telephone?: string | null;
    email?: string | null;
    logo_url?: string | null;
    numero_autorisation?: string | null;
    date_autorisation?: string | null;
    annexe?: string | null;
  };
  dateFin?: string;
  motifAvertissement?: string;
  dateFaits?: string;
  niveauAvertissement?: "1er avertissement" | "2ème avertissement" | "Dernier avertissement";
  typeContrat?: "CDI" | "CDD" | "Période d'essai";
  dureeContrat?: string;
  lieuTravail?: string;
}

const sectionStyle = { fontFamily: "'Times New Roman', Georgia, serif" } as const;

export const DocumentPreview = forwardRef<HTMLDivElement, DocumentPreviewProps>(
  ({ type, employe, entreprise, dateFin, motifAvertissement, dateFaits, niveauAvertissement, typeContrat, dureeContrat, lieuTravail }, ref) => {
    const today = format(new Date(), "dd MMMM yyyy", { locale: fr });
    const dateEmbauche = employe.date_embauche
      ? format(new Date(employe.date_embauche), "dd MMMM yyyy", { locale: fr })
      : "_______________";
    const dateNaissance = employe.date_naissance
      ? format(new Date(employe.date_naissance), "dd MMMM yyyy", { locale: fr })
      : "_______________";
    const dateFinFormatted = dateFin
      ? format(new Date(dateFin), "dd MMMM yyyy", { locale: fr })
      : today;
    const dateFaitsFormatted = dateFaits
      ? format(new Date(dateFaits), "dd MMMM yyyy", { locale: fr })
      : "_______________";

    const titleMap = {
      attestation: "Attestation de Travail",
      certificat: "Certificat de Travail",
      avertissement: "Lettre d'Avertissement",
      contrat: "Contrat de Travail",
    } as const;
    const title = titleMap[type];

    const qrData = buildQRContent({
      entreprise: entreprise.nom,
      type: title,
      titre: `${employe.prenom} ${employe.nom}`,
      date: today,
      extra: {
        Poste: employe.poste ?? null,
        CIN: employe.cin ?? null,
        "Date d'embauche": dateEmbauche,
      },
    });

    const containerStyle: React.CSSProperties = {
      backgroundColor: "#ffffff",
      color: "#000000",
      padding: "40px 50px",
      minHeight: "297mm",
      width: "210mm",
      margin: "0 auto",
      fontSize: "14px",
      lineHeight: "1.6",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      ...sectionStyle,
    };

    const topBlockStyle: React.CSSProperties = { flex: "0 0 auto" };
    const bodyWrapperStyle: React.CSSProperties = { flex: "1 1 auto" };
    const signatureBottomStyle: React.CSSProperties = { flex: "0 0 auto", marginTop: "auto" };

    const renderHeader = () => (
      <>
        {/* En-tête encadré style rapport */}
        <div style={{ border: "1px solid #000", borderRadius: "8px", padding: "16px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            {/* Logo */}
            <div style={{ width: "96px", height: "96px", border: "1px solid #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", background: "#d4e5f7", borderRadius: "6px", flexShrink: 0 }}>
              {entreprise.logo_url ? (
                <img src={entreprise.logo_url} alt="Logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              ) : (
                <span style={{ fontSize: "12px", color: "#6b7280" }}>LOGO</span>
              )}
            </div>

            {/* Informations entreprise */}
            <div style={{ flex: 1, textAlign: "center", padding: "0 12px" }}>
              <p style={{ fontSize: "16px", fontWeight: "bold", color: "#1e5a7a", marginBottom: "4px", ...sectionStyle }}>
                {entreprise.nom || "Laboratoire de Travaux Publics & de Construction"}
              </p>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#000", marginBottom: "4px", ...sectionStyle }}>
                Autorisation N° {entreprise.numero_autorisation || "—"}
                {entreprise.date_autorisation && (
                  <> Du {format(new Date(entreprise.date_autorisation), "dd/MM/yyyy", { locale: fr })}</>
                )}
              </p>
              {entreprise.siege_social && (
                <p style={{ fontSize: "11px", color: "#000", marginBottom: "2px", ...sectionStyle }}>
                  <span style={{ fontWeight: 500 }}>Siège Social : </span>{entreprise.siege_social}
                </p>
              )}
              {entreprise.annexe && (
                <p style={{ fontSize: "11px", color: "#000", marginBottom: "2px", ...sectionStyle }}>
                  <span style={{ fontWeight: 500 }}>Annexe : </span>{entreprise.annexe}
                </p>
              )}
              <p style={{ fontSize: "11px", color: "#000", marginTop: "4px", ...sectionStyle }}>
                <span style={{ fontWeight: 500 }}>Mobile : </span>{entreprise.telephone || ""}
                {" - "}
                <span style={{ fontWeight: 500 }}>Mail : </span>{entreprise.email || ""}
              </p>
            </div>

            {/* QR Code */}
            <div data-qr-wrapper style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 96, height: 96 }}>
              <QRCodeSVG value={qrData} size={96} level="L" marginSize={2} style={{ width: 96, height: 96, display: "block" }} />
            </div>
          </div>
        </div>

        {/* Ligne de séparation */}
        <div style={{ borderTop: "2px solid #1e5a7a", marginBottom: "16px" }} />

        {/* Titre du document */}
        <div data-doc-title style={{ textAlign: "center", margin: "50px 0" }}>

          <span style={{
            fontSize: "20px",
            fontWeight: "bold",
            textTransform: "uppercase",
            textDecoration: "underline",
            letterSpacing: "4px",
            color: "#1e5a7a",
            ...sectionStyle,
          }}>
            {title}
          </span>
        </div>
      </>
    );

    const bodyStyle: React.CSSProperties = {
      textAlign: "justify",
      lineHeight: "2",
      fontSize: "14px",
    };

    const paragraphStyle: React.CSSProperties = {
      marginBottom: "20px",
      textIndent: "40px",
    };

    const signatureContainerStyle: React.CSSProperties = {
      marginTop: "80px",
      textAlign: "right",
    };

    if (type === "attestation") {
      return (
        <div ref={ref} style={containerStyle} data-doc-attestation>
          {renderHeader()}

          <div style={bodyStyle} data-doc-body>
            <p style={paragraphStyle}>
              Je soussigné(e), Directeur(trice) de <strong>{entreprise.nom || "_______________"}</strong>,
            </p>
            <p style={paragraphStyle}>
              Atteste par la présente que <strong>M./Mme {employe.prenom} {employe.nom}</strong>
              {employe.cin && <span>, titulaire de la CIN N° <strong>{employe.cin}</strong></span>}
              {employe.date_naissance && <span>, né(e) le <strong>{dateNaissance}</strong></span>},
            </p>
            <p style={paragraphStyle}>
              Est employé(e) au sein de notre établissement depuis le <strong>{dateEmbauche}</strong>
              {employe.poste && <span> en qualité de <strong>{employe.poste}</strong></span>}.
            </p>
            <p style={paragraphStyle}>
              Cette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.
            </p>
          </div>

          <div style={signatureContainerStyle} data-doc-signature>
            <div style={{ marginBottom: "60px" }}>
              Fait à _______________, le {today}
            </div>
            <div style={{ fontWeight: "bold", marginBottom: "50px" }}>Le Directeur</div>
            <div>(Signature et cachet)</div>
          </div>
        </div>
      );
    }


    // Certificat de travail
    if (type === "certificat") {
      return (
        <div ref={ref} style={containerStyle} data-doc-certificat>
          {renderHeader()}

          <div style={bodyStyle} data-doc-body>
            <p style={paragraphStyle}>
              Je soussigné(e), Directeur(trice) de <strong>{entreprise.nom || "_______________"}</strong>,
            </p>
            <p style={paragraphStyle}>
              Certifie par la présente que <strong>M./Mme {employe.prenom} {employe.nom}</strong>
              {employe.cin && <span>, titulaire de la CIN N° <strong>{employe.cin}</strong></span>}
              {employe.date_naissance && <span>, né(e) le <strong>{dateNaissance}</strong></span>},
            </p>
            <p style={paragraphStyle}>
              A été employé(e) au sein de notre établissement du <strong>{dateEmbauche}</strong> au <strong>{dateFinFormatted}</strong>
              {employe.poste && <span> en qualité de <strong>{employe.poste}</strong></span>}.
            </p>
            <p style={paragraphStyle}>
              Durant cette période, M./Mme {employe.nom} a fait preuve de sérieux et de professionnalisme
              dans l'accomplissement de ses fonctions.
            </p>
            <p style={paragraphStyle}>
              L'intéressé(e) nous quitte libre de tout engagement.
            </p>
            <p style={paragraphStyle}>
              En foi de quoi, le présent certificat lui est délivré pour servir et valoir ce que de droit.
            </p>
          </div>

          <div style={signatureContainerStyle} data-doc-signature>
            <div style={{ marginBottom: "60px" }}>
              Fait à _______________, le {today}
            </div>
            <div style={{ fontWeight: "bold", marginBottom: "50px" }}>Le Directeur</div>
            <div>(Signature et cachet)</div>
          </div>
        </div>
      );
    }

    // Avertissement
    if (type === "avertissement") {
      const niveau = niveauAvertissement || "1er avertissement";
      const niveauColor = niveau === "Dernier avertissement" ? "#b91c1c" : niveau === "2ème avertissement" ? "#c2410c" : "#1e5a7a";
      return (
        <div ref={ref} style={containerStyle} data-doc-avertissement>
          {renderHeader()}

          <div style={{ textAlign: "center", marginTop: "-30px", marginBottom: "30px" }}>
            <span style={{
              display: "inline-block",
              padding: "6px 18px",
              border: `2px solid ${niveauColor}`,
              borderRadius: "4px",
              color: niveauColor,
              fontWeight: "bold",
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "2px",
              ...sectionStyle,
            }}>
              {niveau}
            </span>
          </div>

          <div style={{ marginBottom: "30px", fontSize: "13px" }}>
            <div style={{ marginBottom: "6px" }}>
              <strong>Destinataire :</strong> M./Mme {employe.prenom} {employe.nom}
              {employe.poste && <span> — {employe.poste}</span>}
            </div>
            {employe.cin && <div style={{ marginBottom: "6px" }}><strong>CIN :</strong> {employe.cin}</div>}
            {employe.adresse && <div style={{ marginBottom: "6px" }}><strong>Adresse :</strong> {employe.adresse}</div>}
            <div><strong>Objet :</strong> Lettre d'avertissement</div>
          </div>

          <div style={bodyStyle} data-doc-body>
            <p style={paragraphStyle}>Madame, Monsieur,</p>
            <p style={paragraphStyle}>
              Suite aux faits constatés en date du <strong>{dateFaitsFormatted}</strong>,
              nous nous voyons dans l'obligation de vous adresser la présente
              <strong> {niveau.toLowerCase()}</strong> pour le motif suivant :
            </p>
            <p style={{ ...paragraphStyle, textIndent: 0, padding: "12px 16px", border: "1px solid #d1d5db", background: "#f9fafb", borderRadius: "4px", fontStyle: "italic" }}>
              {motifAvertissement || "________________________________________________________________________________________________"}
            </p>
            <p style={paragraphStyle}>
              Ce comportement constitue un manquement à vos obligations professionnelles et porte préjudice
              au bon fonctionnement de notre établissement.
            </p>
            <p style={paragraphStyle}>
              Nous vous demandons de prendre toutes les mesures nécessaires afin que de tels faits ne se
              reproduisent plus. À défaut, nous serions contraints de prendre des sanctions disciplinaires
              plus sévères pouvant aller jusqu'au licenciement.
            </p>
            <p style={paragraphStyle}>
              Nous vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations distinguées.
            </p>
          </div>

          <div style={signatureContainerStyle} data-doc-signature>
            <div style={{ marginBottom: "60px" }}>
              Fait à _______________, le {today}
            </div>
            <div style={{ fontWeight: "bold", marginBottom: "50px" }}>La Direction</div>
            <div>(Signature et cachet)</div>
          </div>
        </div>
      );
    }

    // Contrat de travail
    const contratType = typeContrat || "CDI";
    const salaireFormatted = employe.salaire
      ? new Intl.NumberFormat("fr-FR").format(employe.salaire) + " DA"
      : "_______________";
    return (
      <div ref={ref} style={containerStyle} data-doc-contrat>
        {renderHeader()}

        <div style={{ textAlign: "center", marginTop: "-30px", marginBottom: "30px" }}>
          <span style={{
            display: "inline-block",
            padding: "6px 18px",
            border: "2px solid #1e5a7a",
            borderRadius: "4px",
            color: "#1e5a7a",
            fontWeight: "bold",
            fontSize: "13px",
            letterSpacing: "2px",
            ...sectionStyle,
          }}>
            {contratType}
          </span>
        </div>

        <div style={bodyStyle} data-doc-body>
          <p style={{ ...paragraphStyle, textIndent: 0 }}>
            <strong>ENTRE LES SOUSSIGNÉS :</strong>
          </p>
          <p style={paragraphStyle}>
            <strong>{entreprise.nom || "_______________"}</strong>
            {entreprise.siege_social && <span>, dont le siège social est sis à {entreprise.siege_social}</span>},
            représentée par son Directeur, ci-après dénommée <strong>« L'EMPLOYEUR »</strong>,
            d'une part,
          </p>
          <p style={{ ...paragraphStyle, textIndent: 0 }}>
            <strong>ET :</strong>
          </p>
          <p style={paragraphStyle}>
            <strong>M./Mme {employe.prenom} {employe.nom}</strong>
            {employe.date_naissance && <span>, né(e) le <strong>{dateNaissance}</strong></span>}
            {employe.cin && <span>, titulaire de la CIN N° <strong>{employe.cin}</strong></span>}
            {employe.adresse && <span>, demeurant à {employe.adresse}</span>},
            ci-après dénommé(e) <strong>« LE SALARIÉ »</strong>, d'autre part.
          </p>

          <p style={{ ...paragraphStyle, textIndent: 0, fontWeight: "bold", marginTop: "24px" }}>
            IL A ÉTÉ CONVENU CE QUI SUIT :
          </p>

          <p style={{ ...paragraphStyle, textIndent: 0 }}>
            <strong>Article 1 — Engagement</strong>
          </p>
          <p style={paragraphStyle}>
            L'Employeur engage le Salarié, qui accepte, en qualité de
            <strong> {employe.poste || "_______________"}</strong>, à compter du <strong>{dateEmbauche}</strong>.
          </p>

          <p style={{ ...paragraphStyle, textIndent: 0 }}>
            <strong>Article 2 — Nature et durée du contrat</strong>
          </p>
          <p style={paragraphStyle}>
            Le présent contrat est conclu pour une durée <strong>{contratType === "CDI" ? "indéterminée" : `déterminée${dureeContrat ? ` de ${dureeContrat}` : ""}`}</strong>
            {contratType === "CDD" && dateFin && <span>, prenant fin le <strong>{dateFinFormatted}</strong></span>}.
          </p>

          <p style={{ ...paragraphStyle, textIndent: 0 }}>
            <strong>Article 3 — Lieu de travail</strong>
          </p>
          <p style={paragraphStyle}>
            Le Salarié exercera ses fonctions à <strong>{lieuTravail || entreprise.siege_social || "_______________"}</strong>.
            Toutefois, l'Employeur se réserve le droit de l'affecter sur tout autre site selon les besoins du service.
          </p>

          <p style={{ ...paragraphStyle, textIndent: 0 }}>
            <strong>Article 4 — Rémunération</strong>
          </p>
          <p style={paragraphStyle}>
            En contrepartie de son travail, le Salarié percevra un salaire mensuel brut de
            <strong> {salaireFormatted}</strong>, payable mensuellement à terme échu.
          </p>

          <p style={{ ...paragraphStyle, textIndent: 0 }}>
            <strong>Article 5 — Obligations du salarié</strong>
          </p>
          <p style={paragraphStyle}>
            Le Salarié s'engage à exécuter ses missions avec diligence, à respecter le règlement intérieur
            de l'entreprise et à observer la plus stricte confidentialité sur toutes les informations dont
            il aurait connaissance dans l'exercice de ses fonctions.
          </p>

          <p style={{ ...paragraphStyle, textIndent: 0 }}>
            <strong>Article 6 — Résiliation</strong>
          </p>
          <p style={paragraphStyle}>
            Le présent contrat pourra être résilié par l'une ou l'autre des parties, dans le respect
            de la législation du travail en vigueur et sous réserve d'un préavis conforme à la convention applicable.
          </p>

          <p style={paragraphStyle}>
            Fait en deux (02) exemplaires originaux, dont un remis à chaque partie.
          </p>
        </div>

        <div data-doc-signature style={{ marginTop: "60px", display: "flex", justifyContent: "space-between", gap: "40px" }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ marginBottom: "60px", fontWeight: "bold" }}>Le Salarié</div>
            <div style={{ borderTop: "1px solid #000", paddingTop: "6px", fontSize: "12px" }}>(Lu et approuvé)</div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ marginBottom: "60px", fontWeight: "bold" }}>L'Employeur</div>
            <div style={{ borderTop: "1px solid #000", paddingTop: "6px", fontSize: "12px" }}>(Signature et cachet)</div>
          </div>
        </div>
      </div>
    );
  }
);

DocumentPreview.displayName = "DocumentPreview";
