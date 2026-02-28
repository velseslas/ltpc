import { FileSignature } from "lucide-react";
import { useLettresEngagement } from "@/hooks/useDocuments";
import DocumentListPage from "./DocumentListPage";

const LettresEngagement = () => (
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
  />
);

export default LettresEngagement;
