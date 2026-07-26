// -----------------------------------------------------------------------------
// LTPC AI — Cartographie des ENTITÉS MÉTIER / TECHNIQUES de LTPC ERP.
//
// Objectif : donner à LTPC AI un accès LARGE EN LECTURE à toutes les données de
// travail du laboratoire (intervenants, matériaux, essais, matériel, documents,
// facturation…), sans jamais exposer les données de sécurité.
//
// ⚠️ SÉCURITÉ — tables volontairement EXCLUES de cette cartographie :
//   auth.*            (utilisateurs Supabase, mots de passe, tokens, sessions)
//   user_roles        (rôles → escalade de privilèges)
//   role_permissions / permissions / role_definitions
//   parametres_securite
//   push_subscriptions (endpoints + clés de chiffrement push)
//   notification_preferences
// Aucun secret, hash, token ou clé n'est lisible via cette couche.
//
// ⚠️ SQL — aucun SQL arbitraire n'est possible : chaque entité déclare sa table,
// ses colonnes de lecture et ses colonnes de recherche. Le LLM ne choisit jamais
// une table ni une colonne : il reçoit uniquement des résultats structurés.
// Toutes les requêtes partent du client Supabase authentifié → RLS appliquées.
// -----------------------------------------------------------------------------

export interface BusinessEntity {
  key: string;                       // identifiant interne (ex. "cimenteries")
  label: string;                     // libellé métier affiché à l'IA
  table: string;                     // table réelle du schéma public
  category: string;                  // regroupement métier
  keywords: string[];                // vocabulaire utilisateur (normalisé au match)
  select: string;                    // colonnes lues (jamais "*")
  searchFields: string[];            // colonnes texte pour ILIKE
  orderBy: { column: string; ascending: boolean };
  labelCols: string[];               // colonnes formant le libellé d'une ligne
  snippetCols?: string[];            // colonnes formant le résumé d'une ligne
  source_type: string;               // type de citation
  url?: string;                      // route UI associée (facultatif)
}

const s = (v: unknown, max = 140) => {
  const str = v == null ? "" : String(v);
  return str.length > max ? str.slice(0, max) + "…" : str;
};

export function rowLabel(e: BusinessEntity, r: Record<string, unknown>): string {
  const parts = e.labelCols.map((c) => r[c]).filter((v) => v != null && String(v).trim() !== "");
  return s(parts.join(" ").trim() || e.label, 90);
}

export function rowSnippet(e: BusinessEntity, r: Record<string, unknown>): string {
  const cols = e.snippetCols ?? [];
  const parts = cols.map((c) => r[c]).filter((v) => v != null && String(v).trim() !== "");
  return s(parts.join(" · "));
}

// --- fabriques ---------------------------------------------------------------

/** Fournisseur / producteur / intervenant externe (nom, contact, ville…). */
function fournisseur(
  key: string, label: string, table: string, keywords: string[],
  extra: string[] = [], url?: string,
): BusinessEntity {
  return {
    key, label, table, category: "intervenants_externes", keywords,
    select: ["id", "nom", "contact", "telephone", "email", "ville", "adresse", ...extra, "created_at"].join(", "),
    searchFields: ["nom", "ville", "contact", ...extra.filter((c) => !c.includes("_id"))],
    orderBy: { column: "nom", ascending: true },
    labelCols: ["nom"],
    snippetCols: ["ville", "contact", "telephone", ...extra],
    source_type: key.replace(/s$/, ""),
    url,
  };
}

/** Essai béton (frais / durci / NDT) : numero, ouvrage, classe, statut. */
function essaiBeton(key: string, label: string, table: string, keywords: string[], url?: string): BusinessEntity {
  return {
    key, label, table, category: "essais_beton", keywords,
    select: "id, numero, ouvrage, classe_resistance, statut, created_at",
    searchFields: ["numero", "ouvrage", "classe_resistance", "statut"],
    orderBy: { column: "created_at", ascending: false },
    labelCols: ["numero", "ouvrage"],
    snippetCols: ["classe_resistance", "statut"],
    source_type: key, url,
  };
}

