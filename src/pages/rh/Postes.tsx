import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Users, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePostes, useDeletePoste } from "@/hooks/usePostes";
import { useToast } from "@/hooks/use-toast";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AdminOnly } from "@/components/common/AdminOnly";

export default function Postes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: postes, isLoading } = usePostes();
  const deletePoste = useDeletePoste();

  const filteredPostes = postes?.filter(
    (poste) =>
      poste.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      poste.departement?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      await deletePoste.mutateAsync(id);
      toast({
        title: "Poste supprimé",
        description: "Le poste a été supprimé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le poste.",
        variant: "destructive",
      });
    }
  };

  const formatSalary = (salary: number | null) => {
    if (!salary) return "Non défini";
    return new Intl.NumberFormat("fr-DZ").format(salary) + " DA";
  };

  return (
    <div data-essai-mobile className="space-y-6">
        <AppBreadcrumb 
          items={[
            { label: "Ressources Humaines", path: "/rh" },
            { label: "Postes" }
          ]} 
        />

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
            onClick={() => navigate("/rh")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Postes de <span className="text-primary">Travail</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestion des postes et fonctions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un poste..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => navigate("/rh/postes/nouveau")} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 h-48 bg-muted/50" />
              </Card>
            ))}
          </div>
        ) : filteredPostes?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Aucun poste trouvé</p>
              <Button
                onClick={() => navigate("/rh/postes/nouveau")}
                className="mt-4"
              >
                Créer un premier poste
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPostes?.map((poste) => (
              <Card
                key={poste.id}
                className="border-border/50 hover:border-primary/50 transition-all duration-300 group"
              >
                <CardContent className="p-6 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xl font-semibold text-foreground">
                        {poste.nom}
                      </h3>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => navigate(`/rh/postes/${poste.id}/modifier`)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AdminOnly><AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer le poste ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. Le poste "{poste.nom}"
                                sera définitivement supprimé.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(poste.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog></AdminOnly>
                      </div>
                    </div>
                    <p className="text-sm text-primary">
                      {poste.departement || "Non assigné"}
                    </p>
                  </div>

                  {poste.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {poste.description}
                    </p>
                  )}

                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">{poste.nombre_employes || 0} employés</span>
                  </div>

                  {poste.competences && poste.competences.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {poste.competences.slice(0, 3).map((comp, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-muted text-muted-foreground"
                        >
                          {comp}
                        </Badge>
                      ))}
                      {poste.competences.length > 3 && (
                        <Badge variant="secondary" className="bg-muted text-muted-foreground">
                          +{poste.competences.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">Salaire moyen</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatSalary(poste.salaire_moyen)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
}
