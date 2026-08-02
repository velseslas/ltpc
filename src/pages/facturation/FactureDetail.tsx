import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, ClipboardEdit, Loader2, FileText } from "lucide-react";
import { useFacture } from "@/hooks/useFacturation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { Badge } from "@/components/ui/badge";

const statutBadge = (s: string) => {
  const map: Record<string, { label: string; cls: string }> = {
    payee: { label: "Payée", cls: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" },
    impayee: { label: "Impayée", cls: "bg-red-500/20 text-red-500 border-red-500/30" },
  };
  const m = map[s] || { label: "Impayée", cls: "bg-red-500/20 text-red-500 border-red-500/30" };
  return <Badge className={m.cls}>{m.label}</Badge>;
};

export default function FactureDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: facture, isLoading } = useFacture(id);

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!facture) return <div className="text-center py-12 text-muted-foreground">Facture non trouvée</div>;

  const isEspece = ((facture as any).mode_paiement || "") === "espece";
  const lignes = (facture as any).lignes_facture || [];
  const sortedLignes = [...lignes].sort((a: any, b: any) => a.ordre - b.ordre);

  return (
    <div data-essai-mobile className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Facturation", path: "/facturation" },
        { label: "Factures", path: "/facturation/factures" },
        { label: facture.numero },
      ]} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/facturation/factures")} className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Facture <span className="text-primary">{facture.numero}</span>
            </h1>
            <p className="text-muted-foreground mt-1">Détails de la facture</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          <Button variant="outline" className="flex items-center justify-center gap-2 w-full sm:w-auto" onClick={() => navigate(`/facturation/factures/${id}/apercu`)}>
            <FileText className="h-4 w-4" />Facture
          </Button>
          <Button variant="outline" className="flex items-center justify-center gap-2 w-full sm:w-auto" onClick={() => navigate(`/facturation/factures/${id}/saisie`)}>
            <ClipboardEdit className="h-4 w-4" />Saisie
          </Button>
          <Button className="flex items-center justify-center gap-2 w-full sm:w-auto" onClick={() => navigate(`/facturation/factures/${id}/modifier`)}>
            <Pencil className="h-4 w-4" />Modifier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Informations générales</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Client</span><p className="font-medium">{(facture as any).clients?.nom ?? "—"}</p></div>
            <div><span className="text-muted-foreground">Chantier</span><p className="font-medium">{(facture as any).chantiers?.nom ?? "—"}</p></div>
            <div><span className="text-muted-foreground">Date émission</span><p className="font-medium">{format(new Date(facture.date_emission), "PPP", { locale: fr })}</p></div>
            <div><span className="text-muted-foreground">Date échéance</span><p className="font-medium">{facture.date_echeance ? format(new Date(facture.date_echeance), "PPP", { locale: fr }) : "—"}</p></div>
            <div><span className="text-muted-foreground">Statut</span><p>{statutBadge(facture.statut)}</p></div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Montants</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Montant HT</span><p className="font-medium text-lg">{Number(facture.montant_ht).toLocaleString()} DA</p></div>
            {!isEspece && <div><span className="text-muted-foreground">TVA ({facture.taux_tva}%)</span><p className="font-medium text-lg">{Number(facture.montant_tva).toLocaleString()} DA</p></div>}
            <div className="col-span-2">
              <span className="text-muted-foreground">{isEspece ? "Montant total" : "Montant TTC"}</span>
              <p className="font-bold text-2xl text-primary">{(isEspece ? Number(facture.montant_ht) : Number(facture.montant_ttc)).toLocaleString()} DA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lines detail */}
      {sortedLignes.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Lignes de facturation ({sortedLignes.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-4 text-muted-foreground font-medium">#</th>
                  <th className="py-2 pr-4 text-muted-foreground font-medium">Désignation</th>
                  <th className="py-2 pr-4 text-muted-foreground font-medium text-center">Qté</th>
                  <th className="py-2 pr-4 text-muted-foreground font-medium text-right">P.U (DA)</th>
                  <th className="py-2 text-muted-foreground font-medium text-right">Montant (DA)</th>
                </tr>
              </thead>
              <tbody>
                {sortedLignes.map((l: any, i: number) => (
                  <tr key={l.id} className="border-b border-border/50">
                    <td className="py-3 pr-4">{i + 1}</td>
                    <td className="py-3 pr-4 font-medium">{l.description}</td>
                    <td className="py-3 pr-4 text-center">{l.quantite}</td>
                    <td className="py-3 pr-4 text-right">{Number(l.prix_unitaire).toLocaleString()}</td>
                    <td className="py-3 text-right font-medium">{Number(l.montant).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold">
                  <td colSpan={4} className="py-3 text-right pr-4">Total HT :</td>
                  <td className="py-3 text-right">{Number(facture.montant_ht).toLocaleString()} DA</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {facture.observations && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-2">Observations</h2>
          <p className="text-muted-foreground">{facture.observations}</p>
        </div>
      )}
    </div>
  );
}
