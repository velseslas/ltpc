import { EchantillonGeotechniqueList } from "@/components/essais/EchantillonGeotechniqueList";

const Oedometrique = () => (
  <EchantillonGeotechniqueList
    title="Essai Œdométrique"
    essaiType="oedometrique"
    basePath="/essais/geotechnique/mecanique/oedometrique"
    backPath="/essais/geotechnique/mecanique"
    breadcrumbItems={[
      { label: "Géotechnique", path: "/essais/geotechnique" },
      { label: "Mécaniques", path: "/essais/geotechnique/mecanique" },
      { label: "Œdométrique" }
    ]}
  />
);

export default Oedometrique;
