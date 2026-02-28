import { EchantillonBetonFraisList } from "@/components/essais/EchantillonBetonFraisList";

const TeneurAir = () => {
  return (
    <EchantillonBetonFraisList
      title="Teneur en Air"
      essaiType="teneur-air"
      basePath="/essais/beton/beton-frais/teneur-air"
    />
  );
};

export default TeneurAir;
