import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Eye, Pencil, Trash2, Printer, Download, Mail, ArrowLeft, MoreHorizontal } from "lucide-react";
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
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
    if (documentRef.current) {
      const printContent = documentRef.current.innerHTML;
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Document</title>
              <style>
                body { margin: 0; padding: 0; font-family: "Times New Roman", serif; }
                @page { size: A4; margin: 0; }
                @media print {
                  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
              </style>
            </head>
            <body>${printContent}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  const handleDownload = async () => {
    if (documentRef.current) {
      try {
        const canvas = await html2canvas(documentRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        });
        
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 0;
        
        pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        pdf.save(`${selectedDocument?.type_document || "document"}_${selectedIntervenant?.nom || "employe"}.pdf`);
        
        toast.success("Document PDF téléchargé");
      } catch (error) {
        toast.error("Erreur lors du téléchargement");
        console.error(error);
      }
    }
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
    return type === "Attestation de travail" || type === "Certificat de travail";
  };

  const getDocumentType = (type: string): "attestation" | "certificat" => {
    return type === "Attestation de travail" ? "attestation" : "certificat";
  };

  return (
    <>
      <div className="space-y-6">
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

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">N°</TableHead>
                <TableHead>Nom de l'employé</TableHead>
                <TableHead>Type de document</TableHead>
                <TableHead>Date de création</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun document trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map((doc, index) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      {doc.intervenant?.prenom} {doc.intervenant?.nom}
                    </TableCell>
                    <TableCell>{doc.type_document}</TableCell>
                    <TableCell>
                      {format(new Date(doc.created_at), "dd MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

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

      {/* View Dialog with Document Preview */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Aperçu du document</span>
              {selectedDocument && isDocumentPreviewable(selectedDocument.type_document) && (
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
            </DialogTitle>
          </DialogHeader>
          
          {selectedDocument && isDocumentPreviewable(selectedDocument.type_document) && selectedIntervenant && entreprise ? (
            <div className="overflow-auto bg-muted/30 p-4 rounded-lg">
              <div className="transform scale-[0.6] origin-top">
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
                  }}
                />
              </div>
            </div>
          ) : selectedDocument ? (
            <div className="space-y-4 py-4">
              <div className="text-center py-8 text-muted-foreground">
                <p>L'aperçu n'est pas disponible pour ce type de document.</p>
                <p className="text-sm mt-2">Types supportés: Attestation de travail, Certificat de travail</p>
              </div>
              <div className="border-t pt-4 space-y-3">
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
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

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
