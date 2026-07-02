import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, CheckCircle2, PenLine } from "lucide-react";
import { useMouvement, useMouvementItems, useSignMouvement, useValidateMouvement, MOUVEMENT_TYPE_LABEL, ITEM_ETAT_LABEL } from "@/hooks/useMouvementsMateriel";
import { MouvementTypeBadge, MouvementStatutBadge, ItemEtatBadge } from "@/components/materiel/MovementBadges";
import { SignaturePad } from "@/components/materiel/SignaturePad";
import { EntrepriseHeader } from "@/components/print/EntrepriseHeader";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const DECLARATIONS: Record<string, string> = {
  decharge: "Je soussigné reconnais avoir reçu le matériel ci-dessus en bon état et m'engage à en assurer la garde ainsi que la restitution.",
  passation: "Le technicien sortant remet le matériel au technicien entrant qui en accepte la responsabilité.",
  restitution: "Je restitue le matériel ci-dessus.",
  affectation: "Le responsable laboratoire affecte le matériel ci-dessus au chantier indiqué.",
};

export default function MouvementDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: m } = useMouvement(id);
  const { data: items } = useMouvementItems(id);
  const sign = useSignMouvement();
  const validate = useValidateMouvement();

  const [sigForm, setSigForm] = useState({ role: "technicien", nom: "", fonction: "", data: null as string | null });

  if (!m) return <div className="p-8 text-center text-muted-foreground">Chargement...</div>;

  const handleSign = async () => {
    if (!sigForm.nom) { toast.error("Nom requis"); return; }
    await sign.mutateAsync({
      movementId: id, role: sigForm.role, nom: sigForm.nom,
      fonction: sigForm.fonction, signature_data: sigForm.data || undefined,
    });
    toast.success("Signature enregistrée");
    setSigForm({ role: "technicien", nom: "", fonction: "", data: null });
  };

  const handleValidate = async () => {
    await validate.mutateAsync(id);
    toast.success("Mouvement validé · statuts matériel mis à jour");
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire", path: "/materiel" },
        { label: "Mouvements", path: "/materiel/mouvements" },
        { label: m.numero },
      ]} />

      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <BackButton to="/materiel/mouvements" />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {m.numero} <MouvementTypeBadge type={m.type} /> <MouvementStatutBadge statut={m.statut} />
            </h1>
            <p className="text-muted-foreground">{format(new Date(m.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" /> Imprimer PDF</Button>
          {m.statut !== "signe" && m.statut !== "annule" && (
            <Button onClick={handleValidate}><CheckCircle2 className="h-4 w-4 mr-2" /> Valider & appliquer</Button>
          )}
        </div>
      </div>

      <div data-ref="report" className="space-y-6">
        <EntrepriseHeader title={MOUVEMENT_TYPE_LABEL[m.type as keyof typeof MOUVEMENT_TYPE_LABEL]} subtitle={`N° ${m.numero} · ${format(new Date(m.date_mouvement), "dd/MM/yyyy", { locale: fr })}`} />

        <Card>
          <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-3 text-sm">
            <div><strong>Chantier :</strong> {m.chantiers?.nom || "—"}</div>
            <div><strong>Date :</strong> {format(new Date(m.date_mouvement), "dd/MM/yyyy", { locale: fr })}</div>
            <div><strong>Technicien sortant :</strong> {m.sortant ? `${m.sortant.prenom} ${m.sortant.nom}` : "—"}</div>
            <div><strong>Technicien entrant :</strong> {m.entrant ? `${m.entrant.prenom} ${m.entrant.nom}` : "—"}</div>
            <div><strong>Responsable :</strong> {m.responsable ? `${m.responsable.prenom} ${m.responsable.nom}` : "—"}</div>
            {m.motif && <div><strong>Motif :</strong> {m.motif}</div>}
            {m.observations && <div className="md:col-span-2"><strong>Observations :</strong> {m.observations}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Matériels ({items?.length || 0})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matériel</TableHead><TableHead>Référence</TableHead>
                  <TableHead>N° série</TableHead><TableHead>Qté</TableHead>
                  <TableHead>État</TableHead><TableHead>Observations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(items || []).map((it: any) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-medium">{it.materiel_laboratoire?.nom}</TableCell>
                    <TableCell>{it.materiel_laboratoire?.reference || "—"}</TableCell>
                    <TableCell>{it.materiel_laboratoire?.numero_serie || "—"}</TableCell>
                    <TableCell>{it.quantite}</TableCell>
                    <TableCell><ItemEtatBadge etat={it.etat} /></TableCell>
                    <TableCell>{it.observations || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Déclaration</CardTitle></CardHeader>
          <CardContent>
            <p className="italic text-sm">{DECLARATIONS[m.type]}</p>
          </CardContent>
        </Card>
      </div>

      {m.type !== "decharge" && (
        <Card className="print:hidden">
          <CardHeader><CardTitle className="flex items-center gap-2"><PenLine className="h-4 w-4" /> Ajouter une signature</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label>Rôle</Label>
                <select className="w-full border rounded-md h-10 px-3 bg-background" value={sigForm.role} onChange={(e) => setSigForm({ ...sigForm, role: e.target.value })}>
                  <option value="technicien">Technicien</option>
                  <option value="technicien_sortant">Technicien sortant</option>
                  <option value="technicien_entrant">Technicien entrant</option>
                  <option value="responsable">Responsable laboratoire</option>
                </select>
              </div>
              <div>
                <Label>Nom *</Label>
                <Input value={sigForm.nom} onChange={(e) => setSigForm({ ...sigForm, nom: e.target.value })} />
              </div>
              <div>
                <Label>Fonction</Label>
                <Input value={sigForm.fonction} onChange={(e) => setSigForm({ ...sigForm, fonction: e.target.value })} />
              </div>
            </div>
            <SignaturePad value={sigForm.data || undefined} onChange={(d) => setSigForm({ ...sigForm, data: d })} />
            <div className="flex justify-end">
              <Button onClick={handleSign} disabled={sign.isPending}>Enregistrer la signature</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
