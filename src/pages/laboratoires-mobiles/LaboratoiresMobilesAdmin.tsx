import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, MapPin, Building2, HardHat } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteLaboratoireMobile } from "@/hooks/useLaboratoiresMobiles";
import { Button } from "@/components/ui/button";
import { useLaboratoiresMobiles } from "@/hooks/useLaboratoiresMobiles";
import { useChantiers } from "@/hooks/useChantiers";
import { useClients } from "@/hooks/useClients";
import { useIntervenants } from "@/hooks/useIntervenants";
import { useEchantillonsCompression } from "@/hooks/useEchantillonsCompression";
import { wilayas } from "@/data/wilayas";
import { AdminStatsCards } from "@/components/laboratoires-mobiles/AdminStatsCards";
import { WilayaCard } from "@/components/laboratoires-mobiles/WilayaCard";
import { ClientCard } from "@/components/laboratoires-mobiles/ClientCard";
import { ChantierCard } from "@/components/laboratoires-mobiles/ChantierCard";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type NavigationLevel = "wilayas" | "clients" | "chantiers";

interface NavigationState {
  level: NavigationLevel;
  selectedWilaya?: string;
  selectedClient?: { id: string; nom: string };
}

const ITEMS_PER_PAGE = 8;

export default function LaboratoiresMobilesAdmin() {
  const navigate = useNavigate();
  const { data: labos, isLoading: labosLoading } = useLaboratoiresMobiles();
  const { data: chantiers, isLoading: chantiersLoading } = useChantiers();
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: intervenants } = useIntervenants();
  const { data: echantillonsCompression } = useEchantillonsCompression();

  const [navState, setNavState] = useState<NavigationState>({ level: "wilayas" });
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteChangierId, setDeleteChantierId] = useState<string | null>(null);
  const deleteLabo = useDeleteLaboratoireMobile();

  // Get chantiers that have laboratoires mobiles assigned
  const chantiersWithLaboMobile = useMemo(() => {
    if (!labos || !chantiers) return [];
    const laboChantierIds = new Set(
      labos
        .filter(l => l.chantier_id)
        .map(l => l.chantier_id as string)
    );
    return chantiers.filter(c => laboChantierIds.has(c.id));
  }, [labos, chantiers]);

  // Get unique wilayas that have laboratoires mobiles
  const wilayasWithLaboMobile = useMemo(() => {
    const wilayaCounts = new Map<string, number>();
    chantiersWithLaboMobile.forEach(c => {
      if (c.ville) {
        wilayaCounts.set(c.ville, (wilayaCounts.get(c.ville) || 0) + 1);
      }
    });
    return wilayas
      .filter(w => wilayaCounts.has(w.nom))
      .map(w => ({
        ...w,
        chantiersCount: wilayaCounts.get(w.nom) || 0
      }))
      .sort((a, b) => b.chantiersCount - a.chantiersCount);
  }, [chantiersWithLaboMobile]);

  const maxChantiersPerWilaya = useMemo(() => {
    return Math.max(...wilayasWithLaboMobile.map(w => w.chantiersCount), 1);
  }, [wilayasWithLaboMobile]);

  // Get clients in selected wilaya (only those with labo mobile chantiers)
  const clientsInWilaya = useMemo(() => {
    if (!clients || !navState.selectedWilaya) return [];
    const clientCounts = new Map<string, number>();
    chantiersWithLaboMobile.forEach(c => {
      if (c.ville === navState.selectedWilaya && c.client_id) {
        clientCounts.set(c.client_id, (clientCounts.get(c.client_id) || 0) + 1);
      }
    });
    return clients
      .filter(c => clientCounts.has(c.id))
      .map(c => ({
        ...c,
        chantiersCount: clientCounts.get(c.id) || 0
      }))
      .sort((a, b) => b.chantiersCount - a.chantiersCount);
  }, [chantiersWithLaboMobile, clients, navState.selectedWilaya]);

  const maxChantiersPerClient = useMemo(() => {
    return Math.max(...clientsInWilaya.map(c => c.chantiersCount), 1);
  }, [clientsInWilaya]);

  // Get chantiers with labo mobile for selected client in selected wilaya
  const chantiersForClient = useMemo(() => {
    if (!navState.selectedClient || !navState.selectedWilaya) return [];
    return chantiersWithLaboMobile.filter(c => 
      c.client_id === navState.selectedClient?.id && 
      c.ville === navState.selectedWilaya
    );
  }, [chantiersWithLaboMobile, navState.selectedClient, navState.selectedWilaya]);

  // Stats calculations
  const techniciensCount = useMemo(() => {
    return intervenants?.filter(i => i.postes?.nom?.toLowerCase().includes('technicien')).length || 0;
  }, [intervenants]);

  // Get current items for pagination
  const getCurrentItems = () => {
    let items: any[] = [];
    switch (navState.level) {
      case "wilayas":
        items = wilayasWithLaboMobile;
        break;
      case "clients":
        items = clientsInWilaya;
        break;
      case "chantiers":
        items = chantiersForClient;
        break;
    }
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return {
      items: items.slice(startIndex, endIndex),
      totalItems: items.length,
      totalPages: Math.ceil(items.length / ITEMS_PER_PAGE),
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, items.length)
    };
  };

  const paginationData = getCurrentItems();

  const handleBack = () => {
    setCurrentPage(1);
    if (navState.level === "chantiers") {
      setNavState({ level: "clients", selectedWilaya: navState.selectedWilaya });
    } else if (navState.level === "clients") {
      setNavState({ level: "wilayas" });
    }
  };

  const handleWilayaClick = (wilayaNom: string) => {
    setCurrentPage(1);
    setNavState({ level: "clients", selectedWilaya: wilayaNom });
  };

  const handleClientClick = (clientId: string, clientNom: string) => {
    setCurrentPage(1);
    setNavState({ 
      level: "chantiers", 
      selectedWilaya: navState.selectedWilaya,
      selectedClient: { id: clientId, nom: clientNom }
    });
  };

  const getTitle = () => {
    switch (navState.level) {
      case "wilayas":
        return "Wilayas - Vue Administrateur";
      case "clients":
        return `Clients - ${navState.selectedWilaya}`;
      case "chantiers":
        return `Chantiers - ${navState.selectedClient?.nom}`;
    }
  };

  const getIcon = () => {
    switch (navState.level) {
      case "wilayas":
        return <MapPin className="h-5 w-5 text-primary" />;
      case "clients":
        return <Building2 className="h-5 w-5 text-primary" />;
      case "chantiers":
        return <HardHat className="h-5 w-5 text-primary" />;
    }
  };

  if (labosLoading || chantiersLoading || clientsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {navState.level !== "wilayas" && (
            <Button variant="outline" size="sm" onClick={handleBack} className="gap-2 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              Administration - Laboratoires Chantier
            </h1>
            <p className="text-muted-foreground">
              Gestion administrative des laboratoires chantier par wilaya
            </p>
          </div>
        </div>
        <Button onClick={() => navigate("/laboratoires-mobiles/nouveau")} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau chantier
        </Button>
      </div>

      {/* Stats Cards */}
      <AdminStatsCards
        wilayasCount={wilayasWithLaboMobile.length}
        chantiersCount={chantiersWithLaboMobile.length}
        techniciensCount={techniciensCount}
        essaisCount={1375}
        tauxReussite={94}
      />

      {/* Section Title */}
      <div className="flex items-center gap-3 pt-4">
        {getIcon()}
        <h2 className="text-xl font-semibold text-foreground">{getTitle()}</h2>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {navState.level === "wilayas" && paginationData.items.map((wilaya: any, index: number) => (
          <WilayaCard
            key={wilaya.code}
            nom={wilaya.nom}
            chantiersCount={wilaya.chantiersCount}
            maxChantiers={maxChantiersPerWilaya}
            colorIndex={index}
            onClick={() => handleWilayaClick(wilaya.nom)}
          />
        ))}

        {navState.level === "clients" && paginationData.items.map((client: any, index: number) => (
          <ClientCard
            key={client.id}
            nom={client.nom}
            chantiersCount={client.chantiersCount}
            maxChantiers={maxChantiersPerClient}
            colorIndex={index}
            onClick={() => handleClientClick(client.id, client.nom)}
          />
        ))}

        {navState.level === "chantiers" && paginationData.items.map((chantier: any, index: number) => (
          <ChantierCard
            key={chantier.id}
            nom={chantier.nom}
            adresse={chantier.adresse}
            statut={chantier.statut}
            colorIndex={index}
            showActions
            onClick={() => navigate(`/laboratoires-mobiles/chantier/${chantier.id}`)}
            onEdit={() => navigate(`/laboratoires-mobiles/${chantier.id}/modifier`)}
            onDelete={() => setDeleteChantierId(chantier.id)}
          />
        ))}
      </div>

      {/* Empty State */}
      {paginationData.totalItems === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {navState.level === "wilayas" && (
            <>
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune wilaya avec des chantiers actifs</p>
            </>
          )}
          {navState.level === "clients" && (
            <>
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun client dans cette wilaya</p>
            </>
          )}
          {navState.level === "chantiers" && (
            <>
              <HardHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun chantier pour ce client</p>
            </>
          )}
        </div>
      )}

      {/* Pagination */}
      {paginationData.totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <p className="text-sm text-muted-foreground">
            Affichage de {paginationData.startIndex} à {paginationData.endIndex} sur {paginationData.totalItems}
          </p>
          
          {paginationData.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: paginationData.totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(p => Math.min(paginationData.totalPages, p + 1))}
                    className={currentPage === paginationData.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteChangierId} onOpenChange={() => setDeleteChantierId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce chantier ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteChangierId) return;
                try {
                  // Find the labo mobile associated with this chantier
                  const labo = labos?.find(l => l.chantier_id === deleteChangierId);
                  if (labo) {
                    await deleteLabo.mutateAsync(labo.id);
                  }
                  toast.success("Chantier supprimé avec succès");
                  setDeleteChantierId(null);
                } catch {
                  toast.error("Erreur lors de la suppression");
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
