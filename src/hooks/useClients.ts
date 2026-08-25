import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { getRepositoryForTable } from "@/lib/repositories";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";

export type Client = Tables<"clients">;
export type ClientInsert = TablesInsert<"clients">;
export type ClientUpdate = TablesUpdate<"clients">;

// Utilise la couche Repository partagée avec LTPC AI — garantit que l'écran
// « Clients » et une question « Combien de clients ? » lisent la même requête.
const clientsRepo = getRepositoryForTable<Client>("clients", {
  defaultOrder: { column: "nom", ascending: true },
});

const PRIVILEGED_ROLES = ["super_admin", "admin", "manager"];

export function useClients() {
  const { data: role, isLoading: roleLoading } = useCurrentUserRole();
  const privileged = !!role && PRIVILEGED_ROLES.includes(role);

  return useQuery({
    queryKey: ["clients", privileged ? "full" : "scoped"],
    enabled: !roleLoading,
    queryFn: async () => {
      if (privileged) {
        // Les rôles privilégiés lisent la table directement afin de conserver
        // les champs fiscaux affichés dans la liste (ICE, NIF, NIS, RIB).
        const { data } = await clientsRepo.list();
        return data as Client[];
      }
      // Les non-privilégiés (techniciens…) n'accèdent qu'à l'identité du client,
      // jamais aux données bancaires/fiscales.
      const { data, error } = await supabase.rpc("clients_scoped");
      if (error) throw error;
      return (data ?? []) as unknown as Client[];
    },
  });
}


export function useClient(id: string) {
  const { data: role, isLoading: roleLoading } = useCurrentUserRole();
  const privileged = !!role && PRIVILEGED_ROLES.includes(role);

  return useQuery({
    queryKey: ["clients", id, privileged ? "full" : "scoped"],
    queryFn: async () => {
      if (privileged) return (await clientsRepo.getById(id)).data;

      // La table contient des données fiscales et bancaires interdites aux
      // techniciens. Le détail doit donc utiliser la même fonction sécurisée
      // que la liste, puis sélectionner le client demandé côté client.
      const { data, error } = await supabase.rpc("clients_scoped");
      if (error) throw error;
      return ((data ?? []).find((client) => client.id === id) ?? null) as unknown as Client | null;
    },
    enabled: !!id && !roleLoading,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (client: ClientInsert) => {
      const { data, error } = await clientsRepo.insert(client as Partial<Client>);
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: ClientUpdate & { id: string }) => {
      const { data, error } = await clientsRepo.update(updates as Partial<Client>, { id });
      if (error) throw new Error(error);
      return data[0];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await clientsRepo.delete({ id });
      if (error) throw new Error(error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }),
  });
}
