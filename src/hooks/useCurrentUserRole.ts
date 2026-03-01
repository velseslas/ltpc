import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { AppRole } from "@/hooks/useRolesPermissions";

export function useCurrentUserRole() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["current_user_role", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase.rpc("get_user_role", {
        _user_id: user.id,
      });
      if (error) throw error;
      return data as AppRole | null;
    },
    enabled: !!user?.id,
  });
}
