import { Loader2 } from "lucide-react";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import LaboratoiresMobilesAdmin from "./LaboratoiresMobilesAdmin";
import LaboratoiresMobilesTechnicien from "./LaboratoiresMobilesTechnicien";

export default function LaboratoiresMobiles() {
  const { data: role, isLoading } = useCurrentUserRole();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Admin roles: super_admin, admin, manager see admin view
  // Technicien, operateur, lecteur see technicien view
  const isAdmin = role === "super_admin" || role === "admin" || role === "manager";

  return isAdmin ? <LaboratoiresMobilesAdmin /> : <LaboratoiresMobilesTechnicien />;
}
