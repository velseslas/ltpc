import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";

export interface EngagementArticle {
  id: string;
  engagement_id: string;
  article_number: number;
  titre: string;
  contenu: string;
  created_at: string;
  updated_at: string;
}

const repo = getRepositoryForTable<EngagementArticle>("engagement_articles", {
  defaultOrder: { column: "article_number", ascending: true },
});


export const DEFAULT_ENGAGEMENT_ARTICLES: { number: number; titre: string; contenu: string }[] = [
  {
    number: 1,
    titre: "OBJET DE L'ENGAGEMENT",
    contenu: `Le présent engagement a pour objet de définir le détail des missions et prestations du laboratoire {{labName}} dans le cadre de l'assistance technique de l'entreprise {{clientName}}, dans le cadre du projet de réalisation de « {{chantierName}} »`,
  },
  {
    number: 2,
    titre: "MISSION DU LABORATOIRE",
    contenu: `La mission du laboratoire consiste à prendre en charge tout le processus de contrôle qualité des bétons selon la procédure d'intervention suivante :

1. Prendre connaissance des exigences relatives au lot bétons du CCTP approuvé
2. Sélectionner les matériaux répondant aux exigences et qualité du béton à confectionner, après analyses et essais au laboratoire.
Les essais sont effectués par le laboratoire, en justification de la qualité des produits proposés à l'agrément du Maitre d'Œuvre. Les différents essais effectués sur les matériaux entrant dans la composition des bétons sont les suivants :
- Analyses granulométriques
- Essais de propreté superficielle
- Equivalent de sable
- Module de finesse
- Mesure des masses volumiques absolues
- Mesure des masses volumiques apparentes
- Essais d'absorption
- Essais de friabilité
- Essais Micro Deval
- Essais Los Angeles
- Essais d'aplatissement
- Essais chimiques
3. Proposition d'Etudes de formulations de bétons pour approbation par les services du CTC.
Les études de formulation de béton sont réalisées à l'issue de la validation de ses constituants. La composition et le dosage des bétons sont déterminés en fonction de la charge intrinsèque à atteindre, afin de répondre à toutes les exigences du CCTP. Les essais d'étude effectués en laboratoire sont suivis d'essais de convenance au niveau des centrales de production afin de confirmer la composition du béton.
4. Contrôle du matériel de production du béton (centrale à béton), bon fonctionnement des balances, des doseurs d'eau et d'adjuvant, des pales de malaxage etc.
5. Contrôle périodique des agrégats stockés sur site et des approvisionnements.
Au démarrage ou au cours de l'exécution des travaux, le nombre et la fréquence de ces essais seront périodiques, cas par cas, par référence, chaque fois qu'il sera possible conformément aux règles Normatives.

Contrôle de la qualité des bétons :
Les essais de contrôle effectués périodiquement en cours des travaux sont les suivants :

a - Sur agrégats en stocks :
Tous les 300 m³ : Analyse granulométriques, Essais de propreté superficielle, Equivalent de sable, Masses volumiques, Masses apparentes
Tous les 1000 m³ : Essai DEVAL, Essai Los Angeles

b - Avant chaque coulage :
- Teneur en humidité

6. Veille sur la régularité et l'homogénéité du béton par le suivi des opérations de bétonnage conformément aux prescriptions de la Norme NA 16002 :
- Mesure de l'affaissement : effectuée en cas de changement visible de la consistance du béton
- Prélèvement des échantillons 6 éprouvettes /150 m³ de béton : la confection des éprouvettes se fera au pied de l'ouvrage
- Codification des échantillons
- Décoffrage des éprouvettes prélevées 24 heures après le prélèvement
- Le technicien chargé des essais procédera à la conservation de ces éprouvettes dans les bassins de maturation à une température de 20° ± 2°C
- Les éprouvettes sont retirées du bassin la veille du jour d'écrasement
- Au jour d'atteinte de l'âge conventionnel (7 & 28j), il est procédé aux essais de compression sur le béton durci
- Les résultats des tests sont reportés sur le registre de chantier du laboratoire puis sur une minute de PV de compression

Les procès-verbaux sont transmis au client dans un délai de 24h après les essais.

Pour le suivi et contrôle de la qualité des bétons, le laboratoire met au service de l'entreprise, son assistance technique par le biais d'ingénieurs de laboratoire qualifiés, ainsi qu'un staff technique de soutien pour rechercher les solutions aux problèmes techniques pouvant être rencontrés en cours de la réalisation des travaux.

L'ingénieur de laboratoire sera mobilisé en permanence (24h/24h) sur site, un ingénieur responsable qualité et coordinateur, effectuera des visites périodiques des chantiers afin de contrôler le bon déroulement du suivi de la qualité des bétons ainsi que la conformité des moyens de production.

Le directeur technique responsable des projets, assistera aux réunions périodiques tenues au niveau du chantier.`,
  },
  {
    number: 3,
    titre: "NOMBRE ET FREQUENCE DES ESSAIS A EFFECTUER",
    contenu: `Le nombre et la fréquence des essais à effectuer seront définis en commun accord entre l'entreprise et le laboratoire {{labName}}, en conformité avec le cahier des charges techniques après avis de l'organisme de contrôle technique dans le cadre de la garantie décennale.`,
  },
  {
    number: 4,
    titre: "REFERENCES TECHNIQUES",
    contenu: `Sont réputées applicables dans leur intégralité les prescriptions techniques générales en vigueur, les Documents Techniques Unifiés, (D.T.U. cahiers des charges, cahiers des clauses spéciales et règles de calculs),

- La norme NA 16002 relative au contrôle de la qualité des bétons.
- La norme NA 425 relative à l'échantillonnage du béton frais.
- La norme NA 426 relative à la conservation des éprouvettes.
- La Norme NF EN 12390-1 relative à la forme et dimension des éprouvettes.
- La norme NF P18-557 relative à l'identification des granulats.
- La norme NF P18-560 relative à l'essai d'analyse granulométrique.
- La norme NF P18-555 relative aux mesures des masses volumiques des granulats.
- La norme NF P18-554 relative à la mesure de la porosité des granulats.
- La norme NF P18-598 relative à l'équivalent de sable.
- La norme NF P18-576 relative à la Friabilité du sable.
- La norme NA 255 relative à l'essai d'absorption du sable.
- La norme NF P18-591 relative à la détermination de la propreté superficielle.
- La norme NF P18-572 relative à l'essai Deval.
- La norme NF P18-573 relative à l'essai LOS ANGELES.
- La norme NF P18-561 relative à l'essai mesure du coefficient d'Aplatissement.
- La norme NF P18-416 relative à l'essai au cône d'Abrahams NF EN 12350-2.
- La norme NF P18-576 relative à la mesure de la densité du béton.
- La norme NF EN 12390-3 relative à la détermination de la résistance à la compression du béton.
- La norme NF EN 12390-5 relative à la détermination de la résistance à la Flexion du béton.
- La norme NF EN 12390-6 relative à la détermination de la résistance à la traction par fendage du béton.
- La norme NF P15-553 relative aux essais de convenance.
- La norme NF P 206 relative au contrôle qualité du BPE.
- DTR BE 21.

Nota : L'énumération des documents de référence (D.T.U. - Normes Algériennes, AFNOR ou autres) ne saurait être limitative.`,
  },
  {
    number: 5,
    titre: "ENGAGEMENT DU LABORATOIRE",
    contenu: `Le laboratoire s'engage à mettre à la disposition de l'entreprise toute son expertise et à exercer sa mission d'assistance technique et de contrôle qualité des bétons selon la procédure sus décrite.`,
  },
];

export function useEngagementArticles(engagementId: string) {
  return useQuery({
    queryKey: ["engagement_articles", engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engagement_articles")
        .select("*")
        .eq("engagement_id", engagementId)
        .order("article_number", { ascending: true });

      if (error) throw error;
      return data as EngagementArticle[];
    },
    enabled: !!engagementId,
  });
}

export function useUpsertEngagementArticles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (articles: { engagement_id: string; article_number: number; titre: string; contenu: string }[]) => {
      const { data, error } = await supabase
        .from("engagement_articles")
        .upsert(articles, { onConflict: "engagement_id,article_number" })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["engagement_articles", variables[0].engagement_id] });
      }
    },
  });
}
