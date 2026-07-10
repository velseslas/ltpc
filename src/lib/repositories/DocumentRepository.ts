// DocumentRepository — couche unique pour les opérations documentaires.
// Regroupe :
//   - Documents administratifs (fichiers dans le bucket `documents-administratifs`)
//   - Documents officiels archivés (bucket `documents-officiels` + table `document_archives`)
//   - Rapports techniques (bucket `rapports-techniques` — lecture seule côté UI ici)
//   - Signatures / cachets / logos (bucket `signatures` / `logos`)
//   - Contrats (bucket `contrats`)
//
// Objectif : ne plus appeler directement `supabase.storage.*` ni
// `supabase.from("document_archives")` depuis les composants React ou les
// hooks — tout doit transiter par ici pour être visible dans le debug bus
// et être prêt à être intercepté par la future couche PWA (cache local,
// synchronisation, file d'attente offline).
import { getRepositoryForTable } from "./registry";
import { getStorageRepository, STORAGE_BUCKETS, type StorageResult } from "./StorageRepository";

// -------- Types --------
export interface DocumentArchive {
  id: string;
  document_type: string;
  document_id: string;
  numero: string | null;
  version: number;
  template_id: string | null;
  pdf_url: string;
  pdf_size: number | null;
  sha256: string;
  qr_token: string;
  generated_by: string | null;
  generated_by_nom: string | null;
  status: string;
  created_at: string;
}

// Repository sur la table `document_archives` (via BaseRepository).
const archivesRepo = getRepositoryForTable<DocumentArchive>("document_archives", {
  defaultSelect: "*",
  defaultOrder: { column: "created_at", ascending: false },
  searchFields: ["numero", "document_type"],
});

export class DocumentRepository {
  /** Récupère toutes les archives d'un document (par type + id). */
  static async listArchives(documentType: string, documentId: string): Promise<DocumentArchive[]> {
    const { data } = await archivesRepo.list({
      filters: { document_type: documentType, document_id: documentId },
      order: { column: "version", ascending: false },
    });
    return data;
  }

  /** URL signée à la demande pour un PDF archivé (bucket documents-officiels). */
  static async signedArchiveUrl(pdfPath: string, ttlSec = 3600): Promise<string> {
    const repo = getStorageRepository(STORAGE_BUCKETS.documentsOfficiels);
    const { data, error } = await repo.createSignedUrl(pdfPath, ttlSec);
    if (error || !data) throw new Error(error ?? "URL signée indisponible");
    return data.signedUrl;
  }

  // -------- Documents administratifs (bucket documents-administratifs) --------

  static async uploadAdministratif(path: string, file: File, opts: { upsert?: boolean } = {}): Promise<{ path: string; publicUrl: string }> {
    const repo = getStorageRepository(STORAGE_BUCKETS.documentsAdministratifs);
    const up = await repo.upload(path, file, { upsert: opts.upsert });
    if (up.error || !up.data) throw new Error(up.error ?? "Échec upload");
    return { path: up.data.path, publicUrl: repo.getPublicUrl(up.data.path).publicUrl };
  }

  static async deleteAdministratif(paths: string | string[]): Promise<StorageResult<{ removed: number }>> {
    return getStorageRepository(STORAGE_BUCKETS.documentsAdministratifs).delete(paths);
  }

  // -------- Contrats (bucket contrats) --------

  static async uploadContrat(path: string, file: File, opts: { upsert?: boolean } = {}): Promise<{ path: string; publicUrl: string }> {
    const repo = getStorageRepository(STORAGE_BUCKETS.contrats);
    const up = await repo.upload(path, file, { upsert: opts.upsert });
    if (up.error || !up.data) throw new Error(up.error ?? "Échec upload");
    return { path: up.data.path, publicUrl: repo.getPublicUrl(up.data.path).publicUrl };
  }

  // -------- Logos / Cachets (bucket logos) --------

  static async uploadLogo(file: File, kind: "logo" | "cachet" = "logo"): Promise<string> {
    const ext = file.name.split(".").pop() || "png";
    const fileName = `${kind}-${Date.now()}.${ext}`;
    const repo = getStorageRepository(STORAGE_BUCKETS.logos);
    const up = await repo.upload(fileName, file, { upsert: true });
    if (up.error || !up.data) throw new Error(up.error ?? "Échec upload");
    return repo.getPublicUrl(up.data.path).publicUrl;
  }

  // -------- Signatures (bucket signatures) --------

  static async uploadSignature(path: string, file: File | Blob, opts: { upsert?: boolean } = {}): Promise<{ publicUrl: string; path: string }> {
    const repo = getStorageRepository(STORAGE_BUCKETS.signatures);
    const up = await repo.upload(path, file, { upsert: opts.upsert ?? true });
    if (up.error || !up.data) throw new Error(up.error ?? "Échec upload");
    return { path: up.data.path, publicUrl: repo.getPublicUrl(up.data.path).publicUrl };
  }

  static async deleteSignature(paths: string | string[]): Promise<StorageResult<{ removed: number }>> {
    return getStorageRepository(STORAGE_BUCKETS.signatures).delete(paths);
  }

  // -------- Certificats étalonnage (bucket certificats-etalonnage) --------

  static async uploadCertificatEtalonnage(path: string, file: File, opts: { upsert?: boolean } = {}): Promise<{ publicUrl: string; path: string }> {
    const repo = getStorageRepository(STORAGE_BUCKETS.certificatsEtalonnage);
    const up = await repo.upload(path, file, { upsert: opts.upsert });
    if (up.error || !up.data) throw new Error(up.error ?? "Échec upload");
    return { path: up.data.path, publicUrl: repo.getPublicUrl(up.data.path).publicUrl };
  }

  // -------- Rapports techniques (bucket rapports-techniques) --------
  // Utilisé par les hooks Rapports pour pièces jointes.

  static rapportsTechniquesBucket() {
    return getStorageRepository(STORAGE_BUCKETS.rapportsTechniques);
  }

  static async uploadRapportPiece(path: string, file: File, opts: { upsert?: boolean; contentType?: string } = {}): Promise<{ path: string }> {
    const repo = getStorageRepository(STORAGE_BUCKETS.rapportsTechniques);
    const up = await repo.upload(path, file, { upsert: opts.upsert ?? false, contentType: opts.contentType });
    if (up.error || !up.data) throw new Error(up.error ?? "Échec upload");
    return { path: up.data.path };
  }

  static async signedRapportUrl(path: string, ttlSec = 3600): Promise<string | null> {
    const repo = getStorageRepository(STORAGE_BUCKETS.rapportsTechniques);
    const { data } = await repo.createSignedUrl(path, ttlSec);
    return data?.signedUrl ?? null;
  }

  static async deleteRapportPiece(paths: string | string[]): Promise<StorageResult<{ removed: number }>> {
    return getStorageRepository(STORAGE_BUCKETS.rapportsTechniques).delete(paths);
  }

  // -------- Documents officiels (bucket documents-officiels) --------
  // Utilisé par DocumentGenerator pour les archives PDF.

  static async uploadOfficiel(path: string, blob: Blob, opts: { upsert?: boolean; contentType?: string } = {}): Promise<{ path: string }> {
    const repo = getStorageRepository(STORAGE_BUCKETS.documentsOfficiels);
    const up = await repo.upload(path, blob, { upsert: opts.upsert ?? false, contentType: opts.contentType });
    if (up.error || !up.data) throw new Error(up.error ?? "Échec upload");
    return { path: up.data.path };
  }
}

