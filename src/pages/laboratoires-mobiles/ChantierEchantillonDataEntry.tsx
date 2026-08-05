import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, addHours } from "date-fns";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

interface EprouvetteData {
  numero: number;
  joursEssai: number;
  echeanceLabel?: string;
  isHeures?: boolean;
  dateEssai: string;
  /** Échéance théorique (ISO) calculée depuis la date de coulage. */
  echeanceISO?: string;
  poids: number;
  densite: number;
  charge: number;
  resistance: number;
}

/** Convertit "dd/MM/yyyy" ou "dd/MM/yyyy HH:mm" vers la valeur attendue par l'input. */
const toInputValue = (display: string, isHeures?: boolean): string => {
  if (!display) return "";
  const [datePart, timePart] = display.split(" ");
  const [dd, mm, yyyy] = datePart.split("/");
  if (!yyyy) return "";
  if (isHeures) return `${yyyy}-${mm}-${dd}T${timePart || "00:00"}`;
  return `${yyyy}-${mm}-${dd}`;
};

/** Convertit la valeur d'un input vers "dd/MM/yyyy" (+ " HH:mm" si heures). */
const fromInputValue = (value: string, isHeures?: boolean): string => {
  if (!value) return "";
  const [datePart, timePart] = value.split("T");
  const [yyyy, mm, dd] = datePart.split("-");
  if (!dd) return "";
  if (isHeures) return `${dd}/${mm}/${yyyy} ${(timePart || "00:00").slice(0, 5)}`;
  return `${dd}/${mm}/${yyyy}`;
};

/** Convertit "dd/MM/yyyy[ HH:mm]" en Date. */
const parseDisplayDate = (display: string): Date | null => {
  if (!display) return null;
  const [datePart, timePart] = display.split(" ");
  const [dd, mm, yyyy] = datePart.split("/");
  if (!yyyy) return null;
  const [hh, mi] = (timePart || "00:00").split(":");
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh) || 0, Number(mi) || 0);
  return isNaN(d.getTime()) ? null : d;
};

const sortEprouvettesByEcheance = (items: EprouvetteData[]): EprouvetteData[] =>
  [...items].sort((a, b) => {
    if (a.isHeures !== b.isHeures) return a.isHeures ? -1 : 1;
    return a.joursEssai - b.joursEssai || a.numero - b.numero;
  });

export type EcheanceViolation = { numero: number; echeance: string; saisie: string };

/**
 * Retourne les éprouvettes renseignées dont la date d'essai est antérieure
 * à l'échéance théorique d'écrasement.
 */
