import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  created_at: string;
  updated_at: string;
}

export type EntrepriseUpdate = Partial<Omit<Entreprise, 'id' | 'created_at' | 'updated_at'>>;

export const useEntreprise = () => {
  return useQuery({
    queryKey: ["entreprise"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entreprise")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1);

      if (error) throw error;
      return (data && data.length > 0 ? data[0] : null) as Entreprise | null;
    },
  });
};

export const useUpdateEntreprise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id?: string; updates: EntrepriseUpdate }) => {
      if (id) {
        // Update existing entreprise
        const { data, error } = await supabase
          .from("entreprise")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new entreprise
        const { data, error } = await supabase
          .from("entreprise")
          .insert(updates)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entreprise"] });
    },
  });
};

export const uploadLogo = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `logo-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('logos')
    .upload(fileName, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('logos')
    .getPublicUrl(fileName);

  return data.publicUrl;
};

export const uploadCachet = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `cachet-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('logos')
    .upload(fileName, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('logos')
    .getPublicUrl(fileName);

  return data.publicUrl;
};
