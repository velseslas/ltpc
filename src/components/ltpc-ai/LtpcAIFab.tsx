// Bouton flottant global — accès rapide à LTPC AI depuis n'importe où dans l'app.
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export default function LtpcAIFab() {
  return (
    <Link
      to="/ltpc-ai"
      title="Ouvrir LTPC AI"
      className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center print:hidden"
    >
      <Sparkles className="h-5 w-5" />
      <span className="sr-only">LTPC AI</span>
    </Link>
  );
}
