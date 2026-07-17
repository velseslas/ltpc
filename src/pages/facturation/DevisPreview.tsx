import { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Printer, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEntrepriseFull } from "@/hooks/useEntreprise";
import { useDevisDetail } from "@/hooks/useFacturation";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { DocumentPageHeader } from "@/components/documents/DocumentPageHeader";
import { PrintService } from "@/lib/print/PrintService";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2 } from "lucide-react";

// LOT 8 — Enregistrement du template Devis auprès du PrintService.
PrintService.registerTemplate({
  id: "devis-document",
  title: "Devis",
  orientation: "portrait",
});

const sectionStyle = { fontFamily: "'Times New Roman', Georgia, serif" } as const;
const pageStyle: React.CSSProperties = {
  padding: "40px 50px",
  minHeight: "1100px",
  ...sectionStyle,
};

function numberToFrenchWords(n: number): string {
  if (n === 0) return "zéro";
  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];

  function convertHundreds(num: number): string {
    if (num === 0) return "";
    if (num < 20) return units[num];
    if (num < 70) {
      const t = Math.floor(num / 10);
      const u = num % 10;
      if (u === 0) return tens[t];
      if (u === 1 && t > 1) return tens[t] + " et un";
      return tens[t] + "-" + units[u];
    }
    if (num < 80) {
      const u = num - 60;
      if (u === 1) return "soixante et onze";
      return "soixante-" + units[u];
    }
    if (num < 100) {
      const u = num - 80;
      if (u === 0) return "quatre-vingts";
      return "quatre-vingt-" + units[u];
    }
    const h = Math.floor(num / 100);
    const rest = num % 100;
    let result = h === 1 ? "cent" : units[h] + " cent";
    if (rest === 0 && h > 1) result += "s";
    if (rest > 0) result += " " + convertHundreds(rest);
    return result;
  }

  const parts: string[] = [];
  const millions = Math.floor(n / 1000000);
  const thousands = Math.floor((n % 1000000) / 1000);
  const remainder = n % 1000;

  if (millions > 0) parts.push(millions === 1 ? "un million" : convertHundreds(millions) + " millions");
  if (thousands > 0) parts.push(thousands === 1 ? "mille" : convertHundreds(thousands) + " mille");
  if (remainder > 0) parts.push(convertHundreds(remainder));

  return parts.join(" ") || "zéro";
}

