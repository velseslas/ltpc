import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, ClipboardEdit, FileBarChart, Loader2 } from "lucide-react";
import { useEchantillonCarottage } from "@/hooks/useEchantillonsCarottage";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";

const CarottageDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: echantillon, isLoading } = useEchantillonCarottage(id || "");

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!echantillon) {
    return <div className="text-center py-12 text-muted-foreground">Échantillon non trouvé</div>;
  }

  const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="flex justify-between py-2 border-b border-border/50">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-foreground font-medium text-sm">{value || "-"}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb
        items={[
          { label: "Béton", path: "/essais/beton" },
          { label: "Destructif", path: "/essais/beton/destructif" },
          { label: "Carottage", path: "/essais/beton/destructif/carottage" },
          { label: `CR-${String(echantillon.numero).padStart(3, "0")}` },
        ]}
      />

      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/essais/beton/destructif/carottage")}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Carottage <span className="text-primary">CR-{String(echantillon.numero).padStart(3, "0")}</span>
            </h1>
            <p className="text-muted-foreground mt-1">Détails de l'échantillon</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/essais/beton/destructif/carottage/${id}/saisie`)}>
            <ClipboardEdit className="h-4 w-4 mr-1" /> Saisie
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/essais/beton/destructif/carottage/${id}/rapport`)}>
            <FileBarChart className="h-4 w-4 mr-1" /> Rapport
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/essais/beton/destructif/carottage/${id}/modifier`)}>
            <Pencil className="h-4 w-4 mr-1" /> Modifier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6 space-y-1">
          <h2 className="text-lg font-semibold mb-3">Identification</h2>
          <InfoRow label="Client" value={echantillon.clients?.nom} />
          <InfoRow label="Chantier" value={echantillon.chantiers?.nom} />
          <InfoRow label="Opérateur" value={echantillon.intervenants ? `${echantillon.intervenants.nom} ${echantillon.intervenants.prenom || ""}` : null} />
          <InfoRow label="Date de prélèvement" value={format(new Date(echantillon.date_prelevement), "dd/MM/yyyy", { locale: fr })} />
          <InfoRow label="Ouvrage" value={echantillon.ouvrage} />
          <InfoRow label="Partie d'ouvrage" value={echantillon.partie_ouvrage} />
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-1">
          <h2 className="text-lg font-semibold mb-3">Caractéristiques</h2>
          <InfoRow label="Localisation" value={echantillon.localisation} />
          <InfoRow label="Diamètre" value={echantillon.diametre_carotte ? `Ø ${echantillon.diametre_carotte} mm` : null} />
          <InfoRow label="Longueur" value={echantillon.longueur_carotte ? `${echantillon.longueur_carotte} mm` : null} />
          <InfoRow label="Direction" value={echantillon.direction_carottage} />
          <InfoRow label="Présence d'armatures" value={echantillon.presence_armatures ? "Oui" : "Non"} />
          <InfoRow label="État de surface" value={echantillon.etat_surface} />
          <InfoRow label="Classe de résistance" value={echantillon.classe_resistance} />
        </div>

        {echantillon.observations && (
          <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-3">Observations</h2>
            <p className="text-foreground text-sm">{echantillon.observations}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarottageDetail;
