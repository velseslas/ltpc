import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

const RELOAD_FLAG = "__lovable_chunk_reload__";

function isDynamicImportError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("dynamically imported module") ||
    m.includes("failed to fetch dynamically imported") ||
    m.includes("importing a module script failed") ||
    m.includes("error loading dynamically") ||
    (m.includes("chunkloaderror")) ||
    (m.includes("loading chunk") && m.includes("failed"))
  );
}

function tryAutoReload(message: string): boolean {
  if (typeof window === "undefined") return false;
  if (!isDynamicImportError(message)) return false;
  try {
    const already = sessionStorage.getItem(RELOAD_FLAG);
    const now = Date.now();
    // Only auto-reload once per 30s to avoid loops
    if (already && now - Number(already) < 30000) return false;
    sessionStorage.setItem(RELOAD_FLAG, String(now));
  } catch {
    // ignore
  }
  // Cache-bust to force fetching the new index.html and chunk hashes
  const url = new URL(window.location.href);
  url.searchParams.set("_r", String(Date.now()));
  window.location.replace(url.toString());
  return true;
}

// Global listeners catch dynamic-import failures that happen outside React render
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    const msg = event?.message || (event?.error && (event.error as Error).message) || "";
    if (msg) tryAutoReload(msg);
  });
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event?.reason;
    const msg = typeof reason === "string" ? reason : reason?.message || "";
    if (msg) tryAutoReload(msg);
  });
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    // If the error is a stale chunk / dynamic import failure (typical after a deploy),
    // reload the page automatically so the user gets the new bundle.
    tryAutoReload(error.message);
  }

  handleReload = () => {
    try {
      sessionStorage.removeItem(RELOAD_FLAG);
    } catch {
      // ignore
    }
    const url = new URL(window.location.href);
    url.searchParams.set("_r", String(Date.now()));
    window.location.replace(url.toString());
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">
              Une erreur est survenue
            </h1>
            <p className="text-muted-foreground">
              {this.state.errorMessage || "Erreur inattendue dans l'application"}
            </p>
            <Button onClick={this.handleReload} size="lg">
              Recharger la page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
