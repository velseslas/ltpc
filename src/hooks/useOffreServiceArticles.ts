import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositoryForTable } from "@/lib/repositories";

export interface OffreServiceArticle {
  id: string;
  offre_service_id: string;
  article_number: number;
  titre: string;
  contenu: string;
  created_at: string;
  updated_at: string;
}

const repo = getRepositoryForTable<OffreServiceArticle>("offre_service_articles", {
  defaultOrder: { column: "article_number", ascending: true },
});


export const DEFAULT_OFFRE_ARTICLES: { number: number; titre: string; contenu: string }[] = [
  {
    number: 1,
    titre: "OBJET DE L'OFFRE",
    contenu: `Nous avons l'honneur de venir par la présente vous demander de bien vouloir étudier notre offre de service, par le biais de laquelle nous vous sollicitons pour une éventuelle prise en charge du contrôle de votre chantier {{chantierName}}.

A cet égard, veuillez trouver ci-joint la fiche technique présentant nos bureaux et les divers services et missions qu'ils peuvent accomplir, ainsi que les moyens dont il est doté.

Nous souhaitons avec confiance que notre demande trouvera au sein de votre organisme une suite favorable.

Veuillez agréer, Monsieur, nos salutations distinguées.`,
  },
  {
    number: 2,
    titre: "PRÉSENTATION DU LABORATOIRE",
    contenu: `Le {{labName}} est animé par une équipe de cadres et de techniciens enthousiaste et dynamique, des professionnels de la construction et du contrôle, qui se proposent de prendre en charge toutes vos préoccupations en matière de contrôle et de conseils.

Nos prestations couvrent l'ensemble des essais de laboratoire de génie civil : essais sur béton (frais et durci), essais sur granulats, essais géotechniques, essais non destructifs et essais in-situ.`,
  },
  {
    number: 3,
    titre: "NOTRE ÉQUIPE",
    contenu: `Service Management :
- Direction administrative et technique
- Directeur : Benmalek Mouhamed Fayçal (Ingénieur en Génie Civil)
- (01) Directeur technique
- (02) Assistantes

Le Laboratoire :
- (20) Techniciens de laboratoire
- (03) Ingénieurs en chef
- (05) Ingénieurs de site`,
  },
  {
    number: 4,
    titre: "NOS MOYENS MATÉRIELS",
    contenu: `Parc automobile :
- (03) Véhicules légers pour services
- (01) Pick-up

Équipements de laboratoire au niveau national :
- (02) Séries de tamis (80mm à 0.063mm)
- (02) Séries de grille à fonte
- (10) Ensemble ES (Equivalent de Sable)
- (01) Los Angeles
- (01) Micro Deval
- (02) Presses hydrauliques 1500 KN
- (08) Presses hydrauliques 2000 KN
- (02) Kits essai brésilien (fendage)
- (03) Étuves de laboratoire
- (01) Presse CBR
- (02) Kits Valeur au Bleu
- (10) Moules CBR
- (06) Moules PROCTOR
- (03) Comparateurs de Gonflement
- (02) Kits limites Atterberg
- (05) Densitomètres à membrane
- (01) Poutre Benkelman (essai à la plaque)
- (01) Compactmètre Clegg
- Une aiguille vibrante de laboratoire
- (03) Appareils à ultrason
- (02) Scléromètres`,
  },
  {
    number: 5,
    titre: "ÉQUIPEMENTS COMPLÉMENTAIRES",
    contenu: `- Un échantillonneur grand format
- Un échantillonneur petit format
- Un moule de surfaçage
- (02) Carotteuses universelles
- (10) Cônes d'Abrams
- (05) Étuves de laboratoire
- (15) Bacs de conservation d'éprouvettes (capacité 80 chacun)
- (01) Bétonnière de laboratoire
- (30) Moules à éprouvettes (15×30)
- (500) Moules à éprouvettes (15×15×15)
- (01) Essai sonique pour pieux jusqu'à 80m de profondeur`,
  },
  {
    number: 6,
    titre: "RÉFÉRENCES CHANTIERS",
    contenu: `- Pôle universitaire 10000 places pédagogique Koléa W. Tipaza (GROUPEMENT KOS)
- 3000 logements OPGI nouvelle ville Ali Mendjeli W. Constantine (GROUPEMENT KO)
- 4000 logements OPGI nouvelle ville Ali Mendjeli W. Constantine (KUR INSAAT)
- 2000 logements AADL nouvelle ville Ali Mendjeli W. Constantine (KUR INSAAT)
- 1000 logements AADL nouvelle ville Ali Mendjeli W. Constantine (KUR INSAAT)
- 1500 logements AADL nouvelle ville Ali Mendjeli W. Constantine (KUR INSAAT)
- 2150 logements AADL nouvelle ville Ali Mendjeli W. Constantine (KUR INSAAT)
- 1004 logements LSP W. Constantine (Groupe Bourouag Construction)
- 444 logements LSP W. Alger (Groupe Bourouag Construction)
- 1500 logements AADL W. Tipaza (Groupe Bourouag Construction)
- 2500 logements AADL W. Tipaza (Groupe Bourouag Construction)
- 440 logements OPGI Staoueli W. Alger (SHIFA MESUT ALGERIA)
- 420 logements OPGI Birkhadem W. Alger (SHIFA MESUT ALGERIA)
- 161 logements OPGI Cheraga W. Alger (SHIFA MESUT ALGERIA)
- 200 logements OPGI Draria W. Alger (SHIFA MESUT ALGERIA)
- 2000 logements ASSUR IMMO El Bez W. Sétif (SHAPOORJI PALLONJI .CO LTD)
- Pôle universitaire 20.000 places pédagogique Sidi Abdellah W. Alger (SHAPOORJI PALLONJI .CO LTD)
- Hôpital 160 lits à Douira W. Alger (SHAPOORJI PALLONJI .CO LTD)
- Pôle universitaire 10.000 places pédagogique W. El Taref (SHAPOORJI PALLONJI .CO LTD)
- Cité universitaire 11.000 lits Sidi Abdellah W. Alger (CRCEG)
- 2300 logements OPGI W. Mostaganem (SHAPOORJI PALLONJI .CO LTD)
- 1000 logements ASSUR IMMO W. Sétif (CRCC12)
- 1200 logements AADL Aïn Beniane W. Alger (MAKSAM INSAAT)
- 1200 logements AADL Birkhadem W. Alger (MAKSAM INSAAT)
- 1200 logements AADL W. Tipaza (MAKSAM INSAAT)
- 1200 logements OPGI W. Annaba (SARL EFFES INSAAT)
- Village touristique W. Skikda (SIAHA SPA)
- Ligne tramway W. Sétif sur 22.4 km (YAPI MERKEZI)
- Extension ligne de tramway W. Constantine (CORSAN ISOLUX)
- Extension de la 1ère ligne de tramway de Constantine (ALSTOM)
- 4700 logements OPGI W. Annaba (GROUPEMENT OZKA.LTD & GURBAG INSAAT)
- 1100 logements OPGI Azzaba W. Skikda (ENTES INSAAT)
- 650 logements LSP W. Annaba (GROUPEMENT TRUVA INSAAT – KARATAS INSAAT)`,
  },
];

export function useOffreServiceArticles(offreId: string) {
  return useQuery({
    queryKey: ["offre_service_articles", offreId],
    queryFn: async () => (await repo.list({ filters: { offre_service_id: offreId } })).data,
    enabled: !!offreId,
  });
}

export function useUpsertOffreServiceArticles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      articles: { offre_service_id: string; article_number: number; titre: string; contenu: string }[],
    ) => {
      const { data, error } = await repo.upsert(articles as Partial<OffreServiceArticle>[], { onConflict: "offre_service_id,article_number" });
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.length > 0) {
        queryClient.invalidateQueries({
          queryKey: ["offre_service_articles", variables[0].offre_service_id],
        });
      }
    },
  });
}

