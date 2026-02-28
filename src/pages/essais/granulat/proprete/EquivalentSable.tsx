import { EchantillonGranulatList } from "@/components/essais/EchantillonGranulatList";

const EquivalentSable = () => {
  return (
    <EchantillonGranulatList
      title="Équivalent de Sable"
      essaiType="equivalent-sable"
      basePath="/essais/granulat/proprete/equivalent-sable"
      backPath="/essais/granulat/proprete"
      breadcrumbItems={[
        { label: "Granulat", path: "/essais/granulat" },
        { label: "Propreté", path: "/essais/granulat/proprete" },
        { label: "Équivalent de Sable" }
      ]}
    />
  );
};

export default EquivalentSable;
