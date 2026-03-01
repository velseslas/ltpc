import { Factory, Plus, Search, ArrowLeft, MapPin, Phone, Mail, User, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCimenteries } from "@/hooks/useCimenteries";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";

const Cimenterie = () => {
  const navigate = useNavigate();
  const { data: cimenteries, isLoading, error } = useCimenteries();
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = cimenteries?.filter(item =>
    item.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ville?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <AppBreadcrumb items={[
        { label: "Intervenants", path: "/intervenant" },
        { label: "Producteurs", path: "/intervenant/producteurs" },
        { label: "Cimenteries" }
      ]} />

       <div className="mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/intervenant/producteurs")} className="shrink-0 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Gestion des <span className="text-primary text-glow">Cimenteries</span>
          </h1>
        </div>
        <p className="text-muted-foreground mt-2">
          Gérez vos producteurs de ciment
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une cimenterie..."
            className="pl-10 bg-card border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          className="gap-2 gradient-primary text-primary-foreground"
          onClick={() => navigate("/intervenant/producteurs/cimenterie/nouveau")}
        >
          <Plus className="w-4 h-4" />
          Nouvelle Cimenterie
        </Button>
      </div>

      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            Erreur lors du chargement des données
          </div>
        ) : filtered?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Factory className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucune cimenterie trouvée</p>
            <p className="text-sm mt-1">Ajoutez votre première cimenterie pour commencer</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered?.map((item) => (
              <div 
                key={item.id} 
                className="rounded-xl bg-card border border-border p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-500/20 flex items-center justify-center">
                    <Factory className="w-5 h-5 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{item.nom}</h3>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>{item.contact || "Non renseigné"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="text-primary hover:underline cursor-pointer">{item.email || "Non renseigné"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{item.telephone || "Non renseigné"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{item.ville || "Non renseigné"}</span>
                  </div>
                </div>

                <div className="mt-4 text-sm text-muted-foreground">
                  Capacité: {item.capacite || "Non renseignée"}
                </div>

                <Button 
                  variant="outline" 
                  className="w-full mt-4 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                  onClick={() => navigate(`/intervenant/producteurs/cimenterie/${item.id}`)}
                >
                  Voir les détails
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Cimenterie;
