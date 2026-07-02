// Phase 5 — Moteur générique de génération documentaire.
// Types partagés — indépendants du rapport technique. Réutilisables pour :
// rapports NC, audits, comptes rendus, avis techniques, courriers, etc.

export type DocumentType =
  | "rapport_technique"
  | "rapport_non_conformite"
  | "audit"
  | "compte_rendu"
  | "avis_technique"
  | "courrier";

export interface DocumentTemplate {
  id: string;
  nom: string;
  couleur_primaire: string;   // ex. #1e5a7a
  couleur_secondaire: string; // ex. #d4e5f7
  police: string;             // ex. "Times New Roman"
  taille_titre: number;       // pt
  taille_corps: number;       // pt
  marge_mm: { top: number; right: number; bottom: number; left: number };
  entete_html?: string | null;   // HTML libre, variables acceptées
  pied_html?: string | null;     // HTML libre, variables acceptées
  logo_url?: string | null;
  cachet_url?: string | null;
  signature_url?: string | null;
  format?: "A4";
  orientation?: "portrait" | "paysage";
}

export interface DocumentSignature {
  ingenieur_nom?: string | null;
  ingenieur_fonction?: string | null;
  signature_url?: string | null;
  cachet_url?: string | null;
  date_validation?: string | null; // ISO
}

export interface DocumentAnnexe {
  ref: string;                 // A1, A2, ...
  titre: string;
  type: "image" | "pdf" | "table" | "graph" | "fichier";
  url?: string | null;         // storage or public URL
  contenu_html?: string | null;
}

export interface DocumentVariables {
  numero_rapport?: string | null;
  date?: string | null;
  chantier?: string | null;
  client?: string | null;
  entreprise?: string | null;
  projet?: string | null;
  ingenieur?: string | null;
  laboratoire?: string | null;
  reference?: string | null;
  objet?: string | null;
  [k: string]: string | null | undefined;
}

export interface DocumentGenerationInput {
  document_type: DocumentType;
  document_id: string;
  numero?: string | null;
  version?: number;              // sinon max(existant)+1
  template: DocumentTemplate;
  variables: DocumentVariables;
  body_html: string;             // Contenu principal (Tiptap HTML par ex.)
  signature?: DocumentSignature | null;
  annexes?: DocumentAnnexe[];
  qr_verification_base_url?: string; // ex. window.location.origin + "/verification"
}

export interface DocumentGenerationResult {
  archive_id: string;
  version: number;
  pdf_url: string;              // storage path
  public_url: string;           // signed URL for immediate use
  qr_token: string;
  sha256: string;
  pdf_size: number;
}
