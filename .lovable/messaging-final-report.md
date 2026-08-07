# LOT 15 — Messagerie interne LTPC — Rapport final

## Architecture
```
UTILISATEUR A → MESSAGE → BASE (RLS) → REALTIME → MESSAGERIE IN-APP → NOTIFICATION IN-APP (push-dispatch)
```
Module strictement additif. Aucune refonte, aucun module existant modifié hors ajout du menu
et de l'événement `message_recu` dans le dispatcher de notifications déjà en place.
Le Push n'est pas modifié : il reste optionnel et n'est jamais bloquant.

## Tables
- `conversations` — `type` (`direct` | `chantier`), `titre`, `chantier_id`, `created_by`,
  `last_message_at`, `last_message_preview` (maintenus par trigger serveur).
- `conversation_participants` — `conversation_id`, `user_id`, `joined_at`, `last_read_at`, `is_archived` (unique par paire).
- `messages` — `conversation_id`, `sender_id`, `content`, `created_at`, `edited_at`, `deleted_at`.
- Index : participants (user, conversation), messages (conversation, created_at desc), conversations (last_message_at desc).

## RLS
Fonctions SECURITY DEFINER (anti-récursion) : `is_conversation_participant`, `can_access_conversation`
(participant **ET** `can_access_chantier_data(chantier_id)` si conversation chantier), `is_conversation_owner`.
- `conversations` : SELECT/UPDATE participant ; INSERT `created_by = auth.uid()` + accès chantier vérifié.
- `conversation_participants` : SELECT participant ; INSERT réservé au créateur de la conversation ;
  UPDATE/DELETE uniquement sur **sa propre** ligne (donc `last_read_at` propre à chaque participant).
- `messages` : SELECT/INSERT participant ; INSERT `sender_id = auth.uid()` ; UPDATE seulement de ses propres messages.
- Trigger `validate_message` : trim, refus du vide, limite 4000 caractères, `sender_id := auth.uid()`
  (le `sender_id` du frontend est donc écrasé côté serveur — impossible d'écrire au nom d'un autre).
- RPC : `get_or_create_direct_conversation` (anti-doublon, refus de soi-même),
  `create_chantier_conversation` (contrôle `can_access_chantier_data`), `list_conversations`,
  `unread_messages_count`, `search_messaging_users`, `conversation_sender_names`.
  Toutes `REVOKE ... FROM PUBLIC, anon` + `GRANT EXECUTE TO authenticated`.

## Realtime
`messages` et `conversations` ajoutées à `supabase_realtime` (REPLICA IDENTITY FULL).
Deux canaux : liste des conversations (invalidation liste + compteur) et fil ouvert
(`filter: conversation_id=eq.<id>`). Désabonnement systématique au démontage, ordre garanti par
`created_at` côté requête, doublons impossibles (invalidation React Query, pas d'append manuel).

## Notifications
Réutilisation intégrale de l'existant : `dispatchNotificationEvent("message_recu", messageId)` →
Edge Function `push-dispatch` (`ALLOWED_EVENTS` + `buildNotification`). Le serveur relit le message,
vérifie que l'appelant est bien l'expéditeur, calcule les destinataires (participants sauf l'expéditeur),
insère dans `notifications` (titre « Nouveau message », lien `/messagerie/<conversationId>`) et tente le
Push seulement si les préférences l'autorisent. Aucun second système de notifications.

## Navigation
- Menu latéral : `💬 Messagerie` avec badge de messages non lus (source : RPC `unread_messages_count`, persistée).
- Routes : `/messagerie` et `/messagerie/:conversationId` (`src/routes/messagerieRoutes.tsx`, montées dans `App.tsx`).
- Clic sur une notification « Nouveau message » → ouvre directement la conversation.

## Desktop
Deux colonnes (liste 320 px + fil), recherche de conversation, bouton « Nouvelle », aperçu du dernier
message, heure, badge non lus, lien vers le chantier. Pas de popup.

## Mobile
Liste plein écran → conversation plein écran avec bouton retour, zone de saisie fixée en bas,
hauteurs en `dvh` pour rester au-dessus du clavier.

## Chantier
`type = 'chantier'` + `chantier_id`. Création via `create_chantier_conversation` (accès chantier vérifié
côté serveur). Lecture bloquée par RLS pour tout utilisateur sans accès au chantier, même par URL directe.
En-tête du fil : lien vers la fiche chantier.

## Performance
50 conversations max par page (RPC paginée), messages limités aux 120 derniers avec index dédié,
`staleTime` React Query, aucun chargement croisé des messages des autres conversations.

## Tests
`src/hooks/__tests__/useMessagerie.test.ts` (vitest, 5 tests ✅) : libellé direct, libellé chantier,
refus des messages vides/espaces, limite de longueur, tri par dernier message.
Vérifications structurelles : `tsgo --noEmit` = 0 erreur, migrations appliquées, fonction déployée.

## Sécurité
- Expéditeur imposé par `auth.uid()` (trigger) — usurpation impossible.
- Non-participant : aucun SELECT/INSERT (policies basées sur `can_access_conversation`).
- Conversation chantier : double contrôle participant + `can_access_chantier_data`.
- Anonyme : aucune policy `anon`, aucun `GRANT` anon, RPC révoquées pour `anon`.
- Pas de multi-tenant SQL dans LTPC (`entreprise` unique, aucune fonction `current_entreprise_id`) :
  l'isolation métier repose sur les chantiers, respectée telle quelle.

## Fichiers modifiés / créés
- Créés : `src/lib/messagerie/model.ts`, `src/hooks/useMessagerie.ts`,
  `src/pages/messagerie/Messagerie.tsx`, `src/components/messagerie/NewConversationDialog.tsx`,
  `src/routes/messagerieRoutes.tsx`, `src/hooks/__tests__/useMessagerie.test.ts`,
  `.lovable/messaging-audit.md`, `.lovable/messaging-final-report.md`.
- Modifiés : `src/App.tsx` (route), `src/components/layout/Sidebar.tsx` (menu + badge),
  `src/lib/notifications/dispatch.ts` (`message_recu`),
  `supabase/functions/push-dispatch/index.ts` (`message_recu`).

## Migrations
1. Tables `conversations` / `conversation_participants` / `messages`, GRANTs, RLS, fonctions de sécurité,
   triggers, RPC de création/lecture, Realtime.
2. RPC `list_conversations` et `conversation_sender_names`.

## Points restants
- Test réel A/B à deux comptes (envoi/réception temps réel, badge, passage en lu) non exécutable ici :
  la session de prévisualisation est **déconnectée** (`signed_out`), aucun compte de test ne peut être créé
  sans accès admin auth. À valider en connectant deux utilisateurs réels.
- Édition/suppression de message : non implémentée en V1 (volontaire, hors priorité).
