import { useEntreprise } from "@/hooks/useEntreprise";

interface EntrepriseHeaderProps {
  title?: string;
  subtitle?: string;
}

export function EntrepriseHeader({ title, subtitle }: EntrepriseHeaderProps) {
  const { data: entreprise } = useEntreprise();

  if (!entreprise) return null;

  return (
    <div className="border-b-2 border-foreground/20 pb-4 mb-4 px-4 pt-4 bg-background">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {entreprise.logo_url && (
            <img
              src={entreprise.logo_url}
              alt="Logo"
              className="h-20 w-20 object-contain"
              crossOrigin="anonymous"
            />
          )}
          <div>
            <h2 className="text-xl font-bold uppercase">{entreprise.nom}</h2>
            {entreprise.representant && (
              <p className="text-sm text-muted-foreground">{entreprise.representant}</p>
            )}
            {entreprise.siege_social && (
              <p className="text-xs text-muted-foreground">{entreprise.siege_social}</p>
            )}
          </div>
        </div>
        <div className="text-right text-xs space-y-0.5">
          {entreprise.telephone && <p>Tél : {entreprise.telephone}</p>}
          {entreprise.email && <p>Email : {entreprise.email}</p>}
          {entreprise.site_web && <p>Web : {entreprise.site_web}</p>}
          {entreprise.rc && <p>RC : {entreprise.rc}</p>}
          {entreprise.nif && <p>NIF : {entreprise.nif}</p>}
        </div>
      </div>
      {title && (
        <div className="text-center mt-4">
          <h1 className="text-lg font-bold uppercase">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
