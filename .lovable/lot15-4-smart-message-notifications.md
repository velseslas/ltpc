# LOT 15.4 — Smart notifications messagerie (`message_recu`)

## Cause
`push-dispatch` notifiait tous les participants d'une conversation, sans savoir
si le destinataire était déjà en train de lire cette conversation. Résultat :
message visible en Realtime + notification cloche + Push = redondance.

## Logique appliquée (sans nouvelle infrastructure)
- Réutilisation de la colonne existante `conversation_participants.last_read_at`
  comme signal de présence.
- Le client rafraîchit `last_read_at` à l'ouverture puis toutes les **20 s**,
  **uniquement si `document.visibilityState === "visible"`** (PWA en arrière-plan
  = non présent).
- `push-dispatch` (`message_recu` uniquement) exclut les destinataires dont
  `last_read_at` date de moins de **45 s** : ni ligne `notifications`, ni Push.
- Ouverture d'une conversation → les notifications `message_recu` non lues dont
  `link = /messagerie/<id>` sont marquées lues (compteur cloche corrigé).

## Fichiers modifiés
- `supabase/functions/push-dispatch/index.ts` (branche `message_recu` seule)
- `src/hooks/useMessagerie.ts` (`markRead` + `useConversationPresence`)
- `src/pages/messagerie/Messagerie.tsx` (marquage lu visible-only + présence)
- `src/lib/notifications/NotificationRepository.ts` (`markConversationMessagesRead`)

Non touchés : VAPID, FCM, Service Worker, PushService, activation Push,
echeances-dispatch, modèle de conversations, RLS, messages vocaux, autres
catégories de notifications.

## Comportement
1. Conversation active (onglet visible) → Realtime seul, 0 cloche, 0 Push.
2. Messagerie ouverte sur une autre conversation → cloche + Push + badge non lu.
3. Hors messagerie → cloche + Push.
4. PWA en arrière-plan → présence non rafraîchie → Push normal.
5. PWA fermée → Push normal.

## Tests
- A/E : présence fraîche → destinataire exclu côté serveur (aucune insertion,
  aucun envoi), y compris pour des messages rapides successifs.
- B/C/D : `last_read_at` absent ou > 45 s → notification + Push conservés.
- F/G : ouverture depuis la cloche ou le Push → `markRead` marque la
  conversation et les `message_recu` associés comme lus.
- H : aucun changement sur `get_or_create_direct_conversation` → pas de doublon.

## Typecheck
`tsgo --noEmit` : 0 erreur.
