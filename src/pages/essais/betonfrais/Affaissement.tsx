import { EchantillonBetonFraisList } from "@/components/essais/EchantillonBetonFraisList";

const Affaissement = () => {
  return (
    <EchantillonBetonFraisList
      title="Essai d'Affaissement"
      essaiType="affaissement"
      basePath="/essais/beton/beton-frais/affaissement"
    />
  );
};

export default Affaissement;
