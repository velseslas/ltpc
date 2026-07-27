import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, addHours } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";
import { EssaiBreadcrumb } from "@/components/essais/EssaiBreadcrumb";
import { useQueryClient } from "@tanstack/react-query";

interface EprouvetteData {
  numero: number;
  joursEssai: number;
  echeanceLabel?: string;
  isHeures?: boolean;
  dateEssai: string;
  poids: number;
  densite: number;
  charge: number;
  resistance: number;
}

/** Convertit "dd/MM/yyyy [HH:mm]" vers la valeur attendue par un input date / datetime-local. */
const toInputValue = (display: string, isHeures?: boolean): string => {
  if (!display) return "";
  const [datePart, timePart] = display.split(" ");
  const [dd, mm, yyyy] = datePart.split("/");
  if (!yyyy) return "";
  return isHeures ? `${yyyy}-${mm}-${dd}T${timePart || "00:00"}` : `${yyyy}-${mm}-${dd}`;
};

/** Convertit la valeur d'un input date / datetime-local vers "dd/MM/yyyy [HH:mm]". */
const fromInputValue = (value: string, isHeures?: boolean): string => {
  if (!value) return "";
  const [datePart, timePart] = value.split("T");
  const [yyyy, mm, dd] = datePart.split("-");
  if (!dd) return "";
  return isHeures ? `${dd}/${mm}/${yyyy} ${timePart || "00:00"}` : `${dd}/${mm}/${yyyy}`;
};

const sortEprouvettesByEcheance = (items: EprouvetteData[]): EprouvetteData[] =>
  [...items].sort((a, b) => {
    if (a.isHeures !== b.isHeures) return a.isHeures ? -1 : 1;
    return a.joursEssai - b.joursEssai || a.numero - b.numero;
  });

interface EchantillonData {
  id: string;
  numero: number;
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

// Parse dimension string to determine shape and sizes in mm
const parseDimension = (dimension: string): { type: 'cube' | 'cylinder'; d: number; h: number } => {
  if (!dimension) return { type: 'cube', d: 150, h: 150 };
  
  const parts = dimension.match(/(\d+)\s*[x*×]\s*(\d+)(?:\s*[x*×]\s*(\d+))?/i);
  
  if (parts) {
    let a = parseInt(parts[1]);
    if (isNaN(a)) a = 0;
    let b = parseInt(parts[2]);
    if (isNaN(b)) b = 0;
    let c = parts[3] ? parseInt(parts[3]) : null;
    if (c !== null && isNaN(c)) c = null;
    
    // Convert cm to mm if needed
    if (a < 50) { a *= 10; b *= 10; if (c) c *= 10; }
    
    if (c) {
      // 3 dimensions = cube (e.g. 150x150x150)
      return { type: 'cube', d: a, h: a };
    } else {
      // 2 dimensions = cylinder (e.g. 160x320 → diameter x height)
      return { type: 'cylinder', d: a, h: b };
    }
  }
  
  // Single number = cube side
  const match = dimension.match(/(\d+)/);
  if (!match) return { type: 'cube', d: 150, h: 150 };
  let side = parseInt(match[1]);
  if (side < 50) side *= 10;
  return { type: 'cube', d: side, h: side };
};

// Calculate density in t/m³ (= g/cm³)
const calculateDensity = (poidsGrammes: number, dimension: string): number => {
  if (poidsGrammes <= 0) return 0;
  
  const dim = parseDimension(dimension);
  let volumeCm3: number;
  
  if (dim.type === 'cylinder') {
    const rCm = dim.d / 10 / 2;
    volumeCm3 = Math.PI * rCm * rCm * (dim.h / 10);
  } else {
    const sideCm = dim.d / 10;
    volumeCm3 = sideCm * sideCm * sideCm;
  }
  
  if (volumeCm3 <= 0) return 0;
  return parseFloat((poidsGrammes / volumeCm3).toFixed(2));
};

// Calculate resistance in MPa = charge(kN) * 1000 / area(mm²)
const calculateResistance = (chargeKN: number, dimension: string): number => {
  if (chargeKN <= 0) return 0;
  
  const dim = parseDimension(dimension);
  let areaMm2: number;
  
  if (dim.type === 'cylinder') {
    areaMm2 = Math.PI * Math.pow(dim.d / 2, 2);
  } else {
    areaMm2 = dim.d * dim.d;
  }
  
  if (areaMm2 <= 0) return 0;
  // 1 kN = 1000 N, 1 MPa = 1 N/mm²
  return parseFloat((chargeKN * 1000 / areaMm2).toFixed(2));
};

const CompressionDataEntry = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [echantillon, setEchantillon] = useState<EchantillonData | null>(null);
  const [eprouvettes, setEprouvettes] = useState<EprouvetteData[]>([]);