/** Essai sur granulat : numero, produit, statut, date d'essai. */
function essaiGranulat(key: string, label: string, table: string, keywords: string[]): BusinessEntity {
  return {
    key, label, table, category: "essais_granulats", keywords,
    select: "id, numero, produit, statut, date_essai, created_at",
    searchFields: ["numero", "produit", "statut"],
    orderBy: { column: "created_at", ascending: false },
    labelCols: ["numero", "produit"],
    snippetCols: ["statut", "date_essai"],
    source_type: key, url: "/essais/granulat",
  };
}

/** Essai géotechnique : numero, type_sol, profondeur, statut. */
function essaiSol(key: string, label: string, table: string, keywords: string[]): BusinessEntity {
  return {
    key, label, table, category: "essais_geotechnique", keywords,
    select: "id, numero, type_sol, profondeur, statut, created_at",
    searchFields: ["numero", "type_sol", "statut"],
    orderBy: { column: "created_at", ascending: false },
    labelCols: ["numero", "type_sol"],
    snippetCols: ["profondeur", "statut"],
    source_type: key, url: "/essais/geotechnique",
  };
}

/** Document commercial / facturation : numero, montants, statut. */
function docCommercial(key: string, label: string, table: string, keywords: string[], extra: string[] = []): BusinessEntity {
  return {
    key, label, table, category: "facturation", keywords,
    select: ["id", "numero", "statut", ...extra, "created_at"].join(", "),
    searchFields: ["numero", "statut"],
    orderBy: { column: "created_at", ascending: false },
    labelCols: ["numero"],
    snippetCols: ["statut", ...extra],
    source_type: key,
  };
}

// --- catalogue ---------------------------------------------------------------

