/**
 * printReady — signal de disponibilité du rendu pour le moteur PDF (Gotenberg).
 *
 * Gotenberg attend `window.__LTPC_PRINT_READY === true` avant de capturer la page.
 * Le signal est posé quand le conteneur d'impression existe, que les polices sont
 * chargées et que toutes les images (cachet, signature, QR) sont décodées.
 *
 * N'affecte que le contexte de rendu PDF : rien n'est exécuté hors `/__render/:token`.
 */
declare global {
  interface Window {
    __LTPC_PRINT_READY?: boolean;
  }
}

const PRINT_ROOT_SELECTOR = '[data-ref="report"], [data-print-root]';

async function waitForImages(root: ParentNode): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          }),
    ),
  );
}

/** Démarre la surveillance ; pose le drapeau dès que la page est imprimable. */
export function armPrintReadySignal(timeoutMs = 45_000): void {
  if (typeof window === "undefined") return;
  window.__LTPC_PRINT_READY = false;
  const deadline = Date.now() + timeoutMs;

  const tick = async () => {
    const root = document.querySelector(PRINT_ROOT_SELECTOR);
    if (root) {
      try {
        await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
      } catch {
        /* polices indisponibles : on continue */
      }
      await waitForImages(root);
      // Deux frames pour laisser Recharts finaliser ses SVG.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          window.__LTPC_PRINT_READY = true;
          document.documentElement.setAttribute("data-print-ready", "true");
        }),
      );
      return;
    }
    if (Date.now() > deadline) {
      window.__LTPC_PRINT_READY = true; // évite un blocage infini du moteur
      document.documentElement.setAttribute("data-print-ready", "timeout");
      return;
    }
    setTimeout(tick, 200);
  };

  setTimeout(tick, 200);
}
