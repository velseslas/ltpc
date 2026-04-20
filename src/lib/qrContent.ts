/**
 * Construit le contenu texte structuré et lisible affiché au scan d'un QR code.
 *
 * Plutôt que d'encoder une URL de redirection, le QR code embarque directement
 * les détails clés du document (numéro, titre, client, chantier, dates, montants).
 * Le résultat est lisible dans n'importe quel scanner standard.
 */
export interface QRDocumentInfo {
  /** Nom du laboratoire / entreprise émettrice */
  entreprise?: string | null;
  /** Type de document (ex: "Rapport d'essai", "Lettre d'engagement") */
  type?: string | null;
  /** Numéro / référence du document */
  numero?: string | null;
  /** Titre principal */
  titre?: string | null;
  /** Sous-titre ou détail (norme, période, etc.) */
  sousTitre?: string | null;
  /** Nom du client */
  client?: string | null;
  /** Nom / lieu du chantier */
  chantier?: string | null;
  /** Date du document (ISO ou texte) */
  date?: string | null;
  /** Montant HT formaté */
  montantHT?: string | number | null;
  /** Montant TTC formaté */
  montantTTC?: string | number | null;
  /** Champs additionnels libres (label => valeur) */
  extra?: Record<string, string | number | null | undefined>;
}

const formatMontant = (v: string | number | null | undefined) => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return String(v);
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
};

const formatDate = (v: string | null | undefined) => {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString("fr-FR");
};

/**
 * Génère un contenu vCard 3.0 encodé dans le QR code.
 *
 * Le format vCard est reconnu nativement par la plupart des scanners
 * (caméra iPhone, Google Lens, scanners Android), qui affichent
 * automatiquement les informations sous forme de fiche structurée
 * — sans bouton "Copier" intermédiaire.
 *
 * Les détails du document (numéro, client, chantier, date, montants)
 * sont placés dans le champ NOTE de la vCard pour rester lisibles.
 */
export function buildQRContent(info: QRDocumentInfo): string {
  const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

  const orgName = info.entreprise || "Document";
  const fullName = [info.type, info.numero].filter(Boolean).join(" ") || info.titre || "Document";

  const noteLines: string[] = [];
  if (info.titre) noteLines.push(info.titre);
  if (info.sousTitre) noteLines.push(info.sousTitre);
  if (info.numero) noteLines.push(`N°: ${info.numero}`);
  if (info.client) noteLines.push(`Client: ${info.client}`);
  if (info.chantier) noteLines.push(`Chantier: ${info.chantier}`);
  const date = formatDate(info.date ?? null);
  if (date) noteLines.push(`Date: ${date}`);
  const ht = formatMontant(info.montantHT);
  if (ht) noteLines.push(`Montant HT: ${ht}`);
  const ttc = formatMontant(info.montantTTC);
  if (ttc) noteLines.push(`Montant TTC: ${ttc}`);
  if (info.extra) {
    for (const [k, v] of Object.entries(info.extra)) {
      if (v === null || v === undefined || v === "") continue;
      noteLines.push(`${k}: ${v}`);
    }
  }

  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escape(fullName)}`,
    `ORG:${escape(orgName)}`,
    info.titre ? `TITLE:${escape(info.titre)}` : null,
    noteLines.length > 0 ? `NOTE:${escape(noteLines.join("\n"))}` : null,
    "END:VCARD",
  ].filter(Boolean).join("\n");

  return vcard;
}

/**
 * Heuristique : transforme une entrée legacy en texte structuré lisible.
 *
 * - Si `value` est déjà un texte multi-lignes (contient `\n`) ou ne ressemble pas
 *   à une URL, on le retourne tel quel.
 * - Si `value` est une URL, on tente de construire un texte lisible à partir des
 *   informations contextuelles (`title`, `subtitle`, `entreprise`).
 */
export function normalizeQRValue(
  value: string,
  fallback: { entreprise?: string | null; title?: string | null; subtitle?: string | null }
): string {
  if (!value) {
    return buildQRContent({
      entreprise: fallback.entreprise,
      titre: fallback.title,
      sousTitre: fallback.subtitle,
      date: new Date().toISOString(),
    });
  }

  const isUrl = /^https?:\/\//i.test(value.trim());
  if (!isUrl) return value;

  // Conversion URL -> texte structuré lisible
  return buildQRContent({
    entreprise: fallback.entreprise,
    titre: fallback.title,
    sousTitre: fallback.subtitle,
    date: new Date().toISOString(),
  });
}