export const findEcheanceViolations = (items: EprouvetteData[]): EcheanceViolation[] => {
  const violations: EcheanceViolation[] = [];
  for (const ep of items) {
    const hasData = (ep.poids || 0) > 0 || (ep.charge || 0) > 0 || (ep.resistance || 0) > 0;
    if (!hasData || !ep.echeanceISO) continue;
    const saisie = parseDisplayDate(ep.dateEssai);
    if (!saisie) continue;
    const echeance = new Date(ep.echeanceISO);
    if (!ep.isHeures) {
      echeance.setHours(0, 0, 0, 0);
      saisie.setHours(0, 0, 0, 0);
    }
    if (saisie.getTime() < echeance.getTime()) {
      violations.push({
        numero: ep.numero,
        echeance: format(echeance, ep.isHeures ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy"),
        saisie: ep.dateEssai,
      });
    }
  }
  return violations;
};

interface EchantillonData {
  id: string;
  numero: number;
  numero_chantier: number;
  client_nom: string;
  chantier_nom: string;
  ouvrage: string;
  destination_beton: string;
  type_eprouvette: string;
  dimension_eprouvette: string;
  operateur_nom: string;
  date_coulage: string;
  nombre_eprouvettes: number;
  jours_essai: { jour: number; nombre: number }[];
  resultats: EprouvetteData[];
}

const calculateDensity = (poidsGrammes: number, dimension: string): number => {
  if (poidsGrammes <= 0) return 0;
  const match = dimension?.match(/(\d+)/);
  if (!match) return 0;
  let sideMm = parseInt(match[1]);
  if (sideMm < 50) sideMm = sideMm * 10;
  const sideCm = sideMm / 10;
  const volumeCm3 = sideCm * sideCm * sideCm;
  if (volumeCm3 <= 0) return 0;
  return parseFloat((poidsGrammes / volumeCm3).toFixed(2));
};

const calculateResistance = (chargeKN: number, dimension: string): number => {
  if (chargeKN <= 0) return 0;
  const match = dimension?.match(/(\d+)/);
  if (!match) return 0;
  let sideMm = parseInt(match[1]);
  if (sideMm < 50) sideMm = sideMm * 10;
  const areaCm2 = (sideMm / 10) * (sideMm / 10);
  if (areaCm2 <= 0) return 0;
  return parseFloat((chargeKN * 10 / areaCm2).toFixed(2));
};

export default function ChantierEchantillonDataEntry() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { chantierId, echantillonId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [echantillon, setEchantillon] = useState<EchantillonData | null>(null);
  const [eprouvettes, setEprouvettes] = useState<EprouvetteData[]>([]);
  const [echeanceViolations, setEcheanceViolations] = useState<EcheanceViolation[]>([]);

  useEffect(() => {
    const fetchEchantillon = async () => {
      if (!echantillonId) return;
      
      try {
        const { data, error } = await supabase
          .from("echantillons_compression")
          .select(`
            *,
            clients:client_id(nom),
            chantiers:chantier_id(nom),
            intervenants:operateur_id(nom, prenom)
          `)
          .eq("id", echantillonId)
          .single();

        if (error) throw error;

        const joursEssai = (Array.isArray(data.jours_essai) ? data.jours_essai : []) as { jour: number; nombre: number; unite?: string; heures?: number }[];
        const existingResultats = (Array.isArray(data.resultats) ? data.resultats : []) as unknown as EprouvetteData[];

        let eprouvettesList: EprouvetteData[] = [];
        let eprouvetteNum = 1;

        joursEssai.forEach((je) => {
          const isHeures = je.unite === "heures" && typeof je.heures === "number";
          const heures = typeof je.heures === "number" ? je.heures : 0;
          for (let i = 0; i < je.nombre; i++) {
            const existing = existingResultats.find(r => r.numero === eprouvetteNum);
            const echeanceDate = data.date_coulage
              ? isHeures
                ? addHours(new Date(data.date_coulage), heures)
                : addDays(new Date(data.date_coulage), je.jour)
              : null;
            const dateCalculee = echeanceDate
              ? format(echeanceDate, isHeures ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy")
              : "";

            eprouvettesList.push({
              numero: eprouvetteNum,
              joursEssai: je.jour,
              echeanceLabel: isHeures ? `${heures} h` : String(je.jour),
              isHeures,
              echeanceISO: echeanceDate ? echeanceDate.toISOString() : undefined,
              // Les échéances en jours sont toujours recalculées depuis la date de coulage
              // (les valeurs stockées peuvent être décalées si les échéances ont été modifiées).
              dateEssai: isHeures ? (existing?.dateEssai || dateCalculee) : (dateCalculee || existing?.dateEssai || ""),
              poids: existing?.poids || 0,
              densite: existing?.densite || 0,
              charge: existing?.charge || 0,
              resistance: existing?.resistance || 0,
            });
            eprouvetteNum++;
          }
        });

        setEchantillon({
          id: data.id,
          numero: data.numero,
          numero_chantier: (data as any).numero_chantier || data.numero,
          client_nom: data.clients?.nom || "-",
          chantier_nom: data.chantiers?.nom || "-",
          ouvrage: (data as any).ouvrage || "-",
          destination_beton: data.destination_beton || "-",
          type_eprouvette: data.type_eprouvette || "cube",
          dimension_eprouvette: data.dimension_eprouvette || "150x150x150",
          operateur_nom: data.intervenants 
            ? `${data.intervenants.prenom} ${data.intervenants.nom}`
            : "-",
          date_coulage: data.date_coulage 
            ? format(new Date(data.date_coulage), "dd/MM/yyyy", { locale: fr })
            : "-",
          nombre_eprouvettes: data.nombre_eprouvettes || 0,
          jours_essai: joursEssai,
          resultats: existingResultats,
        });

        setEprouvettes(sortEprouvettesByEcheance(eprouvettesList));
      } catch (error) {
        console.error("Error fetching echantillon:", error);
        toast.error("Erreur lors du chargement");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEchantillon();
  }, [echantillonId]);

  const handlePoidsChange = (index: number, value: number) => {
    setEprouvettes(prev => {
      const updated = [...prev];
      updated[index].poids = value;
      updated[index].densite = calculateDensity(value, echantillon?.dimension_eprouvette || "");
      return updated;
    });
  };

  const handleChargeChange = (index: number, value: number) => {
    setEprouvettes(prev => {
      const updated = [...prev];
      updated[index].charge = value;
      updated[index].resistance = calculateResistance(value, echantillon?.dimension_eprouvette || "");
      return updated;
    });
  };

  const handleDateEssaiChange = (index: number, value: string) => {
    setEprouvettes(prev =>
      prev.map((ep, i) => (i === index ? { ...ep, dateEssai: fromInputValue(value, ep.isHeures) } : ep))
    );
  };


  const calculateResults = () => {
    const resistances = eprouvettes.map(e => e.resistance).filter(r => r > 0);
    if (resistances.length === 0) return { moyenne: 0, caracteristique: 0, classe: "--" };
    const moyenne = resistances.reduce((a, b) => a + b, 0) / resistances.length;
    const variance = resistances.reduce((sum, r) => sum + Math.pow(r - moyenne, 2), 0) / resistances.length;
    const ecartType = Math.sqrt(variance);
    const caracteristique = moyenne - 1.48 * ecartType;

    let classe = "--";
    const fcmRef = [
      { classe: "C12/15", fcm: 20 },
      { classe: "C16/20", fcm: 24 },
      { classe: "C20/25", fcm: 28 },
      { classe: "C25/30", fcm: 33 },
      { classe: "C30/37", fcm: 38 },
      { classe: "C35/45", fcm: 43 },
      { classe: "C40/50", fcm: 48 },
      { classe: "C45/55", fcm: 53 },
      { classe: "C50/60", fcm: 58 },
    ];
    for (const ref of fcmRef) {
      if (moyenne >= ref.fcm) classe = ref.classe;
    }

    return {
      moyenne: parseFloat(moyenne.toFixed(2)),
      caracteristique: parseFloat(Math.max(0, caracteristique).toFixed(2)),
      classe,
    };
  };

  const handleSave = async () => {
    if (!echantillonId) return;

    if (eprouvettes.some((ep) => !ep.dateEssai)) {
      toast.error("La date d'essai est obligatoire pour chaque éprouvette");
      return;
    }

    const violations = findEcheanceViolations(eprouvettes);
    if (violations.length > 0) {
      setEcheanceViolations(violations);
      return;
    }


    setIsSaving(true);
    try {
      const eprouvettesWithData = eprouvettes.filter(e => e.resistance > 0 && e.poids > 0 && e.charge > 0);
      const allComplete = eprouvettes.length > 0 && eprouvettesWithData.length === eprouvettes.length;
      const someComplete = eprouvettesWithData.length > 0;
      
      let newStatut = "a-faire";
      if (allComplete) newStatut = "termine";
      else if (someComplete) newStatut = "en-cours";
      
      const { error } = await supabase
        .from("echantillons_compression")
        .update({
          resultats: eprouvettes as unknown as Json,
          statut: newStatut,
        })
        .eq("id", echantillonId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["echantillons-compression"] });
      queryClient.invalidateQueries({ queryKey: ["echantillons-chantier"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      toast.success("Données enregistrées avec succès");
      navigate(`/laboratoires-mobiles/chantier/${chantierId}?echantillon=${echantillonId}`);
    } catch (error) {
      console.error("Error saving data:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  const results = calculateResults();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!echantillon) {
    return <div className="text-center py-8 text-muted-foreground">Échantillon non trouvé</div>;
  }

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <EssaiBreadcrumb items={[
          { label: "Laboratoires Mobiles", path: "/laboratoires-mobiles" },
          { label: echantillon.chantier_nom, path: `/laboratoires-mobiles/chantier/${chantierId}` },
          { label: `EC-${String(echantillon.numero_chantier).padStart(3, "0")}`, path: `/laboratoires-mobiles/chantier/${chantierId}/echantillon/${echantillonId}` },
          { label: "Saisie" },
        ]} />
      </div>

      <div className="flex items-start gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(`/laboratoires-mobiles/chantier/${chantierId}/echantillon/${echantillonId}`)}
          className="shrink-0 border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            Saisie de Données - <span className="text-primary">EC</span>-{String(echantillon.numero_chantier).padStart(3, "0")}
          </h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations Échantillon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Technicien: <span className="font-medium">{echantillon.operateur_nom}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Date coulage: <span className="font-medium">{echantillon.date_coulage}</span>
              </p>
            </div>
            <div className="space-y-2 text-right">
              <p className="text-sm text-muted-foreground">
                Chantier: <span className="font-medium">{echantillon.chantier_nom}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Ouvrage: <span className="font-medium">{echantillon.ouvrage}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Partie de l'ouvrage: <span className="font-medium">{echantillon.destination_beton}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Type éprouvette: <span className="font-medium">{echantillon.type_eprouvette}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Données Éprouvettes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground"></th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Date d'essai</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Échéance</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Poids (g)</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Densité</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Charge (kN)</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Résistance</th>
                </tr>
              </thead>
              <tbody>
                {eprouvettes.map((ep, index) => (
                  <tr key={ep.numero} className="border-b border-border/50">
                    <td className="py-4 px-2 text-sm font-medium">Éprouvette {ep.numero}</td>
                    <td className="py-4 px-2">
                      {ep.isHeures ? (
                        <Input
                          type="date"
                          value={toInputValue(ep.dateEssai, true)}
                          onChange={(e) => handleDateEssaiChange(index, e.target.value)}
                          className={`w-52 ${!ep.dateEssai ? "border-destructive" : ""}`}
                          required
                        />
                      ) : (
                        <div className="bg-muted/50 rounded-lg px-4 py-2 w-40 text-center font-medium">
                          {ep.dateEssai || "--"}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-2">
                      <div className="bg-muted/50 rounded-lg px-4 py-2 w-20 text-center font-medium">{ep.echeanceLabel ?? ep.joursEssai}</div>
                    </td>
                    <td className="py-4 px-2">
                      <Input
                        type="number"
                        value={ep.poids || ""}
                        onChange={(e) => handlePoidsChange(index, parseFloat(e.target.value) || 0)}
                        className="w-24 text-center"
                        placeholder="0"
                      />
                    </td>
                    <td className="py-4 px-2">
                      <div className="bg-primary/20 border border-primary/30 rounded-lg px-4 py-2 w-24 text-center text-primary font-medium">
                        {ep.densite || "--"}
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <Input
                        type="number"
                        value={ep.charge || ""}
                        onChange={(e) => handleChargeChange(index, parseFloat(e.target.value) || 0)}
                        className="w-24 text-center"
                        placeholder="0"
                        step="0.1"
                      />
                    </td>
                    <td className="py-4 px-2">
                      <div className="bg-primary/20 border border-primary/30 rounded-lg px-4 py-2 w-28 text-center text-primary font-medium">
                        {ep.resistance || "--"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Résultats calculés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Résistance moyenne</p>
              <p className="text-2xl font-bold">{results.moyenne > 0 ? results.moyenne : "--"} MPa</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Résistance caractéristique</p>
              <p className="text-2xl font-bold">{results.caracteristique > 0 ? results.caracteristique : "--"} MPa</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Classe de résistance</p>
              <p className="text-2xl font-bold text-primary">{results.classe}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate(`/laboratoires-mobiles/chantier/${chantierId}/echantillon/${echantillonId}`)}>
          Annuler
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
