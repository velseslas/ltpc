import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Building2, User, Mail, Phone, MapPin, 
  FileText, Plus, Loader2, Calendar, Trash2, Printer, Edit, LayoutGrid, Download, Factory, FileCheck, FolderOpen, ArrowLeft, Pencil, Landmark, HardHat
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClient } from "@/hooks/useClients";
import { useContratsByClient, useDeleteContrat } from "@/hooks/useContrats";
import { useDocumentsAdministratifsByClient, useDeleteDocumentAdministratif } from "@/hooks/useDocumentsAdministratifs";
import { DocumentAdministratifFormDialog } from "@/components/clients/DocumentAdministratifFormDialog";
import { useChantiersByClient, useDeleteChantier } from "@/hooks/useChantiers";
import { useClientCentrales, useRemoveClientCentrale, ClientCentrale } from "@/hooks/useClientCentrales";
import { useClientMaitresOuvrage, useRemoveClientMaitreOuvrage } from "@/hooks/useClientMaitresOuvrage";
import { useClientMaitresOeuvre, useRemoveClientMaitreOeuvre } from "@/hooks/useClientMaitresOeuvre";
import { ContractFormDialog } from "@/components/clients/ContractFormDialog";
import { CentraleFormDialog } from "@/components/clients/CentraleFormDialog";
import { MoaFormDialog } from "@/components/clients/MoaFormDialog";
import { MoeFormDialog } from "@/components/clients/MoeFormDialog";
import { toast } from "sonner";
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
} from "@/components/ui/alert-dialog";

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"projets" | "contrats" | "dossier" | "moa" | "moe">("projets");
  const [isContractFormOpen, setIsContractFormOpen] = useState(false);
  const [editingContrat, setEditingContrat] = useState<any>(null);
  const [isDocAdminFormOpen, setIsDocAdminFormOpen] = useState(false);
  const [editingDocAdmin, setEditingDocAdmin] = useState<any>(null);
  const [isCentraleFormOpen, setIsCentraleFormOpen] = useState(false);
  const [editingCentrale, setEditingCentrale] = useState<ClientCentrale | null>(null);
  const [isMoaFormOpen, setIsMoaFormOpen] = useState(false);
  const [isMoeFormOpen, setIsMoeFormOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<string | null>(null);
  const [docAdminToDelete, setDocAdminToDelete] = useState<string | null>(null);
  const [centraleToDelete, setCentraleToDelete] = useState<{ id: string; nom: string } | null>(null);
  const [chantierToDelete, setChantierToDelete] = useState<{ id: string; nom: string } | null>(null);
  const [moaToDelete, setMoaToDelete] = useState<{ id: string; nom: string } | null>(null);
  const [moeToDelete, setMoeToDelete] = useState<{ id: string; nom: string } | null>(null);

  const { data: client, isLoading: clientLoading } = useClient(id || "");
  const { data: contrats, isLoading: contratsLoading } = useContratsByClient(id || "");
  const { data: chantiers } = useChantiersByClient(id || "");
  const { data: clientCentrales } = useClientCentrales(id || "");
  const { data: docsAdmin, isLoading: docsAdminLoading } = useDocumentsAdministratifsByClient(id || "");
  const { data: clientMoa } = useClientMaitresOuvrage(id || "");
  const { data: clientMoe } = useClientMaitresOeuvre(id || "");
  const deleteContrat = useDeleteContrat();
  const deleteDocAdmin = useDeleteDocumentAdministratif();
  const removeClientCentrale = useRemoveClientCentrale();
  const deleteChantier = useDeleteChantier();
  const removeMoa = useRemoveClientMaitreOuvrage();
  const removeMoe = useRemoveClientMaitreOeuvre();

  // Calculate project stats
  const totalChantiers = chantiers?.length || 0;
  const chantiersEnCours = chantiers?.filter(c => c.statut === "actif" || c.statut === "en_cours").length || 0;
  const chantiersPlanifies = chantiers?.filter(c => c.statut === "planifie" || c.statut === "en_pause").length || 0;
  const chantiersTermines = chantiers?.filter(c => c.statut === "termine").length || 0;

  const handleDeleteContrat = async () => {
    if (!contractToDelete) return;
    try {
      await deleteContrat.mutateAsync(contractToDelete);
      toast.success("Contrat supprimé avec succès");
      setContractToDelete(null);
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleDeleteDocAdmin = async () => {
    if (!docAdminToDelete) return;
    try {
      await deleteDocAdmin.mutateAsync(docAdminToDelete);
      toast.success("Document supprimé avec succès");
      setDocAdminToDelete(null);
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleDeleteCentrale = async () => {
    if (!centraleToDelete || !id) return;
    try {
      await removeClientCentrale.mutateAsync({ id: centraleToDelete.id, clientId: id });
      toast.success("Centrale retirée avec succès");
      setCentraleToDelete(null);
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleDeleteChantier = async () => {
    if (!chantierToDelete || !id) return;
    try {
      await deleteChantier.mutateAsync({ id: chantierToDelete.id, clientId: id });
      toast.success("Chantier supprimé avec succès");
      setChantierToDelete(null);
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleDeleteMoa = async () => {
    if (!moaToDelete || !id) return;
    try {
      await removeMoa.mutateAsync({ id: moaToDelete.id, clientId: id });
      toast.success("Maître de l'ouvrage retiré");
      setMoaToDelete(null);
    } catch { toast.error("Erreur lors de la suppression"); }
  };

  const handleDeleteMoe = async () => {
    if (!moeToDelete || !id) return;
    try {
      await removeMoe.mutateAsync({ id: moeToDelete.id, clientId: id });
      toast.success("Maître d'œuvre retiré");
      setMoeToDelete(null);
    } catch { toast.error("Erreur lors de la suppression"); }
  };


    switch (statut) {
      case "actif":
      case "en_cours":
        return "En cours";
      case "planifie":
      case "en_pause":
        return "Planifié";
      case "termine":
        return "Terminé";
      default:
        return statut;
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case "actif":
      case "en_cours":
        return "bg-green-500 text-green-950";
      case "planifie":
      case "en_pause":
        return "bg-amber-500 text-amber-950";
      case "termine":
        return "bg-muted-foreground text-background";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (clientLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-24">
        <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">Client non trouvé</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate("/intervenant/clients")}
        >
          Retour aux clients
        </Button>
      </div>
    );
  }

  return (
    <>
      <AppBreadcrumb 
        items={[
          { label: "Intervenants", path: "/intervenant" },
          { label: "Clients", path: "/intervenant/clients" },
          { label: client.nom }
        ]} 
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/intervenant/clients")} className="shrink-0 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground text-glow">
            {client.nom}
          </h1>
        </div>
      </div>

      {/* Main Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Informations du client */}
        <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
              <h3 className="text-base font-medium text-foreground">
                Informations du client
              </h3>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                <Printer className="w-3.5 h-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={() => navigate(`/intervenant/clients/${id}/modifier`)}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 transition-colors">
              <Building2 className="w-4 h-4 text-primary" />
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Entreprise:</p>
                <p className="text-sm text-foreground font-medium">{client.nom}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 transition-colors">
              <User className="w-4 h-4 text-primary" />
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Contact:</p>
                <p className="text-sm text-foreground font-medium">{client.contact || "Non renseigné"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 transition-colors">
              <Mail className="w-4 h-4 text-primary" />
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Email:</p>
                <p className="text-sm text-foreground font-medium">{client.email || "Non renseigné"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 transition-colors">
              <Phone className="w-4 h-4 text-primary" />
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Tél:</p>
                <p className="text-sm text-foreground font-medium">{client.telephone || "Non renseigné"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 transition-colors">
              <MapPin className="w-4 h-4 text-primary" />
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Localisation:</p>
                <p className="text-sm text-foreground font-medium">
                  {client.ville ? `${client.ville}${client.adresse ? `, ${client.adresse}` : ""}` : "Non renseigné"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Informations fiscales */}
        <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center">
                <FileCheck className="w-3.5 h-3.5 text-primary" />
              </div>
              <h3 className="text-base font-medium text-foreground">
                Informations fiscales et bancaires
              </h3>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={() => navigate(`/intervenant/clients/${id}/modifier`)}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 transition-colors">
              <FileText className="w-4 h-4 text-primary" />
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">RC:</p>
                <p className="text-sm text-foreground font-medium">{client.ice || "Non renseigné"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 transition-colors">
              <FileText className="w-4 h-4 text-primary" />
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">NIF:</p>
                <p className="text-sm text-foreground font-medium">{(client as any).nif || "Non renseigné"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 transition-colors">
              <FileText className="w-4 h-4 text-primary" />
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">NIS:</p>
                <p className="text-sm text-foreground font-medium">{(client as any).nis || "Non renseigné"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 transition-colors">
              <FileText className="w-4 h-4 text-primary" />
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Article d'imposition:</p>
                <p className="text-sm text-foreground font-medium">{(client as any).article_imposition || "Non renseigné"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 transition-colors">
              <FileText className="w-4 h-4 text-primary" />
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Banque:</p>
                <p className="text-sm text-foreground font-medium">{(client as any).banque || "Non renseigné"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 transition-colors">
              <FileText className="w-4 h-4 text-primary" />
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Agence:</p>
                <p className="text-sm text-foreground font-medium">{(client as any).agence || "Non renseigné"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 transition-colors">
              <FileText className="w-4 h-4 text-primary" />
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">RIB:</p>
                <p className="text-sm text-foreground font-medium">{(client as any).rib || "Non renseigné"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Résumé des projets - moved to its own row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Résumé des projets */}
        <div className="bg-card border border-border rounded-xl p-3 hover:border-primary/30 transition-all duration-300 group">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
              <LayoutGrid className="w-3 h-3 text-primary" />
            </div>
            <h3 className="text-sm font-medium text-foreground">
              Résumé des projets
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-secondary/50 rounded-md p-2">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold text-foreground">{totalChantiers}</p>
            </div>
            <div className="bg-green-500/20 rounded-md p-2">
              <p className="text-xs text-green-400">En cours</p>
              <p className="text-xl font-bold text-foreground">{chantiersEnCours}</p>
            </div>
            <div className="bg-amber-500/20 rounded-md p-2">
              <p className="text-xs text-amber-400">Planifiés</p>
              <p className="text-xl font-bold text-foreground">{chantiersPlanifies}</p>
            </div>
            <div className="bg-primary/20 rounded-md p-2">
              <p className="text-xs text-primary">Terminés</p>
              <p className="text-xl font-bold text-foreground">{chantiersTermines}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Centrales à Béton Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Factory className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-xl font-display font-semibold text-foreground">
              Centrales à Béton
            </h2>
            {clientCentrales && clientCentrales.length > 0 && (
              <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
                {clientCentrales.length}
              </span>
            )}
          </div>
          <Button 
            size="sm"
            className="gap-2 gradient-primary text-primary-foreground"
            onClick={() => {
              setEditingCentrale(null);
              setIsCentraleFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Nouvelle centrale
          </Button>
        </div>

        {clientCentrales && clientCentrales.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clientCentrales.map((item, index) => (
              <div 
                key={item.id}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 animate-fade-in group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Header with actions */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">
                    {item.chantiers?.nom || "Aucun chantier"}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingCentrale(item);
                        setIsCentraleFormOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setCentraleToDelete({ id: item.id, nom: item.centrales_beton?.nom || "" })}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
                    </Button>
                  </div>
                </div>

                {/* Title */}
                <h4 className="font-semibold text-foreground mb-4 group-hover:text-primary transition-colors">
                  {item.centrales_beton?.nom}
                </h4>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4 text-primary/70" />
                  <span>{item.centrales_beton?.ville || "Aucune localisation"}</span>
                </div>

                {/* Phone */}
                {item.centrales_beton?.telephone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Phone className="w-4 h-4 text-primary/70" />
                    <span>{item.centrales_beton.telephone}</span>
                  </div>
                )}

                {/* Capacity */}
                {item.centrales_beton?.capacite && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Factory className="w-4 h-4 text-primary/70" />
                    <span>{item.centrales_beton.capacite}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
            <Factory className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucune centrale associée</p>
            <p className="text-sm mt-1">Cliquez sur "Nouvelle centrale" pour en ajouter une</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setActiveTab("projets")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "projets"
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Projets
        </button>
        <button
          onClick={() => setActiveTab("contrats")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "contrats"
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="w-4 h-4" />
          Contrats
          {contrats && contrats.length > 0 && (
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
              {contrats.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("dossier")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "dossier"
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          Dossier administratif
          {docsAdmin && docsAdmin.length > 0 && (
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
              {docsAdmin.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("moa")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "moa"
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Landmark className="w-4 h-4" />
          Maître de l'ouvrage
          {clientMoa && clientMoa.length > 0 && (
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
              {clientMoa.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("moe")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "moe"
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <HardHat className="w-4 h-4" />
          Maître d'œuvre
          {clientMoe && clientMoe.length > 0 && (
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
              {clientMoe.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div>
        {activeTab === "projets" && (
          <div>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-semibold text-foreground">
                Chantiers du client
              </h2>
              <Button 
                size="sm"
                className="gap-2 gradient-primary text-primary-foreground"
                onClick={() => navigate(`/intervenant/chantiers/nouveau?clientId=${id}`)}
              >
                <Plus className="w-4 h-4" />
                Nouveau chantier
              </Button>
            </div>

            {/* Chantiers Grid */}
            {chantiers && chantiers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {chantiers.map((chantier, index) => (
                  <div 
                    key={chantier.id}
                    className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 animate-fade-in group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Header with status and actions */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(chantier.statut)} transition-transform group-hover:scale-105`}>
                        {getStatusLabel(chantier.statut)}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => navigate(`/intervenant/chantiers/${chantier.id}/modifier?clientId=${id}`)}
                        >
                          <Edit className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => setChantierToDelete({ id: chantier.id, nom: chantier.nom })}
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
                        </Button>
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {chantier.nom}
                    </h4>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {chantier.description || "Aucune description"}
                    </p>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="w-4 h-4 text-primary/70" />
                      <span>{chantier.ville || chantier.adresse || "Aucune localisation"}</span>
                    </div>

                    {/* Dates */}
                    {(chantier.date_debut || chantier.date_fin) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 text-primary/70" />
                        <span>
                          {chantier.date_debut ? new Date(chantier.date_debut).toLocaleDateString("fr-FR") : "—"}
                          {" - "}
                          {chantier.date_fin ? new Date(chantier.date_fin).toLocaleDateString("fr-FR") : "—"}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun chantier associé à ce client</p>
                <p className="text-sm mt-1">Ajoutez votre premier chantier</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "contrats" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-semibold text-foreground">
                Contrats du client
              </h2>
              <Button 
                className="gap-2 gradient-primary text-primary-foreground"
                onClick={() => setIsContractFormOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Nouveau Contrat
              </Button>
            </div>

            {contratsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : contrats && contrats.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contrats.map((contrat: any) => (
                  <div 
                    key={contrat.id}
                    className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all duration-300 group"
                  >
                    {/* Header with status and actions */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        contrat.statut === "actif" 
                          ? "bg-green-500 text-green-950" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {contrat.statut === "actif" ? "Actif" : contrat.statut}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {contrat.document_url && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => window.open(contrat.document_url, '_blank')}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => {
                            setEditingContrat(contrat);
                            setIsContractFormOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setContractToDelete(contrat.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="font-semibold text-foreground mb-2">
                      {contrat.titre}
                    </h4>

                    {/* Chantier */}
                    <p className="text-sm text-muted-foreground mb-4">
                      {contrat.chantiers?.nom || "Aucun chantier associé"}
                    </p>

                    {/* Document */}
                    {contrat.document_nom && (
                      <div className="flex items-center gap-2 text-sm text-primary mb-2">
                        <FileText className="w-4 h-4" />
                        <span className="truncate">{contrat.document_nom}</span>
                      </div>
                    )}

                    {/* Date */}
                    {contrat.date_signature && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Signé le {new Date(contrat.date_signature).toLocaleDateString("fr-FR")}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun contrat pour ce client</p>
                <p className="text-sm mt-1">Ajoutez votre premier contrat</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "dossier" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-semibold text-foreground">
                Dossier administratif
              </h2>
              <Button 
                className="gap-2 gradient-primary text-primary-foreground"
                onClick={() => setIsDocAdminFormOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Nouveau Document
              </Button>
            </div>

            {docsAdminLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : docsAdmin && docsAdmin.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {docsAdmin.map((doc) => (
                  <div 
                    key={doc.id}
                    className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                        Document
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {doc.document_url && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => window.open(doc.document_url!, '_blank')}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => {
                            setEditingDocAdmin(doc);
                            setIsDocAdminFormOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDocAdminToDelete(doc.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <h4 className="font-semibold text-foreground mb-2">
                      {doc.titre}
                    </h4>

                    {doc.document_nom && (
                      <div className="flex items-center gap-2 text-sm text-primary mb-2">
                        <FileText className="w-4 h-4" />
                        <span className="truncate">{doc.document_nom}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Ajouté le {new Date(doc.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun document administratif pour ce client</p>
                <p className="text-sm mt-1">Ajoutez votre premier document</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "moa" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-semibold text-foreground">
                Maîtres de l'ouvrage
              </h2>
              <Button 
                className="gap-2 gradient-primary text-primary-foreground"
                onClick={() => setIsMoaFormOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Associer un MOA
              </Button>
            </div>

            {clientMoa && clientMoa.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clientMoa.map((item: any) => (
                  <div key={item.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">MOA</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => setMoaToDelete({ id: item.id, nom: item.maitres_ouvrage?.nom || "" })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <h4 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{item.maitres_ouvrage?.nom}</h4>
                    {item.maitres_ouvrage?.contact && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <User className="w-4 h-4 text-primary/70" /><span>{item.maitres_ouvrage.contact}</span>
                      </div>
                    )}
                    {item.maitres_ouvrage?.telephone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Phone className="w-4 h-4 text-primary/70" /><span>{item.maitres_ouvrage.telephone}</span>
                      </div>
                    )}
                    {item.maitres_ouvrage?.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Mail className="w-4 h-4 text-primary/70" /><span>{item.maitres_ouvrage.email}</span>
                      </div>
                    )}
                    {item.maitres_ouvrage?.ville && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 text-primary/70" /><span>{item.maitres_ouvrage.ville}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
                <Landmark className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun maître de l'ouvrage associé</p>
                <p className="text-sm mt-1">Cliquez sur "Associer un MOA" pour en ajouter</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "moe" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-semibold text-foreground">
                Maîtres d'œuvre
              </h2>
              <Button 
                className="gap-2 gradient-primary text-primary-foreground"
                onClick={() => setIsMoeFormOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Associer un MOE
              </Button>
            </div>

            {clientMoe && clientMoe.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clientMoe.map((item: any) => (
                  <div key={item.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-rose-500/20 text-rose-400">MOE</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => setMoeToDelete({ id: item.id, nom: item.maitres_oeuvre?.nom || "" })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <h4 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{item.maitres_oeuvre?.nom}</h4>
                    {item.maitres_oeuvre?.contact && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <User className="w-4 h-4 text-primary/70" /><span>{item.maitres_oeuvre.contact}</span>
                      </div>
                    )}
                    {item.maitres_oeuvre?.telephone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Phone className="w-4 h-4 text-primary/70" /><span>{item.maitres_oeuvre.telephone}</span>
                      </div>
                    )}
                    {item.maitres_oeuvre?.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Mail className="w-4 h-4 text-primary/70" /><span>{item.maitres_oeuvre.email}</span>
                      </div>
                    )}
                    {item.maitres_oeuvre?.ville && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 text-primary/70" /><span>{item.maitres_oeuvre.ville}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
                <HardHat className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun maître d'œuvre associé</p>
                <p className="text-sm mt-1">Cliquez sur "Associer un MOE" pour en ajouter</p>
              </div>
            )}
          </div>
        )}
      </div>

      <ContractFormDialog 
        open={isContractFormOpen} 
        onOpenChange={(open) => {
          setIsContractFormOpen(open);
          if (!open) setEditingContrat(null);
        }}
        clientId={id}
        chantiers={chantiers?.map(c => ({ id: c.id, nom: c.nom })) || []}
        editingContrat={editingContrat}
      />

      <CentraleFormDialog
        open={isCentraleFormOpen}
        onOpenChange={(open) => {
          setIsCentraleFormOpen(open);
          if (!open) setEditingCentrale(null);
        }}
        clientId={id || ""}
        editingCentrale={editingCentrale}
      />

      <DocumentAdministratifFormDialog
        open={isDocAdminFormOpen}
        onOpenChange={(open) => {
          setIsDocAdminFormOpen(open);
          if (!open) setEditingDocAdmin(null);
        }}
        clientId={id}
        editingDoc={editingDocAdmin}
      />

      <MoaFormDialog
        open={isMoaFormOpen}
        onOpenChange={setIsMoaFormOpen}
        clientId={id || ""}
        existingIds={clientMoa?.map((m: any) => m.maitres_ouvrage?.id).filter(Boolean) || []}
      />

      <MoeFormDialog
        open={isMoeFormOpen}
        onOpenChange={setIsMoeFormOpen}
        clientId={id || ""}
        existingIds={clientMoe?.map((m: any) => m.maitres_oeuvre?.id).filter(Boolean) || []}
      />

      <AlertDialog open={!!contractToDelete} onOpenChange={() => setContractToDelete(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce contrat ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContrat} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!centraleToDelete} onOpenChange={() => setCentraleToDelete(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer cette centrale ?</AlertDialogTitle>
            <AlertDialogDescription>La centrale "{centraleToDelete?.nom}" sera retirée de ce client.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCentrale} className="bg-destructive hover:bg-destructive/90">Retirer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!chantierToDelete} onOpenChange={() => setChantierToDelete(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce chantier ?</AlertDialogTitle>
            <AlertDialogDescription>Le chantier "{chantierToDelete?.nom}" sera définitivement supprimé.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChantier} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!docAdminToDelete} onOpenChange={() => setDocAdminToDelete(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce document ?</AlertDialogTitle>
            <AlertDialogDescription>Ce document sera définitivement supprimé.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDocAdmin} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!moaToDelete} onOpenChange={() => setMoaToDelete(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce maître de l'ouvrage ?</AlertDialogTitle>
            <AlertDialogDescription>"{moaToDelete?.nom}" sera retiré de ce client.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMoa} className="bg-destructive hover:bg-destructive/90">Retirer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!moeToDelete} onOpenChange={() => setMoeToDelete(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce maître d'œuvre ?</AlertDialogTitle>
            <AlertDialogDescription>"{moeToDelete?.nom}" sera retiré de ce client.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMoe} className="bg-destructive hover:bg-destructive/90">Retirer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ClientDetail;
