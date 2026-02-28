import { EchantillonGranulatList } from "@/components/essais/EchantillonGranulatList";

const LosAngeles = () => {
  return (
    <EchantillonGranulatList
      title="Essai Los Angeles"
      essaiType="los-angeles"
      basePath="/essais/granulat/mecaniques/los-angeles"
      backPath="/essais/granulat/mecaniques"
      breadcrumbItems={[
        { label: "Granulat", path: "/essais/granulat" },
        { label: "Mécaniques", path: "/essais/granulat/mecaniques" },
        { label: "Los Angeles" }
      ]}
    />
  );
};

export default LosAngeles;
