import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowLeftRight, Printer, Download, Calendar, MapPin, User, Microscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useAffectationMateriel } from "@/hooks/useMaterielLaboratoire";
import { useEntreprise } from "@/hooks/useEntreprise";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRef, useEffect, useState } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function MaterielAffectationHistorique() {
  const navigate = useNavigate();
  const { data, isLoading } = useAffectationMateriel();
  const { data: entreprise } = useEntreprise();
  const printRef = useRef<HTMLDivElement>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const today = format(new Date(), "dd MMMM yyyy", { locale: fr });

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

  const statutBadge = (s: string) => {
    switch (s) {
      case "en_cours": return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">En cours</Badge>;
      case "terminee": return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Terminée</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Veuillez autoriser les popups");
      return;
    }
    printWindow.document.write(`
      <html><head><title>Historique des Affectations</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #111; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11px; }
        th, td { border: 1px solid #444; padding: 6px 8px; text-align: left; }
        th { background: #f1f5f9; font-weight: 600; }
        .header { text-align: center; margin-bottom: 16px; }
        .header h2 { margin: 4px 0; }
        .meta { font-size: 12px; color: #555; margin-bottom: 8px; }
        @page { size: landscape; margin: 10mm; }
        @media print { body { margin: 0; } }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 400);
  };

  const handleDownload = async () => {
    if (!printRef.current) return;
    toast.info("Génération du PDF...");
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: "#fff", useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      pdf.save(`historique-affectations-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("PDF téléchargé");
    } catch {
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  const totalEnCours = data?.filter((a: any) => a.statut === "en_cours").length || 0;
  const totalTerminees = data?.filter((a: any) => a.statut === "terminee").length || 0;

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire", path: "/materiel" },
        { label: "Affectation Matériel", path: "/materiel/affectation" },
        { label: "Historique" },
      ]} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate("/materiel/affectation")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Historique des Affectations</h1>
            <p className="text-muted-foreground">Suivi complet des affectations matériel</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Télécharger PDF
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ArrowLeftRight className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total affectations</p>
                <p className="text-2xl font-bold">{data?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <ArrowLeftRight className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold">{totalEnCours}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <ArrowLeftRight className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Terminées</p>
                <p className="text-2xl font-bold">{totalTerminees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div ref={printRef} style={{ padding: "16px", background: "#fff", color: "#111" }}>
        {/* En-tête entreprise */}
        <div style={{ border: "1px solid #000", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ width: "100px", height: "100px", border: "1px solid #ddd", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
              {logoSrc ? (
                <img src={logoSrc} alt="Logo" style={{ maxWidth: "90px", maxHeight: "90px", objectFit: "contain" }} />
              ) : (
                <span style={{ fontSize: "10px", color: "#999" }}>Logo</span>
              )}
            </div>
            <div style={{ textAlign: "center", flex: 1, padding: "0 16px" }}>
              <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#1e5a7a", margin: "0 0 4px" }}>
                {entreprise?.nom || "Laboratoire"}
              </h1>
              {entreprise?.numero_autorisation && (
                <p style={{ fontSize: "12px", margin: "0 0 2px", color: "#555" }}>
                  Agrément N° {entreprise.numero_autorisation}
                  {entreprise?.date_autorisation && ` du ${format(new Date(entreprise.date_autorisation), "dd/MM/yyyy")}`}
                </p>
              )}
              {entreprise?.siege_social && (
                <p style={{ fontSize: "11px", margin: "2px 0", color: "#555" }}>
                  Siège social : {entreprise.siege_social}
                </p>
              )}
              {entreprise?.annexe && (
                <p style={{ fontSize: "11px", margin: "2px 0", color: "#555" }}>
                  Annexe : {entreprise.annexe}
                </p>
              )}
              <div style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}>
                {entreprise?.telephone && <span>Tél : {entreprise.telephone}</span>}
                {entreprise?.telephone && entreprise?.email && <span> — </span>}
                {entreprise?.email && <span>Email : {entreprise.email}</span>}
              </div>
            </div>
            <div style={{ width: "100px", flexShrink: 0 }} />
          </div>
        </div>

        {/* Titre */}
        <h3 style={{ fontSize: "14px", fontWeight: 600, margin: "12px 0 8px", textDecoration: "underline", textAlign: "center", color: "#1e5a7a" }}>
          HISTORIQUE DES AFFECTATIONS MATÉRIEL
        </h3>
        <p style={{ fontSize: "11px", color: "#555", textAlign: "center", marginBottom: "8px" }}>Date : {today}</p>

        {/* Stats */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "12px", fontSize: "12px" }}>
          <span><strong>Total :</strong> {data?.length || 0}</span>
          <span style={{ color: "#16a34a" }}>● En cours : {totalEnCours}</span>
          <span style={{ color: "#3b82f6" }}>● Terminées : {totalTerminees}</span>
        </div>

        {/* Tableau */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead>
            <tr>
              {["N°", "Matériel", "Référence", "Chantier", "Technicien", "Date début", "Date fin", "Durée", "Statut", "Observations"].map(h => (
                <th key={h} style={{ border: "1px solid #444", padding: "6px 8px", background: "#f1f5f9", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.map((a: any, i: number) => {
              const debut = new Date(a.date_debut);
              const fin = a.date_fin ? new Date(a.date_fin) : new Date();
              const duree = Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24));
              return (
                <tr key={a.id}>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "center" }}>{i + 1}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px", fontWeight: 500 }}>{a.materiel_laboratoire?.nom || "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{a.materiel_laboratoire?.reference || "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{a.chantiers?.nom || "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{a.intervenants ? `${a.intervenants.prenom} ${a.intervenants.nom}` : "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{format(debut, "dd/MM/yyyy", { locale: fr })}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{a.date_fin ? format(new Date(a.date_fin), "dd/MM/yyyy", { locale: fr }) : "—"}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "center" }}>{duree}j</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{a.statut === "en_cours" ? "En cours" : a.statut === "terminee" ? "Terminée" : a.statut}</td>
                  <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{a.observations || "—"}</td>
                </tr>
              );
            })}
            {(!data || data.length === 0) && (
              <tr>
                <td colSpan={10} style={{ border: "1px solid #ccc", padding: "16px", textAlign: "center", color: "#888" }}>
                  Aucune affectation enregistrée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
