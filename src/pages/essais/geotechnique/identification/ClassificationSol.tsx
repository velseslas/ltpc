import { EchantillonGeotechniqueList } from "@/components/essais/EchantillonGeotechniqueList";

const ClassificationSol = () => (
  <EchantillonGeotechniqueList
    title="Classification des Sols"
    essaiType="classification-sol"
    basePath="/essais/geotechnique/identification/classification-sol"
    backPath="/essais/geotechnique/identification"
    breadcrumbItems={[
      { label: "Géotechnique", path: "/essais/geotechnique" },
      { label: "Identification", path: "/essais/geotechnique/identification" },
      { label: "Classification" }
    ]}
  />
);

export default ClassificationSol;
