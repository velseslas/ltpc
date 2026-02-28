import { DollarSign } from "lucide-react";
import { useOffresPrix } from "@/hooks/useDocuments";
import DocumentListPage from "./DocumentListPage";

const OffresPrix = () => (
  <DocumentListPage
    title="Offres de prix"
    icon={DollarSign}
    iconColor="text-amber-500"
    useHook={useOffresPrix}
    extraFields="prix"
    extraColumns={[
      {
        header: "Montant HT",
        render: (item: any) =>
          item.montant_ht ? `${Number(item.montant_ht).toLocaleString("fr-DZ")} DA` : "—",
      },
      {
        header: "Montant TTC",
        render: (item: any) =>
          item.montant_ttc ? `${Number(item.montant_ttc).toLocaleString("fr-DZ")} DA` : "—",
      },
    ]}
  />
);

export default OffresPrix;
