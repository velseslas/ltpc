# AUDIT FINAL — RÉDACTION RAPPORTS TECHNIQUES + IA
Phase 1 — audit seul. **Aucun code, aucune migration, aucune policy, aucun prompt n'a été modifié.**
Date : 25/07/2026 — Méthode : lecture statique exhaustive du module, inspection de la base (pg_policies, pg_trigger, information_schema, pg_constraint), typecheck `tsgo` (0 erreur).

---

## 1. Cartographie du module

### Pages / routes
| Route | Fichier | Rôle |
|---|---|---|
| `/essais/redaction-rapport-technique` et `/essais/rapports-techniques` | `src/pages/essais/RedactionRapportTechnique.tsx` | Liste + onglets statuts + catégories/modèles |
| `/essais/rapports-techniques/nouveau` | `src/pages/essais/rapports-techniques/NouveauRapportTechnique.tsx` | Assistant 5 étapes (contexte → catégorie → problème → pièces → récap) |
| `/essais/rapports-techniques/:id` | `src/pages/essais/rapports-techniques/RapportTechniqueDetail.tsx` | Éditeur, IA, validation, historique, document officiel |
| `/reports/rapport-technique/:id/print` | `src/pages/essais/rapports-techniques/RapportTechniquePrintView.tsx` | Vue A4 native (Print Engine V2) |
| `/verification/:token` | `src/pages/verification/VerificationPage.tsx` | Vérification publique QR |
| `/ltpc-ai`, `/ltpc-ai/monitoring`, `/ltpc-ai/knowledge` | `src/pages/ltpc-ai/*` | Copilote, IA proactive, base de connaissance |

Déclaration des routes : `src/routes/essaisCoreRoutes.tsx`, `src/App.tsx` (route print + `/verification/:token`).

### Composants
`src/components/rapports/RichTextEditor.tsx` (Tiptap), `src/components/rapports/AISuggestionDialog.tsx`, `src/components/reports/ReportHeader.tsx`, `src/components/reports/ShareButton.tsx`/`ShareDialog.tsx`, `src/components/layout/AppBreadcrumb.tsx`.

### Hooks
`useRapportsTechniques.ts` (CRUD, catégories, modèles, pièces jointes, `useContexteChantier`), `useRapportAI.ts`, `useRapportWorkflow.ts` (versions + transitions), `useDocumentArchives.ts`, `useEntreprise.ts`, `useProactiveAlerts.ts`, `useLtpcAI.ts`.

### Services / libs
`src/lib/ai/aiProvider.ts` (façade client), `src/lib/ai/aiCatalog.ts`, `src/lib/ai/aiRoutingStore.ts`, `src/lib/rapports/templateEngine.ts`, `src/lib/documents/DocumentGenerator.ts` (+ `types.ts`, `DocumentShareService.ts`), `src/lib/print/PrintService.ts`, `src/styles/print.css`, `src/lib/sanitize.ts`, `src/lib/repositories/DocumentRepository.ts`, `src/lib/qrContent.ts`, `src/lib/ltpc-ai/*` (AgentOrchestrator, SearchService, KnowledgeService, ContextService, ConversationService, `tools/*` 15 outils, `analysis/*` 5 services).

### Edge Functions
`rapport-ai-analyser`, `rapport-ai-questions`, `rapport-ai-generer`, `rapport-ai-improve`, `rapport-ai-review`, `ltpc-ai-chat`, `ltpc-ai-embed`, `ltpc-ai-rag-index`, `ltpc-ai-monitor`, `ltpc-ai-narrative`, `verify-archive`.
Partagés : `_shared/ai-provider.ts` (factory multi-fournisseurs + `FEATURE_ROUTING`), `_shared/ai-prompts.ts`, `_shared/ai-log.ts`, `_shared/auth-guard.ts`, `_shared/rate-limit.ts`.

### Tables
`rapports_techniques`, `rapport_categories`, `rapport_modeles_bibliotheque`, `rapport_templates`, `rapport_versions`, `rapport_workflow_events`, `rapport_historique`, `rapport_pieces_jointes`, `rapport_questions_ia`, `rapport_ai_calls`, `rapport_ai_reviews`, `document_archives`, `ai_alerts`, `ai_daily_summaries`, `ai_knowledge_chunks`, `journal_audit`.

### Buckets
`rapports-techniques` (privé, pièces jointes), `documents-officiels` (privé, PDF archivés), `logos` (public), `signatures` (privé).

### Fichiers critiques
`DocumentGenerator.ts`, `RapportTechniquePrintView.tsx`, `useRapportWorkflow.ts`, `_shared/ai-provider.ts`, `_shared/auth-guard.ts`, `verify-archive/index.ts`, `ltpc-ai-rag-index/index.ts`.

---

## 2. Parcours utilisateur — ruptures constatées

