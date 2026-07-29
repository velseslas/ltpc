import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { callRpc, DocumentRepository, getRepositoryForTable } from "@/lib/repositories";
import { supabase } from "@/integrations/supabase/client";

export interface Entreprise {
  id: string;
  nom: string;
  numero_autorisation: string | null;
  date_autorisation: string | null;
  siege_social: string | null;
  annexe: string | null;
  telephone: string | null;
  email: string | null;
  site_web: string | null;
  logo_url: string | null;
  cachet_url: string | null;
  representant: string | null;
  rib: string | null;
  banque: string | null;
  agence: string | null;
  rc: string | null;
  nif: string | null;
  nis: string | null;
  ai: string | null;
  created_at: string;
  updated_at: string;
}

export type EntrepriseUpdate = Partial<Omit<Entreprise, 'id' | 'created_at' | 'updated_at'>>;

const entrepriseRepo = getRepositoryForTable<Entreprise>("entreprise", {
  defaultSelect: "*",
  defaultOrder: { column: "created_at", ascending: true },
});

export const useEntreprise = () => {
  return useQuery({
    queryKey: ["entreprise"],
    queryFn: async () => {
      // Public-safe fields only (no banking / tax IDs). RLS restricts the
      // underlying table to admins; everyone else reads via this RPC.
      const { data, error } = await callRpc<Entreprise[]>("get_entreprise_public");
      if (error) throw new Error(error);
      const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
      return row as Entreprise | null;
    },
    retry: (failureCount, error) => {
      const err = error as { code?: string; message?: string } | null;
      const expiredJwt = err?.code === "PGRST303" || /jwt expired|token is expired/i.test(err?.message || "");
      return expiredJwt && failureCount < 2;
    },
  });
};

// Branding public (nom + logo) — lisible sans être connecté (page de login).
// Table dédiée `entreprise_branding` synchronisée depuis `entreprise`.
export const useEntrepriseBranding = () => {
  return useQuery({
    queryKey: ["entreprise", "branding"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entreprise_branding" as never)
        .select("id, nom, logo_url")
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data ?? null) as { id: string; nom: string; logo_url: string | null } | null;
    },
  });
};

// Full entreprise record including sensitive banking / tax IDs.
// Reserved for admin-only pages (settings, facture/devis previews).
// RLS restricts the underlying table to super_admin / admin.
export const useEntrepriseFull = () => {
  return useQuery({
    queryKey: ["entreprise", "full"],
    queryFn: async () => {
      const { data } = await entrepriseRepo.list({ limit: 1 });
      return (data[0] ?? null) as Entreprise | null;
    },
  });
};

export const useUpdateEntreprise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id?: string; updates: EntrepriseUpdate }) => {
      if (id) {
        const res = await entrepriseRepo.update(updates as any, { id });
        if (res.error) throw new Error(res.error);
        return res.data[0];
      } else {
        const res = await entrepriseRepo.insert(updates as any);
        if (res.error) throw new Error(res.error);
        return res.data[0];
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entreprise"] });
    },
  });
};

// Upload helpers — délégués à DocumentRepository (bucket `logos`).
export const uploadLogo = (file: File): Promise<string> => DocumentRepository.uploadLogo(file, "logo");
export const uploadCachet = (file: File): Promise<string> => DocumentRepository.uploadLogo(file, "cachet");
