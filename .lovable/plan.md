# Assistant IA de rédaction de rapports techniques

Module complet permettant à un technicien de décrire un problème, à une IA (Gemini 2.5 Flash) de l'analyser et de rédiger un projet de rapport, puis à un ingénieur de valider et générer un PDF officiel archivé.

## Note sur le modèle IA

Vous avez demandé **Gemini 2.5 Flash via l'API Google AI Studio** (clé Google).

Deux options — je recommande la 1 :
1. **Lovable AI Gateway → `google/gemini-2.5-flash`** : aucune clé à fournir, facturé sur vos crédits Lovable, même modèle, appel serveur via edge function. Zéro configuration.
2. **Google AI Studio direct** : vous fournissez `GOOGLE_AI_API_KEY` (secret sécurisé), appel serveur via edge function vers `generativelanguage.googleapis.com`.

Je propose de partir sur **l'option 1** sauf indication contraire — même modèle, aucune clé à gérer. Dites-moi si vous préférez l'option 2.

## Rôles (réutilisation existante)

Mapping via la table `user_roles` existante :
- `TECHNICIEN` → peut créer/décrire/joindre/sauver brouillon
- `INGENIEUR` (à créer si absent) ou `RESPONSABLE` → peut modifier, valider, signer
- `SUPER_ADMIN` / `ADMIN` → gère modèles, catégories, prompts système, en-têtes

Je vérifierai les rôles présents avant impl. et je créerai un rôle `ingenieur` uniquement si nécessaire.

## Architecture (aperçu technique)

**Tables Supabase** :
- `rapports_techniques` — id, numero (RAPP-YYYY-NNN), titre, description_probleme, categorie, sous_type, client_id, chantier_id, materiau, statut (brouillon/en_cours/a_completer/en_attente_validation/valide/refuse/archive), technicien_id, ingenieur_id, analyse_ia (jsonb: type, confiance, gravite, essais_recommandes, normes, causes, risques), contenu_rapport (jsonb structuré : objet/contexte/constatations/analyse/consequences/recommandations/conclusion), version, valide_at, pdf_url, qr_token
- `rapport_pieces_jointes` — id, rapport_id, type (photo/pdf/essai/document), nom, url, essai_ref
- `rapport_questions_ia` — id, rapport_id, question, reponse, ordre
- `rapport_historique` — id, rapport_id, user_id, action, ancien_contenu jsonb, nouveau_contenu jsonb, timestamp
- `rapport_modeles_bibliotheque` — id, categorie, titre, prompt_template, structure_default (jsonb) — 21+ modèles seedés
- `rapport_categories` — id, nom, ordre, icone (Béton, Granulats, Ciment, Adjuvant, Acier, Chantier, Essais, Non-conformités, Réclamations, Audit, Autres)

**RLS** : techniciens voient leurs rapports + ceux de leur périmètre (Wilaya/Chantier), ingénieurs voient tout, admin voit tout. `GRANT` explicites sur chaque table.

**Bucket Storage** : `rapports-techniques` (photos, PDFs joints, rapports générés).

**Edge Functions** :
- `rapport-analyser` — reçoit description + pièces, retourne analyse structurée (Output.object schema Zod)
- `rapport-questions` — génère questions complémentaires selon lacunes détectées
- `rapport-generer` — produit le rapport structuré en 7 sections
- `rapport-pdf` — assemble le PDF final via composant impression (`data-ref="report"`, `-webkit-print-color-adjust: exact`)

## Livraison par phases

### Phase 1 — Fondations base de données + navigation
- Migrations : 6 tables + RLS + GRANT + bucket storage
- Seed catégories + 21 modèles de bibliothèque
- Route `/essais/rapports-techniques` + refonte du widget (déjà en place) en page fonctionnelle
- Layout principal : bibliothèque à gauche, zone centrale, header avec onglets (Nouveau / Brouillons / En attente / Validés / Archivés)
- Filtres + recherche + badges de compteurs par onglet

### Phase 2 — Création & description
- Formulaire "Nouveau rapport" : sélection catégorie/sous-type (depuis bibliothèque), grand textarea description, sélection Client → Chantier (cascade), matériau, date
- Upload multi-fichiers : photos, PDFs, documents (Storage)
- Sélection d'essais existants du laboratoire (picker vers `essais_*`)
- Sauvegarde brouillon auto + manuel

### Phase 3 — Moteur IA (analyse + questions + génération)
- Edge function `rapport-analyser` avec prompt système "ingénieur senior spécialisé laboratoire de contrôle des matériaux" : ton neutre/juridique/technique, jamais inventer, "Information non disponible" si manque
- Affichage carte d'analyse (type détecté, badge de confiance, gravité, matériaux, essais recommandés, normes, causes probables, risques)
- Edge function `rapport-questions` : détecte lacunes, pose questions ciblées, l'utilisateur répond, l'IA intègre
- Edge function `rapport-generer` : produit contenu structuré en 7 sections (Objet / Contexte / Constatations / Analyse technique / Conséquences / Recommandations / Conclusion) avec distinction Faits / Hypothèses / Analyses / Recommandations / Conclusions

### Phase 4 — Éditeur & workflow de validation
- Éditeur riche (Tiptap) : gras, listes, tableaux, images inline, insertion résultats d'essais et références normatives
- Boutons de workflow selon rôle : Enregistrer brouillon / Marquer à compléter / Soumettre validation / Valider / Refuser
- Historique complet (utilisateur, date, ancien contenu, nouveau contenu) — diff visuel version à version
- Signature électronique ingénieur (image signature depuis `parametres_signature`)

### Phase 5 — PDF officiel + archivage
- Composant impression avec logo, en-tête laboratoire, référence auto `RAPP-YYYY-NNN`, projet, client, entreprise, date, 7 sections, signature/cachet, QR code de vérification (token public → page de vérification), pagination, pied de page
- Génération PDF via `window.print()` sur route dédiée + option `html2pdf` pour téléchargement direct
- Archivage : upload dans bucket + `pdf_url` en base + verrouillage lecture seule après validation

### Phase 6 — Historique, recherche IA, statistiques
- Page Historique avec filtres avancés (client, chantier, date, type, catégorie, statut, ingénieur, technicien, mot-clé)
- Recherche full-text (Postgres tsvector) sur titre + description + contenu + pièces jointes indexées
- Recherche sémantique IA optionnelle : le mot-clé déclenche un appel Gemini qui reformule et étend la requête
- Dashboard admin : rapports par mois, taux validation, temps moyen technicien→validation, catégories les plus fréquentes

## Points à confirmer avant Phase 1

1. **Modèle IA** : je pars sur Lovable AI Gateway `google/gemini-2.5-flash` (aucune clé) — OK ? Sinon je bascule sur clé Google AI Studio.
2. **Rôle "ingénieur"** : je crée un nouveau rôle `ingenieur` dans user_roles, ou je mappe sur `RESPONSABLE` existant ? (je vérifierai la liste des rôles actuels)
3. **QR code de vérification** : page publique `/verifier/:token` qui affiche un résumé signé du rapport — OK ?
4. **Périmètre du contenu inséré par IA** : autorisez-vous l'IA à citer nommément des normes (EN 206, NF P18, ASTM…) même sans document joint, ou uniquement les normes présentes dans la base ?

Répondez sur ces 4 points (ou dites "go phase 1 avec vos défauts") et je démarre l'implémentation phase par phase.
