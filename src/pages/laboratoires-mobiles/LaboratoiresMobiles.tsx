import { Loader2 } from "lucide-react";
import { usePermissionContext } from "@/hooks/usePermissionContext";
import LaboratoiresMobilesAdmin from "./LaboratoiresMobilesAdmin";
import LaboratoiresMobilesTechnicien from "./LaboratoiresMobilesTechnicien";

export default function LaboratoiresMobiles() {
  const { isAdmin, isLoading } = usePermissionContext();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only super_admin / admin / manager see all chantiers.
  // Everyone else (technicien, operateur, lecteur, unknown) sees only their assigned chantiers.
  return isAdmin ? <LaboratoiresMobilesAdmin /> : <LaboratoiresMobilesTechnicien />;
}
