import { EchantillonGeotechniqueList } from "@/components/essais/EchantillonGeotechniqueList";

const Pressiometre = () => (
  <EchantillonGeotechniqueList
    title="Essai Pressiométrique"
    essaiType="pressiometre"
    basePath="/essais/geotechnique/in-situ/pressiometre"
    backPath="/essais/geotechnique/in-situ"
    breadcrumbItems={[
      { label: "Géotechnique", path: "/essais/geotechnique" },
      { label: "In-Situ", path: "/essais/geotechnique/in-situ" },
      { label: "Pressiomètre" }
    ]}
  />
);

export default Pressiometre;
