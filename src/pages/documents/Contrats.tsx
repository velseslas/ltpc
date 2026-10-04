import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useContratsDocuments } from "@/hooks/useDocuments";
import DocumentListPage from "./DocumentListPage";

const Contrats = () => {
  const navigate = useNavigate();

  return (
    <DocumentListPage
      title="Contrats chantier"
      icon={FileText}
      iconColor="text-rose-500"
      useHook={useContratsDocuments}
      extraFields="contract"
      extraColumns={[
        {
          header: "Montant HT",
          render: (item: any) => {
            return item.montant_ht != null
              ? `${Number(item.montant_ht).toLocaleString("fr-DZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA`
              : "—";
          },
        },
      ]}
      onItemClick={(item) => navigate(`/documents/contrats/${item.id}`)}
    />
  );
};

export default Contrats;
