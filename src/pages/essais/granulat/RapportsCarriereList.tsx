import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Plus, Search, Loader2, FileText, MoreHorizontal, Mountain, Eye, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { EchantillonPagination } from "@/components/essais/EchantillonPagination";
import { useCarrieres } from "@/hooks/useCarrieres";

const ITEMS_PER_PAGE = 10;

const TABLES_ESSAIS = [
  "echantillons_granulometrie",
  "echantillons_equivalent_sable",
  "echantillons_bleu_methylene",
  "echantillons_los_angeles",
  "echantillons_micro_deval",
  "echantillons_masse_volumique",
];

interface DatesCarriere {
  dateReception: string | null;
  dateRapport: string | null;
}

/** Dernière date de réception et dernière date de rapport (essai le plus récent) par carrière. */
function useDatesCarrieres() {
  return useQuery({
    queryKey: ["rapport-carriere-dates"],
    queryFn: async () => {
      const map = new Map<string, DatesCarriere>();
      const rows = await Promise.all(
        TABLES_ESSAIS.map(async (table) => {
          const { data } = await (supabase as any)
            .from(table)
            .select("carriere_id, date_reception, created_at");
          return (data || []) as { carriere_id: string | null; date_reception: string | null; created_at: string | null }[];
        })
      );
      for (const rowsForTable of rows) {
        for (const r of rowsForTable) {
          if (!r.carriere_id) continue;
          const entry = map.get(r.carriere_id) ?? { dateReception: null, dateRapport: null };
          if (r.date_reception && (!entry.dateReception || r.date_reception > entry.dateReception)) {
            entry.dateReception = r.date_reception;
          }
          if (r.created_at && (!entry.dateRapport || r.created_at > entry.dateRapport)) {
            entry.dateRapport = r.created_at;
          }
          map.set(r.carriere_id, entry);
        }
      }
      return map;
    },
  });
}

const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy", { locale: fr });
  } catch {
    return "—";
  }
};

const RapportsCarriereList = () => {
  const navigate = useNavigate();
  const { data: carrieres, isLoading } = useCarrieres();
  const { data: datesMap } = useDatesCarrieres();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = (carrieres || []).filter((c) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      c.nom?.toLowerCase().includes(q) ||
      c.ville?.toLowerCase().includes(q) ||
      c.type_agregat?.toLowerCase().includes(q)
    );
  });

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginated = filtered.slice(startIndex, endIndex);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const goToRapport = (carriereId: string) => {
    navigate(`/essais/granulat/rapport-carriere/generer?carriere=${carriereId}`);
  };

  return (
    <>
      <EssaiBreadcrumb items={[
        { label: "Granulat", path: "/essais/granulat" },
        { label: "Rapport Carrière" },
      ]} />

      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/essais/granulat")}
            className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Rapport <span className="text-primary text-glow">Carrière</span>
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 ml-14">
          Sélectionnez une carrière pour générer la synthèse de ses essais granulats
        </p>
      </div>

      {/* Search and Actions Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6 items-start lg:items-center justify-between">
        <div className="relative flex-1 min-w-0 w-full lg:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une carrière, une wilaya..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          className="gradient-primary text-primary-foreground"
          onClick={() => navigate("/essais/granulat/rapport-carriere/generer")}
        >
          <Plus className="hidden md:inline-block md:mr-2 w-4 h-4" />
          Nouveau rapport
        </Button>
      </div>

      {/* Carrières Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[110px]">N°</TableHead>
                  <TableHead>Carrière</TableHead>
                  <TableHead>Wilaya</TableHead>
                  <TableHead>Date de réception</TableHead>
                  <TableHead>Date rapport</TableHead>
                  <TableHead className="w-[60px] text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((carriere, index) => {
                  const dates = datesMap?.get(carriere.id);
                  return (
                    <TableRow
                      key={carriere.id}
                      className="cursor-pointer"
                      onClick={() => goToRapport(carriere.id)}
                    >
                      <TableCell className="font-medium text-primary">
                        RC-{String(startIndex + index + 1).padStart(3, "0")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/10 flex items-center justify-center shrink-0">
                            <Mountain className="h-4 w-4 text-violet-500" />
                          </div>
                          <span className="font-semibold text-foreground">{carriere.nom}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {carriere.ville || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {fmtDate(dates?.dateReception)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {fmtDate(dates?.dateRapport)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/intervenant/producteurs/carriere/${carriere.id}`);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Détails
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                goToRapport(carriere.id);
                              }}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Rapport
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/intervenant/producteurs/carriere/${carriere.id}/modifier`);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {paginated.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucune carrière trouvée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <EchantillonPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
        />
      </div>
    </>
  );
};

export default RapportsCarriereList;
