import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Trash2, Eye, Pencil, HardHat, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMaitresOeuvre, useDeleteMaitreOeuvre } from "@/hooks/useMaitresOeuvre";
import { toast } from "sonner";

export default function MaitreOeuvreListe() {
  const navigate = useNavigate();
  const { data, isLoading } = useMaitresOeuvre();
  const deleteMutation = useDeleteMaitreOeuvre();
  const [search, setSearch] = useState("");

  const filtered = data?.filter((p: any) =>
    p.nom.toLowerCase().includes(search.toLowerCase()) ||
    p.specialite?.toLowerCase().includes(search.toLowerCase()) ||
    p.ville?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Maître d'œuvre supprimé");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const getStatusBadge = (statut: string) => {
    if (statut === "actif") return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Actif</Badge>;
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Inactif</Badge>;
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[{ label: "Intervenants", path: "/intervenant" }, { label: "Maîtres d'œuvre" }]} />

      <div className="flex items-center gap-3">
        <BackButton to="/intervenant" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Maîtres d'œuvre</h1>
          <p className="text-muted-foreground">Gestion des maîtres d'œuvre (MOE)</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-11" />
        </div>
        <Button className="gap-2 h-11" onClick={() => navigate("/intervenant/maitres-oeuvre/nouveau")}>
          <Plus className="h-4 w-4" />Nouveau MOE
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-border/50"><CardContent className="p-6"><Skeleton className="h-6 w-32 mb-2" /><Skeleton className="h-4 w-48 mb-4" /><Skeleton className="h-10 w-full mt-4" /></CardContent></Card>
          ))}
        </div>
      )}

      {!isLoading && (!filtered || filtered.length === 0) && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <HardHat className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Aucun maître d'œuvre trouvé</h3>
            <p className="text-muted-foreground text-center mb-4">
              {search ? "Aucun résultat pour votre recherche." : "Commencez par ajouter un maître d'œuvre."}
            </p>
            <Button onClick={() => navigate("/intervenant/maitres-oeuvre/nouveau")}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && filtered && filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p: any) => (
            <Card key={p.id} className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-foreground">{p.nom}</h3>
                  <div className="flex items-center gap-1">
                    {getStatusBadge(p.statut)}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/intervenant/maitres-oeuvre/${p.id}/modifier`)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                            <AlertDialogDescription>Supprimer {p.nom} ? Cette action est irréversible.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(p.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>

                {p.specialite && <p className="text-sm text-primary font-medium mb-3">{p.specialite}</p>}

                <div className="space-y-2 text-sm text-muted-foreground">
                  {p.telephone && <div className="flex items-center gap-2"><Phone className="h-4 w-4" /><span>{p.telephone}</span></div>}
                  {p.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4" /><span>{p.email}</span></div>}
                  {p.ville && <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /><span>{p.ville}</span></div>}
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50" onClick={() => navigate(`/intervenant/maitres-oeuvre/${p.id}`)}>
                    <Eye className="h-4 w-4" />Détails
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
