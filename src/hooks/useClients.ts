import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { getRepository, getRepositoryForTable } from "@/lib/repositories";
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
        const { data } = await getRepository("clients").list();
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
  return useQuery({
    queryKey: ["clients", id],
    queryFn: async () => (await clientsRepo.getById(id)).data,
    enabled: !!id,
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
