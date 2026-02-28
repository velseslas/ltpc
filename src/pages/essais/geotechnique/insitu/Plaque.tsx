import { EchantillonGeotechniqueList } from "@/components/essais/EchantillonGeotechniqueList";

const Plaque = () => (
  <EchantillonGeotechniqueList
    title="Essai de Plaque"
    essaiType="plaque"
    basePath="/essais/geotechnique/in-situ/plaque"
    backPath="/essais/geotechnique/in-situ"
    breadcrumbItems={[
      { label: "Géotechnique", path: "/essais/geotechnique" },
      { label: "In-Situ", path: "/essais/geotechnique/in-situ" },
      { label: "Plaque" }
    ]}
  />
);

export default Plaque;
