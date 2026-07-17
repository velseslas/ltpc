import { useRef, useEffect, useState } from "react";
import { PrintService } from "@/lib/print/PrintService";

// LOT 9 — Template Inventaire matériel (paysage).
PrintService.registerTemplate({ id: "materiel-inventaire", title: "Inventaire matériel", orientation: "landscape" });
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Printer, Download, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEntreprise } from "@/hooks/useEntreprise";
import { toast } from "sonner";
interface MaterielItem {
  id: string;
  nom: string;
  reference?: string | null;
  categorie?: string | null;
  marque?: string | null;
  modele?: string | null;
  numero_serie?: string | null;
  etat: string;
  localisation?: string | null;
}

interface MaterielInventaireDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: MaterielItem[];
}

const etatLabel = (etat: string) => {
  switch (etat) {
    case "operationnel": return "Opérationnel";
    case "hors_service": return "Hors service";
    case "en_reparation": return "En réparation";
    default: return etat;
  }
};

export default function MaterielInventaireDialog({ open, onOpenChange, data }: MaterielInventaireDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { data: entreprise } = useEntreprise();
  const today = format(new Date(), "dd MMMM yyyy", { locale: fr });
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!entreprise?.logo_url) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        setLogoDataUrl(canvas.toDataURL("image/png"));
      }
    };
    img.onerror = () => setLogoDataUrl(null);
    img.src = entreprise.logo_url;
  }, [entreprise?.logo_url]);

  const logoSrc = logoDataUrl || entreprise?.logo_url;

  const handlePrint = () => PrintService.print({ title: "Inventaire matériel", orientation: "landscape" });

  const handleDownloadPDF = async () => {
    downloadReportAsPDF(`inventaire-materiel-${format(new Date(), "yyyy-MM-dd")}`);
  };

  const stats = {
    total: data.length,
    operationnel: data.filter(m => m.etat === "operationnel").length,
    hors_service: data.filter(m => m.etat === "hors_service").length,
    en_reparation: data.filter(m => m.etat === "en_reparation").length,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Inventaire du Matériel
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4" />
            Télécharger PDF
          </Button>
        </div>

        <div ref={printRef} data-print-root data-print-template="materiel-inventaire" data-ref="report" style={{ padding: "16px", background: "#fff", color: "#111" }}>
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            {entreprise?.nom && (
              <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 4px" }}>{entreprise.nom}</h2>
            )}
            {entreprise?.numero_autorisation && (
              <p style={{ fontSize: "11px", margin: "0 0 2px", color: "#555" }}>
                Agrément N° {entreprise.numero_autorisation}
              </p>
            )}
            <h3 style={{ fontSize: "14px", fontWeight: 600, margin: "12px 0 4px", textDecoration: "underline" }}>
              INVENTAIRE DU MATÉRIEL DE LABORATOIRE
            </h3>
            <p style={{ fontSize: "11px", color: "#555" }}>Date : {today}</p>
          </div>

          <div style={{ display: "flex", gap: "16px", marginBottom: "12px", fontSize: "12px" }}>
            <span><strong>Total :</strong> {stats.total}</span>
            <span style={{ color: "#16a34a" }}>● Opérationnel : {stats.operationnel}</span>
            <span style={{ color: "#ef4444" }}>● Hors service : {stats.hors_service}</span>
            <span style={{ color: "#f59e0b" }}>● En réparation : {stats.en_reparation}</span>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #444", padding: "6px 8px", background: "#f1f5f9", fontWeight: 600 }}>N°</th>
                <th style={{ border: "1px solid #444", padding: "6px 8px", background: "#f1f5f9", fontWeight: 600 }}>Désignation</th>
                <th style={{ border: "1px solid #444", padding: "6px 8px", background: "#f1f5f9", fontWeight: 600 }}>Référence</th>
                <th style={{ border: "1px solid #444", padding: "6px 8px", background: "#f1f5f9", fontWeight: 600 }}>Catégorie</th>
                <th style={{ border: "1px solid #444", padding: "6px 8px", background: "#f1f5f9", fontWeight: 600 }}>Marque</th>
                <th style={{ border: "1px solid #444", padding: "6px 8px", background: "#f1f5f9", fontWeight: 600 }}>Modèle</th>
                <th style={{ border: "1px solid #444", padding: "6px 8px", background: "#f1f5f9", fontWeight: 600 }}>N° Série</th>
                <th style={{ border: "1px solid #444", padding: "6px 8px", background: "#f1f5f9", fontWeight: 600 }}>État</th>
                <th style={{ border: "1px solid #444", padding: "6px 8px", background: "#f1f5f9", fontWeight: 600 }}>Localisation</th>
              </tr>
            </thead>
            <tbody>
              {data.map((m, i) => (
                <tr key={m.id}>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "center" }}>{i + 1}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px", fontWeight: 500 }}>{m.nom}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{m.reference || "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px", textTransform: "capitalize" }}>{m.categorie?.replace("_", " ") || "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{m.marque || "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{m.modele || "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{m.numero_serie || "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{etatLabel(m.etat)}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{m.localisation || "—"}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ border: "1px solid #ccc", padding: "16px", textAlign: "center", color: "#888" }}>
                    Aucun matériel enregistré
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