  useEffect(() => {
    const fetchEchantillon = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from("echantillons_compression")
          .select(`
            *,
            clients:client_id(nom),
            chantiers:chantier_id(nom),
            intervenants:operateur_id(nom, prenom)
          `)
          .eq("id", id)
          .single();

        if (error) throw error;

        const joursEssai = (Array.isArray(data.jours_essai) ? data.jours_essai : []) as { jour: number; nombre: number; unite?: string; heures?: number }[];
        const existingResultats = (Array.isArray(data.resultats) ? data.resultats : []) as unknown as EprouvetteData[];

        // Build eprouvettes list based on jours_essai configuration
        let eprouvettesList: EprouvetteData[] = [];
        let eprouvetteNum = 1;

        joursEssai.forEach((je) => {
          const isHeures = je.unite === "heures" && typeof je.heures === "number";
          const heures = typeof je.heures === "number" ? je.heures : 0;
          for (let i = 0; i < je.nombre; i++) {
            const existing = existingResultats.find(r => r.numero === eprouvetteNum);
            const dateCalculee = data.date_coulage
              ? isHeures
                ? format(addHours(new Date(data.date_coulage), heures), "dd/MM/yyyy HH:mm")
                : format(addDays(new Date(data.date_coulage), je.jour), "dd/MM/yyyy")
              : "";

            eprouvettesList.push({
              numero: eprouvetteNum,
              joursEssai: je.jour,
              echeanceLabel: isHeures ? `${heures} h` : String(je.jour),
              isHeures,
              dateEssai: existing?.dateEssai || dateCalculee,
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
        toast.error("Erreur lors du chargement de l'échantillon");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEchantillon();
  }, [id]);

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
    const resistances = eprouvettes
      .map(e => e.resistance)
      .filter(r => r > 0);

    if (resistances.length === 0) {
      return { moyenne: 0, caracteristique: 0, classe: "--" };
    }

    const moyenne = resistances.reduce((a, b) => a + b, 0) / resistances.length;
    
    // Résistance caractéristique: fc,k = fc,m - 1.48 * s (selon EN 206)
    const variance = resistances.reduce((sum, r) => sum + Math.pow(r - moyenne, 2), 0) / resistances.length;
    const ecartType = Math.sqrt(variance);
    const caracteristique = moyenne - 1.48 * ecartType;

    // Déterminer la classe de béton basée sur la résistance MOYENNE (fc,m)
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

    // Trouver la classe correspondante à la résistance moyenne
    for (const ref of fcmRef) {
      if (moyenne >= ref.fcm) {
        classe = ref.classe;
      }
    }

    return {
      moyenne: parseFloat(moyenne.toFixed(2)),
      caracteristique: parseFloat(Math.max(0, caracteristique).toFixed(2)),
      classe,
    };
  };

  const handleSave = async () => {
    if (!id) return;

    if (eprouvettes.some((ep) => !ep.dateEssai)) {
      toast.error("La date d'essai est obligatoire pour chaque éprouvette");
      return;
    }

    setIsSaving(true);
    try {
      const results = calculateResults();
      
      // Determine status based on data completeness
      const eprouvettesWithData = eprouvettes.filter(e => e.resistance > 0 && e.poids > 0 && e.charge > 0);
      const allComplete = eprouvettes.length > 0 && eprouvettesWithData.length === eprouvettes.length;
      const someComplete = eprouvettesWithData.length > 0;
      
      let newStatut = "a-faire";
      if (allComplete) {
        newStatut = "termine";
      } else if (someComplete) {
        newStatut = "en-cours";
      }
      
      const { error } = await supabase
        .from("echantillons_compression")
        .update({
          resultats: eprouvettes as unknown as Json,
          statut: newStatut,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Données enregistrées avec succès");
      navigate("/essais/beton/beton-durci/compression");
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
    return (
      <div className="text-center py-8 text-muted-foreground">
        Échantillon non trouvé
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EssaiBreadcrumb 
        items={[
          { label: "Béton", path: "/essais/beton" },
          { label: "Béton Durci", path: "/essais/beton/beton-durci" },
          { label: "Compression", path: "/essais/beton/beton-durci/compression" },
          { label: <><span className="text-primary">EC</span>-{String(echantillon.numero).padStart(3, "0")}</>, path: `/essais/beton/beton-durci/compression/${id}` },
          { label: "Saisie de données" }
        ]} 
      />
      
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(`/essais/beton/beton-durci/compression/${id}`)}
          className="border-border hover:bg-primary/10 hover:text-primary hover:border-primary/50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Saisie de Données - <span className="text-primary">EC</span>-{String(echantillon.numero).padStart(3, "0")}
          </h1>
        </div>
      </div>

        {/* Informations Échantillon */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Informations Échantillon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Technicien: <span className="text-foreground font-medium">{echantillon.operateur_nom}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Date coulage: <span className="text-foreground font-medium">{echantillon.date_coulage}</span>
                </p>
              </div>
              <div className="space-y-2 text-right">
                <p className="text-sm text-muted-foreground">
                  Client: <span className="text-foreground font-medium">{echantillon.client_nom}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Chantier: <span className="text-foreground font-medium">{echantillon.chantier_nom}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Ouvrage: <span className="text-foreground font-medium">{echantillon.ouvrage}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Partie de l'ouvrage: <span className="text-foreground font-medium">{echantillon.destination_beton}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Type éprouvette: <span className="text-foreground font-medium">{echantillon.type_eprouvette}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Données Éprouvettes */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Données Éprouvettes ({echantillon.type_eprouvette}) - Moyenne: N/mm²
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground"></th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Date d'essai</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Échéance</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Poids (g)</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Densité (kg/dm³)</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Charge (kN)</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Résistance (N/mm²)</th>
                  </tr>
                </thead>
                <tbody>
                  {eprouvettes.map((ep, index) => (
                    <tr key={ep.numero} className="border-b border-border/50">
                      <td className="py-4 px-2 text-sm text-foreground font-medium">
                        Éprouvette {ep.numero}
                      </td>
                      <td className="py-4 px-2">
                        {ep.isHeures ? (
                          <Input
                            type="datetime-local"
                            value={toInputValue(ep.dateEssai, true)}
                            onChange={(e) => handleDateEssaiChange(index, e.target.value)}
                            className={`bg-muted/50 border-border w-52 ${!ep.dateEssai ? "border-destructive" : ""}`}
                            required
                          />
                        ) : (
                          <div className="bg-muted/50 rounded-lg px-4 py-2 w-40 text-center text-foreground font-medium">
                            {ep.dateEssai || "--"}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-2">
                        <div className="bg-muted/50 rounded-lg px-4 py-2 w-20 text-center text-foreground font-medium">
                          {ep.echeanceLabel ?? ep.joursEssai}
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <Input
                          type="number"
                          value={ep.poids || ""}
                          onChange={(e) => handlePoidsChange(index, parseFloat(e.target.value) || 0)}
                          className="w-24 bg-muted/50 border-border text-center"
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
                          className="w-24 bg-muted/50 border-border text-center"
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

        {/* Résultats calculés */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Résultats calculés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Résistance moyenne</p>
                <p className="text-2xl font-bold text-foreground">
                  {results.moyenne > 0 ? results.moyenne : "--"} <span className="text-lg font-normal">MPa</span>
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Résistance caractéristique</p>
                <p className="text-2xl font-bold text-foreground">
                  {results.caracteristique > 0 ? results.caracteristique : "--"} <span className="text-lg font-normal">MPa</span>
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Classe de résistance</p>
                <p className="text-2xl font-bold text-primary">
                  {results.classe}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/essais/beton/beton-durci/compression")}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Sauvegarder
          </Button>
        </div>
      </div>
  );
};

export default CompressionDataEntry;
