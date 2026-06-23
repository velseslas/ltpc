import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { normalizeQRValue } from "@/lib/qrContent";

interface EntrepriseData {
  nom?: string | null;
  logo_url?: string | null;
  numero_autorisation?: string | null;
  date_autorisation?: string | null;
  siege_social?: string | null;
  annexe?: string | null;
  telephone?: string | null;
  email?: string | null;
}

interface ReportHeaderProps {
  entreprise?: EntrepriseData | null;
  verificationUrl: string;
  title: string;
  subtitle?: string;
}

export function ReportHeader({ entreprise, verificationUrl, title, subtitle }: ReportHeaderProps) {
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!entreprise?.logo_url) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        setLogoDataUrl(canvas.toDataURL("image/png"));
      }
    };
    img.onerror = () => setLogoDataUrl(null);
    img.src = entreprise.logo_url;
  }, [entreprise?.logo_url]);

  const logoSrc = logoDataUrl || entreprise?.logo_url;

  return (
    <>
      {/* En-tête */}
      <div data-report-header className="border border-black rounded-lg p-4 mb-6">
        <div className="flex items-start justify-between">
          {/* Logo */}
          <div className="w-24 h-24 border border-gray-300 flex items-center justify-center bg-[#d4e5f7] rounded">
            {logoSrc ? (
              <img src={logoSrc} alt="Logo" className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-sm text-gray-500">LOGO</span>
            )}
          </div>

          {/* Informations entreprise */}
          <div className="flex-1 text-center px-2">
            <h1 className="text-base font-bold text-[#1e5a7a] mb-1 whitespace-nowrap">
              {entreprise?.nom || "Laboratoire de Travaux Publics & de Construction"}
            </h1>
            <p className="text-sm font-semibold text-black mb-1">
              Autorisation N° {entreprise?.numero_autorisation || "35"}
              {entreprise?.date_autorisation && (
                <> Du {format(new Date(entreprise.date_autorisation), "dd/MM/yyyy", { locale: fr })}</>
              )}
            </p>
            {entreprise?.siege_social && (
              <p className="text-xs text-black mb-0.5 whitespace-nowrap">
                <span className="font-medium">Siège Social : </span>{entreprise.siege_social}
              </p>
            )}
            {entreprise?.annexe && (
              <p className="text-xs text-black mb-0.5 whitespace-nowrap">
                <span className="font-medium">Annexe : </span>{entreprise.annexe}
              </p>
            )}
            <p className="text-xs text-black mt-1">
              <span className="font-medium">Mobile : </span>{entreprise?.telephone || ""} - <span className="font-medium">Mail : </span>{entreprise?.email || ""}
            </p>
          </div>

          {/* QR Code — contenu lisible (détails du rapport) */}
          <div data-qr-wrapper className="flex flex-col items-center shrink-0" style={{ width: 96, height: 96 }}>
            <QRCodeSVG
              value={normalizeQRValue(verificationUrl, { entreprise: entreprise?.nom, title, subtitle })}
              size={96}
              level="L"
              marginSize={2}
              style={{ width: 96, height: 96, display: "block" }}
            />
          </div>
        </div>
      </div>

      {/* Ligne de séparation */}
      <div className="border-t-2 border-[#1e5a7a] mb-4"></div>

      {/* Titre du rapport */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-[#1e5a7a] mb-1">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-black">
            {subtitle}
          </p>
        )}
      </div>
    </>
  );
}
