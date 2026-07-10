// DocumentShareService — Point d'entrée unique pour le partage de documents.
// Architecture évolutive :
//   Web (aujourd'hui) → WebShareProvider (navigator.share + fallback download)
//   PWA (demain)      → même WebShareProvider (déjà compatible)
//   Capacitor (futur) → CapacitorShareProvider (à brancher sans toucher aux composants)
//
// Aucun composant ne doit partager un PDF directement.
// Tout passe par DocumentShareService.share(payload).

const LOG = "[DocumentShareService]";

export interface ShareDocumentMeta {
  documentName: string;
  documentNumber?: string | null;
  documentDate?: string | null;
  secureUrl?: string | null;
}

export interface SharePayload {
  meta: ShareDocumentMeta;
  subject: string;
  message: string;
  /** Fournisseur du PDF à joindre. */
  getPdf?: () => Promise<Blob | null>;
  fileName?: string;
}

export type ShareChannel =
  | "auto"
  | "download"
  | "copy-link"
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
  /**
   * shared        : partage natif réussi (popup à fermer)
   * downloaded    : PDF téléchargé (popup reste ouverte, message affiché)
   * copied        : lien copié (uniquement sur demande explicite)
   * cancelled     : utilisateur a annulé
   * error         : erreur
   * unsupported   : Web Share indisponible, fallback téléchargement effectué
   */
  action: "shared" | "downloaded" | "copied" | "cancelled" | "error" | "unsupported";
  message?: string;
}

export interface ShareProvider {
  readonly name: string;
  canShareFiles(): boolean;
  canShare(): boolean;
  share(payload: SharePayload, channel?: ShareChannel): Promise<ShareResult>;
}

// ---------------------------------------------------------------------------
// WebShareProvider
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

    console.log(`${LOG} share() channel=${channel}`, {
      hasGetPdf: !!getPdf,
      canShare: this.canShare(),
      canShareFiles: this.canShareFiles(),
    });

    // --- Canaux explicites ---
    if (channel === "copy-link") {
      try {
        await navigator.clipboard.writeText(url);
        console.log(`${LOG} lien copié`);
        return { ok: true, channel, action: "copied" };
      } catch (err) {
        console.error(`${LOG} copie lien échouée`, err);
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
      return this.downloadPdf(getPdf, finalFileName, channel);
    }

    // --- channel === "auto" ---
    // 1) Web Share API avec fichier (préféré)
    if (getPdf && this.canShareFiles()) {
      try {
        console.log(`${LOG} génération du PDF pour partage natif...`);
        const blob = await getPdf();
        if (blob) {
          const file = new File([blob], finalFileName, { type: "application/pdf" });
          if (navigator.canShare({ files: [file] })) {
            console.log(`${LOG} appel navigator.share (fichier)`);
            await navigator.share({ title: subject, text: message, files: [file] });
            console.log(`${LOG} partage natif réussi`);
            return { ok: true, channel, action: "shared" };
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          console.log(`${LOG} partage annulé par l'utilisateur`);
          return { ok: false, channel, action: "cancelled" };
        }
        console.warn(`${LOG} partage natif fichier échoué, fallback téléchargement`, err);
      }
    }

    // 2) Fallback : téléchargement du PDF + message clair (JAMAIS de copie automatique)
    if (getPdf) {
      const dl = await this.downloadPdf(getPdf, finalFileName, channel);
      if (dl.ok) {
        return {
          ok: true,
          channel,
          action: "unsupported",
          message:
            "Votre navigateur ne permet pas encore le partage direct des pièces jointes. Le PDF a été téléchargé. Vous pouvez maintenant le joindre dans votre application de messagerie.",
        };
      }
      return dl;
    }

    // 3) Aucun PDF disponible : Web Share texte/URL uniquement
    if (this.canShare()) {
      try {
        await navigator.share({ title: subject, text: message, url });
        return { ok: true, channel, action: "shared" };
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return { ok: false, channel, action: "cancelled" };
        }
        console.error(`${LOG} partage natif texte échoué`, err);
      }
    }

    return {
      ok: false,
      channel,
      action: "error",
      message: "Partage indisponible sur ce navigateur.",
    };
  }

  private async downloadPdf(
    getPdf: SharePayload["getPdf"],
    fileName: string,
    channel: ShareChannel,
  ): Promise<ShareResult> {
    if (!getPdf) {
      return { ok: false, channel, action: "error", message: "Aucun PDF disponible." };
    }
    try {
      console.log(`${LOG} téléchargement du PDF...`);
      const blob = await getPdf();
      if (!blob) return { ok: false, channel, action: "error", message: "Erreur lors de la génération du PDF." };
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      console.log(`${LOG} PDF téléchargé : ${fileName}`);
      return { ok: true, channel, action: "downloaded" };
    } catch (err) {
      console.error(`${LOG} téléchargement échoué`, err);
      return { ok: false, channel, action: "error", message: "Erreur lors du téléchargement." };
    }
  }
}

let activeProvider: ShareProvider = new WebShareProvider();

export const DocumentShareService = {
  getProvider(): ShareProvider {
    return activeProvider;
  },
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
  defaultMessage(_meta: ShareDocumentMeta): string {
    return `Bonjour,\n\nVeuillez trouver ci-joint le rapport technique officiel.\n\nCordialement.`;
  },
  defaultSubject(meta: ShareDocumentMeta): string {
    return meta.documentNumber ? `${meta.documentName} ${meta.documentNumber}` : meta.documentName;
  },
};

export type { ShareProvider as IShareProvider };
