import { EchantillonGranulatList } from "@/components/essais/EchantillonGranulatList";

const TeneurEau = () => {
  return (
    <EchantillonGranulatList
      title="Teneur en Eau"
      essaiType="teneur-eau"
      basePath="/essais/granulat/physiques/teneur-eau"
      backPath="/essais/granulat/physiques"
      breadcrumbItems={[
        { label: "Granulat", path: "/essais/granulat" },
        { label: "Physiques", path: "/essais/granulat/physiques" },
        { label: "Teneur en Eau" }
      ]}
    />
  );
};

export default TeneurEau;
