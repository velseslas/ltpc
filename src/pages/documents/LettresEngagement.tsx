import { FileSignature } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLettresEngagement } from "@/hooks/useDocuments";
import DocumentListPage from "./DocumentListPage";

const LettresEngagement = () => {
  const navigate = useNavigate();

  return (
    <DocumentListPage
      title="Lettres d'engagement"
      icon={FileSignature}
      iconColor="text-blue-500"
      useHook={useLettresEngagement}
      extraFields="engagement"
      extraColumns={[
        {
          header: "Montant",
          render: (item: any) =>
            item.montant ? `${Number(item.montant).toLocaleString("fr-DZ")} DA` : "—",
        },
      ]}
      onItemClick={(item) => navigate(`/documents/lettres-engagement/${item.id}`)}
    />
  );
};

export default LettresEngagement;
