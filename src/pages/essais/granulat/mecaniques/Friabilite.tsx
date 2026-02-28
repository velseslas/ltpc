import { EchantillonGranulatList } from "@/components/essais/EchantillonGranulatList";

const Friabilite = () => {
  return (
    <EchantillonGranulatList
      title="Essai de Friabilité"
      essaiType="friabilite"
      basePath="/essais/granulat/mecaniques/friabilite"
      backPath="/essais/granulat/mecaniques"
      breadcrumbItems={[
        { label: "Granulat", path: "/essais/granulat" },
        { label: "Mécaniques", path: "/essais/granulat/mecaniques" },
        { label: "Friabilité" }
      ]}
    />
  );
};

export default Friabilite;