export const BUSINESS_ENTITIES: BusinessEntity[] = [
  // ---------- Intervenants & partenaires ----------
  {
    key: "clients", label: "Clients / entreprises", table: "clients", category: "intervenants_externes",
    keywords: ["client", "clients", "entreprise", "entreprises", "societe", "société", "sociétés", "donneur d'ordre"],
    select: "id, nom, ville, contact, telephone, representant, created_at",
    searchFields: ["nom", "ville", "contact", "representant"],
    orderBy: { column: "nom", ascending: true },
    labelCols: ["nom"], snippetCols: ["ville", "contact", "telephone"],
    source_type: "client", url: "/intervenant/clients",
  },
  fournisseur("cimenteries", "Cimenteries (fournisseurs de ciment)", "cimenteries",
    ["cimenterie", "cimenteries", "cimentier", "cimentiers", "fournisseur de ciment", "fournisseurs de ciment", "producteur de ciment", "producteurs de ciment", "usine de ciment"],
    ["capacite"], "/intervenant/cimenteries"),
  fournisseur("carrieres", "Carrières (fournisseurs de granulats)", "carrieres",
    ["carriere", "carrieres", "carrière", "carrières", "sabliere", "sablieres", "sablière", "sablières", "fournisseur de granulat", "fournisseurs de granulats", "producteur de granulat", "producteurs de granulats", "gravier", "graviers", "granulat", "granulats", "sable", "sables"],
    ["type_agregat"], "/intervenant/carrieres"),
  fournisseur("adjuvants", "Fournisseurs d'adjuvants", "adjuvants",
    ["adjuvant", "adjuvants", "fournisseur d'adjuvant", "fournisseurs d'adjuvants", "plastifiant", "superplastifiant", "retardateur", "accelerateur"],
    ["produits"], "/intervenant/adjuvants"),
  fournisseur("sources_eau", "Sources d'eau", "sources_eau",
    ["source d'eau", "sources d'eau", "eau de gachage", "eau de gâchage", "fournisseur d'eau"],
    ["debit"], "/intervenant/sources-eau"),
  fournisseur("centrales_beton", "Centrales à béton", "centrales_beton",
    ["centrale", "centrales", "centrale a beton", "centrale à béton", "centrales a beton", "bps", "producteur de beton", "producteurs de béton"],
    ["capacite"], "/intervenant/centrales"),
  fournisseur("prestataires", "Prestataires", "prestataires",
    ["prestataire", "prestataires", "sous-traitant", "sous-traitants", "soustraitant"],
    ["specialite", "statut"], "/intervenant/prestataires"),
  fournisseur("maitres_ouvrage", "Maîtres d'ouvrage", "maitres_ouvrage",
    ["maitre d'ouvrage", "maître d'ouvrage", "maitres d'ouvrage", "moa"],
    ["secteur", "statut"], "/intervenant/maitres-ouvrage"),
  fournisseur("maitres_oeuvre", "Maîtres d'œuvre", "maitres_oeuvre",
    ["maitre d'oeuvre", "maître d'œuvre", "maitres d'oeuvre", "moe", "bureau d'etude", "bureau d'étude"],
    ["specialite", "statut"], "/intervenant/maitres-oeuvre"),
  {
    key: "produits", label: "Produits / matériaux des producteurs", table: "produits", category: "materiaux",
    keywords: ["produit", "produits", "materiau", "materiaux", "matériau", "matériaux", "ciment", "ciments", "densite produit"],
    select: "id, nom, producteur_type, densite, created_at",
    searchFields: ["nom", "producteur_type"],
    orderBy: { column: "nom", ascending: true },
    labelCols: ["nom"], snippetCols: ["producteur_type", "densite"],
    source_type: "produit",
  },

  // ---------- Chantiers & organisation ----------
  {
    key: "chantiers", label: "Chantiers / projets", table: "chantiers", category: "chantiers",
    keywords: ["chantier", "chantiers", "projet", "projets", "site", "sites", "travaux", "ouvrage", "ouvrages"],
    select: "id, nom, ville, adresse, statut, date_debut, date_fin, contact, created_at",
    searchFields: ["nom", "ville", "adresse", "statut", "contact"],
    orderBy: { column: "created_at", ascending: false },
    labelCols: ["nom"], snippetCols: ["ville", "statut"],
    source_type: "chantier", url: "/intervenant/chantiers",
  },
  {
    key: "laboratoires_mobiles", label: "Laboratoires mobiles / de chantier", table: "laboratoires_mobiles", category: "chantiers",
    keywords: ["laboratoire mobile", "laboratoires mobiles", "labo mobile", "laboratoire de chantier", "laboratoires de chantier", "labo chantier"],
    select: "id, nom, immatriculation, statut, localisation_actuelle, created_at",
    searchFields: ["nom", "immatriculation", "statut", "localisation_actuelle"],
    orderBy: { column: "nom", ascending: true },
    labelCols: ["nom", "immatriculation"], snippetCols: ["statut", "localisation_actuelle"],
    source_type: "laboratoire_mobile", url: "/laboratoires-mobiles",
  },
  {
    key: "intervenants", label: "Personnel / techniciens (annuaire métier)", table: "intervenants", category: "personnel",
    keywords: ["technicien", "techniciens", "personnel", "intervenant", "intervenants", "equipe", "équipe", "operateur", "opérateur", "ingenieur", "ingénieur", "employe", "employé", "employes"],
    select: "id, nom, prenom, role, departement, specialite, statut, created_at",
    searchFields: ["nom", "prenom", "role", "departement", "specialite", "statut"],
    orderBy: { column: "nom", ascending: true },
    labelCols: ["nom", "prenom"], snippetCols: ["role", "departement", "specialite", "statut"],
    source_type: "intervenant", url: "/rh/intervenants",
  },
  {
    key: "postes", label: "Postes / fonctions", table: "postes", category: "personnel",
    keywords: ["poste", "postes", "fonction", "fonctions", "metier", "métier"],
    select: "id, nom, departement, type_contrat, nombre_employes, created_at",
    searchFields: ["nom", "departement", "type_contrat"],
    orderBy: { column: "nom", ascending: true },
    labelCols: ["nom"], snippetCols: ["departement", "type_contrat", "nombre_employes"],
    source_type: "poste", url: "/rh/postes",
  },
  {
    key: "affectations", label: "Affectations du personnel aux chantiers", table: "affectations", category: "personnel",
    keywords: ["affectation", "affectations", "mission", "missions", "affectation chantier"],
    select: "id, statut, date_debut, date_fin, notes, created_at",
    searchFields: ["statut", "notes"],
    orderBy: { column: "date_debut", ascending: false },
    labelCols: ["statut"], snippetCols: ["date_debut", "date_fin"],
    source_type: "affectation",
  },

  // ---------- Formulations ----------
  {
    key: "formulations", label: "Formulations / compositions béton", table: "formulations", category: "formulation",
    keywords: ["formulation", "formulations", "composition", "compositions", "melange", "mélange", "recette", "dreux", "gorisse", "dosage", "constituant", "constituants"],
    select: "id, nom, resistance_28j, classe_exposition, slump_souhaite, ciment_calcule, eau_calculee, created_at",
    searchFields: ["nom", "classe_exposition"],
    orderBy: { column: "created_at", ascending: false },
    labelCols: ["nom"], snippetCols: ["resistance_28j", "classe_exposition", "slump_souhaite"],
    source_type: "formulation", url: "/essais/formulation",
  },

  // ---------- Essais béton ----------
  essaiBeton("compression", "Essais de compression béton", "echantillons_compression",
    ["compression", "resistance a la compression", "résistance à la compression", "eprouvette", "éprouvette", "cube", "cylindre", "beton durci", "béton durci", "28j", "fc28"], "/essais/beton-durci/compression"),
  essaiBeton("carottage", "Carottages / carottes béton", "echantillons_carottage",
    ["carottage", "carottages", "carotte", "carottes", "carottee"], "/essais/beton-durci/carottage"),
  essaiBeton("traction_fendage", "Essais de traction par fendage", "echantillons_traction_fendage",
    ["traction", "fendage", "traction par fendage", "brésilien", "bresilien"], "/essais/beton-durci/traction-fendage"),
  essaiBeton("module_elasticite", "Essais de module d'élasticité", "echantillons_module_elasticite",
    ["module d'elasticite", "module d'élasticité", "module elastique", "young"], "/essais/beton-durci/module-elasticite"),
  essaiBeton("permeabilite", "Essais de perméabilité béton", "echantillons_permeabilite",
    ["permeabilite", "perméabilité", "penetration d'eau"], "/essais/beton-durci/permeabilite"),
  essaiBeton("sclerometre", "Essais au scléromètre", "echantillons_sclerometre",
    ["sclerometre", "scléromètre", "rebond", "schmidt"], "/essais/non-destructif/sclerometre"),
  essaiBeton("ultrason", "Essais ultrasons", "echantillons_ultrason",
    ["ultrason", "ultrasons", "auscultation sonique", "vitesse de propagation"], "/essais/non-destructif/ultrason"),
  {
    key: "affaissement", label: "Essais d'affaissement (slump)", table: "echantillons_affaissement", category: "essais_beton",
    keywords: ["affaissement", "slump", "cone d'abrams", "cône d'abrams", "consistance", "beton frais", "béton frais"],
    select: "id, numero, ouvrage, classe_consistance, statut, date_prelevement, created_at",
    searchFields: ["numero", "ouvrage", "classe_consistance", "statut"],
    orderBy: { column: "created_at", ascending: false },
    labelCols: ["numero", "ouvrage"], snippetCols: ["classe_consistance", "statut", "date_prelevement"],
    source_type: "affaissement", url: "/essais/beton-frais/affaissement",
  },
  {
    key: "temperature_beton", label: "Essais de température du béton", table: "echantillons_temperature", category: "essais_beton",
    keywords: ["temperature du beton", "température du béton", "essai de temperature"],
    select: "id, numero, ouvrage, temperature_ambiante, statut, created_at",
    searchFields: ["numero", "ouvrage", "statut"],
    orderBy: { column: "created_at", ascending: false },
    labelCols: ["numero", "ouvrage"], snippetCols: ["temperature_ambiante", "statut"],
    source_type: "temperature", url: "/essais/beton-frais/temperature",
  },
  {
    key: "temps_prise", label: "Essais de temps de prise", table: "echantillons_temps_prise", category: "essais_beton",
    keywords: ["temps de prise", "prise du beton", "prise du béton", "vicat"],
    select: "id, numero, ouvrage, statut, date_prelevement, created_at",
    searchFields: ["numero", "ouvrage", "statut"],
    orderBy: { column: "created_at", ascending: false },
    labelCols: ["numero", "ouvrage"], snippetCols: ["statut", "date_prelevement"],
    source_type: "temps_prise", url: "/essais/beton-frais/temps-prise",
  },
  {
    key: "teneur_air", label: "Essais de teneur en air", table: "echantillons_teneur_air", category: "essais_beton",
    keywords: ["teneur en air", "air occlus", "aeromètre", "aerometre"],
    select: "id, numero, ouvrage, statut, date_prelevement, created_at",
    searchFields: ["numero", "ouvrage", "statut"],
    orderBy: { column: "created_at", ascending: false },
    labelCols: ["numero", "ouvrage"], snippetCols: ["statut", "date_prelevement"],
    source_type: "teneur_air", url: "/essais/beton-frais/teneur-air",
  },

  // ---------- Essais granulats ----------
  essaiGranulat("granulometrie", "Analyses granulométriques", "echantillons_granulometrie",
    ["granulometrie", "granulométrie", "tamisage", "tamis", "module de finesse", "fuseau"]),
  essaiGranulat("los_angeles", "Essais Los Angeles", "echantillons_los_angeles", ["los angeles", "coefficient los angeles"]),
  essaiGranulat("micro_deval", "Essais Micro-Deval", "echantillons_micro_deval", ["micro deval", "micro-deval", "mde"]),
  essaiGranulat("equivalent_sable", "Équivalent de sable", "echantillons_equivalent_sable", ["equivalent de sable", "équivalent de sable"]),
  essaiGranulat("bleu_methylene", "Bleu de méthylène", "echantillons_bleu_methylene", ["bleu de methylene", "bleu de méthylène", "vbs"]),
  essaiGranulat("forme_granulats", "Coefficient d'aplatissement / forme", "echantillons_forme_granulats", ["aplatissement", "forme des granulats", "coefficient de forme"]),
  essaiGranulat("friabilite", "Friabilité des sables", "echantillons_friabilite", ["friabilite", "friabilité"]),
  essaiGranulat("masse_volumique", "Masse volumique des granulats", "echantillons_masse_volumique", ["masse volumique", "densite granulat", "densité granulat", "absorption"]),
  essaiGranulat("matiere_organique", "Matières organiques", "echantillons_matiere_organique", ["matiere organique", "matière organique", "impuretes"]),
  essaiGranulat("teneur_eau_granulat", "Teneur en eau des granulats", "echantillons_teneur_eau", ["teneur en eau des granulats", "humidite granulat", "humidité granulat"]),
  essaiGranulat("ecrasement", "Essais d'écrasement", "echantillons_ecrasement", ["ecrasement", "écrasement"]),

  // ---------- Essais géotechniques ----------
  essaiSol("proctor_normal", "Proctor normal", "echantillons_proctor_normal", ["proctor normal"]),
  essaiSol("proctor_modifie", "Proctor modifié", "echantillons_proctor_modifie", ["proctor modifie", "proctor modifié", "opm"]),
  essaiSol("cbr", "Essais CBR", "echantillons_cbr", ["cbr", "indice portant", "portance"]),
  essaiSol("limites_atterberg", "Limites d'Atterberg", "echantillons_limites_atterberg", ["atterberg", "limite de liquidite", "limite de plasticité", "indice de plasticite"]),
  essaiSol("classification_sol", "Classification des sols", "echantillons_classification_sol", ["classification des sols", "classification sol", "gtr", "uscs"]),
  essaiSol("granulometrie_sol", "Granulométrie des sols", "echantillons_granulometrie_sol", ["granulometrie des sols", "granulométrie sol", "gnt"]),
  essaiSol("teneur_eau_sol", "Teneur en eau des sols", "echantillons_teneur_eau_sol", ["teneur en eau des sols", "humidite sol", "humidité sol"]),
  essaiSol("cisaillement", "Essais de cisaillement", "echantillons_cisaillement", ["cisaillement", "boite de casagrande"]),
  essaiSol("triaxial", "Essais triaxiaux", "echantillons_triaxial", ["triaxial", "triaxiaux"]),
  essaiSol("oedometrique", "Essais œdométriques", "echantillons_oedometrique", ["oedometrique", "œdométrique", "oedometre", "consolidation"]),
  essaiSol("compression_simple", "Compression simple (sol / roche)", "echantillons_compression_simple", ["compression simple", "resistance a la compression simple"]),
  essaiSol("densite_place", "Densité en place", "echantillons_densite_place", ["densite en place", "densité en place"]),
  essaiSol("densitometre", "Densitomètre à membrane", "echantillons_densitometre", ["densitometre", "densitomètre", "membrane"]),
  essaiSol("penetrometre", "Pénétromètre", "echantillons_penetrometre", ["penetrometre", "pénétromètre", "penetration dynamique"]),
  essaiSol("plaque", "Essais à la plaque", "echantillons_plaque", ["essai a la plaque", "plaque", "ev2", "module de deformation"]),
  essaiSol("pressiometre", "Pressiomètre", "echantillons_pressiometre", ["pressiometre", "pressiomètre", "menard"]),
  essaiSol("sondage", "Sondages", "echantillons_sondage", ["sondage", "sondages", "forage"]),

  // ---------- Essais (registre générique) ----------
  {
    key: "essais", label: "Registre des essais", table: "essais", category: "essais",
    keywords: ["essai", "essais", "test", "tests", "prelevement", "prélèvement", "prelevements", "echantillon", "échantillon", "echantillons"],
    select: "id, type, statut, reference, created_at",
    searchFields: ["type", "statut", "reference"],
    orderBy: { column: "created_at", ascending: false },
    labelCols: ["type", "reference"], snippetCols: ["statut"],
    source_type: "essai", url: "/essais",
  },

  // ---------- Rapports & documents ----------
  {
    key: "rapports_techniques", label: "Rapports techniques", table: "rapports_techniques", category: "rapports",
    keywords: ["rapport technique", "rapports techniques", "rapport", "rapports", "expertise", "expertises", "non-conformite", "non conformite", "non-conformités", "anomalie", "anomalies", "observation", "observations", "recommandation", "recommandations"],
    select: "id, numero, titre, statut, entreprise, projet, created_at",
    searchFields: ["numero", "titre", "description_probleme", "entreprise", "projet", "statut"],
    orderBy: { column: "created_at", ascending: false },
    labelCols: ["numero", "titre"], snippetCols: ["statut", "entreprise", "projet"],
    source_type: "rapport_technique", url: "/essais/rapports-techniques",
  },
  {
    key: "document_archives", label: "Documents archivés (PDF officiels)", table: "document_archives", category: "documents",
    keywords: ["document archive", "documents archives", "archive", "archives", "document officiel", "documents officiels"],
    select: "id, numero, document_type, version, created_at",
    searchFields: ["numero", "document_type"],
    orderBy: { column: "created_at", ascending: false },
    labelCols: ["numero", "document_type"], snippetCols: ["version"],
    source_type: "document_archive",
  },

  // ---------- Matériel ----------
  {
    key: "materiel_laboratoire", label: "Matériel de laboratoire", table: "materiel_laboratoire", category: "materiel",
    keywords: ["materiel", "matériel", "materiels", "equipement", "equipements", "équipement", "instrument", "machine", "presse", "balance", "etuve", "étuve"],
    select: "id, nom, reference, marque, modele, categorie, statut_courant, created_at",
    searchFields: ["nom", "reference", "marque", "modele", "categorie", "statut_courant"],
    orderBy: { column: "nom", ascending: true },
    labelCols: ["reference", "nom"], snippetCols: ["marque", "modele", "categorie", "statut_courant"],
    source_type: "materiel", url: "/materiel/liste",
  },
  {
    key: "materiel_chantier", label: "Matériel (inventaire général)", table: "materiel", category: "materiel",
    keywords: ["materiel de chantier", "matériel de chantier", "inventaire materiel", "inventaire matériel"],
    select: "id, nom, reference, marque, modele, statut, localisation, created_at",
    searchFields: ["nom", "reference", "marque", "modele", "statut", "localisation"],
    orderBy: { column: "nom", ascending: true },
    labelCols: ["reference", "nom"], snippetCols: ["marque", "statut", "localisation"],
    source_type: "materiel", url: "/materiel/liste",
  },
  {
    key: "materiel_movements", label: "Mouvements de matériel (affectation, décharge, passation, restitution)",
    table: "materiel_movements", category: "materiel",
    keywords: ["mouvement de materiel", "mouvements de matériel", "affectation de materiel", "affectation de matériel", "decharge", "décharge", "passation", "restitution", "transfert de materiel", "transfert de matériel"],
    select: "id, numero, type, statut, date_mouvement, created_by_nom, created_at",
    searchFields: ["numero", "statut", "created_by_nom"],
    orderBy: { column: "date_mouvement", ascending: false },
    labelCols: ["numero", "type"], snippetCols: ["statut", "date_mouvement"],
    source_type: "mouvement_materiel", url: "/materiel/mouvements",
  },
  {
    key: "affectation_materiel", label: "Affectations de matériel aux chantiers", table: "affectation_materiel", category: "materiel",
    keywords: ["affectation materiel chantier", "materiel affecte", "matériel affecté"],
    select: "id, statut, date_debut, date_fin, quantite, observations, created_at",
    searchFields: ["statut", "observations"],
    orderBy: { column: "date_debut", ascending: false },
    labelCols: ["statut"], snippetCols: ["date_debut", "date_fin", "quantite"],
    source_type: "affectation_materiel",
  },
  {
    key: "etalonnages", label: "Étalonnages du matériel", table: "etalonnage_materiel", category: "materiel",
    keywords: ["etalonnage", "étalonnage", "etalonnages", "calibration", "certificat d'etalonnage", "verification periodique"],
    select: "id, organisme, numero_certificat, date_etalonnage, date_prochaine, statut",
    searchFields: ["organisme", "numero_certificat", "statut"],
    orderBy: { column: "date_prochaine", ascending: true },
    labelCols: ["numero_certificat", "organisme"], snippetCols: ["date_prochaine", "statut"],
    source_type: "etalonnage", url: "/materiel/etalonnage",
  },
  {
    key: "maintenances", label: "Maintenances du matériel", table: "maintenance_materiel", category: "materiel",
    keywords: ["maintenance", "maintenances", "entretien", "reparation", "réparation", "controle materiel"],
    select: "id, type_maintenance, date_maintenance, date_prochaine_maintenance, statut, prestataire, created_at",
    searchFields: ["type_maintenance", "statut", "prestataire", "description"],
    orderBy: { column: "date_maintenance", ascending: false },
    labelCols: ["type_maintenance"], snippetCols: ["date_maintenance", "statut", "prestataire"],
    source_type: "maintenance", url: "/materiel/maintenance",
  },

  // ---------- Commercial / facturation ----------
  docCommercial("devis", "Devis", "devis", ["devis"], ["montant_ht", "montant_ttc", "date_emission"]),
  docCommercial("factures", "Factures", "factures", ["facture", "factures", "facturation"], ["montant_ht", "montant_ttc", "montant_paye", "date_emission"]),
  docCommercial("bons_commande", "Bons de commande", "bons_commande", ["bon de commande", "bons de commande", "commande", "commandes"], ["montant_ht", "montant_ttc", "date_commande"]),
  {
    key: "contrats", label: "Contrats (métadonnées)", table: "contrats", category: "facturation",
    keywords: ["contrat", "contrats", "convention", "conventions"],
    select: "id, titre, statut, date_signature, date_expiration, created_at",
    searchFields: ["titre", "statut"],
    orderBy: { column: "created_at", ascending: false },
    labelCols: ["titre"], snippetCols: ["statut", "date_signature", "date_expiration"],
    source_type: "contrat",
  },
  {
    key: "offres_prix", label: "Offres de prix", table: "offres_prix", category: "facturation",
    keywords: ["offre de prix", "offres de prix", "offre", "offres"],
    select: "id, numero, titre, statut, montant_ht, montant_ttc, date_document, created_at",
    searchFields: ["numero", "titre", "statut"],
    orderBy: { column: "created_at", ascending: false },
    labelCols: ["numero", "titre"], snippetCols: ["statut", "montant_ht"],
    source_type: "offre_prix",
  },
  {
    key: "prix_essais", label: "Tarifs des essais", table: "prix_essais", category: "facturation",
    keywords: ["prix des essais", "tarif", "tarifs", "prix unitaire", "bareme", "barème"],
    select: "id, nom_essai, code_essai, categorie, prix_unitaire, unite",
    searchFields: ["nom_essai", "code_essai", "categorie"],
    orderBy: { column: "nom_essai", ascending: true },
    labelCols: ["code_essai", "nom_essai"], snippetCols: ["categorie", "prix_unitaire", "unite"],
    source_type: "prix_essai",
  },
];

