import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ShieldCheck, FileText, Download, Loader2 } from "lucide-react";
import { getSignedArchiveUrl } from "@/hooks/useDocumentArchives";

// Page publique de vérification — accessible sans authentification via QR code.
// L'architecture est prête ; l'aspect sera étendu (comparaison hash, journal, etc.).
export default function VerificationPage() {
  const { token = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [archive, setArchive] = useState<Record<string, unknown> | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("document_archives")
        .select("*")
        .eq("qr_token", token)
        .maybeSingle();
      setArchive(data as Record<string, unknown> | null);
      if (data && (data as { pdf_url?: string }).pdf_url) {
        try {
          const u = await getSignedArchiveUrl((data as { pdf_url: string }).pdf_url, 3600);
          setSignedUrl(u);
        } catch { /* ignore */ }
      }
      setLoading(false);
    })();
  }, [token]);

  const authentic = !!archive && (archive as { status?: string }).status === "active";
  const a = archive as {
    document_type?: string; numero?: string; version?: number; sha256?: string;
    generated_by_nom?: string; created_at?: string; pdf_size?: number;
  } | null;

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
          ) : !archive ? (
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <div>
                <div className="font-semibold">Document introuvable</div>
                <div className="text-sm text-muted-foreground">Le jeton QR est invalide ou révoqué.</div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                {authentic ? (
                  <><CheckCircle2 className="h-6 w-6 text-emerald-600" /><span className="font-semibold text-emerald-700">Document authentique</span></>
                ) : (
                  <><XCircle className="h-6 w-6 text-destructive" /><span className="font-semibold text-destructive">Document révoqué</span></>
                )}
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
