import { EchantillonGeotechniqueList } from "@/components/essais/EchantillonGeotechniqueList";

const Densitometre = () => (
  <EchantillonGeotechniqueList
    title="Densitomètre à Membrane"
    essaiType="densitometre"
    basePath="/essais/geotechnique/in-situ/densitometre"
    backPath="/essais/geotechnique/in-situ"
    breadcrumbItems={[
      { label: "Géotechnique", path: "/essais/geotechnique" },
      { label: "In-Situ", path: "/essais/geotechnique/in-situ" },
      { label: "Densitomètre à Membrane" }
    ]}
  />
);

export default Densitometre;
