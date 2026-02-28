import { EchantillonGeotechniqueList } from "@/components/essais/EchantillonGeotechniqueList";

const Penetrometre = () => (
  <EchantillonGeotechniqueList
    title="Pénétromètre Dynamique"
    essaiType="penetrometre"
    basePath="/essais/geotechnique/in-situ/penetrometre"
    backPath="/essais/geotechnique/in-situ"
    breadcrumbItems={[
      { label: "Géotechnique", path: "/essais/geotechnique" },
      { label: "In-Situ", path: "/essais/geotechnique/in-situ" },
      { label: "Pénétromètre" }
    ]}
  />
);

export default Penetrometre;
