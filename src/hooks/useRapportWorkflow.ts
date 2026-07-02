import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getAIProvider, type ImproveAction } from "@/lib/ai/aiProvider";

// ---- Improve IA sur un texte sélectionné ----
export function useImproveText() {
  return useMutation({
    mutationFn: async (input: { texte: string; action: ImproveAction; rapportId?: string; contexte?: string }) =>
      getAIProvider().improveText(input),
  });
}

// ---- Versions ----
export interface RapportVersion {
  id: string;
  rapport_id: string;
  version: number;
  titre: string | null;
  contenu: Record<string, unknown> | null;
  editor_html: string | null;
  commentaire: string | null;
  event_type: string;
  created_by: string | null;
  created_at: string;
}

export function useRapportVersions(rapportId?: string | null) {
  return useQuery({
    queryKey: ["rapport_versions", rapportId],
    enabled: !!rapportId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rapport_versions")
        .select("*")
        .eq("rapport_id", rapportId!)
        .order("version", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as RapportVersion[];
    },
  });
}

export function useSaveVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { rapportId: string; commentaire?: string; editor_html: string; titre?: string; contenu?: Record<string, unknown> | null; event_type?: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id ?? null;
      // récupérer la prochaine version
      const { data: last } = await supabase
        .from("rapport_versions")
        .select("version")
        .eq("rapport_id", input.rapportId)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextV = ((last?.version as number | undefined) ?? 0) + 1;
      const { error } = await supabase.from("rapport_versions").insert({
        rapport_id: input.rapportId,
        version: nextV,
        titre: input.titre ?? null,
        contenu: (input.contenu ?? null) as never,
        editor_html: input.editor_html,
        commentaire: input.commentaire ?? null,
        event_type: input.event_type ?? "edition",
        created_by: uid,
      } as never);
      if (error) throw error;
      await supabase.from("rapports_techniques").update({ version_courante: nextV, editor_html: input.editor_html } as never).eq("id", input.rapportId);
      return { version: nextV };
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["rapport_versions", v.rapportId] });
      qc.invalidateQueries({ queryKey: ["rapports_techniques", v.rapportId] });
    },
  });
}

export function useRestoreVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ rapportId, version }: { rapportId: string; version: RapportVersion }) => {
      await supabase.from("rapports_techniques").update({
        editor_html: version.editor_html,
        contenu_rapport: version.contenu as never,
      } as never).eq("id", rapportId);
      const { data: u } = await supabase.auth.getUser();
      const { data: last } = await supabase.from("rapport_versions").select("version").eq("rapport_id", rapportId).order("version", { ascending: false }).limit(1).maybeSingle();
      const nextV = ((last?.version as number | undefined) ?? 0) + 1;
      await supabase.from("rapport_versions").insert({
        rapport_id: rapportId, version: nextV, editor_html: version.editor_html,
        contenu: version.contenu as never, commentaire: `Restauration de la version ${version.version}`,
        event_type: "restauration", created_by: u?.user?.id ?? null,
      } as never);
      return { version: nextV };
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["rapport_versions", v.rapportId] });
      qc.invalidateQueries({ queryKey: ["rapports_techniques", v.rapportId] });
    },
  });
}

// ---- Workflow ----
export type WorkflowAction = "soumettre" | "approuver" | "refuser" | "demander_correction" | "publier" | "archiver";

export interface WorkflowEvent {
  id: string;
  rapport_id: string;
  ancien_statut: string | null;
  nouveau_statut: string;
  action: string;
  commentaire: string | null;
  created_by: string | null;
  created_at: string;
}

export function useWorkflowEvents(rapportId?: string | null) {
  return useQuery({
    queryKey: ["rapport_workflow_events", rapportId],
    enabled: !!rapportId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rapport_workflow_events")
        .select("*")
        .eq("rapport_id", rapportId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as WorkflowEvent[];
    },
  });
}

const ACTION_TO_STATUT: Record<WorkflowAction, string> = {
  soumettre: "en_attente_validation",
  approuver: "valide",
  refuser: "refuse",
  demander_correction: "a_completer",
  publier: "archive", // publie_at renseigné + archive
  archiver: "archive",
};

export function useWorkflowTransition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { rapportId: string; ancienStatut: string; action: WorkflowAction; commentaire?: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id ?? null;
      const nouveau = ACTION_TO_STATUT[input.action];
      const updates: Record<string, unknown> = { statut: nouveau };
      if (input.action === "approuver") { updates.valide_at = new Date().toISOString(); updates.ingenieur_id = uid; }
      if (input.action === "refuser") { updates.refuse_at = new Date().toISOString(); updates.motif_refus = input.commentaire ?? null; }
      if (input.action === "soumettre") { updates.soumis_at = new Date().toISOString(); }
      if (input.action === "publier") { updates.publie_at = new Date().toISOString(); }
      await supabase.from("rapports_techniques").update(updates as never).eq("id", input.rapportId);
      await supabase.from("rapport_workflow_events").insert({
        rapport_id: input.rapportId, ancien_statut: input.ancienStatut, nouveau_statut: nouveau,
        action: input.action, commentaire: input.commentaire ?? null, created_by: uid,
      } as never);
      return { nouveau };
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["rapports_techniques", v.rapportId] });
      qc.invalidateQueries({ queryKey: ["rapport_workflow_events", v.rapportId] });
      qc.invalidateQueries({ queryKey: ["rapports_techniques"] });
    },
  });
}
