# LTPC AI — diagnostic et remise en état

## Ce que le diagnostic a montré (vérifié)

- Le moteur IA côté serveur **fonctionne** : un appel direct à la fonction de chat répond correctement en 0,9 s (modèle Gemini, réponse en français, présentation correcte).
- **La base de connaissances est vide** : 0 fragment indexé. Tous les outils de raisonnement (RAG, analyse, recommandation, synthèse) renvoient donc systématiquement « aucun résultat » — c'est la cause directe des réponses vides ou du « je n'ai pas accès à cette information ».
- **Des données métier sont réellement vides** : la table des essais généraux ne contient aucune ligne, ce qui rend certaines réponses légitimement nulles mais incompréhensibles pour l'utilisateur.
- **Régression d'accès** : depuis le durcissement de sécurité, seuls les administrateurs/managers peuvent lire la table clients. Pour un technicien, tous les outils IA touchant aux clients échouent en silence (l'erreur est avalée et transformée en réponse vide).
- **Les erreurs d'outils sont invisibles** : quand un outil échoue, l'interface n'affiche rien de compréhensible ; l'utilisateur voit soit une réponse vague, soit une erreur brute sans cause.
- La limite d'usage est de 20 requêtes par minute et par utilisateur : au-delà, la réponse est « Limite atteinte », ce qui peut expliquer les « aucune réponse » lors de tests répétés.

Le symptôme « aucune réponse / erreur » n'a pas encore de cause confirmée : il sera reproduit et tracé en première étape, avant correction.

## Ce qui sera fait

### 1. Reproduire et rendre l'erreur visible
- Reproduire l'envoi d'un message dans l'application et capturer l'erreur exacte (console, réseau, journaux de la fonction).
- Afficher dans le fil de discussion un bandeau clair quand un outil échoue : nom de l'outil et motif, au lieu d'un silence.
- Message d'erreur explicite et distinct pour : limite atteinte, crédits épuisés, session expirée, panne réseau.

### 2. Remplir la base de connaissances (cause n°1 des réponses vides)
- Bouton d'indexation dans la page « Base de connaissances » avec compteur de fragments indexés et date de dernière indexation.
- Indexation des rapports techniques, formulations et essais existants via la fonction d'indexation déjà présente.
- Tant que l'index est vide, l'assistant l'annonce explicitement plutôt que d'affirmer qu'il n'a pas accès.

### 3. Rétablir l'accès des techniciens sans rouvrir la faille
- Redonner aux techniciens la lecture des clients de leurs chantiers affectés, uniquement via la fonction restreinte déjà existante (identité seulement, pas de données bancaires/fiscales).
- Faire lire cette source restreinte par les outils IA quand l'utilisateur n'est pas admin/manager.

### 4. Fiabiliser les réponses
- Un outil en échec ne doit plus vider la réponse : les autres résultats sont conservés et la réponse indique ce qui a échoué.
- Distinguer « aucune donnée enregistrée » (0 ligne réelle) de « accès refusé » (erreur de permission) dans le texte de la réponse.

## Détails techniques

- `src/lib/ltpc-ai/AgentOrchestrator.ts` : remonter les erreurs d'outils dans `debug` et dans le message assistant (aujourd'hui elles sont uniquement tracées).
- `src/hooks/useLtpcAI.ts` : typer et propager les erreurs de `functions.invoke` (429 / 402 / 401) vers un message utilisateur ; ne pas laisser la mutation échouer sans trace en base.
- `src/pages/ltpc-ai/LtpcAI.tsx` : bandeau d'erreur outil + état « base de connaissances vide ».
- `src/pages/ltpc-ai/KnowledgeBase.tsx` : action d'indexation appelant `ltpc-ai-rag-index`, affichage du nombre de chunks.
- Migration : politique de lecture scopée sur `clients` pour les techniciens (via `can_access_chantier_data`), sans exposer les colonnes sensibles ; ajustement des outils lecture (`BusinessDataTool`, repository `clients`) pour utiliser la source scopée hors admin.
- Aucune modification du modèle IA, du fournisseur, ni du contrat d'échange client/fonction.

## Vérification

- Envoi de 3 questions types (comptage, liste, analyse) en compte admin puis technicien.
- Contrôle : réponse non vide, chiffres cohérents avec l'écran, citations présentes après indexation, message d'erreur explicite en cas d'échec volontaire.
