import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";

export interface ContratArticle {
  id: string;
  contrat_id: string;
  article_number: number;
  titre: string;
  contenu: string;
  created_at: string;
  updated_at: string;
}

const repo = getRepositoryForTable<ContratArticle>("contrat_articles", {
  defaultOrder: { column: "article_number", ascending: true },
});


export const DEFAULT_ARTICLES: { number: number; titre: string; contenu: string }[] = [
  {
    number: 1,
    titre: "OBJET DE LA CONVENTION",
    contenu: `La présente convention a pour objet de définir des prestations assurées par le laboratoire {{labName}} dans le cadre de l'assistance technique de l'entreprise {{clientName}}, dans le cadre du projet de la réalisation du chantier {{chantierName}}.

Les prestations consistent à l'assistance technique, aux travaux de laboratoire pour le contrôle et le suivi de la qualité des bétons confectionnés pour le projet.`,
  },
  {
    number: 2,
    titre: "MODE DE PASSATION DE LA CONVENTION",
    contenu: `La présente convention est passée de gré à gré conformément à la réglementation en vigueur régissant les marchés publics.`,
  },
  {
    number: 3,
    titre: "INTERVENTION DU LABORATOIRE",
    contenu: `L'intervention du laboratoire {{labName}} consiste, à la demande de l'entreprise {{clientName}}, à l'assistance, études, essais et analyses de qualité des matériaux de construction utilisés dans la réalisation du projet ainsi que le suivi et le contrôle des productions de béton.

Les travaux de laboratoire portent notamment sur ce qui suit :
- Etudes et formulations des compositions de béton.
- Les essais et analyse des sables : équivalent de sable, mesure du taux d'humidité, granulométrie.
- Analyse granulométrique des agrégats.
- Les essais d'écrasement sur éprouvettes de béton.
- Prélèvement, gâchage des éprouvettes pour essais ainsi que la conservation dans des bassins de maturation.
- Vérification, contrôle et correction des compositions au niveau de la centrale à béton.
- S'assurer que les moyens mis en œuvre (centrales à béton), doivent permettre de confectionner les bétons aux qualités souhaitées, conformes aux normes et études préalables de formulation de composition du béton.
- Assistance technique dans le cadre des bétons prescrits.
- Auto contrôle de l'entreprise pour une qualité continue des matériaux et béton.

Du point de vue suivi et contrôle de la qualité des matériaux, le laboratoire mettra au service de l'entreprise l'assistance technique ainsi que son expérience par le biais d'un ingénieur de laboratoire qualifié, ainsi qu'un staff technique de soutien pour rechercher les solutions aux problèmes techniques pouvant être rencontrés en cours de la réalisation des travaux.

L'ingénieur de laboratoire sera mobilisé en permanence sur site, un ingénieur responsable qualité effectuera des visites périodiques du chantier afin de contrôler le bon déroulement du suivi de la qualité des bétons ainsi que la conformité des moyens de production.

Le directeur technique responsable, assistera aux réunions périodiques tenues au niveau du chantier, en qualité de représentant du laboratoire et de l'entreprise concernant la qualité des bétons.`,
  },
  {
    number: 4,
    titre: "MATÉRIEL À MOBILISER SUR SITE",
    contenu: `- Une presse à béton de 1500 KN de type semi-automatique dûment étalonnée par un organisme qualifié.
- Un dispositif d'essai d'équivalent de sable
- Une balance de précision 8Kg/0.2grs
- Une balance standard 30Kg/5grs
- Deux cônes d'Abrams pour les mesures d'affaissement
- Des thermomètres pour le béton frais
- Éprouvettes cubiques 15x15x15 normalisées
- 01 mini compresseur pour le démoulage des éprouvettes
- Deux thermoplongeurs pour le maintien de la température de conservation des éprouvettes.
- Les bassins de conservation seront aménagés par l'entreprise, sur site, à proximité des locaux provisoires du laboratoire.
- Une chambre de permanence est à prévoir sur site pour assurer les coulages du soir.`,
  },
  {
    number: 5,
    titre: "MISSION DU LABORATOIRE",
    contenu: `Le laboratoire {{labName}} a pour mission de procéder aux essais de laboratoire et de suivre la qualité des matériaux à mettre en œuvre, dans le cadre du projet de l'entreprise, et de contribuer avec l'entreprise, pour s'assurer que toutes les conditions sont réunies pour obtenir les performances et la régularité de la qualité des matériaux exigés par les études et le client.

Le laboratoire {{labName}}, en collaboration avec l'entreprise {{clientName}}, doit s'assurer que les constituants entrant dans les formulations et la fabrication du béton sont conformes aux prescriptions de l'étude de charge, des normes et règlements en la matière. (Normes Algériennes)

En particulier s'assurer que les moyens de la centrale à béton, doivent permettre de confectionner les bétons aux qualités souhaitées, conformes aux essais de convenance et étude préalables de formulation et de composition du béton.

Le laboratoire est seul responsable de la gestion technique et administrative des prestations en travaux d'analyse et contrôle des matériaux.

Pour cela le laboratoire doit disposer de tous les pouvoirs qui lui seront délégués par l'entreprise {{clientName}} signataire de la présente convention, pour faire respecter les recommandations relatives à la qualité des matériaux de construction mis en œuvre dans le cadre des projets visés.`,
  },
  {
    number: 6,
    titre: "NOMBRE ET FRÉQUENCE DES ESSAIS À EFFECTUER",
    contenu: `Le nombre et la fréquence des essais à effectuer seront définis en commun accord entre l'entreprise et le laboratoire {{labName}}, en conformité avec le cahier technique après avis de l'organisme de contrôle technique dans le cadre de la garantie décennale.`,
  },
  {
    number: 7,
    titre: "HONORAIRES DU LABORATOIRE",
    contenu: `Les prestations fournies pour le contrôle de la qualité des bétons produits pour le chantier et selon un programme d'essais établi en commun accord, feront l'objet d'une facturation forfaitaire mensuelle fixe quel que soit le nombre d'essais effectués.

Ce montant sera majoré d'une TVA applicable le jour de la facturation.`,
  },
  {
    number: 8,
    titre: "MODALITÉ DE PAIEMENT",
    contenu: `Le règlement des honoraires du laboratoire doit s'effectuer mensuellement dans un délai maximum de 30 jours après réception de la facture par l'entreprise.

Le règlement se fera par espèce ou par chèque bancaire au nom de {{labName}}.`,
  },
  {
    number: 9,
    titre: "DURÉE DE VALIDITÉ DE LA CONVENTION",
    contenu: `La présente convention est valide jusqu'à l'achèvement total des travaux de béton.`,
  },
  {
    number: 10,
    titre: "RÉSILIATION DE LA CONVENTION",
    contenu: `La présente convention peut être résiliée par l'une ou l'autre des deux parties en cas de non-respect des termes du contrat.`,
  },
  {
    number: 11,
    titre: "ENTRÉE EN VIGUEUR",
    contenu: `La présente convention est valable et définitive, dès l'approbation par les deux parties. Elle prendra effet dès le démarrage des prestations du laboratoire.`,
  },
];

export function useContratArticles(contratId: string) {
  return useQuery({
    queryKey: ["contrat_articles", contratId],
    queryFn: async () => (await repo.list({ filters: { contrat_id: contratId } })).data,
    enabled: !!contratId,
  });
}

export function useUpsertContratArticles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (articles: { contrat_id: string; article_number: number; titre: string; contenu: string }[]) => {
      const { data, error } = await repo.upsert(articles as Partial<ContratArticle>[], { onConflict: "contrat_id,article_number" });
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["contrat_articles", variables[0].contrat_id] });
      }
    },
  });
}

