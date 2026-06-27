import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface QRConfig {
  enabled: boolean;
  sizePx: number;
  color: string;
  includeLogo: boolean;
  position: string;
}

const DEFAULT: QRConfig = {
  enabled: true,
  sizePx: 96,
  color: "#000000",
  includeLogo: false,
  position: "bas-droite",
};

export function sizeToPx(s: string | null | undefined): number {
  switch (s) {
    case "small": return 72;
    case "large": return 144;
    case "medium":
    default: return 96;
  }
}

export function useQRConfig(): QRConfig {
  const { data } = useQuery({
    queryKey: ["parametres_qrcode_public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parametres_qrcode")
        .select("activer_qrcode, taille_qrcode, couleur_qrcode, inclure_logo, position_qrcode")
        .maybeSingle();
      if (error) return null;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const config: QRConfig = !data
    ? DEFAULT
    : {
        enabled: data.activer_qrcode ?? true,
        sizePx: sizeToPx(data.taille_qrcode),
        color: data.couleur_qrcode || "#000000",
        includeLogo: !!data.inclure_logo,
        position: data.position_qrcode || "bas-droite",
      };

  // Sync CSS var so print stylesheet honors the configured size
  useEffect(() => {
    document.documentElement.style.setProperty("--qr-size", `${config.sizePx}px`);
  }, [config.sizePx]);

  return config;
}
