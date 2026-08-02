import { useNavigate, useParams } from "react-router-dom";
import { Pencil, ClipboardEdit, FileOutput, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { useDevisDetail } from "@/hooks/useFacturation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statutBadge = (s: string) => {
  const map: Record<string, { label: string; cls: string }> = {
    brouillon: { label: "Brouillon", cls: "bg-muted text-muted-foreground border-border" },
    envoye: { label: "Envoyé", cls: "bg-blue-500/20 text-blue-500 border-blue-500/30" },
    accepte: { label: "Accepté", cls: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" },
    refuse: { label: "Refusé", cls: "bg-red-500/20 text-red-500 border-red-500/30" },
    expire: { label: "Expiré", cls: "bg-amber-500/20 text-amber-500 border-amber-500/30" },
  };
  const m = map[s] || { label: s, cls: "" };
  return <Badge className={m.cls}>{m.label}</Badge>;
};

export default function DevisDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: devis, isLoading } = useDevisDetail(id);

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!devis) return <div className="text-center py-12 text-muted-foreground">Devis introuvable</div>;

  const client = (devis as any).clients;
  const chantier = (devis as any).chantiers;
  const lignes = ((devis as any).lignes_devis || []).sort((a: any, b: any) => a.ordre - b.ordre);

  return (
    <div data-essai-mobile className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Facturation", path: "/facturation" },
        { label: "Devis", path: "/facturation/devis" },
        { label: devis.numero },
      ]} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <BackButton to="/facturation/devis" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Devis {devis.numero}</h1>
            <p className="text-muted-foreground text-sm">{format(new Date(devis.date_emission), "dd MMMM yyyy", { locale: fr })}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          <Button variant="outline" onClick={() => navigate(`/facturation/devis/${id}/apercu`)} className="gap-2 w-full sm:w-auto">
            <FileOutput className="h-4 w-4" /> Aperçu
          </Button>
          <Button variant="outline" onClick={() => navigate(`/facturation/devis/${id}/saisie`)} className="gap-2 w-full sm:w-auto">
            <ClipboardEdit className="h-4 w-4" /> Saisie de données
          </Button>
          <Button onClick={() => navigate(`/facturation/devis/${id}/modifier`)} className="gap-2 w-full sm:w-auto">
            <Pencil className="h-4 w-4" /> Modifier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardHeader><CardTitle className="text-sm">Statut</CardTitle></CardHeader>
          <CardContent>{statutBadge(devis.statut)}</CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardHeader><CardTitle className="text-sm">Client</CardTitle></CardHeader>
          <CardContent>
            <p className="font-medium">{client?.nom || "—"}</p>
            {chantier?.nom && <p className="text-xs text-muted-foreground">Chantier : {chantier.nom}</p>}
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardHeader><CardTitle className="text-sm">Validité</CardTitle></CardHeader>
          <CardContent>
            <p>{devis.date_validite ? format(new Date(devis.date_validite), "dd/MM/yyyy", { locale: fr }) : "—"}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-card/50">
        <CardHeader><CardTitle>Lignes du devis ({lignes.length})</CardTitle></CardHeader>
        <CardContent>
          {lignes.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Aucune ligne. Cliquez sur "Saisie de données" pour ajouter.</p>
          ) : (
            <div className="space-y-2">
              {lignes.map((l: any, i: number) => (
                <div key={l.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{i + 1}. {l.description}</p>
                    <p className="text-xs text-muted-foreground">{l.quantite} × {Number(l.prix_unitaire).toLocaleString()} DA</p>
                  </div>
                  <p className="font-bold">{Number(l.montant).toLocaleString()} DA</p>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-border space-y-1 text-right">
            <p className="text-sm">Total HT : <span className="font-medium">{Number(devis.montant_ht).toLocaleString()} DA</span></p>
            <p className="text-sm">TVA ({devis.taux_tva}%) : <span className="font-medium">{Number(devis.montant_tva).toLocaleString()} DA</span></p>
            <p className="text-lg font-bold text-primary">Total TTC : {Number(devis.montant_ttc).toLocaleString()} DA</p>
          </div>
        </CardContent>
      </Card>

      {devis.observations && (
        <Card className="border-border/50 bg-card/50">
          <CardHeader><CardTitle className="text-sm">Observations</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-line">{devis.observations}</p></CardContent>
        </Card>
      )}
    </div>
  );
}
