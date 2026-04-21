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
  ({ type, employe, entreprise, dateFin }, ref) => {
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

    const qrData = buildQRContent({
      entreprise: entreprise.nom,
      type: type === "attestation" ? "Attestation de Travail" : "Certificat de Travail",
      titre: `${employe.prenom} ${employe.nom}`,
      date: today,
      extra: {
        Poste: employe.poste ?? null,
        CIN: employe.cin ?? null,
        "Date d'embauche": dateEmbauche,
      },
    });

    const title = type === "attestation" ? "Attestation de Travail" : "Certificat de Travail";

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
      ...sectionStyle,
    };

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
                <p style={{ fontSize: "11px", color: "#000", marginBottom: "2px", whiteSpace: "nowrap", ...sectionStyle }}>
                  <span style={{ fontWeight: 500 }}>Siège Social : </span>{entreprise.siege_social}
                </p>
              )}
              {entreprise.annexe && (
                <p style={{ fontSize: "11px", color: "#000", marginBottom: "2px", whiteSpace: "nowrap", ...sectionStyle }}>
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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <QRCodeSVG value={qrData} size={96} level="L" marginSize={2} />
            </div>
          </div>
        </div>

        {/* Ligne de séparation */}
        <div style={{ borderTop: "2px solid #1e5a7a", marginBottom: "16px" }} />

        {/* Titre du document */}
        <div style={{ textAlign: "center", margin: "50px 0" }}>
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
        <div ref={ref} style={containerStyle}>
          {renderHeader()}

          <div style={bodyStyle}>
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

          <div style={signatureContainerStyle}>
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
    return (
      <div ref={ref} style={containerStyle}>
        {renderHeader()}

        <div style={bodyStyle}>
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

        <div style={signatureContainerStyle}>
          <div style={{ marginBottom: "60px" }}>
            Fait à _______________, le {today}
          </div>
          <div style={{ fontWeight: "bold", marginBottom: "50px" }}>Le Directeur</div>
          <div>(Signature et cachet)</div>
        </div>
      </div>
    );
  }
);

DocumentPreview.displayName = "DocumentPreview";
