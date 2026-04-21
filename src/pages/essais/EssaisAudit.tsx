import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye, Undo2, Loader2, History, Trash2, Search } from "lucide-react";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDeletedEssais, useRestoreDeletedEssai, DeletedEssaiEntry } from "@/hooks/useDeletedEssais";
import { useIsAdmin } from "@/hooks/useIsAdmin";

// Map table_name -> { label, prefix, viewPath(id) }
const TABLE_META: Record<string, { label: string; prefix: string; path: (id: string) => string }> = {
  // Béton frais
  echantillons_affaissement:    { label: "Affaissement",          prefix: "AFF",  path: (id) => `/essais/beton/beton-frais/affaissement/${id}` },
  echantillons_temperature:     { label: "Température",           prefix: "TMP",  path: (id) => `/essais/beton/beton-frais/temperature/${id}` },
  echantillons_temps_prise:     { label: "Temps de prise",        prefix: "TPS",  path: (id) => `/essais/beton/beton-frais/temps-prise/${id}` },
  echantillons_teneur_air:      { label: "Teneur en air",         prefix: "AIR",  path: (id) => `/essais/beton/beton-frais/teneur-air/${id}` },
  // Béton durci
  echantillons_compression:     { label: "Compression",           prefix: "CMP",  path: (id) => `/essais/beton/beton-durci/compression/${id}` },
  echantillons_traction_fendage:{ label: "Traction par fendage",  prefix: "TRF",  path: (id) => `/essais/beton/beton-durci/traction-fendage/${id}` },
  echantillons_module_elasticite:{ label: "Module d'élasticité",  prefix: "MOD",  path: (id) => `/essais/beton/beton-durci/module-elasticite/${id}` },
  echantillons_permeabilite:    { label: "Perméabilité",          prefix: "PRM",  path: (id) => `/essais/beton/beton-durci/permeabilite/${id}` },
  echantillons_carottage:       { label: "Carottage",             prefix: "CAR",  path: (id) => `/essais/beton/beton-durci/carottage/${id}` },
  // Béton NDT
  echantillons_ultrason:        { label: "Ultrason",              prefix: "ULT",  path: (id) => `/essais/beton/ndt/ultrason/${id}` },
  echantillons_sclerometre:     { label: "Scléromètre",           prefix: "SCL",  path: (id) => `/essais/beton/ndt/sclerometre/${id}` },
  formulations:                 { label: "Formulation",           prefix: "FRM",  path: (id) => `/producteurs/formulation/${id}` },
  // Granulat
  echantillons_granulometrie:   { label: "Granulométrie",         prefix: "GRN",  path: (id) => `/essais/granulat/identification/granulometrie/${id}` },
  echantillons_equivalent_sable:{ label: "Équivalent de sable",   prefix: "ES",   path: (id) => `/essais/granulat/proprete/equivalent-sable/${id}` },
  echantillons_bleu_methylene:  { label: "Bleu de méthylène",     prefix: "MB",   path: (id) => `/essais/granulat/proprete/bleu-methylene/${id}` },
  echantillons_matiere_organique:{label: "Matière organique",     prefix: "MO",   path: (id) => `/essais/granulat/proprete/matiere-organique/${id}` },
  echantillons_los_angeles:     { label: "Los Angeles",           prefix: "LA",   path: (id) => `/essais/granulat/mecaniques/los-angeles/${id}` },
  echantillons_micro_deval:     { label: "Micro Deval",           prefix: "MDE",  path: (id) => `/essais/granulat/mecaniques/micro-deval/${id}` },
  echantillons_friabilite:      { label: "Friabilité",            prefix: "FR",   path: (id) => `/essais/granulat/mecaniques/friabilite/${id}` },
  echantillons_ecrasement:      { label: "Écrasement",            prefix: "ECR",  path: (id) => `/essais/granulat/mecaniques/ecrasement/${id}` },
  echantillons_forme_granulats: { label: "Forme des granulats",   prefix: "FRM",  path: (id) => `/essais/granulat/identification/forme/${id}` },
  echantillons_masse_volumique: { label: "Masse volumique",       prefix: "MV",   path: (id) => `/essais/granulat/identification/masse-volumique/${id}` },
  echantillons_teneur_eau:      { label: "Teneur en eau",         prefix: "TE",   path: (id) => `/essais/granulat/identification/teneur-eau/${id}` },
  // Géotechnique
  echantillons_classification_sol:{label:"Classification sol",    prefix: "CLS",  path: (id) => `/essais/geotechnique/identification/classification-sol/${id}` },
  echantillons_limites_atterberg:{label:"Limites d'Atterberg",    prefix: "ATT",  path: (id) => `/essais/geotechnique/identification/limites-atterberg/${id}` },
  echantillons_teneur_eau_sol:  { label: "Teneur eau sol",        prefix: "TES",  path: (id) => `/essais/geotechnique/identification/teneur-eau-sol/${id}` },
  echantillons_granulometrie_sol:{label:"Granulométrie sol",      prefix: "GRS",  path: (id) => `/essais/geotechnique/identification/granulometrie-sol/${id}` },
  echantillons_proctor_normal:  { label: "Proctor normal",        prefix: "PRN",  path: (id) => `/essais/geotechnique/compactage/proctor-normal/${id}` },
  echantillons_proctor_modifie: { label: "Proctor modifié",       prefix: "PRM",  path: (id) => `/essais/geotechnique/compactage/proctor-modifie/${id}` },
  echantillons_cbr:             { label: "CBR",                   prefix: "CBR",  path: (id) => `/essais/geotechnique/compactage/cbr/${id}` },
  echantillons_densite_place:   { label: "Densité en place",      prefix: "DP",   path: (id) => `/essais/geotechnique/compactage/densite-place/${id}` },
  echantillons_cisaillement:    { label: "Cisaillement",          prefix: "CIS",  path: (id) => `/essais/geotechnique/mecanique/cisaillement/${id}` },
  echantillons_compression_simple:{label:"Compression simple",    prefix: "CSI",  path: (id) => `/essais/geotechnique/mecanique/compression-simple/${id}` },
  echantillons_triaxial:        { label: "Triaxial",              prefix: "TRX",  path: (id) => `/essais/geotechnique/mecanique/triaxial/${id}` },
  echantillons_oedometrique:    { label: "Œdométrique",           prefix: "OED",  path: (id) => `/essais/geotechnique/mecanique/oedometrique/${id}` },
  echantillons_penetrometre:    { label: "Pénétromètre",          prefix: "PEN",  path: (id) => `/essais/geotechnique/in-situ/penetrometre/${id}` },
  echantillons_pressiometre:    { label: "Pressiomètre",          prefix: "PRE",  path: (id) => `/essais/geotechnique/in-situ/pressiometre/${id}` },
  echantillons_plaque:          { label: "Plaque",                prefix: "PLQ",  path: (id) => `/essais/geotechnique/in-situ/plaque/${id}` },
  echantillons_sondage:         { label: "Sondage",               prefix: "SND",  path: (id) => `/essais/geotechnique/in-situ/sondage/${id}` },
  echantillons_densitometre:    { label: "Densitomètre",          prefix: "DEN",  path: (id) => `/essais/geotechnique/in-situ/densitometre/${id}` },
};

