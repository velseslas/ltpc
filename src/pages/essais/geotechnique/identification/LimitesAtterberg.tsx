import { EchantillonGeotechniqueList } from "@/components/essais/EchantillonGeotechniqueList";

const LimitesAtterberg = () => (
  <EchantillonGeotechniqueList
    title="Limites d'Atterberg"
    essaiType="limites-atterberg"
    basePath="/essais/geotechnique/identification/limites-atterberg"
    backPath="/essais/geotechnique/identification"
    breadcrumbItems={[
      { label: "Géotechnique", path: "/essais/geotechnique" },
      { label: "Identification", path: "/essais/geotechnique/identification" },
      { label: "Limites d'Atterberg" }
    ]}
  />
);

export default LimitesAtterberg;
