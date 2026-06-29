import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { BackButton } from "@/components/common/BackButton";
import { FileMinus } from "lucide-react";

export default function MaterielDecharge() {
  return (
    <div className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: "Matériel Laboratoire", path: "/materiel" },
          { label: "Décharge Matériels" },
        ]}
      />

      <div className="flex items-center gap-4">
        <BackButton to="/materiel" />
        <div>
          <h1 className="text-2xl font-bold">Décharge Matériels</h1>
          <p className="text-muted-foreground">Gestion des décharges de matériel</p>
        </div>
      </div>

      <div className="border rounded-lg p-12 text-center text-muted-foreground">
        <FileMinus className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Module à venir</p>
      </div>
    </div>
  );
}
