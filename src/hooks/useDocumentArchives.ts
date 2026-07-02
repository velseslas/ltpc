import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateOfficialDocument } from "@/lib/documents/DocumentGenerator";
import type { DocumentGenerationInput, DocumentGenerationResult, DocumentType } from "@/lib/documents/types";

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

export function useDocumentArchives(documentType: DocumentType, documentId?: string | null) {
  return useQuery({
    queryKey: ["document_archives", documentType, documentId],
    enabled: !!documentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_archives")
        .select("*")
        .eq("document_type", documentType)
        .eq("document_id", documentId!)
        .order("version", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DocumentArchive[];
    },
  });
}

export function useGenerateOfficialDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DocumentGenerationInput): Promise<DocumentGenerationResult> => generateOfficialDocument(input),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["document_archives", vars.document_type, vars.document_id] });
    },
  });
}

/** URL signée à la demande pour un PDF archivé. */
export async function getSignedArchiveUrl(pdfPath: string, ttlSec = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from("documents-officiels").createSignedUrl(pdfPath, ttlSec);
  if (error) throw error;
  return data.signedUrl;
}
