import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, Building2, MapPin, ArrowLeft, Plus, Search, MoreHorizontal, Pencil, Trash2, FileText, Calendar, Loader2, Upload } from "lucide-react";
import { useAttestationsBonneExecution } from "@/hooks/useDocuments";
import { useClients } from "@/hooks/useClients";
import { useChantiers } from "@/hooks/useChantiers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import DocumentFormDialog, { type DocumentFormData } from "./DocumentFormDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

type ViewLevel = "entreprises" | "chantiers" | "document";

const AttestationsBonneExecution = () => {
  const navigate = useNavigate();
  const { query, create, update, remove } = useAttestationsBonneExecution();
  const { data: clients } = useClients();
  const { data: chantiers } = useChantiers();

  const [viewLevel, setViewLevel] = useState<ViewLevel>("entreprises");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedChantierId, setSelectedChantierId] = useState<string | null>(null);
  const [selectedAttestation, setSelectedAttestation] = useState<any>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const attestations = query.data || [];

  // Group by client
  const clientGroups = attestations.reduce((acc: Record<string, any[]>, item) => {
    const cid = item.client_id || "no-client";
    if (!acc[cid]) acc[cid] = [];
    acc[cid].push(item);
    return acc;
  }, {});

  // Get chantiers for selected client
  const clientChantierGroups = selectedClientId
    ? attestations
        .filter((a) => a.client_id === selectedClientId)
        .reduce((acc: Record<string, any[]>, item) => {
          const chid = item.chantier_id || "no-chantier";
          if (!acc[chid]) acc[chid] = [];
          acc[chid].push(item);
          return acc;
        }, {})
    : {};

  // Get attestations for selected chantier
  const chantierAttestations = selectedChantierId
    ? attestations.filter(
        (a) => a.client_id === selectedClientId && a.chantier_id === selectedChantierId
      )
    : [];

  const handleSubmit = async (data: DocumentFormData) => {
    try {
      const payload: any = {
        titre: data.titre,
        numero: data.numero || null,
        date_document: data.date_document,
        client_id: data.client_id || null,
        chantier_id: data.chantier_id || null,
        observations: data.observations || null,
        statut: data.statut,
        date_debut: data.date_debut || null,
        date_fin: data.date_fin || null,
        document_url: data.document_url || null,
        document_nom: data.document_nom || null,
      };

      if (editItem) {
        await update.mutateAsync({ id: editItem.id, ...payload });
        toast.success("Attestation modifiée avec succès");
      } else {
        await create.mutateAsync(payload);
        toast.success("Attestation créée avec succès");
      }
      setFormOpen(false);
      setEditItem(null);
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await remove.mutateAsync(deleteId);
      toast.success("Attestation supprimée");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
    setDeleteId(null);
  };

  const goBack = () => {
    if (viewLevel === "document") {
      setViewLevel("chantiers");
      setSelectedAttestation(null);
    } else if (viewLevel === "chantiers") {
      setViewLevel("entreprises");
      setSelectedClientId(null);
    } else {
      navigate("/documents");
    }
  };

  const getClientName = (clientId: string) => {
    if (clientId === "no-client") return "Sans entreprise";
    return clients?.find((c) => c.id === clientId)?.nom || "Entreprise inconnue";
  };

  const getChantierName = (chantierId: string) => {
    if (chantierId === "no-chantier") return "Sans chantier";
    return chantiers?.find((c) => c.id === chantierId)?.nom || "Chantier inconnu";
  };

  // Breadcrumb
  const breadcrumbItems = [
    { label: "Documents", path: "/documents" },
    { label: "Attestations de bonne exécution", path: viewLevel === "entreprises" ? undefined : "#" },
  ];
  if (viewLevel === "chantiers" && selectedClientId) {
    breadcrumbItems.push({ label: getClientName(selectedClientId) });
  }
  if (viewLevel === "document" && selectedChantierId) {
    breadcrumbItems.push({ label: getClientName(selectedClientId!) });
    breadcrumbItems.push({ label: getChantierName(selectedChantierId) });
  }

  // === DOCUMENT VIEW ===
  if (viewLevel === "document" && selectedAttestation) {
    const docUrl = selectedAttestation.document_url;
    return (
      <>
        <AppBreadcrumb items={breadcrumbItems} />
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <Button variant="outline" size="icon" className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50" onClick={goBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">{selectedAttestation.titre}</h1>
              <p className="text-muted-foreground text-sm">
                {selectedAttestation.numero && `N° ${selectedAttestation.numero} • `}
                {getClientName(selectedAttestation.client_id)} • {getChantierName(selectedAttestation.chantier_id)}
              </p>
            </div>
          </div>
        </div>

        {docUrl ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
            {docUrl.toLowerCase().endsWith(".pdf") || docUrl.includes("pdf") ? (
              <iframe src={docUrl} className="w-full h-full" title="Document attestation" />
            ) : (
              <div className="flex items-center justify-center h-full p-8">
                <img src={docUrl} alt="Document attestation" className="max-w-full max-h-full object-contain rounded-lg" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <FileText className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">Aucun document scanné</p>
            <p className="text-sm mt-1">Modifiez cette attestation pour ajouter un fichier</p>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <AppBreadcrumb items={breadcrumbItems} />

      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="outline" size="icon" className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50" onClick={goBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              <span className="text-primary text-glow">Attestations</span> de bonne exécution
            </h1>
            <p className="text-muted-foreground mt-1">
              {viewLevel === "entreprises" && "Sélectionnez une entreprise"}
              {viewLevel === "chantiers" && `Chantiers de ${getClientName(selectedClientId!)}`}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            className="pl-10 bg-card border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="gap-2 gradient-primary text-primary-foreground" onClick={() => { setEditItem(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4" />
          Nouveau
        </Button>
      </div>

      {query.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* === ENTREPRISES VIEW === */}
          {viewLevel === "entreprises" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(clientGroups)
                .filter(([cid]) => {
                  const name = getClientName(cid);
                  return name.toLowerCase().includes(searchTerm.toLowerCase());
                })
                .map(([clientId, items]) => (
                  <div
                    key={clientId}
                    className="rounded-xl bg-card border border-border p-6 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer group"
                    onClick={() => { setSelectedClientId(clientId); setViewLevel("chantiers"); setSearchTerm(""); }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {getClientName(clientId)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {items.length} attestation{items.length > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>
                        {new Set(items.map((i: any) => i.chantier_id).filter(Boolean)).size} chantier(s)
                      </span>
                    </div>
                  </div>
                ))}
              {Object.keys(clientGroups).length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune attestation trouvée</p>
                  <p className="text-sm mt-1">Cliquez sur "Nouveau" pour en créer une</p>
                </div>
              )}
            </div>
          )}

          {/* === CHANTIERS VIEW === */}
          {viewLevel === "chantiers" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(clientChantierGroups)
                .filter(([chid]) => {
                  const name = getChantierName(chid);
                  return name.toLowerCase().includes(searchTerm.toLowerCase());
                })
                .map(([chantierId, items]) => (
                  <div
                    key={chantierId}
                    className="rounded-xl bg-card border border-border p-6 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer group"
                    onClick={() => {
                      setSelectedChantierId(chantierId);
                      // If only one attestation, go directly to document
                      if (items.length === 1) {
                        setSelectedAttestation(items[0]);
                        setViewLevel("document");
                      } else {
                        // Show list of attestations for this chantier - pick first for now
                        setSelectedAttestation(items[0]);
                        setViewLevel("document");
                      }
                      setSearchTerm("");
                    }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/30 transition-colors">
                        <MapPin className="w-6 h-6 text-violet-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {getChantierName(chantierId)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {items.length} attestation{items.length > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      {items.slice(0, 2).map((att: any) => (
                        <div key={att.id} className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5" />
                          <span className="truncate">{att.titre}</span>
                        </div>
                      ))}
                      {items.length > 2 && (
                        <p className="text-xs text-primary">+{items.length - 2} de plus</p>
                      )}
                    </div>
                  </div>
                ))}
              {Object.keys(clientChantierGroups).length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun chantier trouvé</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <DocumentFormDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditItem(null); }}
        onSubmit={handleSubmit}
        initialData={editItem}
        title={editItem ? "Modifier - Attestation" : "Nouveau - Attestation de bonne exécution"}
        extraFields="attestation"
        isLoading={create.isPending || update.isPending}
        existingItems={attestations}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AttestationsBonneExecution;
