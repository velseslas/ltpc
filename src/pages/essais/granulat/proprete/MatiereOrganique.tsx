import { EchantillonGranulatList } from "@/components/essais/EchantillonGranulatList";

const MatiereOrganique = () => {
  return (
    <EchantillonGranulatList
      title="Teneur en Matière Organique"
      essaiType="matiere-organique"
      basePath="/essais/granulat/proprete/matiere-organique"
      backPath="/essais/granulat/proprete"
      breadcrumbItems={[
        { label: "Granulat", path: "/essais/granulat" },
        { label: "Propreté", path: "/essais/granulat/proprete" },
        { label: "Matière Organique" }
      ]}
    />
  );
};

export default MatiereOrganique;
