import { EchantillonGeotechniqueList } from "@/components/essais/EchantillonGeotechniqueList";

const TeneurEauSol = () => (
  <EchantillonGeotechniqueList
    title="Teneur en Eau des Sols"
    essaiType="teneur-eau-sol"
    basePath="/essais/geotechnique/identification/teneur-eau-sol"
    backPath="/essais/geotechnique/identification"
    breadcrumbItems={[
      { label: "Géotechnique", path: "/essais/geotechnique" },
      { label: "Identification", path: "/essais/geotechnique/identification" },
      { label: "Teneur en Eau" }
    ]}
  />
);

export default TeneurEauSol;
