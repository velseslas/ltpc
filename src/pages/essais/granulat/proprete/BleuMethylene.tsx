import { EchantillonGranulatList } from "@/components/essais/EchantillonGranulatList";

const BleuMethylene = () => {
  return (
    <EchantillonGranulatList
      title="Essai au Bleu de Méthylène"
      essaiType="bleu-methylene"
      basePath="/essais/granulat/proprete/bleu-methylene"
      backPath="/essais/granulat/proprete"
      breadcrumbItems={[
        { label: "Granulat", path: "/essais/granulat" },
        { label: "Propreté", path: "/essais/granulat/proprete" },
        { label: "Bleu de Méthylène" }
      ]}
    />
  );
};

export default BleuMethylene;
