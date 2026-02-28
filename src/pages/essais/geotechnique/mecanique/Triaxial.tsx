import { EchantillonGeotechniqueList } from "@/components/essais/EchantillonGeotechniqueList";

const Triaxial = () => (
  <EchantillonGeotechniqueList
    title="Essai Triaxial"
    essaiType="triaxial"
    basePath="/essais/geotechnique/mecanique/triaxial"
    backPath="/essais/geotechnique/mecanique"
    breadcrumbItems={[
      { label: "Géotechnique", path: "/essais/geotechnique" },
      { label: "Mécaniques", path: "/essais/geotechnique/mecanique" },
      { label: "Triaxial" }
    ]}
  />
);

export default Triaxial;
