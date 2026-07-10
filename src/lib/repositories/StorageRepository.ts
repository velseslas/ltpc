// StorageRepository — couche unique d'accès à Supabase Storage.
// Objectif : centraliser upload/download/delete/signed URL/list/move/copy/exists
// afin que la future PWA puisse intercepter les opérations pour cache local,
// synchronisation offline, file d'attente et retry automatique.
//
// Ne pas appeler `supabase.storage.*` ailleurs — passer par cette couche.
import { supabase } from "@/integrations/supabase/client";

export interface StorageDebug {
  repository: "StorageRepository";
  bucket: string;
  operation: "upload" | "download" | "delete" | "createSignedUrl" | "getPublicUrl" | "list" | "move" | "copy" | "exists";
  path: string;
  files_returned: number;
  storage_preview: string;
  warning?: string;
  duration_ms: number;
}

export interface StorageResult<T> { data: T | null; error: string | null; debug: StorageDebug }

export interface StorageUploadOptions {
  upsert?: boolean;
  contentType?: string;
  cacheControl?: string;
}

// PWA extension hook — sera plus tard branché sur IndexedDB / file d'attente.
// Aucune implémentation active en Phase 3-bis : simple point d'extension.
export interface StorageHooks {
  beforeOperation?: (debug: Omit<StorageDebug, "files_returned" | "duration_ms">) => void | Promise<void>;
  afterOperation?: (debug: StorageDebug) => void | Promise<void>;
  /** Retourne une réponse "cache" si offline. Non branché pour l'instant. */
  offlineFallback?: <T>(debug: Omit<StorageDebug, "files_returned" | "duration_ms">) => Promise<T | null>;
  /** Enqueue une mutation storage pour rejeu offline. Non branché pour l'instant. */
  enqueueMutation?: (debug: Omit<StorageDebug, "files_returned" | "duration_ms">) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as unknown as any;

export class StorageRepository {
  static hooks: StorageHooks = {};

  constructor(public readonly bucket: string) {}

  private buildDebug(op: StorageDebug["operation"], path: string, files: number, t0: number, warning?: string): StorageDebug {
    return {
      repository: "StorageRepository",
      bucket: this.bucket,
      operation: op,
      path,
      files_returned: files,
      storage_preview: `${op.toUpperCase()} storage://${this.bucket}/${path}`,
      warning,
      duration_ms: Math.round(performance.now() - t0),
    };
  }

  async upload(path: string, file: File | Blob | ArrayBuffer, opts: StorageUploadOptions = {}): Promise<StorageResult<{ path: string }>> {
    const t0 = performance.now();
    await StorageRepository.hooks.beforeOperation?.({ repository: "StorageRepository", bucket: this.bucket, operation: "upload", path, storage_preview: `UPLOAD storage://${this.bucket}/${path}` });
    const { data, error } = await sb.storage.from(this.bucket).upload(path, file, {
      upsert: opts.upsert ?? false,
      contentType: opts.contentType,
      cacheControl: opts.cacheControl,
    });
    const debug = this.buildDebug("upload", path, error ? 0 : 1, t0, error?.message);
    await StorageRepository.hooks.afterOperation?.(debug);
    return { data: data ? { path: (data as { path: string }).path } : null, error: error?.message ?? null, debug };
  }

  async download(path: string): Promise<StorageResult<Blob>> {
    const t0 = performance.now();
    const { data, error } = await sb.storage.from(this.bucket).download(path);
    const debug = this.buildDebug("download", path, error ? 0 : 1, t0, error?.message);
    await StorageRepository.hooks.afterOperation?.(debug);
    return { data: (data as Blob) ?? null, error: error?.message ?? null, debug };
  }

  async delete(paths: string | string[]): Promise<StorageResult<{ removed: number }>> {
    const t0 = performance.now();
    const arr = Array.isArray(paths) ? paths : [paths];
    const { data, error } = await sb.storage.from(this.bucket).remove(arr);
    const removed = Array.isArray(data) ? data.length : 0;
    const debug = this.buildDebug("delete", arr.join(","), removed, t0, error?.message);
    await StorageRepository.hooks.afterOperation?.(debug);
    return { data: { removed }, error: error?.message ?? null, debug };
  }

