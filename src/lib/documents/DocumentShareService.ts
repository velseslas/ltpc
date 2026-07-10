// DocumentShareService — Point d'entrée unique pour le partage de documents.
// Architecture évolutive :
//   Web (aujourd'hui) → WebShareProvider (navigator.share + fallback download)
//   PWA (demain)      → même WebShareProvider (déjà compatible)
//   Capacitor (futur) → CapacitorShareProvider (à brancher sans toucher aux composants)
//
// Aucun composant ne doit partager un PDF directement.
// Tout passe par DocumentShareService.share(payload).

export interface ShareDocumentMeta {
  /** Nom lisible du document (ex: "Rapport Technique"). */
  documentName: string;
  /** Numéro du document (ex: "RAPP-2026-0012"). */
  documentNumber?: string | null;
  /** Date affichable (ISO ou déjà formatée). */
  documentDate?: string | null;
  /** Lien sécurisé (vérification, archive, etc.). */
  secureUrl?: string | null;
}

export interface SharePayload {
  meta: ShareDocumentMeta;
  /** Objet du message (email, etc.). */
  subject: string;
  /** Message texte. */
  message: string;
  /** Fournisseur du PDF à joindre. Optionnel — sinon partage de lien uniquement. */
  getPdf?: () => Promise<Blob | null>;
  /** Nom de fichier du PDF (ex: "RAPP-2026-0012.pdf"). */
  fileName?: string;
}

export type ShareChannel =
  | "auto"        // navigator.share ou fallback
  | "download"    // téléchargement direct
  | "copy-link"   // copier le lien sécurisé
  | "gmail"
  | "outlook"
  | "whatsapp"
  | "telegram"
  | "teams"
  | "google-drive"
  | "onedrive";

export interface ShareResult {
  ok: boolean;
  channel: ShareChannel;
  /** "shared" | "downloaded" | "copied" | "cancelled" | "error" */
  action: "shared" | "downloaded" | "copied" | "cancelled" | "error";
  message?: string;
}

/**
 * Contrat d'un provider de partage.
 * Permet de brancher plus tard CapacitorShareProvider sans modifier les composants.
 */
export interface ShareProvider {
  readonly name: string;
  /** Le partage natif (fichier) est-il disponible ? */
  canShareFiles(): boolean;
  /** Le partage natif (texte/lien) est-il disponible ? */
  canShare(): boolean;
  share(payload: SharePayload, channel?: ShareChannel): Promise<ShareResult>;
}

// ---------------------------------------------------------------------------
// WebShareProvider — utilise Web Share API + fallbacks navigateur
// ---------------------------------------------------------------------------
class WebShareProvider implements ShareProvider {
  readonly name = "web";

  canShare(): boolean {
    return typeof navigator !== "undefined" && typeof navigator.share === "function";
  }

  canShareFiles(): boolean {
    if (!this.canShare()) return false;
    try {
      const probe = new File([new Blob(["x"], { type: "text/plain" })], "probe.txt", { type: "text/plain" });
      return typeof navigator.canShare === "function" && navigator.canShare({ files: [probe] });
    } catch {
      return false;
    }
  }

