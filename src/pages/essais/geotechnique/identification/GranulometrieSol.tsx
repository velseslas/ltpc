import { EchantillonGeotechniqueList } from "@/components/essais/EchantillonGeotechniqueList";

const GranulometrieSol = () => (
  <EchantillonGeotechniqueList
    title="Analyse Granulométrique des Sols"
    essaiType="granulometrie-sol"
    basePath="/essais/geotechnique/identification/granulometrie-sol"
    backPath="/essais/geotechnique/identification"
    breadcrumbItems={[
      { label: "Géotechnique", path: "/essais/geotechnique" },
      { label: "Identification", path: "/essais/geotechnique/identification" },
      { label: "Granulométrie Sol" }
    ]}
  />
);

export default GranulometrieSol;
