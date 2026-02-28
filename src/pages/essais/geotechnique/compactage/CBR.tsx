import { EchantillonGeotechniqueList } from "@/components/essais/EchantillonGeotechniqueList";

const CBR = () => (
  <EchantillonGeotechniqueList
    title="Essai CBR"
    essaiType="cbr"
    basePath="/essais/geotechnique/compactage/cbr"
    backPath="/essais/geotechnique/compactage"
    breadcrumbItems={[
      { label: "Géotechnique", path: "/essais/geotechnique" },
      { label: "Compactage", path: "/essais/geotechnique/compactage" },
      { label: "CBR" }
    ]}
  />
);

export default CBR;