  async share(payload: SharePayload, channel: ShareChannel = "auto"): Promise<ShareResult> {
    const { meta, subject, message, getPdf, fileName } = payload;
    const url = meta.secureUrl || (typeof window !== "undefined" ? window.location.href : "");
    const finalFileName = fileName || `${(meta.documentNumber || meta.documentName).replace(/\s+/g, "-")}.pdf`;

    // Canaux directs demandés explicitement
    if (channel === "copy-link") {
      try {
        await navigator.clipboard.writeText(url);
        return { ok: true, channel, action: "copied" };
      } catch {
        return { ok: false, channel, action: "error", message: "Impossible de copier le lien." };
      }
    }
    if (channel === "download") {
      return this.downloadPdf(getPdf, finalFileName, channel);
    }
    if (channel === "gmail") {
      window.open(
        `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${message}\n\n${url}`)}`,
        "_blank",
      );
      return { ok: true, channel, action: "shared" };
    }
    if (channel === "outlook") {
      window.open(
        `https://outlook.office.com/mail/deeplink/compose?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${message}\n\n${url}`)}`,
        "_blank",
      );
      return { ok: true, channel, action: "shared" };
    }
    if (channel === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${subject}\n\n${message}\n\n${url}`)}`, "_blank");
      return { ok: true, channel, action: "shared" };
    }
    if (channel === "telegram") {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`${subject}\n\n${message}`)}`, "_blank");
      return { ok: true, channel, action: "shared" };
    }
    if (channel === "teams") {
      window.open(`https://teams.microsoft.com/share?href=${encodeURIComponent(url)}&msgText=${encodeURIComponent(`${subject}\n\n${message}`)}`, "_blank");
      return { ok: true, channel, action: "shared" };
    }
    if (channel === "google-drive" || channel === "onedrive") {
      // Placeholder — nécessite OAuth. On télécharge en attendant l'intégration.
      return this.downloadPdf(getPdf, finalFileName, channel);
    }

    // channel === "auto" — priorité Web Share API avec fichier si possible
    try {
      if (getPdf && this.canShareFiles()) {
        const blob = await getPdf();
        if (blob) {
          const file = new File([blob], finalFileName, { type: "application/pdf" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ title: subject, text: message, files: [file] });
            return { ok: true, channel, action: "shared" };
          }
        }
      }
      if (this.canShare()) {
        await navigator.share({ title: subject, text: message, url });
        return { ok: true, channel, action: "shared" };
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return { ok: false, channel, action: "cancelled" };
      }
      // Continue vers fallback
    }

    // Fallback : téléchargement du PDF s'il existe
    if (getPdf) return this.downloadPdf(getPdf, finalFileName, channel);

    // Dernier recours : copier le lien sécurisé dans le presse-papiers
    try {
      await navigator.clipboard.writeText(url);
      return { ok: true, channel, action: "copied", message: "Lien copié dans le presse-papiers." };
    } catch {
      return { ok: false, channel, action: "error", message: "Partage indisponible sur ce navigateur." };
    }
  }

  private async downloadPdf(getPdf: SharePayload["getPdf"], fileName: string, channel: ShareChannel): Promise<ShareResult> {
    if (!getPdf) {
      return { ok: false, channel, action: "error", message: "Aucun PDF disponible." };
    }
    try {
      const blob = await getPdf();
      if (!blob) return { ok: false, channel, action: "error", message: "Erreur lors de la génération du PDF." };
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      return { ok: true, channel, action: "downloaded" };
    } catch {
      return { ok: false, channel, action: "error", message: "Erreur lors du téléchargement." };
    }
  }
}

// ---------------------------------------------------------------------------
// Sélection du provider actif — plus tard : détecter Capacitor
// ---------------------------------------------------------------------------
let activeProvider: ShareProvider = new WebShareProvider();

export const DocumentShareService = {
  /** Retourne le provider actif (utile pour introspection). */
  getProvider(): ShareProvider {
    return activeProvider;
  },
  /** Permet d'injecter un autre provider (ex: CapacitorShareProvider). */
  setProvider(provider: ShareProvider) {
    activeProvider = provider;
  },
  canShare(): boolean {
    return activeProvider.canShare();
  },
  canShareFiles(): boolean {
    return activeProvider.canShareFiles();
  },
  share(payload: SharePayload, channel: ShareChannel = "auto"): Promise<ShareResult> {
    return activeProvider.share(payload, channel);
  },
  /** Message par défaut standardisé. */
  defaultMessage(meta: ShareDocumentMeta): string {
    return `Bonjour,\n\nVeuillez trouver ci-joint ${meta.documentName.toLowerCase()}${meta.documentNumber ? ` ${meta.documentNumber}` : ""}.\n\nCordialement.`;
  },
  defaultSubject(meta: ShareDocumentMeta): string {
    return meta.documentNumber ? `${meta.documentName} ${meta.documentNumber}` : meta.documentName;
  },
};

export type { ShareProvider as IShareProvider };
