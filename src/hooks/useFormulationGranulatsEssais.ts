import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GranulatEssais {
  // Identification
  carriere_id: string | null;
  carriere_nom: string | null;
  produit_nom: string | null;
  // Granulométrie (tamis: [{ouverture, passant, ...}], teneur_fines_f, module_finesse)
  granulometrie: any | null;
  // ES
  es_moyen: number | null;
  esv_moyen: number | null;
  // MB
  valeur_mb: number | null;
  // LA
  coefficient_la: number | null;
  // Masse volumique (densité absolue)
  densite_absolue: number | null;
  densite_apparente: number | null;
}

export interface FormulationGranulatsEssais {
  sable_concasse: GranulatEssais | null;
  sable_fin: GranulatEssais | null;
  gravillons1: GranulatEssais | null;
  gravier2: GranulatEssais | null;
  gravier3: GranulatEssais | null;
}

async function fetchProduitNom(id: string | null): Promise<string | null> {
  if (!id) return null;
  const { data } = await supabase.from("produits").select("nom").eq("id", id).maybeSingle();
  return data?.nom || null;
}

async function fetchCarriere(id: string | null) {
  if (!id) return { nom: null as string | null };
  const { data } = await supabase.from("carrieres").select("nom").eq("id", id).maybeSingle();
  return { nom: data?.nom || null };
}

async function fetchLatest(table: string, carriere_id: string | null, produit_nom: string | null) {
  if (!carriere_id || !produit_nom) return null;
  const { data } = await (supabase as any)
    .from(table)
    .select("resultats, created_at")
    .eq("carriere_id", carriere_id)
    .eq("produit", produit_nom)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.resultats || null;
}

async function buildGranulat(
  carriere_id: string | null,
  produit_id: string | null
): Promise<GranulatEssais | null> {
  if (!carriere_id && !produit_id) return null;
  const [produit_nom, carriere] = await Promise.all([
    fetchProduitNom(produit_id),
    fetchCarriere(carriere_id),
  ]);

  const [granulo, es, mb, la, mv] = await Promise.all([
    fetchLatest("echantillons_granulometrie", carriere_id, produit_nom),
    fetchLatest("echantillons_equivalent_sable", carriere_id, produit_nom),
    fetchLatest("echantillons_bleu_methylene", carriere_id, produit_nom),
    fetchLatest("echantillons_los_angeles", carriere_id, produit_nom),
    fetchLatest("echantillons_masse_volumique", carriere_id, produit_nom),
  ]);

  // Masse volumique can be stored under sable.* or gravier.*
  const mvNode = mv?.sable || mv?.gravier || mv;

  return {
    carriere_id,
    carriere_nom: carriere.nom,
    produit_nom,
    granulometrie: granulo,
    es_moyen: es?.es_moyen ?? null,
    esv_moyen: es?.esv_moyen ?? null,
    valeur_mb: mb?.valeur_mb ?? null,
    coefficient_la: la?.coefficient_la ?? null,
    densite_absolue: mvNode?.densite_seche ?? mvNode?.densite_absolue ?? null,
    densite_apparente: mvNode?.densite_humide ?? mvNode?.densite_apparente ?? null,
  };
}

export function useFormulationGranulatsEssais(formulationId: string | null | undefined) {
  return useQuery({
    queryKey: ["formulation-granulats-essais", formulationId],
    queryFn: async (): Promise<FormulationGranulatsEssais | null> => {
      if (!formulationId) return null;
      const { data: f } = await supabase
        .from("formulations")
        .select(`
          sable_concasse_producteur_id, sable_concasse_produit_id,
          sable_fin_producteur_id, sable_fin_produit_id,
          gravillons1_producteur_id, gravillons1_produit_id,
          gravier2_producteur_id, gravier2_produit_id,
          gravier3_producteur_id, gravier3_produit_id
        `)
        .eq("id", formulationId)
        .maybeSingle();
      if (!f) return null;

      const [sable_concasse, sable_fin, gravillons1, gravier2, gravier3] = await Promise.all([
        buildGranulat(f.sable_concasse_producteur_id, f.sable_concasse_produit_id),
        buildGranulat(f.sable_fin_producteur_id, f.sable_fin_produit_id),
        buildGranulat(f.gravillons1_producteur_id, f.gravillons1_produit_id),
        buildGranulat(f.gravier2_producteur_id, f.gravier2_produit_id),
        buildGranulat(f.gravier3_producteur_id, f.gravier3_produit_id),
      ]);

      return { sable_concasse, sable_fin, gravillons1, gravier2, gravier3 };
    },
    enabled: !!formulationId,
  });
}
