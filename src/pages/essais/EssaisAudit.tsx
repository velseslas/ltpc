import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye, Undo2, Loader2, History, Trash2, Search, ArrowUpDown, FilterX } from "lucide-react";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDeletedEssais, useRestoreDeletedEssai, DeletedEssaiEntry } from "@/hooks/useDeletedEssais";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { AuditEssaiViewer } from "@/components/audit/AuditEssaiViewer";

type ModuleKey = "beton" | "granulat" | "geotechnique" | "formulation";

const TABLE_META: Record<string, { label: string; prefix: string; module: ModuleKey; path: (id: string) => string }> = {
  // Béton frais
  echantillons_affaissement:    { label: "Affaissement",          prefix: "AFF",  module: "beton", path: (id) => `/essais/beton/beton-frais/affaissement/${id}` },
  echantillons_temperature:     { label: "Température",           prefix: "TMP",  module: "beton", path: (id) => `/essais/beton/beton-frais/temperature/${id}` },
  echantillons_temps_prise:     { label: "Temps de prise",        prefix: "TPS",  module: "beton", path: (id) => `/essais/beton/beton-frais/temps-prise/${id}` },
  echantillons_teneur_air:      { label: "Teneur en air",         prefix: "AIR",  module: "beton", path: (id) => `/essais/beton/beton-frais/teneur-air/${id}` },
  // Béton durci
  echantillons_compression:     { label: "Compression",           prefix: "CMP",  module: "beton", path: (id) => `/essais/beton/beton-durci/compression/${id}` },
  echantillons_traction_fendage:{ label: "Traction par fendage",  prefix: "TRF",  module: "beton", path: (id) => `/essais/beton/beton-durci/traction-fendage/${id}` },
  echantillons_module_elasticite:{ label: "Module d'élasticité",  prefix: "MOD",  module: "beton", path: (id) => `/essais/beton/beton-durci/module-elasticite/${id}` },
  echantillons_permeabilite:    { label: "Perméabilité",          prefix: "PRM",  module: "beton", path: (id) => `/essais/beton/beton-durci/permeabilite/${id}` },
  echantillons_carottage:       { label: "Carottage",             prefix: "CAR",  module: "beton", path: (id) => `/essais/beton/beton-durci/carottage/${id}` },
  // Béton NDT
  echantillons_ultrason:        { label: "Ultrason",              prefix: "ULT",  module: "beton", path: (id) => `/essais/beton/ndt/ultrason/${id}` },
  echantillons_sclerometre:     { label: "Scléromètre",           prefix: "SCL",  module: "beton", path: (id) => `/essais/beton/ndt/sclerometre/${id}` },
  formulations:                 { label: "Formulation",           prefix: "FRM",  module: "formulation", path: (id) => `/producteurs/formulation/${id}` },
  // Granulat
  echantillons_granulometrie:   { label: "Granulométrie",         prefix: "GRN",  module: "granulat", path: (id) => `/essais/granulat/identification/granulometrie/${id}` },
  echantillons_equivalent_sable:{ label: "Équivalent de sable",   prefix: "ES",   module: "granulat", path: (id) => `/essais/granulat/proprete/equivalent-sable/${id}` },
  echantillons_bleu_methylene:  { label: "Bleu de méthylène",     prefix: "MB",   module: "granulat", path: (id) => `/essais/granulat/proprete/bleu-methylene/${id}` },
  echantillons_matiere_organique:{label: "Matière organique",     prefix: "MO",   module: "granulat", path: (id) => `/essais/granulat/proprete/matiere-organique/${id}` },
  echantillons_los_angeles:     { label: "Los Angeles",           prefix: "LA",   module: "granulat", path: (id) => `/essais/granulat/mecaniques/los-angeles/${id}` },
  echantillons_micro_deval:     { label: "Micro Deval",           prefix: "MDE",  module: "granulat", path: (id) => `/essais/granulat/mecaniques/micro-deval/${id}` },
  echantillons_friabilite:      { label: "Friabilité",            prefix: "FR",   module: "granulat", path: (id) => `/essais/granulat/mecaniques/friabilite/${id}` },
  echantillons_ecrasement:      { label: "Écrasement",            prefix: "ECR",  module: "granulat", path: (id) => `/essais/granulat/mecaniques/ecrasement/${id}` },
  echantillons_forme_granulats: { label: "Forme des granulats",   prefix: "FRM",  module: "granulat", path: (id) => `/essais/granulat/identification/forme/${id}` },
  echantillons_masse_volumique: { label: "Masse volumique",       prefix: "MV",   module: "granulat", path: (id) => `/essais/granulat/identification/masse-volumique/${id}` },
  echantillons_teneur_eau:      { label: "Teneur en eau",         prefix: "TE",   module: "granulat", path: (id) => `/essais/granulat/identification/teneur-eau/${id}` },
  // Géotechnique
  echantillons_classification_sol:{label:"Classification sol",    prefix: "CLS",  module: "geotechnique", path: (id) => `/essais/geotechnique/identification/classification-sol/${id}` },
  echantillons_limites_atterberg:{label:"Limites d'Atterberg",    prefix: "ATT",  module: "geotechnique", path: (id) => `/essais/geotechnique/identification/limites-atterberg/${id}` },
  echantillons_teneur_eau_sol:  { label: "Teneur eau sol",        prefix: "TES",  module: "geotechnique", path: (id) => `/essais/geotechnique/identification/teneur-eau-sol/${id}` },
  echantillons_granulometrie_sol:{label:"Granulométrie sol",      prefix: "GRS",  module: "geotechnique", path: (id) => `/essais/geotechnique/identification/granulometrie-sol/${id}` },
  echantillons_proctor_normal:  { label: "Proctor normal",        prefix: "PRN",  module: "geotechnique", path: (id) => `/essais/geotechnique/compactage/proctor-normal/${id}` },
  echantillons_proctor_modifie: { label: "Proctor modifié",       prefix: "PRM",  module: "geotechnique", path: (id) => `/essais/geotechnique/compactage/proctor-modifie/${id}` },
  echantillons_cbr:             { label: "CBR",                   prefix: "CBR",  module: "geotechnique", path: (id) => `/essais/geotechnique/compactage/cbr/${id}` },
  echantillons_densite_place:   { label: "Densité en place",      prefix: "DP",   module: "geotechnique", path: (id) => `/essais/geotechnique/compactage/densite-place/${id}` },
  echantillons_cisaillement:    { label: "Cisaillement",          prefix: "CIS",  module: "geotechnique", path: (id) => `/essais/geotechnique/mecanique/cisaillement/${id}` },
  echantillons_compression_simple:{label:"Compression simple",    prefix: "CSI",  module: "geotechnique", path: (id) => `/essais/geotechnique/mecanique/compression-simple/${id}` },
  echantillons_triaxial:        { label: "Triaxial",              prefix: "TRX",  module: "geotechnique", path: (id) => `/essais/geotechnique/mecanique/triaxial/${id}` },
  echantillons_oedometrique:    { label: "Œdométrique",           prefix: "OED",  module: "geotechnique", path: (id) => `/essais/geotechnique/mecanique/oedometrique/${id}` },
  echantillons_penetrometre:    { label: "Pénétromètre",          prefix: "PEN",  module: "geotechnique", path: (id) => `/essais/geotechnique/in-situ/penetrometre/${id}` },
  echantillons_pressiometre:    { label: "Pressiomètre",          prefix: "PRE",  module: "geotechnique", path: (id) => `/essais/geotechnique/in-situ/pressiometre/${id}` },
  echantillons_plaque:          { label: "Plaque",                prefix: "PLQ",  module: "geotechnique", path: (id) => `/essais/geotechnique/in-situ/plaque/${id}` },
  echantillons_sondage:         { label: "Sondage",               prefix: "SND",  module: "geotechnique", path: (id) => `/essais/geotechnique/in-situ/sondage/${id}` },
  echantillons_densitometre:    { label: "Densitomètre",          prefix: "DEN",  module: "geotechnique", path: (id) => `/essais/geotechnique/in-situ/densitometre/${id}` },
};

