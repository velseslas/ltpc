import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Shield, User } from "lucide-react";
import LaboratoiresMobilesAdmin from "./LaboratoiresMobilesAdmin";
import LaboratoiresMobilesTechnicien from "./LaboratoiresMobilesTechnicien";

export default function LaboratoiresMobiles() {
  const [activeView, setActiveView] = useState<"admin" | "technicien">("admin");

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <div className="flex justify-center">
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "admin" | "technicien")}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="admin" className="gap-2">
              <Shield className="h-4 w-4" />
              Vue Admin
            </TabsTrigger>
            <TabsTrigger value="technicien" className="gap-2">
              <User className="h-4 w-4" />
              Vue Technicien
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content based on selected view */}
      {activeView === "admin" ? (
        <LaboratoiresMobilesAdmin />
      ) : (
        <LaboratoiresMobilesTechnicien />
      )}
    </div>
  );
}
