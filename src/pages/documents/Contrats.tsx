import { FileText } from "lucide-react";
import { useContratsDocuments } from "@/hooks/useDocuments";
import DocumentListPage from "./DocumentListPage";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const Contrats = () => (
  <DocumentListPage
    title="Contrats chantier"
    icon={FileText}
    iconColor="text-rose-500"
    useHook={useContratsDocuments}
    extraFields="attestation"
    extraColumns={[
      {
        header: "Période",
        render: (item: any) => {
          const debut = item.date_debut ? format(new Date(item.date_debut), "dd/MM/yy", { locale: fr }) : "";
          const fin = item.date_fin ? format(new Date(item.date_fin), "dd/MM/yy", { locale: fr }) : "";
          return debut || fin ? `${debut} → ${fin}` : "—";
        },
      },
    ]}
  />
);

export default Contrats;
