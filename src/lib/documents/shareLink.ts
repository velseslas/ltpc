// Lien de partage direct vers le FICHIER du document archivé.
//
// Un lien partagé doit ouvrir le document lui-même (rendu natif par le
// navigateur, `application/pdf` inline) et non la page d'aperçu interne LTPC.
// Le moteur de génération, le moteur d'impression et le système de partage
// restent inchangés : seule l'URL servie change.

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

/** URL publique servant directement le fichier archivé (inline). */
export function buildDirectFileUrl(qrToken: string, opts: { download?: boolean } = {}): string {
  const dl = opts.download ? "&dl=1" : "";
  return `${FUNCTIONS_BASE}/document-file?t=${encodeURIComponent(qrToken)}${dl}`;
}
