import { EchantillonGeotechniqueList } from "@/components/essais/EchantillonGeotechniqueList";

const Cisaillement = () => (
  <EchantillonGeotechniqueList
    title="Cisaillement Direct"
    essaiType="cisaillement"
    basePath="/essais/geotechnique/mecanique/cisaillement"
    backPath="/essais/geotechnique/mecanique"
    breadcrumbItems={[
      { label: "Géotechnique", path: "/essais/geotechnique" },
      { label: "Mécaniques", path: "/essais/geotechnique/mecanique" },
      { label: "Cisaillement" }
    ]}
  />
);

export default Cisaillement;
