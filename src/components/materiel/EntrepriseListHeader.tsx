import { useEntreprise } from "@/hooks/useEntreprise";

export function EntrepriseListHeader() {
  const { data: entreprise } = useEntreprise();
  if (!entreprise?.nom) return null;
  return (
    <div className="text-center border-b border-border pb-4">
      <h2 className="text-lg font-bold uppercase tracking-wide">{entreprise.nom}</h2>
      {entreprise.numero_autorisation && (
        <p className="text-xs text-muted-foreground mt-0.5">
          Agrément N° {entreprise.numero_autorisation}
        </p>
      )}
      {(entreprise.siege_social || entreprise.annexe) && (
        <p className="text-xs text-muted-foreground">
          {[entreprise.siege_social, entreprise.annexe].filter(Boolean).join(" — ")}
        </p>
      )}
      {(entreprise.telephone || entreprise.email) && (
        <p className="text-xs text-muted-foreground">
          {[entreprise.telephone && `Tél : ${entreprise.telephone}`, entreprise.email].filter(Boolean).join(" • ")}
        </p>
      )}
    </div>
  );
}