// Groupes métier : une question générique cible plusieurs entités.
export const ENTITY_GROUPS: Record<string, string[]> = {
  "fournisseur": ["cimenteries", "carrieres", "adjuvants", "sources_eau", "centrales_beton"],
  "fournisseurs": ["cimenteries", "carrieres", "adjuvants", "sources_eau", "centrales_beton"],
  "producteur": ["cimenteries", "carrieres", "adjuvants", "sources_eau", "centrales_beton"],
  "producteurs": ["cimenteries", "carrieres", "adjuvants", "sources_eau", "centrales_beton"],
};

const norm = (v: string) =>
  v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    // l'apostrophe est traitée comme une frontière de mot (d'essais → d essais)
    .replace(/[^a-z0-9]+/g, " ").trim();

export function getEntity(key: string): BusinessEntity | undefined {
  return BUSINESS_ENTITIES.find((e) => e.key === key);
}

/**
 * Résout une question utilisateur vers les entités métier concernées.
 * Match sur le vocabulaire déclaré (normalisé, sans accents), le plus long d'abord
 * pour que « teneur en eau des sols » gagne sur « teneur en eau des granulats ».
 */
export function resolveBusinessEntities(query: string, max = 4): BusinessEntity[] {
  const n = " " + norm(query) + " ";
  const scored: Array<{ e: BusinessEntity; score: number }> = [];

  for (const e of BUSINESS_ENTITIES) {
    let best = 0;
    for (const kw of e.keywords) {
      const k = norm(kw);
      if (k.length < 3) continue;
      // singulier/pluriel simples : « cimenterie » matche « cimenteries »
      const re = new RegExp(`(^| )${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?( |$)`);
      if (re.test(n)) best = Math.max(best, k.length);
    }
    if (best > 0) scored.push({ e, score: best });
  }

  // Groupes génériques (fournisseurs, producteurs…) si rien de plus précis.
  if (!scored.length) {
    for (const [kw, keys] of Object.entries(ENTITY_GROUPS)) {
      if (new RegExp(`(^| )${norm(kw)}s?( |$)`).test(n)) {
        for (const k of keys) {
          const e = getEntity(k);
          if (e) scored.push({ e, score: 3 });
        }
        break;
      }
    }
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, max).map((x) => x.e);
}

/** Mots du vocabulaire d'entité — retirés des mots-clés de recherche ILIKE. */
export function entityVocabulary(entities: BusinessEntity[]): Set<string> {
  const bag = new Set<string>();
  for (const e of entities) for (const kw of e.keywords) for (const w of norm(kw).split(" ")) if (w) bag.add(w);
  return bag;
}

/** Cartographie exportable (rapport d'audit / debug). */
export function businessEntityMap() {
  return BUSINESS_ENTITIES.map((e) => ({
    entite: e.label, key: e.key, table: e.table, categorie: e.category,
    count: true, search: e.searchFields.length > 0, get: true,
  }));
}

/** Construit une clause `.or()` Supabase ILIKE (valeurs échappées). */
export function buildIlikeOrFields(fields: string[], keywords: string[]): string | null {
  const clauses: string[] = [];
  for (const f of fields) for (const k of keywords) {
    const safe = k.replace(/[%,()"'\\]/g, "");
    if (safe) clauses.push(`${f}.ilike.%${safe}%`);
  }
  return clauses.length ? clauses.join(",") : null;
}
