import { EchantillonGeotechniqueList } from "@/components/essais/EchantillonGeotechniqueList";

const ProctorModifie = () => (
  <EchantillonGeotechniqueList
    title="Essai Proctor Modifié"
    essaiType="proctor-modifie"
    basePath="/essais/geotechnique/compactage/proctor-modifie"
    backPath="/essais/geotechnique/compactage"
    breadcrumbItems={[
      { label: "Géotechnique", path: "/essais/geotechnique" },
      { label: "Compactage", path: "/essais/geotechnique/compactage" },
      { label: "Proctor Modifié" }
    ]}
  />
);

export default ProctorModifie;
