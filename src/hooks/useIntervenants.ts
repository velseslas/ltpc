import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { getRepositoryForTable } from "@/lib/repositories";
import { supabase } from "@/integrations/supabase/client";

export type Intervenant = Tables<"intervenants">;
export type IntervenantInsert = TablesInsert<"intervenants">;
export type IntervenantUpdate = TablesUpdate<"intervenants">;

export type IntervenantWithPoste = Intervenant & {
  postes: { id: string; nom: string } | null;
};

// Champs RH sensibles : jamais lisibles/écrits directement via l'API données.
// Ils transitent par les fonctions serveur `intervenant_hr` / `intervenant_hr_save`
// réservées aux administrateurs et responsables.
export const INTERVENANT_HR_FIELDS = [
  "date_naissance", "cin", "cnas", "adresse", "salaire", "notes",
] as const;

export interface IntervenantHR {
  id: string;
  date_naissance: string | null;
  cin: string | null;
  cnas: string | null;
  adresse: string | null;
  salaire: number | null;
  notes: string | null;
}

const SAFE_COLUMNS =
  "id, nom, prenom, email, telephone, role, departement, statut, date_embauche, poste_id, specialite, signature_url, created_at, updated_at";

function splitHR<T extends Record<string, unknown>>(payload: T) {
  const safe: Record<string, unknown> = {};
  const hr: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if ((INTERVENANT_HR_FIELDS as readonly string[]).includes(k)) hr[k] = v;
    else safe[k] = v;
  }
  return { safe, hr, hasHR: Object.keys(hr).length > 0 };
}

async function saveHR(id: string, hr: Record<string, unknown>) {
  const { error } = await (supabase as any).rpc("intervenant_hr_save", {
    _id: id,
    _date_naissance: (hr.date_naissance as string | null) ?? null,
    _cin: (hr.cin as string | null) ?? null,
    _cnas: (hr.cnas as string | null) ?? null,
    _adresse: (hr.adresse as string | null) ?? null,
    _salaire: (hr.salaire as number | null) ?? null,
    _notes: (hr.notes as string | null) ?? null,
  });
  if (error) throw new Error(error.message);
}

const repo = getRepositoryForTable<IntervenantWithPoste>("intervenants", {
  defaultSelect: `${SAFE_COLUMNS}, postes(id, nom)`,
  defaultOrder: { column: "nom", ascending: true },
});


// Public directory hook — reads from the PII-free view (safe for all authenticated users).
export function useIntervenants() {
  return useQuery({
    queryKey: ["intervenants"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("intervenants_directory")
        .select("*")
        .order("nom", { ascending: true });
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as Array<Record<string, unknown>>;
      // Re-shape into the historical { ..., postes: { id, nom } } contract.
      return rows.map((r) => ({
        ...r,
        postes: r.poste_id
          ? { id: String(r.poste_id), nom: (r.poste_nom as string | null) ?? "" }
          : null,
      })) as unknown as IntervenantWithPoste[];
    },
  });
}

export function useIntervenant(id: string) {
  return useQuery({
    queryKey: ["intervenants", id],
    queryFn: async () => (await repo.getById(id, `${SAFE_COLUMNS}, postes(id, nom)`)).data,
    enabled: !!id,
  });
}

/** Données RH sensibles — renvoie null si l'utilisateur n'est pas admin/responsable. */
export function useIntervenantHR(id: string) {
  return useQuery({
    queryKey: ["intervenants-hr", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("intervenant_hr", { _id: id });
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as IntervenantHR[];
      return rows[0] ?? null;
    },
  });
}

export function useCreateIntervenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (intervenant: IntervenantInsert) => {
      const { safe, hr, hasHR } = splitHR(intervenant as unknown as Record<string, unknown>);
      const { data, error } = await repo.insert(safe as Partial<IntervenantWithPoste>, { select: SAFE_COLUMNS });
      if (error) throw new Error(error);
      const created = data[0];
      if (hasHR && created?.id) await saveHR(created.id, hr);
      return created;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["intervenants"] }),
  });
}

export function useUpdateIntervenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: IntervenantUpdate & { id: string }) => {
      const { safe, hr, hasHR } = splitHR(updates as unknown as Record<string, unknown>);
      let row: IntervenantWithPoste | undefined;
      if (Object.keys(safe).length) {
        const { data, error } = await repo.update(safe as Partial<IntervenantWithPoste>, { id }, { select: SAFE_COLUMNS });
        if (error) throw new Error(error);
        row = data[0];
      }
      if (hasHR) await saveHR(id, hr);
      return row;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["intervenants"] });
      qc.invalidateQueries({ queryKey: ["intervenants-hr", vars.id] });
    },
  });
}


export function useDeleteIntervenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await repo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["intervenants"] }),
  });
}

export function useIntervenantsStats() {
  return useQuery({
    queryKey: ["intervenants-stats"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("intervenants_directory")
        .select("statut");
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as Array<{ statut: string }>;
      return {
        total: rows.length,
        active: rows.filter((i) => i.statut === "active").length,
        mission: rows.filter((i) => i.statut === "mission").length,
        inactive: rows.filter((i) => i.statut === "inactive").length,
      };
    },
  });
}
