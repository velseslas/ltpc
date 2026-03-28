import { useNavigate, useParams } from "react-router-dom";
import { Phone, Mail, MapPin, HardHat, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { useMaitreOeuvre } from "@/hooks/useMaitresOeuvre";

export default function MaitreOeuvreDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: moe, isLoading } = useMaitreOeuvre(id);

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-8 w-64" /><Skeleton className="h-48 w-full" /></div>;
  if (!moe) return <div className="text-center py-12 text-muted-foreground">Maître d'œuvre non trouvé</div>;

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Intervenants", path: "/intervenant" },
        { label: "Maîtres d'œuvre", path: "/intervenant/maitres-oeuvre" },
        { label: moe.nom },
      ]} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton to="/intervenant/maitres-oeuvre" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">{moe.nom}</h1>
            <p className="text-muted-foreground">{moe.specialite || "Maître d'œuvre"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={moe.statut === "actif" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}>
            {moe.statut === "actif" ? "Actif" : "Inactif"}
          </Badge>
          <Button variant="outline" className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50" onClick={() => navigate(`/intervenant/maitres-oeuvre/${id}/modifier`)}>
            <Pencil className="h-4 w-4 mr-2" />Modifier
          </Button>
        </div>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader><CardTitle className="flex items-center gap-2"><HardHat className="h-5 w-5" />Informations</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {moe.contact && <div><p className="text-sm text-muted-foreground">Contact</p><p className="font-medium text-foreground">{moe.contact}</p></div>}
            {moe.telephone && <div><p className="text-sm text-muted-foreground">Téléphone</p><p className="font-medium text-foreground flex items-center gap-2"><Phone className="h-4 w-4" />{moe.telephone}</p></div>}
            {moe.email && <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium text-foreground flex items-center gap-2"><Mail className="h-4 w-4" />{moe.email}</p></div>}
            {moe.adresse && <div><p className="text-sm text-muted-foreground">Adresse</p><p className="font-medium text-foreground">{moe.adresse}</p></div>}
            {moe.ville && <div><p className="text-sm text-muted-foreground">Wilaya</p><p className="font-medium text-foreground flex items-center gap-2"><MapPin className="h-4 w-4" />{moe.ville}</p></div>}
            {moe.specialite && <div><p className="text-sm text-muted-foreground">Spécialité</p><p className="font-medium text-foreground">{moe.specialite}</p></div>}
            {moe.observations && <div className="md:col-span-3"><p className="text-sm text-muted-foreground">Observations</p><p className="font-medium text-foreground">{moe.observations}</p></div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
