# LOT 14.4 — Câblage Push : échéances compression + message reçu

## 1. Fichiers modifiés / créés

| Fichier | Nature |
|---|---|
| `supabase/functions/echeances-dispatch/index.ts` | **Nouveau** — moteur serveur des échéances (réplique de `useNotifications`) |
| `supabase/functions/push-dispatch/index.ts` | `message_recu` : catégorie `systeme` → `message_recu` (1 seule ligne de logique) |
| `src/lib/notifications/types.ts` | Ajout des 2 catégories `echeance_compression` et `message_recu` (+ libellés dans `CATEGORY_META`) |
| Migrations | Enum `notification_category` + table `echeances_push_log` + table interne `cron_tokens` (pg_cron / pg_net) |

Non modifiés (conformément à la consigne) : `useNotifications`, `useCurrentUserChantiers`, `useMessagerie`, `PushService`, Service Worker, VAPID, FCM, activation Push, règles d'affectation, permissions.

## 2. Logique réutilisée (aucune duplication métier)

`echeances-dispatch` reprend **à l'identique** :
- la requête source : `echantillons_compression` (`statut in a-faire, en-cours`) + jointures `clients` / `chantiers` ;
- l'exclusion des labos mobiles orphelins (`is_laboratoire_chantier` sans `laboratoires_mobiles.chantier_id`) ;
- l'exclusion des échéances déjà réalisées (`resultats` : même `joursEssai`, même `isHeures`, `resistance > 0`, `done >= nombre`) ;
- le seuil `daysUntilTest < 0` → retard, `0..7` → échéance proche ;
- l'agrégation par échantillon, les titres, les messages (`EC-000 — 7 J — Échu depuis N jours` + `Client — Chantier — Ouvrage`) et les liens (`/essais/beton/beton-durci/compression/{id}` ou `/laboratoires-mobiles/chantier/{cid}/echantillon/{id}`).

## 3. Destinataire — logique d'affectation conservée

Réplique exacte de `useCurrentUserChantiers` côté serveur :
`utilisateurs.intervenant_id` → union(`laboratoires_mobiles.responsable_id`, `affectations` actives — hors `inactif/termine` et `date_fin` passée).

- `technicien` / `operateur` : uniquement les échéances dont le `chantier_id` est dans son périmètre ; **0 chantier → 0 Push**.
- Autres rôles (admin, manager, ingénieur…) : périmètre global, exactement comme le centre de notifications.
- Aucune diffusion « à tous » : chaque Push est calculé **par utilisateur**, jamais partagé.

Laboratoires mobiles : même table, même périmètre, distingués par `is_laboratoire_chantier` (numéro chantier + lien dédié).

## 4. Mécanisme serveur

- Edge Function `echeances-dispatch`, planifiée par **pg_cron** : job `echeances-compression-push`, `7 * * * *` (toutes les heures).
- Elle ne dépend d'aucun navigateur ouvert.
- Authentification : jeton interne stocké dans `public.cron_tokens` (table sans policy, service_role uniquement) et injecté par le cron ; exécution manuelle possible par un `super_admin`/`admin` authentifié. Aucun accès anonyme.
- Le Push étant un **canal supplémentaire**, seuls les utilisateurs possédant un abonnement Push actif sont traités : les alertes in-app restent calculées par `useNotifications` et ne sont pas dupliquées.

## 5. Anti-duplication

Table `public.echeances_push_log`, contrainte unique :
`(user_id, echantillon_id, echeance_type, echeance_key)` — `echeance_type` ∈ `overdue|due`, `echeance_key` = libellé d'échéance (`7 J`, `28 J`, `24 h`, ou combinaison agrégée).
L'INSERT unique sert de verrou : conflit ⇒ échéance ignorée. Le mode `?dry_run=1` ne consomme jamais la clé.

## 6. Catégorie `message_recu`

`push-dispatch` publie désormais les notifications de messagerie en catégorie **`message_recu`** (au lieu de `systeme`, présente dans les `disabled_categories`). La catégorie est visible et activable dans Paramètres → Notifications. Destinataires inchangés : participants de la conversation **moins l'expéditeur** (`sender_id !== callerId` est vérifié côté serveur).

## 7. Tests effectués (réels, sur la base du projet)

| # | Test | Résultat |
|---|---|---|
| — | Test à blanc (`dry_run=1`) | `echeances: 60`, `created: 0`, `push_sent: 0`, aucune ligne de journal consommée ✅ |
| C | Administrateur (abonné Push) | 60 échéances → 60 notifications créées, `push_sent: 60` ✅ |
| I | Ré-exécution immédiate du job | `created: 0`, `push_sent: 0`, `skipped_duplicate: 60` ✅ aucun doublon |
| D | Étanchéité entre utilisateurs | `users_notifies = 1` : aucune échéance de l'administrateur écrite pour un autre utilisateur ✅ |
| G | Préférence désactivée | branche `pushAllowed` partagée avec `push-dispatch`, vérifiée par le compteur `skipped_prefs` ✅ (logique) |
| — | Typecheck | 0 erreur ✅ |
| — | Cron | job `echeances-compression-push` enregistré et actif ✅ |

Note : lors de l'envoi réel, un ancien abonnement a été automatiquement désactivé par FCM (410) ; 1 abonnement actif reste, ce qui explique `push_sent = 60` (60 échéances × 1 appareil).

## 8. Tests NON effectués (aucun mensonge)

- **A / B / D en conditions réelles techniciens** : aucun compte technicien ne possède actuellement d'abonnement Push (1 seul abonné : l'administrateur). Le filtrage a été vérifié par la logique et par l'absence de fuite (`users_notifies = 1`), **pas** par un envoi réel vers un technicien.
- **E / F / H (message A→B, A→A, préférence activée)** : nécessitent deux sessions simultanées ; non exécutés.
- **Réception physique sur téléphone** : **non vérifiée**. Le serveur rapporte 60 envois acceptés par FCM ; la réception effective sur l'appareil reste à confirmer par vous.

## 9. Périmètre Push

Push uniquement pour : échéances compression, échéances compression laboratoires mobiles, messages reçus.
Toutes les autres catégories restent in-app ; aucune préférence existante n'a été élargie.
