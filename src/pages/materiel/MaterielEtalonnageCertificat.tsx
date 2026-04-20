import { useNavigate, useParams } from "react-router-dom";
import { FileText, Download, ExternalLink } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useEtalonnageMaterielItem } from "@/hooks/useMaterielLaboratoire";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function MaterielEtalonnageCertificat() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: etalonnage, isLoading } = useEtalonnageMaterielItem(id || "");

  const certificatUrl = (etalonnage as any)?.certificat_url;
  const certificatNom = (etalonnage as any)?.certificat_nom;
  const isPdf = certificatUrl?.toLowerCase().endsWith(".pdf");

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire", path: "/materiel" },
        { label: "Étalonnage Matériel", path: "/materiel/etalonnage" },
        { label: "Certificat" },
      ]} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton to="/materiel/etalonnage" />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Certificat d'étalonnage
            </h1>
            {etalonnage && (
              <p className="text-muted-foreground">
                {etalonnage.materiel_laboratoire?.nom} — {format(new Date(etalonnage.date_etalonnage), "dd MMMM yyyy", { locale: fr })}
              </p>
            )}
          </div>
        </div>
        {certificatUrl && (
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" asChild>
              <a href={certificatUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Ouvrir
              </a>
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <a href={certificatUrl} download={certificatNom || "certificat"}>
                <Download className="h-4 w-4" />
                Télécharger
              </a>
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : !certificatUrl ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun certificat disponible pour cet étalonnage</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate(`/materiel/etalonnage/${id}/modifier`)}
              >
                Téléverser un certificat
              </Button>
            </div>
          ) : isPdf ? (
            <div className="w-full" style={{ height: "calc(100vh - 280px)" }}>
              <iframe
                src={certificatUrl}
                className="w-full h-full border rounded-lg bg-white"
                title="Certificat"
              />
            </div>
          ) : (
            <div className="flex justify-center bg-muted/30 rounded-lg p-4">
              <img
                src={certificatUrl}
                alt={certificatNom || "Certificat"}
                className="max-w-full h-auto rounded shadow-sm"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
