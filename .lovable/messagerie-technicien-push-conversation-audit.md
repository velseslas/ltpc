# AUDIT — Messagerie technicien : Push `message_recu` + conversation invisible

Mode lecture seule. Aucun code, aucune migration, aucun message, aucun Push, aucun abonnement, aucune policy modifiés.

Utilisateurs concernés (table `utilisateurs`) :

| user_id | nom | rôle | statut |
|---|---|---|---|
| 66114a91-da63-4989-b14f-89407ba4338b | Administrateur | super_admin | actif |
| ef14f647-2353-4676-a69e-86533092e0d5 | DEMIGHA AYMENE | technicien | actif |
| 7cdbf9be-e5db-4757-8fc6-a4bf1cf7e494 | demigha wassim | manager | actif |
| a9a3da1f-59d3-46bd-83aa-3bf29b47a82b | OULDAHMED idir | technicien | actif |

---

## A — Pourquoi le technicien ne reçoit PAS le Push `message_recu`

### Cause exacte
**Le technicien n'a AUCUN abonnement Push en base.** La table `push_subscriptions` contient 14 lignes, **toutes** avec `user_id = 66114a91… (Administrateur)** (1 seule `is_active = true`, endpoint FCM créé le 08/08 17:52, User-Agent Android). Aucune ligne pour `ef14f647…` ni pour aucun autre utilisateur.

```
select user_id, count(*), count(*) filter (where is_active) from push_subscriptions group by 1;
-- 66114a91-… | 14 | 1     ← seul l'admin
```

`push-dispatch` → `pushToUser(uid)` fait :
```ts
.from("push_subscriptions").select(...).eq("user_id", userId).eq("is_active", true)
```
→ 0 ligne pour le technicien → `sent = 0`, aucun appel FCM émis. Il n'y a donc **jamais eu de réponse FCM** (ni succès ni erreur) pour ce destinataire.

### Ce qui est HORS DE CAUSE (démontré, pas supposé)
- **Rôle** : `push-dispatch` ne filtre jamais par rôle pour `message_recu`. Destinataires = `conversation_participants` de la conversation moins l'expéditeur (`index.ts`, bloc `if (event === "message_recu")`). Aucun `userIdsForRoles` sur ce chemin.
- **Destinataire réel** : correct. Notifications réellement insérées pour le technicien :
  `73696988…`, `c7592db0…` (conv `03f5d6ee…`), `51989175…` (conv `b72a4060…`), toutes `category = message_recu`, `link = /messagerie/<conversation_id>`.
- **Catégorie** : `message_recu` (catégorie dédiée, pas `systeme`).
- **Préférences** : `notification_preferences` ne contient **qu'une seule ligne**, celle de l'admin. Pour le technicien `prefs = null` → `pushAllowed(null, …)` retourne `{ inapp: true, push: true }`. Les préférences n'ont donc rien bloqué.
- **In-app** : fonctionne (lignes présentes dans `notifications`), ce qui confirme que la chaîne s'arrête exactement à l'étape « abonnement ».

### Point d'arrêt de la chaîne
```
message ✅ → push-dispatch ✅ → recipients ✅ → notification in-app ✅
→ push_subscriptions (technicien) ❌ AUCUNE LIGNE → FCM jamais appelé → téléphone ❌
```

### Comparaison demandée (§9)
| | Admin → Admin | Admin → Technicien |
|---|---|---|
| destinataire résolu | ✅ | ✅ |
| catégorie | `message_recu` | `message_recu` |
| préférences | ligne existante, `push_enabled = true`, `message_recu` non désactivée | aucune ligne → tout autorisé |
| abonnement actif | ✅ 1 endpoint FCM | ❌ 0 endpoint |
| appel FCM | oui | **jamais émis** |

### Correction recommandée (non appliquée)
1. Le technicien doit activer le Push **sur son propre téléphone** : Paramètres → Notifications → « Activer » (PWA installée, permission navigateur accordée). C'est la seule action qui crée sa ligne `push_subscriptions`.
2. Optionnel (confort) : afficher dans l'UI un état explicite « Aucun appareil abonné pour cet utilisateur », et côté serveur journaliser `recipients_without_subscription` dans la réponse de `push-dispatch` pour rendre ce cas visible immédiatement.
3. Aucune modification de VAPID, du Service Worker ou de `push-dispatch` n'est justifiée par les données.

---

## B — Pourquoi la conversation existante n'apparaît pas automatiquement chez le technicien

### Le modèle est correct — démonstration
- Tables : `conversations` (`id, type, titre, chantier_id, created_by, last_message_at, last_message_preview`), `conversation_participants` (`conversation_id, user_id, joined_at, last_read_at` défaut `1970-01-01`, `is_archived`), `messages` (`conversation_id, sender_id, content, message_type, audio_path, created_at, deleted_at`). Il n'y a **pas** de `recipient_id` : le modèle est bien « participants ».
- Création : RPC `get_or_create_direct_conversation(_other_user_id)` — anti-doublon (recherche une conversation `direct` ayant exactement 2 participants dont les deux users) puis insère la conversation **et les DEUX lignes participants**. Données : `03f5d6ee…` (admin + technicien) et `b72a4060…` (manager + technicien) ont bien 2 participants, `joined_at` identique pour les deux → aucun participant manquant.
- **§4 — hypothèse `created_by = current_user` : FAUSSE.** `list_conversations()` filtre sur
  `JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = auth.uid()`.
  `created_by` n'intervient nulle part dans la lecture.
