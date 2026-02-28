import { EchantillonGranulatList } from "@/components/essais/EchantillonGranulatList";

const MasseVolumique = () => {
  return (
    <EchantillonGranulatList
      title="Masse Volumique"
      essaiType="masse-volumique"
      basePath="/essais/granulat/physiques/masse-volumique"
      backPath="/essais/granulat/physiques"
      breadcrumbItems={[
        { label: "Granulat", path: "/essais/granulat" },
        { label: "Physiques", path: "/essais/granulat/physiques" },
        { label: "Masse Volumique" }
      ]}
    />
  );
};

export default MasseVolumique;
