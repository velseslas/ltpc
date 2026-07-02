import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Save, Trash2 } from "lucide-react";
import { useChantiers } from "@/hooks/useChantiers";
import { useClients } from "@/hooks/useClients";
import { useIntervenants } from "@/hooks/useIntervenants";
import { useMaterielList, useAffectationMateriel } from "@/hooks/useMaterielLaboratoire";
import { wilayas } from "@/data/wilayas";
import { useCreateMouvement, MouvementType, MOUVEMENT_TYPE_LABEL, ItemEtat, ITEM_ETAT_LABEL } from "@/hooks/useMouvementsMateriel";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const MOTIFS = ["Mutation", "Congé", "Maladie", "Remplacement", "Fin de contrat", "Autre"];

export default function MouvementForm() {
  const navigate = useNavigate();
  const { type: typeParam } = useParams<{ type: MouvementType }>();
  const type = (typeParam || "affectation") as MouvementType;

  const { data: chantiers } = useChantiers();
  const { data: clients } = useClients();
  const { data: intervenants } = useIntervenants();
  const { data: materiels } = useMaterielList();
  const { data: affectations } = useAffectationMateriel();
  const createMv = useCreateMouvement();

  const [wilaya, setWilaya] = useState("");
  const [clientId, setClientId] = useState("");

  const [form, setForm] = useState({
    chantier_id: "",
    technicien_sortant_id: "",
    technicien_entrant_id: "",
    responsable_id: "",
    date_mouvement: new Date().toISOString().slice(0, 10),
    motif: "",
    observations: "",
  });

  type Item = { materiel_id: string; quantite: number; etat: ItemEtat; observations?: string };
  const [items, setItems] = useState<Item[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const isDecharge = type === "decharge";
  const isPassation = type === "passation";
  const isCascade = isDecharge || isPassation;

  // Item état options adapted per movement type (passation = Bon / Défectueux / Hors usage)
  const etatOptions: { value: ItemEtat; label: string }[] = isPassation
    ? [
        { value: "bon", label: "Bon" },
        { value: "a_reparer", label: "Défectueux" },
        { value: "casse", label: "Hors usage" },
      ]
    : (Object.keys(ITEM_ETAT_LABEL) as ItemEtat[]).map((e) => ({ value: e, label: ITEM_ETAT_LABEL[e] }));

  // Clients that have at least one chantier in the selected wilaya
  const filteredClients = useMemo(() => {
    const cs = (clients as any[]) || [];
    if (!isCascade || !wilaya) return cs;
    const chIds = new Set(((chantiers as any[]) || []).filter((c) => c.ville === wilaya).map((c) => c.client_id));
    return cs.filter((c) => chIds.has(c.id));
  }, [clients, chantiers, wilaya, isCascade]);

  const filteredChantiers = useMemo(() => {
    let list = (chantiers as any[]) || [];
    if (isCascade) {
      if (wilaya) list = list.filter((c) => c.ville === wilaya);
      if (clientId) list = list.filter((c) => c.client_id === clientId);
    }
    return list;
  }, [chantiers, wilaya, clientId, isCascade]);

  // Affectations matching the selected chantier (used to filter techs + import matos)
  const chantierAffectations = useMemo(() => {
    if (!isCascade || !form.chantier_id) return [] as any[];
    return ((affectations as any[]) || []).filter((a) => a.chantier_id === form.chantier_id);
  }, [affectations, form.chantier_id, isCascade]);

  // Techniciens filtered by chantier affectations (for the sortant/destinataire linked to the chantier)
  const techniciensChantier = useMemo(() => {
    const all = (intervenants || []).filter((i: any) => (i.role || "").toUpperCase().includes("TECH"));
    if (isCascade && form.chantier_id) {
      const ids = new Set(chantierAffectations.map((a: any) => a.intervenant_id).filter(Boolean));
      return all.filter((i: any) => ids.has(i.id));
    }
    return all;
  }, [intervenants, isCascade, form.chantier_id, chantierAffectations]);

  // All techniciens (used for technicien entrant on passation, unrestricted)
  const techniciens = useMemo(
    () => (intervenants || []).filter((i: any) => (i.role || "").toUpperCase().includes("TECH")),
    [intervenants]
  );

  // Auto-import matériel from affectations:
  // - décharge: from technicien entrant on the chantier
  // - passation: from technicien sortant on the chantier
  useEffect(() => {
    if (!isCascade) return;
    const techId = isDecharge ? form.technicien_entrant_id : form.technicien_sortant_id;
    if (!form.chantier_id || !techId) return;
    const rows = chantierAffectations.filter((a: any) => a.intervenant_id === techId);
    const imported: Item[] = rows
      .filter((a: any) => a.materiel_id)
      .map((a: any) => ({
        materiel_id: a.materiel_id,
        quantite: a.quantite ?? 1,
        etat: "bon" as ItemEtat,
        observations: "",
      }));
    setItems((prev) => {
      const map = new Map<string, Item>();
      imported.forEach((it) => map.set(it.materiel_id, it));
      prev.forEach((it) => { if (!map.has(it.materiel_id)) map.set(it.materiel_id, it); });
      return Array.from(map.values());
    });
  }, [isCascade, isDecharge, form.chantier_id, form.technicien_entrant_id, form.technicien_sortant_id, chantierAffectations]);

  // Filter material per type
  const availableMaterials = useMemo(() => {
    const all = (materiels as any[]) || [];
    if (isDecharge || isPassation) {
      const ids = new Set(chantierAffectations.map((a: any) => a.materiel_id).filter(Boolean));
      const list = all.filter((m) => ids.has(m.id));
      if (list.length) return list;
      if (isPassation && form.technicien_sortant_id) {
        return all.filter((m) => m.responsable_courant_id === form.technicien_sortant_id);
      }
      return all.filter((m) => m.statut_courant === "disponible");
    }
    if (type === "affectation") return all.filter((m) => m.statut_courant === "disponible");
    if (type === "restitution" && form.technicien_sortant_id) {
      return all.filter((m) => m.responsable_courant_id === form.technicien_sortant_id);
    }
    return all;
  }, [materiels, type, isDecharge, isPassation, chantierAffectations, form.technicien_sortant_id]);

  const addSelected = () => {
    const news: Item[] = Object.keys(selected).filter((k) => selected[k]).map((id) => ({
      materiel_id: id, quantite: 1, etat: "bon" as ItemEtat,
    }));
    setItems([...items, ...news.filter((n) => !items.some((it) => it.materiel_id === n.materiel_id))]);
    setSelected({});
    setPickerOpen(false);
  };

  const updateItem = (idx: number, patch: Partial<Item>) => {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const validate = () => {
    if (!items.length) { toast.error("Ajoutez au moins un matériel"); return false; }
    if (type === "affectation" || type === "decharge") {
      if (!form.chantier_id) { toast.error("Sélectionnez un chantier"); return false; }
      if (!form.technicien_entrant_id) { toast.error("Sélectionnez un technicien destinataire"); return false; }
    }
    if (type === "passation") {
      if (!form.technicien_sortant_id || !form.technicien_entrant_id) { toast.error("Sélectionnez les deux techniciens"); return false; }
      if (form.technicien_sortant_id === form.technicien_entrant_id) { toast.error("Les deux techniciens doivent être différents"); return false; }
      if (!form.motif) { toast.error("Sélectionnez le motif"); return false; }
    }
    if (type === "restitution") {
      if (!form.technicien_sortant_id) { toast.error("Sélectionnez le technicien"); return false; }
    }
    return true;
  };

  const onSubmit = async (signNow: boolean) => {
    if (!validate()) return;
    try {
      const { data: u } = await supabase.auth.getUser();
      const movement: any = {
        type,
        statut: signNow ? "signe" : "valide",
        chantier_id: form.chantier_id || null,
        technicien_sortant_id: form.technicien_sortant_id || null,
        technicien_entrant_id: form.technicien_entrant_id || null,
        responsable_id: form.responsable_id || null,
        date_mouvement: form.date_mouvement,
        motif: form.motif || null,
        observations: form.observations || null,
        created_by: u.user?.id,
      };
      const m = await createMv.mutateAsync({ movement, items });
      toast.success(`Mouvement ${MOUVEMENT_TYPE_LABEL[type]} créé`);
      navigate(`/materiel/mouvements/${m.id}`);
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la création");
    }
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumb items={[
        { label: "Matériel Laboratoire", path: "/materiel" },
        { label: "Mouvements", path: "/materiel/mouvements" },
        { label: `Nouveau · ${MOUVEMENT_TYPE_LABEL[type]}` },
      ]} />

      <div className="flex items-center gap-3">
        <BackButton to="/materiel/mouvements" />
        <h1 className="text-2xl font-bold">Nouveau mouvement · {MOUVEMENT_TYPE_LABEL[type]}</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Informations générales</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Date du mouvement *</Label>
            <Input type="date" value={form.date_mouvement} onChange={(e) => setForm({ ...form, date_mouvement: e.target.value })} />
          </div>

          {isCascade && (
            <>
              <div>
                <Label>Wilaya *</Label>
                <Select value={wilaya} onValueChange={(v) => { setWilaya(v); setClientId(""); setForm({ ...form, chantier_id: "", technicien_sortant_id: "", technicien_entrant_id: "" }); setItems([]); }}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner une wilaya..." /></SelectTrigger>
                  <SelectContent>
                    {wilayas.map((w) => <SelectItem key={w.code} value={w.nom}>{w.code} - {w.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Client *</Label>
                <Select value={clientId} onValueChange={(v) => { setClientId(v); setForm({ ...form, chantier_id: "", technicien_sortant_id: "", technicien_entrant_id: "" }); setItems([]); }} disabled={!wilaya}>
                  <SelectTrigger><SelectValue placeholder={wilaya ? "Sélectionner un client..." : "Choisir d'abord une wilaya"} /></SelectTrigger>
                  <SelectContent>
                    {filteredClients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {(type === "affectation" || type === "decharge" || type === "passation" || type === "restitution") && (
            <div>
              <Label>Chantier {type !== "restitution" && "*"}</Label>
              <Select
                value={form.chantier_id}
                onValueChange={(v) => { setForm({ ...form, chantier_id: v, technicien_sortant_id: "", technicien_entrant_id: "" }); if (isCascade) setItems([]); }}
                disabled={isCascade && !clientId}
              >
                <SelectTrigger><SelectValue placeholder={isCascade && !clientId ? "Choisir d'abord un client" : "Sélectionner..."} /></SelectTrigger>
                <SelectContent>
                  {filteredChantiers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {(type === "passation" || type === "restitution") && (
            <div>
              <Label>Technicien {type === "passation" ? "sortant" : "responsable"} *</Label>
              <Select
                value={form.technicien_sortant_id}
                onValueChange={(v) => setForm({ ...form, technicien_sortant_id: v })}
                disabled={isPassation && !form.chantier_id}
              >
                <SelectTrigger><SelectValue placeholder={isPassation && !form.chantier_id ? "Choisir d'abord un chantier" : "Sélectionner..."} /></SelectTrigger>
                <SelectContent>
                  {isPassation && techniciensChantier.length === 0 ? (
                    <div className="px-2 py-3 text-xs text-muted-foreground">Aucun technicien affecté à ce chantier</div>
                  ) : (
                    (isPassation ? techniciensChantier : techniciens).map((i: any) => (
                      <SelectItem key={i.id} value={i.id}>{i.prenom} {i.nom}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {(type === "affectation" || type === "decharge" || type === "passation") && (
            <div>
              <Label>Technicien {type === "passation" ? "entrant" : "destinataire"} *</Label>
              <Select
                value={form.technicien_entrant_id}
                onValueChange={(v) => setForm({ ...form, technicien_entrant_id: v })}
                disabled={isDecharge && !form.chantier_id}
              >
                <SelectTrigger><SelectValue placeholder={isDecharge && !form.chantier_id ? "Choisir d'abord un chantier" : "Sélectionner..."} /></SelectTrigger>
                <SelectContent>
                  {isDecharge && techniciensChantier.length === 0 ? (
                    <div className="px-2 py-3 text-xs text-muted-foreground">Aucun technicien affecté à ce chantier</div>
                  ) : (
                    (isDecharge ? techniciensChantier : techniciens).map((i: any) => (
                      <SelectItem key={i.id} value={i.id}>{i.prenom} {i.nom}</SelectItem>)
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Responsable laboratoire</Label>
            <Select value={form.responsable_id} onValueChange={(v) => setForm({ ...form, responsable_id: v })}>
              <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>
                {(intervenants || []).map((i: any) => <SelectItem key={i.id} value={i.id}>{i.prenom} {i.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {type === "passation" && (
            <div>
              <Label>Motif *</Label>
              <Select value={form.motif} onValueChange={(v) => setForm({ ...form, motif: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {MOTIFS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Responsable laboratoire</Label>
            <Select value={form.responsable_id} onValueChange={(v) => setForm({ ...form, responsable_id: v })}>
              <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>
                {(intervenants || []).map((i: any) => <SelectItem key={i.id} value={i.id}>{i.prenom} {i.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {type === "passation" && (
            <div>
              <Label>Motif *</Label>
              <Select value={form.motif} onValueChange={(v) => setForm({ ...form, motif: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {MOTIFS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="md:col-span-2">
            <Label>Observations</Label>
            <Textarea value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Matériels concernés ({items.length})</CardTitle>
            <Button variant="outline" onClick={() => setPickerOpen(!pickerOpen)}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter du matériel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pickerOpen && (
            <div className="mb-4 border rounded-lg p-3 max-h-72 overflow-auto">
              {availableMaterials.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun matériel disponible pour ce mouvement
                </p>
              ) : (
                <>
                  {availableMaterials.map((m: any) => (
                    <label key={m.id} className="flex items-center gap-3 p-2 hover:bg-muted/40 rounded cursor-pointer">
                      <Checkbox checked={!!selected[m.id]} onCheckedChange={(c) => setSelected({ ...selected, [m.id]: !!c })} />
                      <div className="flex-1">
                        <p className="font-medium">{m.nom}</p>
                        <p className="text-xs text-muted-foreground">{m.reference || "—"} · {m.numero_serie || "—"}</p>
                      </div>
                    </label>
                  ))}
                  <div className="mt-2 flex justify-end">
                    <Button size="sm" onClick={addSelected}>Ajouter la sélection</Button>
                  </div>
                </>
              )}
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matériel</TableHead><TableHead>Référence</TableHead>
                <TableHead className="w-24">Qté</TableHead><TableHead className="w-40">État</TableHead>
                <TableHead>Observations</TableHead><TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it, idx) => {
                const mat = (materiels as any[])?.find((m) => m.id === it.materiel_id);
                return (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{mat?.nom}</TableCell>
                    <TableCell>{mat?.reference || "—"}</TableCell>
                    <TableCell>
                      <Input type="number" min={1} value={it.quantite} onChange={(e) => updateItem(idx, { quantite: parseInt(e.target.value) || 1 })} />
                    </TableCell>
                    <TableCell>
                      <Select value={it.etat} onValueChange={(v) => updateItem(idx, { etat: v as ItemEtat })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(ITEM_ETAT_LABEL) as ItemEtat[]).map((e) => (
                            <SelectItem key={e} value={e}>{ITEM_ETAT_LABEL[e]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input value={it.observations || ""} onChange={(e) => updateItem(idx, { observations: e.target.value })} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!items.length && (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Aucun matériel ajouté</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => onSubmit(false)} disabled={createMv.isPending}>
          <Save className="h-4 w-4 mr-2" /> Enregistrer (à signer)
        </Button>
        <Button onClick={() => onSubmit(true)} disabled={createMv.isPending}>
          <Save className="h-4 w-4 mr-2" /> Enregistrer et valider
        </Button>
      </div>
    </div>
  );
}
