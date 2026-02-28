import { FolderOpen } from "lucide-react";
import { useDossierAdministratif } from "@/hooks/useDocuments";
import DocumentListPage from "./DocumentListPage";

const DossierAdministratif = () => (
  <DocumentListPage
    title="Dossier administratif"
    icon={FolderOpen}
    iconColor="text-teal-500"
    useHook={useDossierAdministratif}
  />
);

export default DossierAdministratif;