Chaîne théorique respectée jusqu'à « validation ». Ruptures :

1. **Bouton « Historique » cassé** — `RedactionRapportTechnique.tsx:120` navigue vers `/essais/rapports-techniques/historique`, route inexistante : elle est captée par `/:id` et affiche « Rapport introuvable ».
2. **Aucune autosauvegarde dans l'éditeur** (`RapportTechniqueDetail.tsx`) : le HTML Tiptap n'existe qu'en state React tant que l'utilisateur ne clique pas « Enregistrer version ».
3. **Le contexte chantier n'est pas rafraîchi ni réaffiché** après création : `useContexteChantier` n'est appelé que dans l'assistant.
4. **Aucun RAG dans la chaîne de rédaction** : `rapport-ai-analyser` / `-generer` / `-review` n'interrogent jamais `ai_knowledge_chunks`. Le RAG n'existe que pour le chat copilote.
5. **Signature/cachet affichés dès l'ouverture de la vue imprimable**, même sur brouillon.
6. **QR imprimé non vérifiable** (voir §15).
7. **Deux moteurs PDF concurrents** : vue print native (A4, texte sélectionnable) vs `DocumentGenerator` rasterisé (html2canvas) pour le « document officiel » archivé.

---

## 3. Base de données

Structure globalement saine : PK uuid, FK `ON DELETE SET NULL` vers `clients`/`chantiers`/`categories`/`modeles`, `rapport_versions` en CASCADE avec `UNIQUE(rapport_id, version)`, `document_archives` protégé par un trigger `block_delete` (immutabilité) et `UNIQUE(qr_token)`. `created_at`/`updated_at` avec `trg_rap_upd`. Tous les champs demandés existent : `entreprise`, `projet`, `contexte_auto`, `prompt_utilisateur`, `metadonnees`, `last_autosave_at`, `version`, `version_courante`, `editor_html`, `qr_token`, `publie_at`.

