import { useNavigate, useParams } from "react-router-dom";
import { Phone, Mail, MapPin, Landmark, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { useMaitreOuvrage } from "@/hooks/useMaitresOuvrage";

export default function MaitreOuvrageDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: moa, isLoading } = useMaitreOuvrage(id);

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-8 w-64" /><Skeleton className="h-48 w-full" /></div>;
  if (!moa) return <div className="text-center py-12 text-muted-foreground">Maître de l'ouvrage non trouvé</div>;

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Intervenants", path: "/intervenant" },
        { label: "Maîtres de l'ouvrage", path: "/intervenant/maitres-ouvrage" },
        { label: moa.nom },
      ]} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton to="/intervenant/maitres-ouvrage" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">{moa.nom}</h1>
            <p className="text-muted-foreground">{moa.secteur || "Maître de l'ouvrage"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={moa.statut === "actif" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}>
            {moa.statut === "actif" ? "Actif" : "Inactif"}
          </Badge>
          <Button variant="outline" className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50" onClick={() => navigate(`/intervenant/maitres-ouvrage/${id}/modifier`)}>
            <Pencil className="h-4 w-4 mr-2" />Modifier
          </Button>
        </div>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader><CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5" />Informations</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {moa.contact && <div><p className="text-sm text-muted-foreground">Contact</p><p className="font-medium text-foreground">{moa.contact}</p></div>}
            {moa.telephone && <div><p className="text-sm text-muted-foreground">Téléphone</p><p className="font-medium text-foreground flex items-center gap-2"><Phone className="h-4 w-4" />{moa.telephone}</p></div>}
            {moa.email && <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium text-foreground flex items-center gap-2"><Mail className="h-4 w-4" />{moa.email}</p></div>}
            {moa.adresse && <div><p className="text-sm text-muted-foreground">Adresse</p><p className="font-medium text-foreground">{moa.adresse}</p></div>}
            {moa.ville && <div><p className="text-sm text-muted-foreground">Wilaya</p><p className="font-medium text-foreground flex items-center gap-2"><MapPin className="h-4 w-4" />{moa.ville}</p></div>}
            {moa.secteur && <div><p className="text-sm text-muted-foreground">Secteur d'activité</p><p className="font-medium text-foreground">{moa.secteur}</p></div>}
            {moa.observations && <div className="md:col-span-3"><p className="text-sm text-muted-foreground">Observations</p><p className="font-medium text-foreground">{moa.observations}</p></div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
