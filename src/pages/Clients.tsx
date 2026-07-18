import { Building2, Plus, Search, User, Mail, Phone, MapPin, Loader2, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useClients } from "@/hooks/useClients";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";

const Clients = () => {
  const navigate = useNavigate();
  const { data: clients, isLoading, error } = useClients();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClients = clients?.filter(client =>
    client.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.ville?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <AppBreadcrumb 
        items={[
          { label: "Intervenants", path: "/intervenant" },
          { label: "Clients" }
        ]} 
      />

      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button 
            variant="outline" 
            size="icon"
            className="hidden md:inline-flex border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
            onClick={() => navigate("/intervenant")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Gestion des <span className="text-primary text-glow">Clients</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos clients et leurs informations
            </p>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            className="pl-10 bg-card border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          className="gap-2 gradient-primary text-primary-foreground"
          onClick={() => navigate("/intervenant/clients/nouveau")}
        >
          <Plus className="w-4 h-4" />
          Nouveau Client
        </Button>
      </div>

      {/* Cards Grid */}
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            Erreur lors du chargement des données
          </div>
        ) : filteredClients?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun client trouvé</p>
            <p className="text-sm mt-1">Ajoutez votre premier client pour commencer</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients?.map((client) => (
              <div 
                key={client.id} 
                className="rounded-xl bg-card border border-border p-6 hover:border-primary/50 transition-all duration-300"
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{client.nom}</h3>
                </div>

                {/* Details */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>{client.ice || "Non renseigné"}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="text-primary hover:underline cursor-pointer">
                      {client.email || "Non renseigné"}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{client.telephone || "Non renseigné"}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{client.ville ? `${client.ville}${client.adresse ? `, ${client.adresse}` : ''}` : "Non renseigné"}</span>
                  </div>
                </div>

                {/* Action Button */}
                <Button 
                  variant="outline" 
                  className="w-full mt-4 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50 active:bg-primary/20"
                  onClick={() => navigate(`/intervenant/clients/${client.id}`)}
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

export default Clients;
