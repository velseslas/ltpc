import { EchantillonGeotechniqueList } from "@/components/essais/EchantillonGeotechniqueList";

const DensitePlace = () => (
  <EchantillonGeotechniqueList
    title="Densité en Place"
    essaiType="densite-place"
    basePath="/essais/geotechnique/compactage/densite-place"
    backPath="/essais/geotechnique/compactage"
    breadcrumbItems={[
      { label: "Géotechnique", path: "/essais/geotechnique" },
      { label: "Compactage", path: "/essais/geotechnique/compactage" },
      { label: "Densité en Place" }
    ]}
  />
);

export default DensitePlace;
