import { EchantillonGranulatList } from "@/components/essais/EchantillonGranulatList";

const Ecrasement = () => {
  return (
    <EchantillonGranulatList
      title="Essai de Résistance à l'Écrasement"
      essaiType="ecrasement"
      basePath="/essais/granulat/mecaniques/ecrasement"
      backPath="/essais/granulat/mecaniques"
      breadcrumbItems={[
        { label: "Granulat", path: "/essais/granulat" },
        { label: "Mécaniques", path: "/essais/granulat/mecaniques" },
        { label: "Écrasement" }
      ]}
    />
  );
};

export default Ecrasement;