- **§8 — pas de duplication** : 4 conversations en base, aucune paire dupliquée ; les 2 messages de l'admin vers le technicien sont bien dans la même conversation `03f5d6ee…`.

### §5 — RLS : n'est PAS bloquante
```
conversations           : SELECT can_access_conversation(id)
conversation_participants: SELECT is_conversation_participant(conversation_id)
messages                : SELECT can_access_conversation(conversation_id)
```
`can_access_conversation` = participant **et** (chantier NULL **ou** accès chantier). Les conversations concernées sont `type = direct`, `chantier_id = NULL` → la condition chantier est neutre. `list_conversations` est `SECURITY DEFINER`, propriétaire `postgres` (`rolbypassrls = true`), `EXECUTE` accordé à `authenticated`. **RLS ne bloque pas le technicien.**

### Reproduction de la requête serveur avec l'identité du technicien
Exécution du corps exact de `list_conversations` avec `auth.uid() = ef14f647…` :
```
b72a4060-…  direct  demigha wassim   2026-08-08 18:26:45  "Cccccc"   unread 0  archived f
03f5d6ee-…  direct  Administrateur   2026-08-08 18:25:44  "Alfkfjf"  unread 0  archived f
```
→ **La conversation avec l'Administrateur EST retournée par la base.** Le problème n'est ni SQL, ni RLS, ni modèle de données : il est **côté chargement frontend**.

### §6 — Cause exacte côté frontend
Fichiers : `src/hooks/useMessagerie.ts` (`useConversations`), `src/App.tsx` (config React Query), `src/pages/messagerie/Messagerie.tsx`.

1. `useConversations` : `queryKey: ["conversations"]`, `staleTime: 15_000`, **aucun `refetchInterval`**.
2. Défauts globaux (`src/App.tsx` l.60-68) : **`refetchOnWindowFocus: false`**. Sur mobile/PWA, revenir dans l'application après une notification **ne déclenche donc aucun refetch**.
3. Le seul rafraîchissement « poussé » vient du canal Realtime `messagerie-conversations` (`postgres_changes` sur `messages`), créé **uniquement quand la page Messagerie est montée**. Sur Android, la WebSocket est coupée dès que la PWA passe en arrière-plan ou que l'écran s'éteint : l'INSERT du message de l'admin **n'est jamais reçu** et l'invalidation n'a pas lieu.
4. Conséquence : si l'écran Messagerie a déjà été affiché (liste alors vide, mise en cache 30 min via `gcTime`) et que l'application reste ouverte/en arrière-plan, l'utilisateur retrouve **la liste vide en cache**.
5. Le clic sur « Nouvelle conversation » puis la sélection de l'admin exécute la **mutation** `get_or_create_direct_conversation` ; le `MutationCache.onSuccess` global (`src/App.tsx` l.55-59) fait `invalidateQueries({ type: "active" })` → **c'est ce refetch, et non la création d'une conversation, qui fait enfin apparaître la conversation existante** (la RPC est idempotente : elle a retourné la conversation déjà présente, cf. `unread` visible ensuite). Ce scénario explique **exactement** la séquence décrite.

Facteur aggravant secondaire : `Messagerie.tsx` l.65 masque `c.is_archived` ; non déclenché ici (`is_archived = false` pour le technicien sur les 2 conversations), mais une conversation archivée puis relancée resterait invisible sans indicateur.

### §7 — Notification vs conversation : conforme
`push-dispatch` (bloc `message_recu`) relit le message existant, prend `msg.conversation_id` et construit `link = /messagerie/<conversation_id>`. Aucune conversation n'est créée par la notification, et les liens en base pointent bien vers les conversations existantes. Les routes `/messagerie` et `/messagerie/:conversationId` existent (`src/routes/messagerieRoutes.tsx`) → le clic ouvre directement le fil, ce qui est cohérent.

### Correction recommandée (non appliquée)
1. `useConversations` : ajouter `refetchOnWindowFocus: true` (ou un `refetchInterval` court, ex. 30 s) **spécifiquement sur cette query**, sans toucher aux défauts globaux.
2. Rafraîchir sur reprise d'application : écouter `visibilitychange` / `focus` et invalider `["conversations"]` + `["messages-unread-count"]`.
3. Rendre le canal Realtime résilient : ré-invalider la liste sur `SUBSCRIBED` (reconnexion socket) puisque les événements manqués pendant la coupure ne sont jamais rejoués.
4. Invalider `["conversations"]` à la réception d'une notification `message_recu` dans le centre de notifications (le canal `notifications` reste actif là où celui de la messagerie ne l'est pas).
5. Optionnel : afficher les conversations archivées ayant des non-lus, ou les désarchiver automatiquement à réception d'un message.

---

## Synthèse

| Problème | Cause racine | Niveau |
|---|---|---|
| A — Pas de Push chez le technicien | Aucun abonnement Push (`push_subscriptions`) pour `ef14f647…` : FCM n'est jamais appelé. Rôle, préférences, catégorie, RLS et `push-dispatch` sont hors de cause. | Données / appareil |
| B — Conversation invisible | La base retourne bien la conversation ; c'est la liste frontend qui n'est pas rafraîchie (`staleTime` + `refetchOnWindowFocus: false` + Realtime coupé en arrière-plan). Le modèle n'est PAS filtré sur `created_by`, et la RLS ne bloque pas. | Frontend / cache |

Aucune correction appliquée.
