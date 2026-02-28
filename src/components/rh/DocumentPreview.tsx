import { forwardRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { QRCodeSVG } from "qrcode.react";

interface DocumentPreviewProps {
  type: "attestation" | "certificat";
  employe: {
    nom: string;
    prenom: string;
    date_naissance?: string | null;
    date_embauche?: string | null;
    poste?: string | null;
    cin?: string | null;
    adresse?: string | null;
  };
  entreprise: {
    nom: string;
    siege_social?: string | null;
    telephone?: string | null;
    email?: string | null;
    logo_url?: string | null;
    numero_autorisation?: string | null;
  };
  dateFin?: string;
}

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

    // Generate QR code data with document info
    const qrData = JSON.stringify({
      type: type === "attestation" ? "Attestation de Travail" : "Certificat de Travail",
      employe: `${employe.prenom} ${employe.nom}`,
      entreprise: entreprise.nom,
      date: today,
    });

    const containerStyle: React.CSSProperties = {
      backgroundColor: "#ffffff",
      color: "#000000",
      padding: "40px",
      minHeight: "297mm",
      width: "210mm",
      margin: "0 auto",
      fontFamily: "'Times New Roman', Times, serif",
      fontSize: "14px",
      lineHeight: "1.6",
      boxSizing: "border-box",
    };

    const headerStyle: React.CSSProperties = {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "30px",
      paddingBottom: "20px",
      borderBottom: "2px solid #333",
    };

    const logoContainerStyle: React.CSSProperties = {
      width: "100px",
      height: "100px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    };

    const companyInfoStyle: React.CSSProperties = {
      textAlign: "center",
      flex: 1,
      padding: "0 20px",
    };

    const companyNameStyle: React.CSSProperties = {
      fontSize: "22px",
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: "2px",
      marginBottom: "8px",
    };

    const companyDetailsStyle: React.CSSProperties = {
      fontSize: "12px",
      color: "#444",
      marginBottom: "4px",
    };

    const qrContainerStyle: React.CSSProperties = {
      width: "80px",
      height: "80px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    };

    const titleContainerStyle: React.CSSProperties = {
      textAlign: "center",
      margin: "50px 0",
    };

    const titleStyle: React.CSSProperties = {
      fontSize: "20px",
      fontWeight: "bold",
      textTransform: "uppercase",
      textDecoration: "underline",
      letterSpacing: "4px",
    };

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

    const signatureDateStyle: React.CSSProperties = {
      marginBottom: "60px",
    };

    const signatureLabelStyle: React.CSSProperties = {
      fontWeight: "bold",
      marginBottom: "50px",
    };

    if (type === "attestation") {
      return (
        <div ref={ref} style={containerStyle}>
          {/* En-tête avec logo et QR code */}
          <div style={headerStyle}>
            <div style={logoContainerStyle}>
              {entreprise.logo_url ? (
                <img 
                  src={entreprise.logo_url} 
                  alt="Logo entreprise" 
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                />
              ) : (
                <div style={{ 
                  width: "80px", 
                  height: "80px", 
                  border: "2px solid #333", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  fontSize: "10px",
                  color: "#666"
                }}>
                  LOGO
                </div>
              )}
            </div>
            
            <div style={companyInfoStyle}>
              <div style={companyNameStyle}>
                {entreprise.nom || "ENTREPRISE"}
              </div>
              {entreprise.siege_social && (
                <div style={companyDetailsStyle}>{entreprise.siege_social}</div>
              )}
              {entreprise.telephone && (
                <div style={companyDetailsStyle}>Tél: {entreprise.telephone}</div>
              )}
              {entreprise.email && (
                <div style={companyDetailsStyle}>Email: {entreprise.email}</div>
              )}
              {entreprise.numero_autorisation && (
                <div style={companyDetailsStyle}>N° Autorisation: {entreprise.numero_autorisation}</div>
              )}
            </div>

            <div style={qrContainerStyle}>
              <QRCodeSVG value={qrData} size={70} level="M" />
            </div>
          </div>

          {/* Titre */}
          <div style={titleContainerStyle}>
            <span style={titleStyle}>Attestation de Travail</span>
          </div>

          {/* Corps */}
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

          {/* Signature */}
          <div style={signatureContainerStyle}>
            <div style={signatureDateStyle}>
              Fait à _______________, le {today}
            </div>
            <div style={signatureLabelStyle}>Le Directeur</div>
            <div>(Signature et cachet)</div>
          </div>
        </div>
      );
    }

    // Certificat de travail
    return (
      <div ref={ref} style={containerStyle}>
        {/* En-tête avec logo et QR code */}
        <div style={headerStyle}>
          <div style={logoContainerStyle}>
            {entreprise.logo_url ? (
              <img 
                src={entreprise.logo_url} 
                alt="Logo entreprise" 
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              />
            ) : (
              <div style={{ 
                width: "80px", 
                height: "80px", 
                border: "2px solid #333", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                fontSize: "10px",
                color: "#666"
              }}>
                LOGO
              </div>
            )}
          </div>
          
          <div style={companyInfoStyle}>
            <div style={companyNameStyle}>
              {entreprise.nom || "ENTREPRISE"}
            </div>
            {entreprise.siege_social && (
              <div style={companyDetailsStyle}>{entreprise.siege_social}</div>
            )}
            {entreprise.telephone && (
              <div style={companyDetailsStyle}>Tél: {entreprise.telephone}</div>
            )}
            {entreprise.email && (
              <div style={companyDetailsStyle}>Email: {entreprise.email}</div>
            )}
            {entreprise.numero_autorisation && (
              <div style={companyDetailsStyle}>N° Autorisation: {entreprise.numero_autorisation}</div>
            )}
          </div>

          <div style={qrContainerStyle}>
            <QRCodeSVG value={qrData} size={70} level="M" />
          </div>
        </div>

        {/* Titre */}
        <div style={titleContainerStyle}>
          <span style={titleStyle}>Certificat de Travail</span>
        </div>

        {/* Corps */}
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

        {/* Signature */}
        <div style={signatureContainerStyle}>
          <div style={signatureDateStyle}>
            Fait à _______________, le {today}
          </div>
          <div style={signatureLabelStyle}>Le Directeur</div>
          <div>(Signature et cachet)</div>
        </div>
      </div>
    );
  }
);

DocumentPreview.displayName = "DocumentPreview";
