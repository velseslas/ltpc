import { EchantillonBetonFraisList } from "@/components/essais/EchantillonBetonFraisList";

const TempsPrise = () => {
  return (
    <EchantillonBetonFraisList
      title="Temps de Prise sur Site"
      essaiType="temps-prise"
      basePath="/essais/beton/beton-frais/temps-prise"
    />
  );
};

export default TempsPrise;
