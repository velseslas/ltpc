import { EchantillonGeotechniqueList } from "@/components/essais/EchantillonGeotechniqueList";

const ProctorNormal = () => (
  <EchantillonGeotechniqueList
    title="Essai Proctor Normal"
    essaiType="proctor-normal"
    basePath="/essais/geotechnique/compactage/proctor-normal"
    backPath="/essais/geotechnique/compactage"
    breadcrumbItems={[
      { label: "Géotechnique", path: "/essais/geotechnique" },
      { label: "Compactage", path: "/essais/geotechnique/compactage" },
      { label: "Proctor Normal" }
    ]}
  />
);

export default ProctorNormal;
