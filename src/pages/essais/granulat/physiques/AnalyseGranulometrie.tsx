import { EchantillonGranulatList } from "@/components/essais/EchantillonGranulatList";

const AnalyseGranulometrie = () => {
  return (
    <EchantillonGranulatList
      title="Analyse Granulométrique"
      essaiType="granulometrie"
      basePath="/essais/granulat/physiques/granulometrie"
      backPath="/essais/granulat/physiques"
      breadcrumbItems={[
        { label: "Granulat", path: "/essais/granulat" },
        { label: "Physiques", path: "/essais/granulat/physiques" },
        { label: "Granulométrie" }
      ]}
    />
  );
};

export default AnalyseGranulometrie;