const MODULE_LABELS: Record<ModuleKey, string> = {
  beton: "Béton",
  granulat: "Granulat",
  geotechnique: "Géotechnique",
  formulation: "Formulation",
};

function metaFor(tableName: string) {
  return TABLE_META[tableName] || { label: tableName, prefix: "ECH", module: "beton" as ModuleKey, path: (_id: string) => "/essais" };
}

function formatNumero(entry: DeletedEssaiEntry) {
  const meta = metaFor(entry.table_name);
  const num = entry.numero ?? entry.record_data?.numero;
  if (!num) return meta.prefix;
  return `${meta.prefix}-${String(num).padStart(3, "0")}`;
}

const HIDDEN_FIELDS = new Set(["id", "created_at", "updated_at"]);

const EssaisAudit = () => {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const { data: entries, isLoading } = useDeletedEssais();
  const restore = useRestoreDeletedEssai();

  const [search, setSearch] = useState("");
  const [showRestored, setShowRestored] = useState(false);
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [sortKey, setSortKey] = useState<"deleted_at" | "table_name" | "numero">("deleted_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [viewing, setViewing] = useState<DeletedEssaiEntry | null>(null);

  const tableOptions = useMemo(() => {
    const set = new Set<string>();
    (entries || []).forEach((e) => {
      const m = metaFor(e.table_name);
      if (moduleFilter === "all" || m.module === moduleFilter) {
        set.add(e.table_name);
      }
    });
    return Array.from(set).sort((a, b) => metaFor(a).label.localeCompare(metaFor(b).label));
  }, [entries, moduleFilter]);

  const filtered = useMemo(() => {
    let list = (entries || []).filter((e) => {
      if (!showRestored && e.restored_at) return false;
      const meta = metaFor(e.table_name);
      if (moduleFilter !== "all" && meta.module !== moduleFilter) return false;
      if (tableFilter !== "all" && e.table_name !== tableFilter) return false;
      if (dateFrom && new Date(e.deleted_at) < new Date(dateFrom)) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (new Date(e.deleted_at) > end) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = [
          meta.label,
          formatNumero(e),
          e.deleted_by_name || "",
          e.essai_label || "",
          String(e.numero ?? ""),
        ].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "deleted_at") {
        cmp = new Date(a.deleted_at).getTime() - new Date(b.deleted_at).getTime();
      } else if (sortKey === "table_name") {
        cmp = metaFor(a.table_name).label.localeCompare(metaFor(b.table_name).label);
      } else if (sortKey === "numero") {
        cmp = (a.numero ?? 0) - (b.numero ?? 0);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [entries, showRestored, moduleFilter, tableFilter, dateFrom, dateTo, search, sortKey, sortDir]);

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Accès réservé aux administrateurs.
        </CardContent>
      </Card>
    );
  }

  const activeCount = (entries || []).filter((e) => !e.restored_at).length;

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setModuleFilter("all");
    setTableFilter("all");
    setDateFrom("");
    setDateTo("");
    setSortKey("deleted_at");
    setSortDir("desc");
  };

  const viewingMeta = viewing ? metaFor(viewing.table_name) : null;

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
        <CardHeader className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trash2 className="h-5 w-5 text-destructive" />
              Essais supprimés
              <Badge variant="secondary">{activeCount}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={showRestored ? "default" : "outline"}
                size="sm"
                onClick={() => setShowRestored((v) => !v)}
              >
                <History className="h-4 w-4 mr-1" />
                {showRestored ? "Masquer restaurés" : "Voir restaurés"}
              </Button>
              <Button variant="ghost" size="sm" onClick={resetFilters} title="Réinitialiser les filtres">
                <FilterX className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par référence, type, utilisateur…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={moduleFilter} onValueChange={(v) => { setModuleFilter(v); setTableFilter("all"); }}>
              <SelectTrigger><SelectValue placeholder="Module" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les modules</SelectItem>
                <SelectItem value="beton">Béton</SelectItem>
                <SelectItem value="granulat">Granulat</SelectItem>
                <SelectItem value="geotechnique">Géotechnique</SelectItem>
                <SelectItem value="formulation">Formulation</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger><SelectValue placeholder="Type d'essai" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {tableOptions.map((t) => (
                  <SelectItem key={t} value={t}>{metaFor(t).label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-xs"
                title="Date suppression — depuis"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-xs"
                title="Date suppression — jusqu'à"
              />
            </div>
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
              Aucun essai correspondant
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button onClick={() => toggleSort("numero")} className="inline-flex items-center gap-1 hover:text-foreground">
                        Numéro <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button onClick={() => toggleSort("table_name")} className="inline-flex items-center gap-1 hover:text-foreground">
                        Type d'essai <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Supprimé par</TableHead>
                    <TableHead>
                      <button onClick={() => toggleSort("deleted_at")} className="inline-flex items-center gap-1 hover:text-foreground">
                        Date suppression <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
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
                        <TableCell><Badge variant="outline">{MODULE_LABELS[meta.module]}</Badge></TableCell>
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewing(entry)}
                              className="gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              Voir essai
                            </Button>
                            {isRestored ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(meta.path(entry.record_id))}
                                className="gap-1"
                              >
                                Ouvrir
                              </Button>
                            ) : (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" className="gap-1" disabled={restore.isPending}>
                                    <Undo2 className="h-4 w-4" />
                                    Restaurer
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Restaurer cet essai ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      L'essai <strong>{formatNumero(entry)}</strong> ({meta.label}) sera réinséré
                                      avec ses données d'origine. Cette action peut être annulée en supprimant à nouveau l'essai.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => restore.mutate(entry.id)}>
                                      Confirmer la restauration
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

      {/* Drawer : voir l'essai supprimé */}
      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {viewing && formatNumero(viewing)} — {viewingMeta?.label}
            </SheetTitle>
            <SheetDescription>
              {viewing && (
                <span>
                  Supprimé par <strong>{viewing.deleted_by_name || "—"}</strong> le{" "}
                  {format(new Date(viewing.deleted_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                </span>
              )}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 mt-4 pr-4">
            {viewing && <AuditEssaiViewer recordData={viewing.record_data || {}} />}
          </ScrollArea>

          {viewing && !viewing.restored_at && (
            <div className="pt-4 border-t mt-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full gap-2" disabled={restore.isPending}>
                    <Undo2 className="h-4 w-4" />
                    Restaurer cet essai
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Restaurer cet essai ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      L'essai <strong>{formatNumero(viewing)}</strong> ({viewingMeta?.label}) sera réinséré
                      avec ses données d'origine.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        restore.mutate(viewing.id, {
                          onSuccess: () => setViewing(null),
                        });
                      }}
                    >
                      Confirmer la restauration
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default EssaisAudit;
