import { EchantillonGranulatList } from "@/components/essais/EchantillonGranulatList";

const MicroDeval = () => {
  return (
    <EchantillonGranulatList
      title="Essai Micro-Deval"
      essaiType="micro-deval"
      basePath="/essais/granulat/mecaniques/micro-deval"
      backPath="/essais/granulat/mecaniques"
      breadcrumbItems={[
        { label: "Granulat", path: "/essais/granulat" },
        { label: "Mécaniques", path: "/essais/granulat/mecaniques" },
        { label: "Micro-Deval" }
      ]}
    />
  );
};

export default MicroDeval;
