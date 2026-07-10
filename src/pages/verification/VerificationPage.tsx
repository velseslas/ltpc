import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ShieldCheck, FileText, Download, Loader2 } from "lucide-react";

// Page publique de vérification — accessible sans authentification via QR code.
// Utilise l'Edge Function sécurisée `verify-archive` (RC2) qui :
//  - ne renvoie aucune donnée interne (variables, contenu_snapshot, uuid émetteur)
//  - vérifie le statut et l'expiration
//  - retourne une URL signée courte durée pour le PDF officiel
interface PublicArchive {
  document_type: string;
  numero: string | null;
  version: number;
  created_at: string;
  generated_by_nom: string | null;
  pdf_size: number | null;
  sha256: string;
  status: string;
}
interface VerifyResponse {
  valid: boolean;
  reason?: string;
  archive?: PublicArchive;
  signed_url?: string | null;
}

export default function VerificationPage() {
  const { token = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerifyResponse | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke<VerifyResponse>("verify-archive", {
          body: { token, ttl: 3600 },
        });
        if (error) {
          setResult({ valid: false, reason: "network_error" });
        } else {
          setResult(data ?? { valid: false, reason: "empty_response" });
        }
      } catch {
        setResult({ valid: false, reason: "network_error" });
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const authentic = !!result?.valid && result.archive?.status === "active";
  const a = result?.archive ?? null;
  const signedUrl = result?.signed_url ?? null;

  const reasonLabel = (r?: string) => {
    switch (r) {
      case "invalid_token": return "Le jeton QR est invalide.";
      case "not_found_or_expired": return "Le document est introuvable, révoqué ou expiré.";
      case "lookup_failed":
      case "internal_error":
      case "network_error": return "Vérification indisponible pour le moment.";
      default: return "Le jeton QR n'a pas pu être vérifié.";
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Vérification d'authenticité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Vérification…</div>
          ) : !authentic ? (
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <div>
                <div className="font-semibold">Document non authentifié</div>
                <div className="text-sm text-muted-foreground">{reasonLabel(result?.reason)}</div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                <span className="font-semibold text-emerald-700">Document authentique</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-muted-foreground">Type</div><div className="font-medium">{a?.document_type}</div></div>
                <div><div className="text-muted-foreground">Numéro</div><div className="font-medium">{a?.numero ?? "—"}</div></div>
                <div><div className="text-muted-foreground">Version</div><Badge variant="outline">v{a?.version}</Badge></div>
                <div><div className="text-muted-foreground">Émis le</div><div className="font-medium">{a?.created_at ? new Date(a.created_at).toLocaleString("fr-FR") : "—"}</div></div>
                <div><div className="text-muted-foreground">Émis par</div><div className="font-medium">{a?.generated_by_nom ?? "—"}</div></div>
                <div><div className="text-muted-foreground">Taille</div><div className="font-medium">{a?.pdf_size ? `${Math.round(a.pdf_size / 1024)} Ko` : "—"}</div></div>
              </div>
              <div className="text-xs break-all bg-muted p-2 rounded">
                <div className="text-muted-foreground mb-1">Empreinte SHA-256</div>
                <code>{a?.sha256}</code>
              </div>
              {signedUrl && (
                <Button asChild className="w-full"><a href={signedUrl} target="_blank" rel="noreferrer"><FileText className="h-4 w-4 mr-2" /> Ouvrir le PDF officiel</a></Button>
              )}
              {signedUrl && (
                <Button asChild variant="outline" className="w-full"><a href={signedUrl} download><Download className="h-4 w-4 mr-2" /> Télécharger</a></Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
