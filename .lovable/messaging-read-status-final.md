# LOT 15.2 — Statut des messages (✓ envoyé / ✓✓ lu)

## Logique utilisée
Réutilisation stricte de `conversation_participants.last_read_at` (mécanisme LOT 15, déjà mis à jour
par `markRead` à l'ouverture d'une conversation). Aucun système de lecture parallèle, aucune colonne ajoutée.

- `useConversationReadCutoff(conversationId)` lit `user_id, last_read_at` des participants,
  exclut l'utilisateur courant et retourne la **date de lecture la plus ancienne parmi les autres**
  (donc « lu par tous » en conversation chantier).
- Si un autre participant n'a jamais lu (`last_read_at IS NULL`) → aucun ✓✓.
- Un message envoyé est ✓✓ si `created_at <= cutoff`, sinon ✓.

## Fichiers modifiés
- `src/hooks/useMessagerie.ts` — ajout de `useConversationReadCutoff` + écoute des UPDATE
  `conversation_participants` **dans le canal existant** `messagerie-thread-<id>`.
- `src/pages/messagerie/Messagerie.tsx` — coches `Check` / `CheckCheck` (lucide) à droite de l'heure,
  uniquement sur les messages de l'utilisateur courant.

## Migration
Une seule, minimale (indispensable au temps réel des accusés de lecture) :
```sql
ALTER TABLE public.conversation_participants REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
```
Aucun changement de schéma, de RLS ni de GRANT.

## Fonctionnement
- **✓** : message présent en base et non encore lu par le destinataire.
- **✓✓** : `last_read_at` du destinataire ≥ `created_at` du message (lecture réelle).
- **Texte** : coche affichée sous le contenu, à droite de l'heure.
- **Vocal** : identique, le lecteur audio (`VoiceMessage`) n'a pas été touché.
- **Reçus** : aucun statut affiché.
- **Plusieurs messages** : tous ceux antérieurs au `last_read_at` passent ensemble à ✓✓.

## Realtime
Aucun nouveau canal : un second listener `postgres_changes` (UPDATE sur
`conversation_participants`, filtré `conversation_id=eq.<id>`) est branché sur le canal du fil
déjà existant, et invalide la clé React Query `conversation-read-state`. L'expéditeur passe
donc de ✓ à ✓✓ sans rafraîchir.

## Tests réels
- Conversation réelle `854cf327…` (admin ↔ demigha wassim), rendu vérifié via Playwright :
  **7 coches « Lu » (✓✓)** pour les messages antérieurs au `last_read_at` du destinataire
  (2026-08-07 19:14:07+00) et **1 coche « Envoyé » (✓)** pour le message vocal de 22:43,
  postérieur à cette lecture. Texte et vocal validés sur données réelles.
- Test A → B puis B → A avec deux sessions simultanées : **non exécuté** — une seule session
  utilisateur est disponible dans l'environnement d'aperçu (impossible d'ouvrir la conversation
  en tant que second compte). La bascule ✓ → ✓✓ en direct reste donc à confirmer sur deux appareils.

## Typecheck
`tsgo --noEmit` → 0 erreur.

## Verdict
🟠 **PARTIEL** : ✓ et ✓✓ sont corrects et vérifiés sur données réelles (texte + vocal) ;
la transition automatique ✓ → ✓✓ en temps réel n'a pas pu être observée en direct faute d'un
second compte connecté simultanément.