function metaFor(tableName: string) {
  return TABLE_META[tableName] || { label: tableName, prefix: "ECH", path: (_id: string) => "/essais" };
}

function formatNumero(entry: DeletedEssaiEntry) {
  const meta = metaFor(entry.table_name);
  const num = entry.numero ?? entry.record_data?.numero;
  if (!num) return meta.prefix;
  return `${meta.prefix}-${String(num).padStart(3, "0")}`;
}

const EssaisAudit = () => {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const { data: entries, isLoading } = useDeletedEssais();
  const restore = useRestoreDeletedEssai();
  const [search, setSearch] = useState("");
  const [showRestored, setShowRestored] = useState(false);

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Accès réservé aux administrateurs.
        </CardContent>
      </Card>
    );
  }

  const filtered = (entries || []).filter((e) => {
    if (!showRestored && e.restored_at) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const meta = metaFor(e.table_name);
    return (
      meta.label.toLowerCase().includes(q) ||
      formatNumero(e).toLowerCase().includes(q) ||
      (e.deleted_by_name || "").toLowerCase().includes(q)
    );
  });

  const activeCount = (entries || []).filter((e) => !e.restored_at).length;

  return (
    <>
      <AppBreadcrumb items={[{ label: "Essais", path: "/essais" }, { label: "Audit" }]} />

      <div className="mb-6 flex items-center gap-3">
        <BackButton to="/essais" />
        <div>
          <h1 className="text-3xl font-display font-bold">
            Audit des <span className="text-primary text-glow">Essais</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Liste des essais supprimés — restauration possible par les administrateurs
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trash2 className="h-5 w-5 text-destructive" />
            Essais supprimés
            <Badge variant="secondary">{activeCount}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Button
              variant={showRestored ? "default" : "outline"}
              size="sm"
              onClick={() => setShowRestored((v) => !v)}
            >
              <History className="h-4 w-4 mr-1" />
              {showRestored ? "Masquer restaurés" : "Voir restaurés"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Trash2 className="h-10 w-10 mx-auto mb-2 opacity-40" />
              Aucun essai supprimé
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Type d'essai</TableHead>
                    <TableHead>Supprimé par</TableHead>
                    <TableHead>Date suppression</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((entry) => {
                    const meta = metaFor(entry.table_name);
                    const isRestored = !!entry.restored_at;
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-xs">{formatNumero(entry)}</TableCell>
                        <TableCell>{meta.label}</TableCell>
                        <TableCell className="text-sm">{entry.deleted_by_name || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(entry.deleted_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          {isRestored ? (
                            <Badge variant="secondary" className="gap-1">
                              <Undo2 className="h-3 w-3" /> Restauré
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Supprimé</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {isRestored && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(meta.path(entry.record_id))}
                                className="gap-1"
                              >
                                <Eye className="h-4 w-4" />
                                Voir
                              </Button>
                            )}
                            {!isRestored && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" className="gap-1">
                                    <Undo2 className="h-4 w-4" />
                                    Restaurer
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Restaurer cet essai ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      L'essai <strong>{formatNumero(entry)}</strong> ({meta.label}) sera réinséré
                                      avec ses données d'origine.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => restore.mutate(entry.id)}>
                                      Restaurer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default EssaisAudit;
