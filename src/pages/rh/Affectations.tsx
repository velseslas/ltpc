import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Printer, 
  Download, 
  Mail, 
  Building2, 
  MapPin, 
  Users, 
  Eye,
  Calendar,
  ArrowLeft
} from "lucide-react";
import { useIntervenants } from "@/hooks/useIntervenants";
import { useAffectations } from "@/hooks/useAffectations";
import { useClients } from "@/hooks/useClients";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";

export default function Affectations() {
  const navigate = useNavigate();
  const { data: intervenants, isLoading: loadingIntervenants } = useIntervenants();
  const { data: affectations, isLoading: loadingAffectations } = useAffectations();
  const { data: clients } = useClients();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [specialiteFilter, setSpecialiteFilter] = useState<string>("all");

  // Get unique specialties
  const specialites = useMemo(() => {
    if (!intervenants) return [];
    const specs = intervenants
      .map(i => i.specialite)
      .filter((s): s is string => !!s);
    return [...new Set(specs)];
  }, [intervenants]);

  // Filter intervenants
  const filteredIntervenants = useMemo(() => {
    if (!intervenants) return [];
    return intervenants.filter(intervenant => {
      if (statusFilter !== "all" && intervenant.statut !== statusFilter) return false;
      if (specialiteFilter !== "all" && intervenant.specialite !== specialiteFilter) return false;
      return true;
    });
  }, [intervenants, statusFilter, specialiteFilter]);

  // Get affectations count per intervenant
  const getAffectationsCount = (intervenantId: string) => {
    if (!affectations) return 0;
    return affectations.filter(a => 
      a.intervenant_id === intervenantId && a.statut === "en_cours"
    ).length;
  };

  // Get intervenant status badge
  const getStatusBadge = (statut: string, affCount: number) => {
    if (affCount > 0) {
      return <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">Affecté</Badge>;
    }
    if (statut === "active") {
      return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">Disponible</Badge>;
    }
    return <Badge variant="outline" className="bg-muted text-muted-foreground">Inactif</Badge>;
  };

  // Group affectations by client
  const affectationsByClient = useMemo(() => {
    if (!affectations || !clients) return [];
    
    const grouped = clients.map(client => {
      const clientAffectations = affectations.filter(a => a.client_id === client.id);
      return {
        client,
        affectations: clientAffectations,
      };
    }).filter(g => g.affectations.length > 0);

    return grouped;
  }, [affectations, clients]);

  if (loadingIntervenants || loadingAffectations) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <AppBreadcrumb 
          items={[
            { label: "Ressources Humaines", path: "/rh" },
            { label: "Affectations" }
          ]} 
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
              onClick={() => navigate("/rh")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-semibold text-foreground">
              Affectations des Techniciens
            </h1>
          </div>
          <Button onClick={() => navigate("/rh/affectations/nouveau")}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Affectation
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="mission">En mission</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>

              <Select value={specialiteFilter} onValueChange={setSpecialiteFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Toutes les spécialités" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les spécialités</SelectItem>
                  {specialites.map(spec => (
                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex-1" />

              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Courrier
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Technicians Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIntervenants.map(intervenant => {
            const affCount = getAffectationsCount(intervenant.id);
            return (
              <Card key={intervenant.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {intervenant.prenom} {intervenant.nom.toUpperCase()}
                      </h3>
                      <p className="text-sm text-primary">{intervenant.role}</p>
                    </div>
                    {getStatusBadge(intervenant.statut, affCount)}
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground mb-4">
                    <p>Spécialité</p>
                    <p className="text-foreground font-medium">
                      {intervenant.specialite || "Non définie"}
                    </p>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground mb-4">
                    <p>Affectations actives</p>
                    <p className="text-primary font-medium">
                      {affCount} chantier(s)
                    </p>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                    onClick={() => navigate(`/rh/techniciens/${intervenant.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir les détails
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Affectations by Client */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Affectations par Client
          </h2>

          {affectationsByClient.map(({ client, affectations: clientAffectations }) => (
            <Card key={client.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{client.nom}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Contact: {client.contact || "N/A"} • {client.ville || "N/A"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {clientAffectations.map(affectation => (
                  <div 
                    key={affectation.id}
                    className="bg-muted/50 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <h4 className="font-medium text-foreground">
                        {(affectation as any).chantier?.nom || "Chantier inconnu"}
                      </h4>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {(affectation as any).chantier?.ville || "N/A"}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-3 w-3" />
                        Technicien: {(affectation as any).intervenant?.prenom} {(affectation as any).intervenant?.nom?.toUpperCase()}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge 
                        variant="outline" 
                        className={
                          affectation.statut === "en_cours" 
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {affectation.statut === "en_cours" ? "En cours" : affectation.statut}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Affecté depuis le {affectation.date_debut ? format(new Date(affectation.date_debut), "dd/MM/yyyy", { locale: fr }) : "N/A"}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {affectationsByClient.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucune affectation trouvée
              </CardContent>
            </Card>
          )}
        </div>
    </div>
  );
}
