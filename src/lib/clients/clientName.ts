import { supabase } from "@/integrations/supabase/client";

/**
 * Récupère le nom d'un client même pour les rôles non privilégiés (techniciens),
 * qui n'ont pas d'accès direct à la table `clients` : on passe alors par la
 * fonction sécurisée `clients_scoped()` (identité uniquement, sans données sensibles).
 */
export async function resolveClientNom(clientId?: string | null): Promise<string | null> {
  if (!clientId) return null;
  try {
    const { data, error } = await supabase.rpc("clients_scoped");
    if (error) return null;
    const found = (data as Array<{ id: string; nom: string }> | null)?.find((c) => c.id === clientId);
    return found?.nom ?? null;
  } catch {
    return null;
  }
}
