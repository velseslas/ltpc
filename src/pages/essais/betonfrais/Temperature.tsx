import { EchantillonBetonFraisList } from "@/components/essais/EchantillonBetonFraisList";

const Temperature = () => {
  return (
    <EchantillonBetonFraisList
      title="Essai de Température"
      essaiType="temperature"
      basePath="/essais/beton/beton-frais/temperature"
    />
  );
};

export default Temperature;