export default function DevisPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  const { data: entreprise } = useEntrepriseFull();
  const { data: devis, isLoading } = useDevisDetail(id);

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!devis) return <div className="text-center py-12 text-muted-foreground">Devis introuvable</div>;

  const client = (devis as any).clients || {};
  const chantier = (devis as any).chantiers || {};
  const lignes = ((devis as any).lignes_devis || []).sort((a: any, b: any) => a.ordre - b.ordre);

  const dateEmission = format(new Date(devis.date_emission), "dd/MM/yyyy", { locale: fr });
  const dateValidite = devis.date_validite ? format(new Date(devis.date_validite), "dd/MM/yyyy", { locale: fr }) : null;

  const qrData = `Devis: ${devis.numero} | Client: ${client.nom || "—"} | Montant: ${Number(devis.montant_ttc).toLocaleString()} DA | Date: ${dateEmission}`;

  const montantTTCEntier = Math.floor(Number(devis.montant_ttc));
  const montantEnLettres = numberToFrenchWords(montantTTCEntier);

  const doPrint = () => {
    PrintService.print({ title: `Devis ${devis.numero}`, orientation: "portrait" });
  };
  const handlePrint = doPrint;
  const handleDownload = doPrint;

  const cellStyle: React.CSSProperties = {
    border: "1px solid #000",
    padding: "6px 10px",
    fontSize: "11px",
    verticalAlign: "middle",
    ...sectionStyle,
  };

  const headerCellStyle: React.CSSProperties = {
    ...cellStyle,
    backgroundColor: "#1e5a7a",
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: "11px",
  };

  return (
    <>
      <AppBreadcrumb items={[
        { label: "Facturation", path: "/facturation" },
        { label: "Devis", path: "/facturation/devis" },
        { label: devis.numero },
      ]} />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50" onClick={() => navigate("/facturation/devis")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Devis {devis.numero}</h1>
            <p className="text-muted-foreground text-sm">Aperçu du document</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" /> Imprimer
          </Button>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" /> Télécharger PDF
          </Button>
        </div>
      </div>

      <div className="flex justify-center">
        <div ref={reportRef} data-print-root data-print-template="devis-document" data-ref="report" style={{ width: "210mm" }}>
          <div data-pdf-page className="bg-white text-black shadow-xl" style={pageStyle}>
            <DocumentPageHeader
              entreprise={entreprise}
              qrData={qrData}
              title={`DEVIS N° ${devis.numero}`}
              subtitle={`Date d'émission : ${dateEmission}`}
            />

            {/* Entreprise: Informations fiscales & bancaires */}
            <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
              <div style={{ flex: 1, border: "1px solid #000", borderRadius: "6px", padding: "10px 12px" }}>
                <p style={{ fontSize: "12px", fontWeight: "bold", color: "#1e5a7a", marginBottom: "6px", borderBottom: "1px solid #ccc", paddingBottom: "4px", ...sectionStyle }}>INFORMATIONS FISCALES</p>
                {entreprise?.rc && <p style={{ fontSize: "11px", ...sectionStyle }}><strong>RC :</strong> {entreprise.rc}</p>}
                {entreprise?.nif && <p style={{ fontSize: "11px", ...sectionStyle }}><strong>NIF :</strong> {entreprise.nif}</p>}
                {entreprise?.nis && <p style={{ fontSize: "11px", ...sectionStyle }}><strong>NIS :</strong> {entreprise.nis}</p>}
                {(entreprise as any)?.ai && <p style={{ fontSize: "11px", ...sectionStyle }}><strong>Article d'imposition :</strong> {(entreprise as any).ai}</p>}
              </div>
              <div style={{ flex: 1, border: "1px solid #000", borderRadius: "6px", padding: "10px 12px" }}>
                <p style={{ fontSize: "12px", fontWeight: "bold", color: "#1e5a7a", marginBottom: "6px", borderBottom: "1px solid #ccc", paddingBottom: "4px", ...sectionStyle }}>INFORMATIONS BANCAIRES</p>
                {entreprise?.banque && <p style={{ fontSize: "11px", ...sectionStyle }}><strong>Banque :</strong> {entreprise.banque}</p>}
                {entreprise?.agence && <p style={{ fontSize: "11px", ...sectionStyle }}><strong>Agence :</strong> {entreprise.agence}</p>}
                {entreprise?.rib && <p style={{ fontSize: "11px", ...sectionStyle }}><strong>RIB :</strong> {entreprise.rib}</p>}
              </div>
            </div>

            {/* Client & Devis info */}
            <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
              <div style={{ flex: 1, border: "1px solid #000", borderRadius: "6px", padding: "12px" }}>
                <p style={{ fontSize: "12px", fontWeight: "bold", color: "#1e5a7a", marginBottom: "8px", borderBottom: "1px solid #ccc", paddingBottom: "4px", ...sectionStyle }}>CLIENT</p>
                <p style={{ fontSize: "12px", fontWeight: "bold", ...sectionStyle }}>{client.nom || "—"}</p>
                {client.adresse && <p style={{ fontSize: "11px", ...sectionStyle }}>{client.adresse}{client.ville ? `, ${client.ville}` : ""}</p>}
                {chantier.nom && <p style={{ fontSize: "11px", ...sectionStyle }}><strong>Chantier :</strong> {chantier.nom}</p>}
                {client.rc && <p style={{ fontSize: "11px", ...sectionStyle }}>RC : {client.rc}</p>}
                {client.nif && <p style={{ fontSize: "11px", ...sectionStyle }}>NIF : {client.nif}</p>}
                {client.nis && <p style={{ fontSize: "11px", ...sectionStyle }}>NIS : {client.nis}</p>}
                {client.article_imposition && <p style={{ fontSize: "11px", ...sectionStyle }}>Article d'imposition : {client.article_imposition}</p>}
              </div>

              <div style={{ width: "220px", border: "1px solid #000", borderRadius: "6px", padding: "12px" }}>
                <p style={{ fontSize: "12px", fontWeight: "bold", color: "#1e5a7a", marginBottom: "8px", borderBottom: "1px solid #ccc", paddingBottom: "4px", ...sectionStyle }}>DÉTAILS</p>
                <p style={{ fontSize: "11px", ...sectionStyle }}><strong>N° :</strong> {devis.numero}</p>
                <p style={{ fontSize: "11px", ...sectionStyle }}><strong>Date :</strong> {dateEmission}</p>
                {dateValidite && <p style={{ fontSize: "11px", ...sectionStyle }}><strong>Validité :</strong> {dateValidite}</p>}
              </div>
            </div>

            {/* Lines table */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
              <thead>
                <tr>
                  <th style={{ ...headerCellStyle, width: "40px" }}>N°</th>
                  <th style={headerCellStyle}>Désignation</th>
                  <th style={{ ...headerCellStyle, width: "60px" }}>Qté</th>
                  <th style={{ ...headerCellStyle, width: "110px" }}>Prix Unit. (DA)</th>
                  <th style={{ ...headerCellStyle, width: "120px" }}>Montant (DA)</th>
                </tr>
              </thead>
              <tbody>
                {lignes.length > 0 ? lignes.map((l: any, i: number) => (
                  <tr key={l.id}>
                    <td style={{ ...cellStyle, textAlign: "center" }}>{i + 1}</td>
                    <td style={cellStyle}>{l.description}</td>
                    <td style={{ ...cellStyle, textAlign: "center" }}>{l.quantite}</td>
                    <td style={{ ...cellStyle, textAlign: "right" }}>{Number(l.prix_unitaire).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</td>
                    <td style={{ ...cellStyle, textAlign: "right", fontWeight: "bold" }}>{Number(l.montant).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} style={{ ...cellStyle, textAlign: "center", color: "#999", padding: "20px" }}>Aucune ligne</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
              <table style={{ borderCollapse: "collapse", width: "300px" }}>
                <tbody>
                  <tr>
                    <td style={{ ...cellStyle, fontWeight: "bold", backgroundColor: "#f0f4f8" }}>Total HT</td>
                    <td style={{ ...cellStyle, textAlign: "right", fontWeight: "bold" }}>{Number(devis.montant_ht).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DA</td>
                  </tr>
                  <tr>
                    <td style={{ ...cellStyle, backgroundColor: "#f0f4f8" }}>TVA ({devis.taux_tva}%)</td>
                    <td style={{ ...cellStyle, textAlign: "right" }}>{Number(devis.montant_tva).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DA</td>
                  </tr>
                  <tr>
                    <td style={{ ...cellStyle, fontWeight: "bold", backgroundColor: "#1e5a7a", color: "#fff", fontSize: "13px" }}>Total TTC</td>
                    <td style={{ ...cellStyle, textAlign: "right", fontWeight: "bold", fontSize: "14px", backgroundColor: "#e8f4f8" }}>{Number(devis.montant_ttc).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DA</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ border: "1px solid #000", borderRadius: "6px", padding: "10px 14px", marginBottom: "24px", backgroundColor: "#f9fafb" }}>
              <p style={{ fontSize: "11px", ...sectionStyle }}>
                <strong>Arrêté le présent devis à la somme de :</strong>{" "}
                <span style={{ textTransform: "capitalize" }}>{montantEnLettres} Dinars Algériens</span>
              </p>
            </div>

            {devis.observations && (
              <div style={{ marginBottom: "24px" }}>
                <p style={{ fontSize: "11px", fontWeight: "bold", color: "#1e5a7a", marginBottom: "4px", ...sectionStyle }}>OBSERVATIONS</p>
                <p style={{ fontSize: "11px", ...sectionStyle }}>{devis.observations}</p>
              </div>
            )}

            {dateValidite && (
              <div style={{ marginBottom: "24px", padding: "8px 12px", backgroundColor: "#fff8e1", border: "1px solid #f0c419", borderRadius: "4px" }}>
                <p style={{ fontSize: "11px", ...sectionStyle, fontStyle: "italic" }}>
                  Ce devis est valable jusqu'au <strong>{dateValidite}</strong>.
                </p>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px" }}>
              <div style={{ textAlign: "center", width: "200px" }}>
                <p style={{ fontSize: "11px", fontWeight: "bold", borderBottom: "1px solid #000", paddingBottom: "60px", ...sectionStyle }}>Bon pour accord (Client)</p>
              </div>
              <div style={{ textAlign: "center", width: "200px" }}>
                <p style={{ fontSize: "11px", fontWeight: "bold", borderBottom: "1px solid #000", paddingBottom: "60px", ...sectionStyle }}>Le Directeur</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
