// Phase 3-ter — Migré vers BaseRepository (via getRepositoryForTable).
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories/registry";

export interface QRConfig {
  enabled: boolean;
  sizePx: number;
  color: string;
  includeLogo: boolean;
  position: string;
}

interface QRRow {
  activer_qrcode: boolean | null;
  taille_qrcode: string | null;
  couleur_qrcode: string | null;
  inclure_logo: boolean | null;
  position_qrcode: string | null;
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
      const repo = getRepositoryForTable<QRRow>("parametres_qrcode", {
        defaultSelect: "activer_qrcode, taille_qrcode, couleur_qrcode, inclure_logo, position_qrcode",
      });
      const { data } = await repo.list({ limit: 1 });
      return data[0] ?? null;
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

  useEffect(() => {
    document.documentElement.style.setProperty("--qr-size", `${config.sizePx}px`);
  }, [config.sizePx]);

  return config;
}