**Numérotation `RAPP-YYYY-NNNN`** — `trg_assign_rap_num` → `assign_rapport_numero()` → `next_rapport_numero()` :
- Attribué uniquement au passage `statut='valide'` (les brouillons n'ont pas de numéro) : conforme à une logique « numéro officiel », mais l'UI affiche alors le titre à sa place.
- Unicité garantie par `UNIQUE(numero)`.
- Calcul par `MAX(regexp_replace(...))` **sans verrou** (`pg_advisory_xact_lock` absent) : deux validations simultanées peuvent viser le même numéro ; la contrainte UNIQUE fait échouer la seconde transaction avec une erreur brute non traduite dans l'UI. Pas de trou/réutilisation, mais échec fonctionnel possible.
- Non réutilisation : OK (jamais réattribué, jamais remis à NULL).
- **Absence de contrainte d'état** : rien en base n'interdit de repasser `valide` → `brouillon`, ni de modifier `contenu_rapport`/`editor_html` d'un rapport `valide` (voir §12/§18).

---

## 4. Brouillon / autosave

- Assistant : autosave `setInterval` 30 s (`NouveauRapportTechnique.tsx:166`) + « Enregistrer » manuel + création du brouillon en sortie d'étape 1. `last_autosave_at` renseigné à chaque update.
- **Risques identifiés** :
  - Aucun `beforeunload` / `visibilitychange` : la fermeture d'onglet dans les 30 s perd les saisies (grep : aucun listener dans le module).
  - Aucune file offline : les échecs réseau ne sont que « toastés » (mode silencieux : perte silencieuse). La `syncQueue` PWA (`src/lib/pwa/syncQueue.ts`) n'est pas branchée sur ce module.
  - Aucune restauration locale (pas de sauvegarde IndexedDB/localStorage du formulaire) : rechargement avant première création ⇒ perte totale.
  - Page détail : **aucun autosave**, aucun garde-fou de navigation ; le travail de rédaction long est le plus exposé.
  - `handleFiles` peut appeler `saveDraft` puis lire `rapportId` non encore mis à jour (closure) — chemin d'upload fragile avant première sauvegarde.

---

## 5. Architecture IA

- Deux couches distinctes et cohérentes : façade client `src/lib/ai/aiProvider.ts` (n'appelle que `supabase.functions.invoke`, aucune clé) et factory serveur `_shared/ai-provider.ts` (lovable, openai, mistral, deepseek, anthropic, ollama) avec `FEATURE_ROUTING` primaire → fallback.
- **Aucune clé API côté frontend** (vérifié : aucune référence `LOVABLE_API_KEY`/`*_API_KEY` dans `src/`). Tous les appels sensibles passent par Edge Functions avec `requireAuth` + `enforceRateLimit` + `canAccessRapport`.
- **Pas d'implémentation concurrente** de la façade : `getAIProvider()` consommé uniquement par `useRapportAI.ts` et `useRapportWorkflow.ts`.
- Faiblesses :
  - **Aucun timeout** sur `postJson` (`_shared/ai-provider.ts:55`) : un fournisseur qui ne répond pas bloque la fonction jusqu'au timeout plateforme.
  - **Aucun retry** ; le fallback est déclenché même sur erreurs terminales (402 crédits épuisés, 401) — consommation inutile de fournisseurs alternatifs, et message final = erreur du dernier fournisseur, pas la cause réelle.
  - **Aucune limite de taille** de prompt ni de `max_tokens` (sauf Anthropic 4096) : contexte auto + réponses questions + description peuvent gonfler sans borne.
  - Modèles figés en génération prior (`gemini-2.5-flash/pro`) ; le catalogue applicatif (`aiCatalog.ts`, `aiRoutingStore.ts`) n'est pas relié à `FEATURE_ROUTING` serveur — le routage « paramétrable » côté UI n'a aucun effet.
  - Coûts/tokens journalisés (`rapport_ai_calls`) mais aucun quota par utilisateur/rapport.

---

## 6. Prompts

Centralisés dans `_shared/ai-prompts.ts` (aucun prompt dans les composants) — bon point. Système `SYSTEM_INGENIEUR_LABO` impose « ne jamais inventer », « Information non disponible. », séparation faits/hypothèses.
Faiblesses :
- **Pas de versionnement** des prompts (aucun `prompt_version` persisté dans `rapport_ai_calls`) : impossible de rejouer/expliquer un rapport ancien.
- **Injection de prompt possible** : `description_probleme`, réponses aux questions, noms de chantier/formulation sont interpolés en clair dans le prompt utilisateur, séparés uniquement par `"""`. Un texte du type « Ignore les instructions précédentes… » dans la description est traité comme instruction. Aucune neutralisation, aucun marquage « DONNÉES NON FIABLES ».
- Contexte auto injecté sans distinction « mesuré / déclaré / absent » : « N/A » et une valeur réelle ont le même poids visuel dans le prompt.

---

## 7. Contexte chantier

`useContexteChantier` (`useRapportsTechniques.ts:367`) — pas de fichier `useContexteChantier.ts` séparé.
- Sources : `chantiers` + `clients` (nom, représentant), `formulations` du chantier, comptage `echantillons_compression`.
- **Approximations non signalées** : `entreprise = clients.representant ?? clients.nom` et `projet = chantiers.description ?? chantiers.nom`. Une donnée déduite est présentée comme certaine (badge « Contexte récupéré automatiquement »), sans mention de la source ni du caractère supposé.
- Couverture partielle : seuls les essais de compression sont comptés ; granulats, géotechnique, carottage, NDT, matériel/étalonnage sont absents du contexte.
- **Snapshot figé** : `contexte_auto` est écrit à la création puis jamais rafraîchi ; aucun horodatage de capture ⇒ contexte potentiellement obsolète au moment de l'analyse IA, sans avertissement.
- Aucune gestion de conflit entre valeur auto et valeur saisie (l'utilisateur écrase, l'origine est perdue).

---

## 8. RAG / connaissances

- Ingestion : `ltpc-ai-rag-index` (chunks 900 c. / overlap 120), embeddings `google/gemini-embedding-001` via gateway, stockage `ai_knowledge_chunks`. Recherche : `KnowledgeService.hybridSearch` (FTS + similarité cosinus côté client).
- 🔴 **L'indexation des rapports techniques est cassée** : `TABLE_FOR.rapport_technique` sélectionne `contexte` et `contenu_html` (`ltpc-ai-rag-index/index.ts:76`) — ces colonnes n'existent pas dans `rapports_techniques` (vérifié en base : 0 ligne). Toute réindexation de la source `rapport_technique` échoue ⇒ aucun rapport historique n'entre dans la base de connaissance.
- 🟠 **Le RAG n'alimente pas la rédaction** : aucune des fonctions `rapport-ai-*` n'appelle `KnowledgeService`/`ai_knowledge_chunks`. Le rapport généré ne contient donc **aucune citation ni source** ; les normes citées par le modèle proviennent de sa mémoire paramétrique, non d'un corpus tracé.
- Aucune notion de version/date de validité des documents indexés, aucun marquage « obsolète », aucune distinction norme officielle / note interne.
- `ai_knowledge_chunks` lisible par tout utilisateur authentifié (`read chunks authenticated`, `qual: true`) — pas de cloisonnement client/chantier.

---

## 9. Services d'analyse

Présents et typés : `CompressionAnalysisService`, `ConcreteMixAnalysisService`, `GranulometryAnalysisService`, `AnomalyDetectionService`, `TechnicalRecommendationService` (`src/lib/ltpc-ai/analysis/`).
- 🟠 **Non branchés au module rapports** : ils ne sont consommés que par les outils du copilote (`tools/CompressionTool.ts`, `NonConformityTool.ts`). Les fonctions `rapport-ai-analyser`/`-generer` ne reçoivent ni anomalies détectées ni recommandations calculées — l'analyse « technique » du rapport est purement générative.
- Conséquence directe : **une recommandation technique peut être produite sans aucune donnée d'essai**, sans avertissement de suffisance des données (seul garde-fou : la liste `informationsManquantes` du JSON d'analyse, purement déclarative et non bloquante).
- Côté services eux-mêmes : entrées/sorties typées, dégradation silencieuse quand les tableaux sont vides (retour « aucune anomalie ») — pas d'état « données insuffisantes » distinct de « conforme ».

---

## 10. IA proactive

- `ltpc-ai-monitor` : scans déterministes (compression `fc < fck-4`, formulations `E/C > 0,65`, étalonnage ≤ 30 j), upsert `ai_alerts` sur `onConflict: code,source_type,source_id` (déduplication correcte), narration facultative, `ai_daily_summaries`.
- Points d'attention :
  - **Aucun cron installé** (aucun job pg_cron constaté) : la surveillance ne tourne que si quelqu'un déclenche la fonction ⇒ « proactif » de fait manuel.
  - `extractResistance` fait une recherche récursive de clés numériques dans `resultats` : risque de **faux positifs/négatifs** (peut capter une valeur qui n'est pas une résistance moyenne à 28 j) et ignore l'âge de l'essai.
  - `classFromLabel` ne lit que la partie cylindre de « C25/30 » — pas d'erreur, mais aucune trace de la convention utilisée dans l'alerte.
  - Fenêtres fixes (500/300 lignes, 30 jours) : silencieusement tronquées sur gros volumes.
  - Alertes en `status='open'`, résolution possible par admin/manager ; historique conservé. Aucune décision automatique n'est prise — conforme à l'exigence.
  - Lecture : **toute personne authentifiée voit toutes les alertes** (tous clients/chantiers confondus).

---

## 11. Éditeur (Tiptap)

- Extensions : StarterKit (H1-H3, listes, citation, hr), Underline, Link, Image (URL), Table complète, Placeholder ; insertion de variables `{{…}}` ; action IA sur sélection.
- `onUpdate` → state parent ; persistance uniquement via « Enregistrer version » (`rapport_versions` + `editor_html`).
- Risques :
  - Pas d'autosave, pas de verrou d'édition concurrente ni de détection de conflit : deux utilisateurs qui éditent le même rapport écrasent mutuellement `editor_html` (dernier écrit gagne, sans avertissement).
  - `useEffect` de resynchronisation sur `value` : un rechargement de la query pendant la frappe peut réécrire le contenu de l'éditeur.
  - Images par URL externe uniquement (pas d'upload) : une image externe indisponible casse le rendu du document final ; aucune vérification `https`.
  - Contenu exploitable pour le document final : oui (HTML sanitizé par DOMPurify avant rendu — `sanitize.ts` retire `style`, scripts, iframes). Note : la suppression de l'attribut `style` supprime aussi les mises en forme légitimes collées.

---

## 12. Validation humaine

- Statuts : `brouillon → en_cours → a_completer → en_attente_validation → valide → refuse → archive`. Transitions UI cohérentes (`WorkflowActions`), journalisées dans `rapport_workflow_events` avec auteur, commentaire obligatoire au refus.
- L'IA n'écrit jamais directement dans le rapport final (génération = proposition dans l'éditeur ; revue IA = observations seules) — **exigence respectée au niveau UI**.
- 🔴 **Workflow non contraint côté serveur** : `useWorkflowTransition` (`useRapportWorkflow.ts:143`) applique n'importe quelle transition depuis le client, sans vérification de rôle ni de séquence. La policy `rap_update` autorise `manager`/`ingenieur`/`admin`… mais aussi le **technicien créateur** à modifier tant que le statut est brouillon/en_cours/a_completer — or c'est lui qui déclenche `soumettre`, et rien n'empêche un `manager` d'auto-approuver son propre rapport. Aucun contrôle « le validateur ≠ le rédacteur ».
- 🔴 **Aucun gel après validation** : la policy `rap_update` n'exclut pas `statut='valide'`/`archive` pour admin/manager/ingénieur ⇒ `editor_html`, `contenu_rapport`, `titre` d'un rapport validé restent modifiables en base (l'UI se contente de masquer l'éditeur via `isValide`). La vue imprimable lit les données vivantes ⇒ modification silencieuse d'un rapport « officiel ».
- Rôles : `ingenieur` est utilisé dans les policies et `canAccessRapport`, mais **n'apparaît pas dans `get_user_role`** (ordre de priorité : super_admin, admin, manager, technicien, operateur, lecteur) — incohérence de référentiel de rôles à clarifier.
- `signature_ingenieur_id` existe mais n'est jamais renseigné ; `ingenieur_id` l'est à l'approbation.

---

## 13. DocumentGenerator

- Pipeline : QR (qrcode.react offscreen) → HTML assemblé (en-tête, corps, signature, annexes, pied) → **html2canvas → jsPDF (image JPEG)** → upload `documents-officiels` → SHA-256 → insertion `document_archives` (version = max+1, `status='active'`).
- 🔴 **Violation de la contrainte d'impression LTPC** : le PDF officiel est une **rasterisation** ; texte et tableaux non sélectionnables, non recherchables, qualité dépendante de `scale:2`, JPEG 0.92. C'est exactement le pipeline que le Print Engine V2 devait supprimer, et il coexiste avec la vue print native.
- 🟠 **Pagination fausse** : `htmlToPdf` réinsère la même image entière décalée par page (`y -= pageHeight`) ; le pied de page est en `position:fixed` (ignoré par html2canvas hors première zone) ⇒ coupures au milieu des lignes, pages blanches possibles, pas de répétition d'en-tête de tableau.
- 🟠 **Traçabilité incomplète** : `template_id` envoyé vide (`id: ""` dans `RapportTechniqueDetail`) ⇒ `null` en base ; aucune trace du modèle réellement utilisé, du contexte IA, des sources RAG ni du `prompt_version`.
- Reproductibilité : `contenu_snapshot` (body_html + annexes) et `variables` sont archivés + SHA-256 ⇒ le PDF est vérifiable, mais **non reproductible à l'identique** (rendu dépend du navigateur/polices/`html2canvas`).
- `applyVariables` remplace tout `{{clé}}` restant par `""` : une variable inconnue disparaît silencieusement au lieu d'être signalée.

---

## 14. Signature / cachet

- 🔴 **Signataire non identifié** : la signature affichée provient de `entreprise.representant` (Directeur), pas de l'utilisateur qui a validé (`ingenieur_id`), aussi bien dans `DocumentGenerator` (`ingenieur_nom: entreprise.representant`) que dans la vue imprimable. Le document nomme donc une personne qui n'est pas nécessairement le validateur.
- 🔴 **Signature affichée sans validation** : `RapportTechniquePrintView` rend systématiquement le bloc signature + cachet (`rt-signature`), même pour un brouillon ; seule la date devient « — ». Un brouillon imprimé est visuellement indiscernable d'un rapport validé (le statut n'apparaît que dans un champ de tableau).
- Rôle affiché en dur « Ingénieur validateur ». `signatures` (bucket) et `signature_ingenieur_id` non utilisés : aucune signature nominative, aucune preuve d'intégrité liée au signataire.

---

## 15. QR de vérification

- Chaîne officielle solide : token 24 octets aléatoires (`crypto.getRandomValues`), `UNIQUE(qr_token)` sur `document_archives`, RPC `verify_archive_by_token` SECURITY DEFINER, Edge Function publique `verify-archive` (validation regex, TTL borné 60 s–24 h, `max_age_days`, aucune donnée interne exposée), page publique affichant type/numéro/version/date/émetteur/SHA-256 + URL signée.
- 🔴 **QR imprimé incohérent** : `RapportTechniquePrintView` construit `${origin}/verification/${r.qr_token ?? id}` à partir de `rapports_techniques.qr_token` (défaut `gen_random_bytes(16)`), **jamais présent dans `document_archives`** ⇒ le QR de tout rapport imprimé renvoie « Document non authentifié ». Seul le QR intégré au PDF de `DocumentGenerator` est vérifiable.
- 🟡 Aucune expiration par défaut (`max_age_days` non transmis par la page) ; aucune révocation exposée dans l'UI (`status` n'est jamais passé à `revoked`).
- Positif : une modification ultérieure du brouillon **ne modifie pas** l'archive (trigger `block_delete`, snapshot + SHA-256). En revanche la vue imprimable, elle, reflète les données vivantes (§12).

---

## 16. Impression et PDF

- Chemin natif conforme : `RapportTechniquePrintView` + `PrintService.print()` + `src/styles/print.css` (`@page { size: A4 portrait; margin: 12mm 14mm 14mm 14mm }`, `.rt-print-root`, `.rt-info-table`, `.rt-signature`, `data-print-keep-together`), texte et tableaux **sélectionnables**, aucune capture d'écran, aucun Canva. Compatible « Microsoft Print to PDF ».
- 🔴 Chemin non conforme coexistant : `DocumentGenerator` (html2canvas/jsPDF image) — voir §13. Le « document officiel » archivé est donc le seul livrable non sélectionnable du module.
- 🟠 En-tête/pied non répétés dans la vue native : `ReportHeader` est un bloc unique, aucun `thead` répété pour le corps, aucun numéro de page (`@page` sans compteur) — un rapport de plusieurs pages perd l'identification en pages 2+.
- 🟡 `auto=1` déclenche l'impression après 400 ms sans attendre le chargement des images (logo/cachet) : risque de logo absent à l'impression.
- Non testable ici : impression Windows réelle (environnement sandbox sans imprimante) — à valider manuellement.

---

## 17. Archivage

Conservés dans `document_archives` : `numero`, `version`, `pdf_url`, `pdf_size`, `sha256`, `qr_token`, `variables`, `contenu_snapshot`, `generated_by` + `generated_by_nom`, `created_at`, `status`, `template_id`. Suppression bloquée par trigger ⇒ **immutabilité effective**.
Manques :
- Pas de `validateur` ni de `valide_at` archivés (seulement `variables.date`), pas de `chantier_id`/`client_id`, pas de `contexte_auto` figé, **aucune trace des appels IA ni des sources RAG** ayant contribué au contenu, `template_id` null.
- `rapport_ai_calls` conserve prompts/réponses mais n'est jamais relié à une archive donnée.
- Le statut `archive` du rapport est un simple libellé : aucune vue lecture seule dédiée, aucune interdiction technique d'édition (§12).

---

## 18. Sécurité

Positif : RLS active partout, `canAccessRapport()` SECURITY DEFINER réutilisé dans les policies et les Edge Functions, `requireAuth` + `enforceRateLimit` sur toutes les fonctions IA, buckets `rapports-techniques`/`documents-officiels` privés avec URLs signées, aucune clé API côté client, `verify-archive` étroitement scopé.

| Constat | Détail |
|---|---|
| 🔴 Rapport validé modifiable | `rap_update` n'exclut pas `valide`/`archive` pour admin/manager/ingénieur |
| 🔴 Transitions de statut non contrôlées serveur | tout titulaire d'un droit UPDATE peut écrire `statut='valide'`, `valide_at`, `ingenieur_id` directement |
| 🟠 `rapport_workflow_events` en lecture ouverte | policy `wf_select_auth` `qual: true` : tout utilisateur lit le journal de tous les rapports |
| 🟠 `ai_alerts` / `ai_daily_summaries` / `ai_knowledge_chunks` en lecture ouverte | fuite transversale de données chantier/client entre utilisateurs |
| 🟠 URL signée 7 jours stockée en base | `rapport_pieces_jointes.url` conserve une URL signée 604 800 s ; toute lecture de la ligne donne un accès direct au fichier |
| 🟠 Aucune restriction d'upload | `useUploadPieceJointe` n'impose ni type MIME ni taille max |
| 🟡 `document_archives` illisible par le rédacteur | `archives_read_auth` = admin/manager ou `generated_by` : un technicien auteur ne voit pas les archives générées par un autre |
| 🟡 Fuite vers l'IA | `rapport-ai-*` utilisent la **service role** pour lire le rapport après `canAccessRapport` (correct), mais tout le `contexte_auto` (client, chantier, formulations) part vers un fournisseur externe sans consentement tracé ni option d'anonymisation |
| 🟡 Rate limit in-memory | non partagé entre isolates Deno : contournable par montée en charge |
| 🟡 `verify_jwt` par défaut | `supabase/config.toml` ne déclare pas les fonctions `rapport-ai-*` ; la protection repose entièrement sur `requireAuth` en code (présent partout — vérifié) |

---

## 19. Qualité IA

- Garde-fous présents : consigne « ne jamais inventer », « Information non disponible. », séparation faits/hypothèses/recommandations dans le schéma JSON (`faits`, `hypotheses`, `recommandations_synthese`), `informationsManquantes`, revue IA non destructive avec score et sévérités.
- 🔴 **Aucun ancrage documentaire** : les `normesApplicables` sont générées librement, sans RAG ni référentiel interne ⇒ risque de norme inexistante ou de version périmée présentée comme applicable, sans source vérifiable.
- 🟠 **Aucune vérification de cohérence avec les données laboratoire** : les résultats d'essais réels ne sont pas transmis (seuls des comptages : « Compression béton (12) »). L'IA peut donc contredire les mesures sans être contredite, et produire des recommandations sans données.
- 🟠 **Distinction FAIT / MESURE / INTERPRÉTATION incomplète dans le rendu** : `contenuToHtml` fusionne toutes les sections en H2/H3 sans étiquetage de nature ; « Hypothèses » et « Faits » deviennent de simples listes, sans marquage visuel de statut épistémique, et aucune mention « contenu généré par IA, validé par … » n'apparaît sur le document imprimé.
- 🟡 `niveauConfiance` affiché sans définition ni calibration ; `gravite` IA peut contredire la gravité déclarée sans arbitrage.

---

## 20. Tests

| Test | Résultat |
|---|---|
| Typecheck `tsgo -p tsconfig.app.json` | ✅ 0 erreur |
| Tests existants du module rapports | ❌ aucun (seul `src/lib/ltpc-ai/__tests__/routing.test.ts` existe) |
| Routes | ⚠️ `/essais/rapports-techniques/historique` inexistante (capté par `/:id`) |
| Requêtes de lecture | ⚠️ `useRapportTechnique` fait `select("*")` sans jointure, alors que le détail et la vue print lisent `r.clients.nom`, `r.chantiers.nom`, `r.rapport_categories.nom` ⇒ **Client / Chantier / Catégorie toujours « — » à l'impression** |
| Edge Functions (statique) | ✅ auth + rate limit + `canAccessRapport` présents ; ❌ `ltpc-ai-rag-index` référence des colonnes inexistantes |
| Numérotation | ✅ unique, ⚠️ sans verrou |
| Autosave | ⚠️ 30 s, aucun filet (unload/offline) |
| Document / QR | ❌ QR de la vue imprimable non vérifiable |
| Impression | ✅ native A4 sélectionnable ; ❌ PDF officiel rasterisé |
| 8 scénarios demandés | rapport simple ✅ ; données manquantes ⚠️ (pas de blocage, mention « Information non disponible » dépendante du modèle) ; données contradictoires ❌ (aucune détection) ; analyse IA ✅ ; RAG ❌ (non branché) ; finalisé ⚠️ (non gelé) ; réouvert ✅ ; imprimé ⚠️ (identification incomplète, QR invalide) |
| Console preview | non exécuté (audit statique — aucune interaction demandée) |

---

## Tableau de synthèse

| Domaine | Statut | Problème | Gravité | Fichier |
|---|---|---|---|---|
| Validation | ❌ | Rapport `valide`/`archive` reste modifiable en base | 🔴 | policy `rap_update` |
| Validation | ❌ | Transitions de statut appliquées côté client, sans contrôle de rôle ni séparation rédacteur/validateur | 🔴 | `src/hooks/useRapportWorkflow.ts:143` |
| QR | ❌ | QR imprimé basé sur `rapports_techniques.qr_token`, absent de `document_archives` ⇒ « non authentifié » | 🔴 | `RapportTechniquePrintView.tsx:99` |
| Impression / PDF | ❌ | PDF officiel rasterisé (html2canvas/jsPDF) : texte non sélectionnable | 🔴 | `src/lib/documents/DocumentGenerator.ts:171` |
| Signature | ❌ | Signataire = représentant entreprise, non le validateur réel | 🔴 | `DocumentGenerator` / `RapportTechniqueDetail.tsx` (OfficialDocumentPanel) |
| Signature | ❌ | Bloc signature/cachet imprimé même sur brouillon | 🔴 | `RapportTechniquePrintView.tsx:163` |
| RAG | ❌ | Indexation `rapport_technique` sur colonnes inexistantes (`contexte`, `contenu_html`) | 🔴 | `supabase/functions/ltpc-ai-rag-index/index.ts:76` |
| Qualité IA | ❌ | Normes/références générées sans source traçable, aucune citation dans le rapport | 🔴 | `_shared/ai-prompts.ts` + `rapport-ai-generer` |
| Impression | ❌ | Client / Chantier / Catégorie toujours « — » (aucune jointure dans la query) | 🟠 | `useRapportsTechniques.ts:142` |
| Autosave | ⚠️ | Aucun autosave dans l'éditeur, aucun `beforeunload`, aucune file offline | 🟠 | `RapportTechniqueDetail.tsx`, `NouveauRapportTechnique.tsx:166` |
| Analyse | ⚠️ | Services d'analyse non branchés ; recommandations possibles sans données | 🟠 | `src/lib/ltpc-ai/analysis/*` |
| Contexte | ⚠️ | `entreprise`/`projet` déduits présentés comme certains ; snapshot jamais rafraîchi ni horodaté | 🟠 | `useRapportsTechniques.ts:367` |
| Prompts | ⚠️ | Injection de prompt possible via description/réponses ; pas de versionnement | 🟠 | `_shared/ai-prompts.ts` |
| IA archi | ⚠️ | Aucun timeout, fallback déclenché sur erreurs terminales, pas de plafond de tokens | 🟠 | `_shared/ai-provider.ts:55` |
| DocumentGenerator | ⚠️ | Pagination image erronée, pied `position:fixed`, `template_id` vide | 🟠 | `DocumentGenerator.ts:171,239` / `RapportTechniqueDetail.tsx` |
| Éditeur | ⚠️ | Édition concurrente sans verrou ni détection de conflit | 🟠 | `useRapportWorkflow.ts:43` |
| Sécurité | ⚠️ | `rapport_workflow_events`, `ai_alerts`, `ai_daily_summaries`, `ai_knowledge_chunks` lisibles par tout authentifié | 🟠 | policies |
| Sécurité | ⚠️ | URL signée 7 jours persistée dans `rapport_pieces_jointes.url` ; upload sans contrôle MIME/taille | 🟠 | `useRapportsTechniques.ts:300` |
| Parcours | ⚠️ | Bouton « Historique » vers une route inexistante | 🟠 | `RedactionRapportTechnique.tsx:120` |
| IA proactive | ⚠️ | Aucun cron : surveillance déclenchée manuellement ; `extractResistance` heuristique | 🟠 | `ltpc-ai-monitor/index.ts` |
| Archivage | ⚠️ | Ni validateur, ni contexte, ni sources IA/RAG archivés | 🟠 | `DocumentGenerator.ts:272` |
| Numérotation | ⚠️ | `next_rapport_numero()` sans verrou d'avis ⇒ collision possible sous concurrence | 🟡 | fonction DB |
| Rôles | ⚠️ | `ingenieur` absent de `get_user_role` alors qu'utilisé par les policies | 🟡 | DB |
| Impression | ⚠️ | Pas de numéro de page ni d'en-tête répété en pages 2+ ; `auto=1` n'attend pas les images | 🟡 | `print.css`, `RapportTechniquePrintView.tsx:78` |
| Sécurité | ⚠️ | Rate limit in-memory non partagé entre isolates | 🟡 | `_shared/rate-limit.ts` |
| Tests | ⚠️ | Aucun test automatisé du module | 🟡 | — |
| UX | 💡 | Compteurs d'onglets non calculés (`counts` factice) | 🔵 | `RedactionRapportTechnique.tsx:76` |
| UX | 💡 | Étape « modèle » sans effet sur la structure générée (modèle passé au prompt en titre seul) | 🔵 | `rapport-ai-analyser`, `-generer` |
| Amélioration | 💡 | Routage IA paramétrable (`aiCatalog`/`aiRoutingStore`) non relié à `FEATURE_ROUTING` serveur | 🔵 | `src/lib/ai/*` |

---

## Synthèse par nature de risque

**Problèmes bloquants** (à traiter avant tout usage professionnel) : gel du rapport validé, contrôle serveur des transitions et des rôles, identité réelle du signataire, masquage de la signature hors statut validé, cohérence du QR imprimé, remplacement du PDF rasterisé par le pipeline natif.

**Corrections obligatoires** : jointures manquantes dans `useRapportTechnique` (identification imprimée), indexation RAG cassée, autosave de l'éditeur + filet réseau, cloisonnement RLS des tables ouvertes, route « Historique ».

**Corrections recommandées** : ancrage documentaire des normes (RAG + citations), branchement des services d'analyse et transmission des résultats d'essais réels, protection contre l'injection de prompt, timeout/limite de tokens, verrou de numérotation, archivage du validateur/contexte/sources IA, pagination et en-têtes répétés à l'impression.

**Améliorations facultatives** : compteurs d'onglets réels, modèles pilotant réellement la structure, unification du routage IA UI/serveur, versionnement des prompts, quotas IA par utilisateur.

**Risques IA** : normes inventées non détectables (absence de source), recommandations sans données mesurées, contradiction possible avec les résultats de laboratoire, détournement par injection de prompt.
**Risques sécurité** : modification post-validation, auto-validation, lecture transversale des journaux et alertes, URLs signées longue durée.
**Risques normatifs** : document officiel signé par une personne non validatrice, références normatives non traçables, absence de mention « généré avec assistance IA, validé par … ».
**Risques traçabilité** : archives sans validateur ni sources, `template_id` vide, prompts non versionnés, contexte non horodaté.
**Risques impression** : PDF officiel non sélectionnable, QR invalide, identification vide, pages 2+ non identifiées, logo potentiellement absent.
**Risques UX** : perte de rédaction (pas d'autosave), écrasement entre utilisateurs, bouton mort, compteurs faux.

---

## VERDICT

# 🔴 NON PRÊT POUR PRODUCTION

Le socle est de bonne qualité (architecture IA centralisée, RLS, archives immuables, vérification QR serveur, impression native A4 conforme), mais huit points 🔴 touchent directement la valeur juridique du livrable : un rapport validé peut être modifié, une validation peut être auto-attribuée, la signature nomme une personne qui n'est pas le validateur, elle s'imprime sur un brouillon, le QR imprimé n'est pas vérifiable, le PDF officiel est une image, et les normes citées ne reposent sur aucune source traçable (RAG cassé et non branché).

Phase 2 recommandée dans cet ordre : (1) gel + contrôle serveur du workflow, (2) signature/QR/identification du document imprimé, (3) suppression du pipeline rasterisé, (4) RAG + citations, (5) autosave et RLS résiduelles.
