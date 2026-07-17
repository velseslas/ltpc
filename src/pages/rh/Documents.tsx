import { useState, useRef } from "react";
import { PrintService } from "@/lib/print/PrintService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Eye, Pencil, Trash2, Printer, Download, Mail, ArrowLeft, MoreHorizontal, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDocumentsRH, DocumentRH } from "@/hooks/useDocumentsRH";
import { useIntervenants } from "@/hooks/useIntervenants";
import { useEntreprise } from "@/hooks/useEntreprise";
import { usePostes } from "@/hooks/usePostes";
import { DocumentPreview } from "@/components/rh/DocumentPreview";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { AdminOnly } from "@/components/common/AdminOnly";

const typesDocument = [
  "Contrat de travail",
  "Attestation de travail",
  "Certificat de travail",
  "Bulletin de paie",
  "Avertissement",
];

export default function Documents() {
  const navigate = useNavigate();
  const { documents, isLoading, createDocument, updateDocument, deleteDocument } = useDocumentsRH();
  const { data: intervenants = [] } = useIntervenants();
  const { data: entreprise } = useEntreprise();
  const { data: postes = [] } = usePostes();
  const documentRef = useRef<HTMLDivElement>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentRH | null>(null);
  const [emailAddress, setEmailAddress] = useState("");
  const [formData, setFormData] = useState({
    intervenant_id: "",
    type_document: "",
    nom_fichier: "",
  });

  // Get full intervenant data for the selected document
  const selectedIntervenant = intervenants.find(i => i.id === selectedDocument?.intervenant_id);
  const selectedPoste = postes.find(p => p.id === selectedIntervenant?.poste_id);

  const filteredDocuments = documents.filter((doc) => {
    const employeeName = `${doc.intervenant?.prenom || ""} ${doc.intervenant?.nom || ""}`.toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    return (
      employeeName.includes(searchLower) ||
      doc.type_document.toLowerCase().includes(searchLower) ||
      doc.nom_fichier?.toLowerCase().includes(searchLower)
    );
  });

  const handleOpenNewDialog = () => {
    setSelectedDocument(null);
    setFormData({ intervenant_id: "", type_document: "", nom_fichier: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (doc: DocumentRH) => {
    setSelectedDocument(doc);
    setFormData({
      intervenant_id: doc.intervenant_id,
      type_document: doc.type_document,
      nom_fichier: doc.nom_fichier || "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenViewDialog = (doc: DocumentRH) => {
    setSelectedDocument(doc);
    setIsViewDialogOpen(true);
  };

  const handleOpenDeleteDialog = (doc: DocumentRH) => {
    setSelectedDocument(doc);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDocument) {
      await updateDocument.mutateAsync({ id: selectedDocument.id, ...formData });
    } else {
      await createDocument.mutateAsync(formData);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (selectedDocument) {
      await deleteDocument.mutateAsync(selectedDocument.id);
      setIsDeleteDialogOpen(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    downloadReportAsPDF(`${selectedDocument?.type_document || "document"}_${selectedIntervenant?.nom || "employe"}`);
  };

  const handleOpenEmailDialog = () => {
    setEmailAddress(selectedIntervenant?.email || "");
    setIsEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailAddress) {
      toast.error("Veuillez saisir une adresse email");
      return;
    }
    
    // For now, just show a message that email functionality requires setup
    toast.info("La fonctionnalité d'envoi par email nécessite une configuration Resend. Contactez l'administrateur.");
    setIsEmailDialogOpen(false);
  };

  const isDocumentPreviewable = (type: string) => {
    return (
      type === "Attestation de travail" ||
      type === "Certificat de travail" ||
      type === "Avertissement" ||
      type === "Contrat de travail"
    );
  };

  const getDocumentType = (type: string): "attestation" | "certificat" | "avertissement" | "contrat" => {
    if (type === "Attestation de travail") return "attestation";
    if (type === "Certificat de travail") return "certificat";
    if (type === "Avertissement") return "avertissement";
    return "contrat";
  };

  return (
    <>
      {!isViewDialogOpen && <div className="space-y-6">
        <AppBreadcrumb 
          items={[
            { label: "Ressources Humaines", path: "/rh" },
            { label: "Documents" }
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
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Documents <span className="text-primary">RH</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestion des documents du personnel
              </p>
            </div>
          </div>
        </div>

        {/* Search + New */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleOpenNewDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau
          </Button>
        </div>

        {/* Documents Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-6">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-48 mb-4" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">Aucun document trouvé</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((doc) => (
              <Card
                key={doc.id}
                className="border-border/50 hover:border-primary/50 transition-colors group"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{doc.type_document}</h3>
                        <p className="text-sm text-muted-foreground">
                          {doc.intervenant?.prenom} {doc.intervenant?.nom}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenViewDialog(doc)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Aperçu
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEditDialog(doc)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenDeleteDialog(doc)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {doc.nom_fichier && (
                    <p className="text-xs text-muted-foreground mb-2 truncate">
                      📎 {doc.nom_fichier}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                    <span>{format(new Date(doc.created_at), "dd MMM yyyy", { locale: fr })}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs hover:text-primary"
                      onClick={() => handleOpenViewDialog(doc)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Aperçu
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDocument ? "Modifier le document" : "Nouveau document"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="intervenant">Employé</Label>
              <Select
                value={formData.intervenant_id}
                onValueChange={(value) => setFormData({ ...formData, intervenant_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un employé" />
                </SelectTrigger>
                <SelectContent>
                  {intervenants.map((intervenant) => (
                    <SelectItem key={intervenant.id} value={intervenant.id}>
                      {intervenant.prenom} {intervenant.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type de document</Label>
              <Select
                value={formData.type_document}
                onValueChange={(value) => setFormData({ ...formData, type_document: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {typesDocument.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom_fichier">Nom du fichier</Label>
              <Input
                id="nom_fichier"
                value={formData.nom_fichier}
                onChange={(e) => setFormData({ ...formData, nom_fichier: e.target.value })}
                placeholder="Ex: contrat_dupont_2024.pdf"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={!formData.intervenant_id || !formData.type_document}>
                {selectedDocument ? "Modifier" : "Créer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Inline Document Preview */}
      {isViewDialogOpen && selectedDocument && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                onClick={() => setIsViewDialogOpen(false)}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-xl font-semibold">Aperçu du document</h2>
            </div>
            {isDocumentPreviewable(selectedDocument.type_document) && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                  <Printer className="h-4 w-4" />
                  Imprimer
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                  <Download className="h-4 w-4" />
                  Télécharger
                </Button>
                <Button variant="outline" size="sm" onClick={handleOpenEmailDialog} className="gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Button>
              </div>
            )}
          </div>

          {isDocumentPreviewable(selectedDocument.type_document) && selectedIntervenant && entreprise ? (
            <Card>
              <CardContent className="p-6 overflow-auto bg-muted/30 rounded-lg flex justify-center">
                <div
                  data-ref="report"
                  style={{
                    width: "210mm",
                    transform: "scale(var(--doc-scale, 0.85))",
                    transformOrigin: "top center",
                    marginBottom: "calc((1 - var(--doc-scale, 0.85)) * -297mm)",
                  }}
                  className="[--doc-scale:0.6] sm:[--doc-scale:0.75] lg:[--doc-scale:0.9]"
                >
                  <DocumentPreview
                    ref={documentRef}
                    type={getDocumentType(selectedDocument.type_document)}
                    employe={{
                      nom: selectedIntervenant.nom,
                      prenom: selectedIntervenant.prenom,
                      date_naissance: selectedIntervenant.date_naissance,
                      date_embauche: selectedIntervenant.date_embauche,
                      poste: selectedPoste?.nom,
                      cin: selectedIntervenant.cin,
                      adresse: selectedIntervenant.adresse,
                    }}
                    entreprise={{
                      nom: entreprise.nom,
                      siege_social: entreprise.siege_social,
                      telephone: entreprise.telephone,
                      email: entreprise.email,
                      logo_url: entreprise.logo_url,
                      numero_autorisation: entreprise.numero_autorisation,
                      date_autorisation: entreprise.date_autorisation,
                      annexe: entreprise.annexe,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <p>L'aperçu n'est pas disponible pour ce type de document.</p>
                  <p className="text-sm mt-2">Types supportés: Attestation, Certificat, Avertissement, Contrat de travail</p>
                </div>
                <div className="border-t pt-4 grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Employé</span>
                    <p className="font-medium">
                      {selectedDocument.intervenant?.prenom} {selectedDocument.intervenant?.nom}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Type de document</span>
                    <p className="font-medium">{selectedDocument.type_document}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Date de création</span>
                    <p className="font-medium">
                      {format(new Date(selectedDocument.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer par email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="exemple@email.com"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSendEmail} className="gap-2">
                <Mail className="h-4 w-4" />
                Envoyer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
