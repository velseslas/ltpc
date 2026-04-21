import { Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOffresService } from "@/hooks/useDocuments";
import DocumentListPage from "./DocumentListPage";

const OffresService = () => {
  const navigate = useNavigate();
  return (
    <DocumentListPage
      title="Offres de service"
      icon={Briefcase}
      iconColor="text-emerald-500"
      useHook={useOffresService}
      extraFields="service"
      onItemClick={(item) => navigate(`/documents/offres-service/${item.id}`)}
    />
  );
};

export default OffresService;
