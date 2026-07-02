// ContextService — construit le contexte automatique à partir de la route active.
// Aujourd'hui : parse d'URL + fetch d'entités liées. Demain : hook global qui enregistre
// la dernière entité consultée (chantier, formulation, rapport) dans un store.
import { supabase } from "@/integrations/supabase/client";
import type { AIContext } from "./types";

interface RouteMatch {
  entity_type: string;
  entity_id: string;
}

const PATTERNS: Array<{ regex: RegExp; entity: string }> = [
  { regex: /^\/intervenant\/chantiers\/([0-9a-f-]{36})/i, entity: "chantier" },
  { regex: /^\/intervenant\/clients\/([0-9a-f-]{36})/i, entity: "client" },
  { regex: /^\/essais\/rapports-techniques\/([0-9a-f-]{36})/i, entity: "rapport_technique" },
  { regex: /^\/materiel\/[^/]+\/([0-9a-f-]{36})/i, entity: "materiel" },
];

function matchRoute(pathname: string): RouteMatch | null {
  for (const { regex, entity } of PATTERNS) {
    const m = pathname.match(regex);
    if (m) return { entity_type: entity, entity_id: m[1] };
  }
  return null;
}

async function enrichEntity(match: RouteMatch): Promise<Record<string, unknown>> {
  const { entity_type, entity_id } = match;
  switch (entity_type) {
    case "chantier": {
      const [{ data: chantier }, { data: essais }, { data: rapports }] = await Promise.all([
        supabase.from("chantiers").select("id, nom, code, wilaya, client_id, adresse").eq("id", entity_id).maybeSingle(),
        supabase.from("echantillons_compression").select("id, formulation, resistance_visee").eq("chantier_id", entity_id).limit(20),
        supabase.from("rapports_techniques").select("id, numero, titre, statut").eq("chantier_id", entity_id).limit(20),
      ]);
      return { chantier, essais_count: essais?.length ?? 0, rapports_count: rapports?.length ?? 0, essais, rapports };
    }
    case "client": {
      const { data: client } = await supabase.from("clients").select("id, raison_sociale, code, wilaya").eq("id", entity_id).maybeSingle();
      const { data: chantiers } = await supabase.from("chantiers").select("id, nom, code").eq("client_id", entity_id).limit(20);
      return { client, chantiers };
    }
    case "rapport_technique": {
      const { data } = await supabase.from("rapports_techniques").select("*").eq("id", entity_id).maybeSingle();
      return { rapport: data };
    }
    case "materiel": {
      const { data } = await supabase.from("materiel_laboratoire").select("*").eq("id", entity_id).maybeSingle();
      return { materiel: data };
    }
    default: return {};
  }
}

export const ContextService = {
  async fromRoute(pathname: string): Promise<AIContext> {
    const match = matchRoute(pathname);
    if (!match) return { route: pathname, data: {} };
    const data = await enrichEntity(match);
    return { route: pathname, entity_type: match.entity_type, entity_id: match.entity_id, data };
  },
};
