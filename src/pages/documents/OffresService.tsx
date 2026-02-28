import { Briefcase } from "lucide-react";
import { useOffresService } from "@/hooks/useDocuments";
import DocumentListPage from "./DocumentListPage";

const OffresService = () => (
  <DocumentListPage
    title="Offres de service"
    icon={Briefcase}
    iconColor="text-emerald-500"
    useHook={useOffresService}
    extraFields="service"
  />
);

export default OffresService;
