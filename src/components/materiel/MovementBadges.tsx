import { Badge } from "@/components/ui/badge";
import { ItemEtat, ITEM_ETAT_LABEL, MaterielStatutCourant, STATUT_LABEL, MouvementType, MOUVEMENT_TYPE_LABEL, MouvementStatut } from "@/hooks/useMouvementsMateriel";

const STATUT_COLORS: Record<MaterielStatutCourant, string> = {
  disponible: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
  affecte: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  pris_en_charge: "bg-indigo-500/20 text-indigo-600 border-indigo-500/30",
  en_passation: "bg-purple-500/20 text-purple-600 border-purple-500/30",
  restitue: "bg-slate-500/20 text-slate-600 border-slate-500/30",
  en_maintenance: "bg-amber-500/20 text-amber-600 border-amber-500/30",
  hors_service: "bg-red-500/20 text-red-600 border-red-500/30",
  perdu: "bg-rose-500/20 text-rose-600 border-rose-500/30",
  vole: "bg-rose-700/20 text-rose-700 border-rose-700/30",
  reforme: "bg-zinc-500/20 text-zinc-600 border-zinc-500/30",
};

export function MaterielStatutBadge({ statut }: { statut: MaterielStatutCourant }) {
  return <Badge className={STATUT_COLORS[statut] || ""}>{STATUT_LABEL[statut] || statut}</Badge>;
}

const ETAT_COLORS: Record<ItemEtat, string> = {
  bon: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
  usage: "bg-amber-500/20 text-amber-600 border-amber-500/30",
  casse: "bg-red-500/20 text-red-600 border-red-500/30",
  manquant: "bg-rose-500/20 text-rose-600 border-rose-500/30",
  a_reparer: "bg-orange-500/20 text-orange-600 border-orange-500/30",
};
export function ItemEtatBadge({ etat }: { etat: ItemEtat }) {
  return <Badge className={ETAT_COLORS[etat] || ""}>{ITEM_ETAT_LABEL[etat] || etat}</Badge>;
}

const TYPE_COLORS: Record<MouvementType, string> = {
  affectation: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  decharge: "bg-indigo-500/20 text-indigo-600 border-indigo-500/30",
  passation: "bg-purple-500/20 text-purple-600 border-purple-500/30",
  restitution: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
};
export function MouvementTypeBadge({ type }: { type: MouvementType }) {
  return <Badge className={TYPE_COLORS[type] || ""}>{MOUVEMENT_TYPE_LABEL[type] || type}</Badge>;
}

const MV_STATUT: Record<MouvementStatut, string> = {
  brouillon: "bg-slate-500/20 text-slate-600 border-slate-500/30",
  valide: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  signe: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
  annule: "bg-red-500/20 text-red-600 border-red-500/30",
};
const MV_STATUT_LABEL: Record<MouvementStatut, string> = {
  brouillon: "Brouillon", valide: "Validé", signe: "Signé", annule: "Annulé",
};
export function MouvementStatutBadge({ statut }: { statut: MouvementStatut }) {
  return <Badge className={MV_STATUT[statut] || ""}>{MV_STATUT_LABEL[statut] || statut}</Badge>;
}
