import { EchantillonGranulatList } from "@/components/essais/EchantillonGranulatList";

const FormeGranulats = () => {
  return (
    <EchantillonGranulatList
      title="Coefficient d'Aplatissement"
      essaiType="forme-granulats"
      basePath="/essais/granulat/physiques/forme"
      backPath="/essais/granulat/physiques"
      breadcrumbItems={[
        { label: "Granulat", path: "/essais/granulat" },
        { label: "Physiques", path: "/essais/granulat/physiques" },
        { label: "Coefficient d'Aplatissement" }
      ]}
    />
  );
};

export default FormeGranulats;
