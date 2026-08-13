import { Building, Plus, Search, ArrowLeft, MapPin, Phone, Mail, User, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCentralesBeton } from "@/hooks/useCentralesBeton";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { WilayaCard } from "@/components/laboratoires-mobiles/WilayaCard";
import { wilayas } from "@/data/wilayas";

const NON_RENSEIGNEE = "Non renseignée";

const CentraleBeton = () => {
  const navigate = useNavigate();
  const { data: centrales, isLoading, error } = useCentralesBeton();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWilaya, setSelectedWilaya] = useState<string | null>(null);

  const wilayasWithCentrales = useMemo(() => {
    const counts = new Map<string, number>();
    (centrales || []).forEach((c) => {
      const key = c.ville && c.ville.trim() ? c.ville.trim() : NON_RENSEIGNEE;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    const ordered = wilayas
      .filter((w) => counts.has(w.nom))
      .map((w) => ({ code: w.code, nom: w.nom, count: counts.get(w.nom) || 0 }));
    const extras = Array.from(counts.keys())
      .filter((k) => !wilayas.some((w) => w.nom === k))
      .map((k) => ({ code: k, nom: k, count: counts.get(k) || 0 }));
    return [...ordered, ...extras];
  }, [centrales]);

  const maxCount = useMemo(
    () => Math.max(...wilayasWithCentrales.map((w) => w.count), 1),
    [wilayasWithCentrales]
  );

  const filtered = centrales?.filter((item) => {
    const key = item.ville && item.ville.trim() ? item.ville.trim() : NON_RENSEIGNEE;
    if (selectedWilaya && key !== selectedWilaya) return false;
    const term = searchTerm.toLowerCase();
    return (
      item.nom.toLowerCase().includes(term) ||
      item.ville?.toLowerCase().includes(term)
    );
  });

  return (
    <>
      <AppBreadcrumb items={[
        { label: "Intervenants", path: "/intervenant" },
        { label: "Producteurs", path: "/intervenant/producteurs" },
        { label: "Centrales à béton", path: selectedWilaya ? "/intervenant/producteurs/centrale" : undefined },
        ...(selectedWilaya ? [{ label: selectedWilaya }] : []),
      ]} />

       <div className="mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => (selectedWilaya ? setSelectedWilaya(null) : navigate("/intervenant/producteurs"))}
            className="shrink-0 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Gestion des <span className="text-primary text-glow">Centrales à béton</span>
          </h1>
        </div>
        <p className="text-muted-foreground mt-2">
          {selectedWilaya ? `Centrales de la wilaya de ${selectedWilaya}` : "Sélectionnez une wilaya pour voir ses centrales"}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une centrale..."
            className="pl-10 bg-card border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          className="gap-2 gradient-primary text-primary-foreground"
          onClick={() => navigate("/intervenant/producteurs/centrale/nouveau")}
        >
          <Plus className="hidden md:inline-block w-4 h-4" />
          Nouvelle Centrale
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
        ) : !selectedWilaya && !searchTerm ? (
          wilayasWithCentrales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune centrale à béton trouvée</p>
              <p className="text-sm mt-1">Ajoutez votre première centrale pour commencer</p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {wilayasWithCentrales.map((w, index) => (
                <WilayaCard
                  key={w.code}
                  nom={w.nom}
                  chantiersCount={w.count}
                  maxChantiers={maxCount}
                  colorIndex={index}
                  label="Centrales"
                  onClick={() => setSelectedWilaya(w.nom)}
                />
              ))}
            </div>
          )
        ) : filtered?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucune centrale à béton trouvée</p>
            <p className="text-sm mt-1">Ajoutez votre première centrale pour commencer</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered?.map((item) => (
              <div 
                key={item.id} 
                className="rounded-xl bg-card border border-border p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Building className="w-5 h-5 text-green-400" />
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
                  onClick={() => navigate(`/intervenant/producteurs/centrale/${item.id}`)}
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

export default CentraleBeton;
