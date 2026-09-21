import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { normalizeQRValue } from "@/lib/qrContent";
import { useQRConfig } from "@/hooks/useQRConfig";
import { useLogoDataUrl } from "@/hooks/useLogoDataUrl";

interface DocumentPageHeaderProps {
  entreprise?: {
    nom?: string | null;
    logo_url?: string | null;
    numero_autorisation?: string | null;
    date_autorisation?: string | null;
    siege_social?: string | null;
    annexe?: string | null;
    telephone?: string | null;
    email?: string | null;
  } | null;
  qrData: string;
  title: string;
  subtitle?: string;
}

const sectionStyle = { fontFamily: "'Times New Roman', Georgia, serif" } as const;

export function DocumentPageHeader({ entreprise, qrData, title, subtitle }: DocumentPageHeaderProps) {
  const qrConfig = useQRConfig();
  const logoSrc = useLogoDataUrl(entreprise?.logo_url);
  return (
    <>
      {/* En-tête encadré */}
      <div style={{ border: "1px solid #000", borderRadius: "8px", padding: "16px", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          {/* Logo */}
          <div data-logo style={{ width: "96px", height: "96px", border: "1px solid #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", background: "#d4e5f7", borderRadius: "6px", flexShrink: 0 }}>
            {logoSrc ? (
              <img src={logoSrc} alt="Logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            ) : (
              <span style={{ fontSize: "12px", color: "#6b7280" }}>LOGO</span>
            )}
          </div>

          {/* Informations entreprise */}
          <div style={{ flex: 1, textAlign: "center", padding: "0 12px" }}>
            <p style={{ fontSize: "16px", fontWeight: "bold", color: "#1e5a7a", marginBottom: "4px", ...sectionStyle }}>
              {entreprise?.nom || "Laboratoire de Travaux Publics & de Construction"}
            </p>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#000", marginBottom: "4px", ...sectionStyle }}>
              Autorisation N° {entreprise?.numero_autorisation || "—"}
              {entreprise?.date_autorisation && (
                <> Du {format(new Date(entreprise.date_autorisation), "dd/MM/yyyy", { locale: fr })}</>
              )}
            </p>
            {entreprise?.siege_social && (
              <p style={{ fontSize: "11px", color: "#000", marginBottom: "2px", whiteSpace: "nowrap", ...sectionStyle }}>
                <span style={{ fontWeight: 500 }}>Siège Social : </span>{entreprise.siege_social}
              </p>
            )}
            {entreprise?.annexe && (
              <p style={{ fontSize: "11px", color: "#000", marginBottom: "2px", whiteSpace: "nowrap", ...sectionStyle }}>
                <span style={{ fontWeight: 500 }}>Annexe : </span>{entreprise.annexe}
              </p>
            )}
            <p style={{ fontSize: "11px", color: "#000", marginTop: "4px", ...sectionStyle }}>
              <span style={{ fontWeight: 500 }}>Mobile : </span>{entreprise?.telephone || ""}
              {" - "}
              <span style={{ fontWeight: 500 }}>Mail : </span>{entreprise?.email || ""}
            </p>
          </div>

          {/* QR Code — contenu lisible (détails du document) */}
          {qrConfig.enabled && (
            <div data-qr-wrapper style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: qrConfig.sizePx, height: qrConfig.sizePx }}>
              <QRCodeSVG
                value={normalizeQRValue(qrData, { entreprise: entreprise?.nom, title, subtitle })}
                size={qrConfig.sizePx}
                level="L"
                marginSize={2}
                fgColor={qrConfig.color}
                imageSettings={qrConfig.includeLogo && logoSrc ? { src: logoSrc, height: Math.round(qrConfig.sizePx * 0.22), width: Math.round(qrConfig.sizePx * 0.22), excavate: true } : undefined}
                style={{ width: qrConfig.sizePx, height: qrConfig.sizePx, display: "block" }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Ligne de séparation */}
      <div style={{ borderTop: "2px solid #1e5a7a", marginBottom: "16px" }} />

      {/* Titre */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <p style={{ fontSize: "18px", fontWeight: "bold", color: "#1e5a7a", marginBottom: "4px", ...sectionStyle }}>
          {title}
        </p>
        {subtitle && (
          <p style={{ fontSize: "13px", color: "#000", ...sectionStyle }}>
            {subtitle}
          </p>
        )}
      </div>
    </>
  );
}
