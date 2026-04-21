import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

// Fields to completely hide
const HIDDEN = new Set(["id", "created_at", "updated_at"]);

// Fields that are foreign key UUIDs pointing to named tables
const FK_RESOLVERS: Record<string, { table: string; field: string; label: string }> = {
  client_id:       { table: "clients",          field: "nom",  label: "Entreprise (Client)" },
  chantier_id:     { table: "chantiers",        field: "nom",  label: "Chantier" },
  operateur_id:    { table: "intervenants",     field: "nom",  label: "Opérateur" },
  centrale_id:     { table: "centrales_beton",  field: "nom",  label: "Centrale à béton" },
  carriere_id:     { table: "carrieres",        field: "nom",  label: "Carrière" },
  formulation_id:  { table: "formulations",     field: "numero", label: "Formulation N°" },
  intervenant_id:  { table: "intervenants",     field: "nom",  label: "Intervenant" },
  prestataire_id:  { table: "prestataires",     field: "nom",  label: "Prestataire" },
};

// Human-readable labels for common fields
const FIELD_LABELS: Record<string, string> = {
  numero: "Numéro",
  numero_chantier: "N° Chantier",
  statut: "Statut",
  date_prelevement: "Date de prélèvement",
  date_essai: "Date d'essai",
  date_reception: "Date de réception",
  date_coulage: "Date de coulage",
  produit: "Produit",
  type_sol: "Type de sol",
  ouvrage: "Ouvrage",
  destination_beton: "Destination du béton",
  classe_resistance: "Classe de résistance",
  classe_consistance: "Classe de consistance",
  temperature_air: "Température air (°C)",
  temperature_beton: "Température béton (°C)",
  temperature_ambiante: "Température ambiante (°C)",
  heure_prelevement: "Heure de prélèvement",
  observations: "Observations",
  profondeur: "Profondeur",
  type_eprouvette: "Type d'éprouvette",
  dimension_eprouvette: "Dimension d'éprouvette",
  nombre_eprouvettes: "Nombre d'éprouvettes",
  jours_essai: "Jours d'essai",
  resultats: "Résultats",
  condition_cure: "Condition de cure",
  mode_coulage: "Mode de coulage",
  etuvage: "Étuvage",
  usage: "Usage",
  essai_convenance: "Essai de convenance",
  essai_convenance_details: "Détails convenance",
  mention_eprouvette_client: "Mention éprouvette client",
  mention_info_client: "Mention info client",
  is_laboratoire_chantier: "Laboratoire de chantier",
  localisation: "Localisation",
  partie_ouvrage: "Partie d'ouvrage",
  diametre_carotte: "Diamètre de carotte",
  longueur_carotte: "Longueur de carotte (mm)",
  direction_carottage: "Direction de carottage",
  etat_surface: "État de surface",
  presence_armatures: "Présence d'armatures",
};

function getFieldLabel(key: string): string {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  return key
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}

function formatFieldValue(key: string, value: any): string | JSX.Element {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Oui" : "Non";

  // Date fields
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    try {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        if (value.length <= 10) return format(d, "dd MMM yyyy", { locale: fr });
        return format(d, "dd MMM yyyy à HH:mm", { locale: fr });
      }
    } catch { /* fallthrough */ }
  }

  if (typeof value === "object") {
    return (
      <pre className="bg-muted/40 rounded p-2 text-xs overflow-x-auto whitespace-pre-wrap">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return String(value);
}

interface Props {
  recordData: Record<string, any>;
}

export function AuditEssaiViewer({ recordData }: Props) {
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      const results: Record<string, string> = {};
      const promises: Promise<void>[] = [];

      for (const [fkField, config] of Object.entries(FK_RESOLVERS)) {
        const val = recordData[fkField];
        if (!val || typeof val !== "string") continue;

        promises.push(
          (async () => {
            try {
              const { data } = await (supabase as any)
                .from(config.table)
                .select(config.field)
                .eq("id", val)
                .maybeSingle();
              if (data) {
                const resolved = data[config.field];
                results[fkField] = config.label + (config.field === "numero" ? ` ${resolved}` : `: ${resolved}`);
              }
            } catch {
              // silently skip
            }
          })()
        );
      }

      await Promise.all(promises);
      if (!cancelled) {
        setResolvedNames(results);
        setLoading(false);
      }
    }
    resolve();
    return () => { cancelled = true; };
  }, [recordData]);

  // Separate fields into categories
  const fkFields = Object.keys(FK_RESOLVERS).filter((k) => recordData[k]);
  const regularFields = Object.keys(recordData)
    .filter((k) => !HIDDEN.has(k) && !FK_RESOLVERS[k])
    .sort((a, b) => {
      // Put numero/statut first, resultats/observations last
      const order = ["numero", "numero_chantier", "statut", "produit", "type_sol", "ouvrage"];
      const endOrder = ["observations", "resultats"];
      const aIdx = order.indexOf(a);
      const bIdx = order.indexOf(b);
      const aEnd = endOrder.indexOf(a);
      const bEnd = endOrder.indexOf(b);
      if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
      if (aIdx >= 0) return -1;
      if (bIdx >= 0) return 1;
      if (aEnd >= 0 && bEnd >= 0) return aEnd - bEnd;
      if (aEnd >= 0) return 1;
      if (bEnd >= 0) return -1;
      return getFieldLabel(a).localeCompare(getFieldLabel(b));
    });

  if (loading) {
    return <p className="text-sm text-muted-foreground animate-pulse">Chargement des données…</p>;
  }

  return (
    <div className="space-y-6">
      {/* Section: Relations (clients, chantier, etc.) */}
      {fkFields.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 tracking-wider">
            Identification
          </h4>
          <div className="space-y-1 rounded-lg border border-border/60 bg-muted/20 p-3">
            {fkFields.map((key) => (
              <div key={key} className="flex items-start gap-2 py-1.5">
                <span className="text-sm font-medium min-w-[140px]">
                  {FK_RESOLVERS[key].label}
                </span>
                <span className="text-sm">
                  {resolvedNames[key]
                    ? resolvedNames[key].split(": ").pop() || resolvedNames[key]
                    : <span className="text-muted-foreground italic">Non trouvé</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section: All other fields */}
      <div>
        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 tracking-wider">
          Données de l'essai
        </h4>
        <div className="space-y-0 rounded-lg border border-border/60">
          {regularFields.map((key, i) => {
            const value = recordData[key];
            const rendered = formatFieldValue(key, value);
            return (
              <div
                key={key}
                className={`grid grid-cols-5 gap-2 px-3 py-2.5 ${i > 0 ? "border-t border-border/30" : ""}`}
              >
                <div className="col-span-2 text-xs font-medium text-muted-foreground flex items-start pt-0.5">
                  {getFieldLabel(key)}
                </div>
                <div className="col-span-3 text-sm break-words">
                  {rendered}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