  async createSignedUrl(path: string, ttlSec = 3600): Promise<StorageResult<{ signedUrl: string }>> {
    const t0 = performance.now();
    const { data, error } = await sb.storage.from(this.bucket).createSignedUrl(path, ttlSec);
    const debug = this.buildDebug("createSignedUrl", path, error ? 0 : 1, t0, error?.message);
    await StorageRepository.hooks.afterOperation?.(debug);
    return { data: data ? { signedUrl: (data as { signedUrl: string }).signedUrl } : null, error: error?.message ?? null, debug };
  }

  getPublicUrl(path: string): { publicUrl: string; debug: StorageDebug } {
    const t0 = performance.now();
    const { data } = sb.storage.from(this.bucket).getPublicUrl(path);
    const debug = this.buildDebug("getPublicUrl", path, 1, t0);
    return { publicUrl: (data as { publicUrl: string }).publicUrl, debug };
  }

  async list(prefix = "", opts: { limit?: number; offset?: number; sortBy?: { column: string; order: "asc" | "desc" } } = {}): Promise<StorageResult<Array<{ name: string; id?: string; updated_at?: string; created_at?: string; last_accessed_at?: string; metadata?: Record<string, unknown> }>>> {
    const t0 = performance.now();
    const { data, error } = await sb.storage.from(this.bucket).list(prefix, opts);
    const arr = (data as Array<Record<string, unknown>>) ?? [];
    const debug = this.buildDebug("list", prefix, arr.length, t0, error?.message);
    await StorageRepository.hooks.afterOperation?.(debug);
    return { data: arr as Array<{ name: string }>, error: error?.message ?? null, debug };
  }

  async move(from: string, to: string): Promise<StorageResult<null>> {
    const t0 = performance.now();
    const { error } = await sb.storage.from(this.bucket).move(from, to);
    const debug = this.buildDebug("move", `${from} → ${to}`, error ? 0 : 1, t0, error?.message);
    await StorageRepository.hooks.afterOperation?.(debug);
    return { data: null, error: error?.message ?? null, debug };
  }

  async copy(from: string, to: string): Promise<StorageResult<null>> {
    const t0 = performance.now();
    const { error } = await sb.storage.from(this.bucket).copy(from, to);
    const debug = this.buildDebug("copy", `${from} → ${to}`, error ? 0 : 1, t0, error?.message);
    await StorageRepository.hooks.afterOperation?.(debug);
    return { data: null, error: error?.message ?? null, debug };
  }

  async exists(path: string): Promise<StorageResult<boolean>> {
    const t0 = performance.now();
    // Supabase n'a pas de `exists` natif — on utilise `list` sur le dossier parent.
    const slash = path.lastIndexOf("/");
    const dir = slash >= 0 ? path.slice(0, slash) : "";
    const name = slash >= 0 ? path.slice(slash + 1) : path;
    const { data, error } = await sb.storage.from(this.bucket).list(dir, { search: name });
    const arr = (data as Array<{ name: string }>) ?? [];
    const found = arr.some((f) => f.name === name);
    const debug = this.buildDebug("exists", path, found ? 1 : 0, t0, error?.message);
    await StorageRepository.hooks.afterOperation?.(debug);
    return { data: found, error: error?.message ?? null, debug };
  }
}

// Cache des instances par bucket.
const STORAGE_CACHE = new Map<string, StorageRepository>();

export function getStorageRepository(bucket: string): StorageRepository {
  const cached = STORAGE_CACHE.get(bucket);
  if (cached) return cached;
  const repo = new StorageRepository(bucket);
  STORAGE_CACHE.set(bucket, repo);
  return repo;
}

// Buckets pré-déclarés (correspondent aux buckets Supabase du projet).
export const STORAGE_BUCKETS = {
  logos: "logos",
  contrats: "contrats",
  documentsAdministratifs: "documents-administratifs",
  certificatsEtalonnage: "certificats-etalonnage",
  signatures: "signatures",
  rapportsTechniques: "rapports-techniques",
  documentsOfficiels: "documents-officiels",
} as const;
