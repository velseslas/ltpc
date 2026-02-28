import { EchantillonGeotechniqueList } from "@/components/essais/EchantillonGeotechniqueList";

const Sondage = () => (
  <EchantillonGeotechniqueList
    title="Sondage Carotté"
    essaiType="sondage"
    basePath="/essais/geotechnique/in-situ/sondage"
    backPath="/essais/geotechnique/in-situ"
    breadcrumbItems={[
      { label: "Géotechnique", path: "/essais/geotechnique" },
      { label: "In-Situ", path: "/essais/geotechnique/in-situ" },
      { label: "Sondage" }
    ]}
  />
);

export default Sondage;
