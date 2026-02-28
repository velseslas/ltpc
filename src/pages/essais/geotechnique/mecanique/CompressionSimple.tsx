import { EchantillonGeotechniqueList } from "@/components/essais/EchantillonGeotechniqueList";

const CompressionSimple = () => (
  <EchantillonGeotechniqueList
    title="Compression Simple"
    essaiType="compression-simple"
    basePath="/essais/geotechnique/mecanique/compression-simple"
    backPath="/essais/geotechnique/mecanique"
    breadcrumbItems={[
      { label: "Géotechnique", path: "/essais/geotechnique" },
      { label: "Mécaniques", path: "/essais/geotechnique/mecanique" },
      { label: "Compression Simple" }
    ]}
  />
);

export default CompressionSimple;
