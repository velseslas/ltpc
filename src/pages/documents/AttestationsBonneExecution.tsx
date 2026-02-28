import { Award } from "lucide-react";
import { useAttestationsBonneExecution } from "@/hooks/useDocuments";
import DocumentListPage from "./DocumentListPage";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const AttestationsBonneExecution = () => (
  <DocumentListPage
    title="Attestations de bonne exécution"
    icon={Award}
    iconColor="text-violet-500"
    useHook={useAttestationsBonneExecution}
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

export default AttestationsBonneExecution;
