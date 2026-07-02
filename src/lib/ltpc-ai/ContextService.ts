// ContextService — construit le contexte automatique à partir de la route active.
import { supabase } from "@/integrations/supabase/client";
import type { AIContext } from "./types";

interface RouteMatch { entity_type: string; entity_id: string }

const PATTERNS: Array<{ regex: RegExp; entity: string }> = [
  { regex: /^\/intervenant\/chantiers\/([0-9a-f-]{36})/i, entity: "chantier" },
  { regex: /^\/intervenant\/clients\/([0-9a-f-]{36})/i, entity: "client" },
  { regex: /^\/essais\/rapports-techniques\/([0-9a-f-]{36})/i, entity: "rapport_technique" },
];

function matchRoute(pathname: string): RouteMatch | null {
  for (const { regex, entity } of PATTERNS) {
    const m = pathname.match(regex);
    if (m) return { entity_type: entity, entity_id: m[1] };
  }
  return null;
}

async function enrichEntity(match: RouteMatch): Promise<Record<string, unknown>> {
  switch (match.entity_type) {
    case "chantier": {
      const [{ data: chantier }, { data: essais }, { data: rapports }, { data: formulations }] = await Promise.all([
        supabase.from("chantiers").select("id, nom, adresse, ville, statut, client_id").eq("id", match.entity_id).maybeSingle(),
        supabase.from("echantillons_compression").select("id, numero, ouvrage, classe_resistance, statut").eq("chantier_id", match.entity_id).limit(20),
        supabase.from("rapports_techniques").select("id, numero, titre, statut").eq("chantier_id", match.entity_id).limit(20),
        supabase.from("formulations").select("id, nom, resistance_28j").eq("chantier_id", match.entity_id).limit(20),
      ]);
      return { chantier, essais_count: essais?.length ?? 0, rapports_count: rapports?.length ?? 0, essais, rapports, formulations };
    }
    case "client": {
      const [{ data: client }, { data: chantiers }] = await Promise.all([
        supabase.from("clients").select("id, nom, ville, contact, telephone").eq("id", match.entity_id).maybeSingle(),
        supabase.from("chantiers").select("id, nom, ville").eq("client_id", match.entity_id).limit(20),
      ]);
      return { client, chantiers };
    }
    case "rapport_technique": {
      const { data } = await supabase.from("rapports_techniques").select("id, numero, titre, statut, entreprise, projet, chantier_id, client_id").eq("id", match.entity_id).maybeSingle();
      return { rapport: data };
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
