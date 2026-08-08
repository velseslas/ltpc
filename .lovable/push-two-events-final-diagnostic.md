# Diagnostic final — Push LTPC pour 2 cas seulement

Date : 2026-08-08 · Lecture seule, aucun code modifié, aucun envoi déclenché.

## Verdict
- **ÉCHÉANCE RAPPORT : 🟠 Push non câblé**
- **MESSAGE REÇU : 🟠 Push non câblé (bloqué par les préférences)** — le code est complet, mais la catégorie utilisée est désactivée, donc aucun Push n'est jamais émis.

---

## A — Échéance de rapport : chaîne complète

| Étape | État |
|---|---|
| Génération de l'alerte | `src/hooks/useNotifications.ts` — calcul **100 % client** (`useQuery`) à partir de `essais`, `echantillons_compression.jours_essai`, `etalonnage_materiel` |
| Types produits | `overdue_test`, `pending_test`, `calibration_due`, `calibration_overdue` |
| Persistée dans `notifications` ? | **NON** — 0 ligne de ce type en base (13 lignes au total : message_recu 8, echantillon_cree 2, rapport_a_valider 2, affectation_creee 1) |
| Destinataire | aucun `user_id` : l'alerte n'existe que dans le navigateur qui l'a calculée |
| Événement Push | **inexistant** : `ALLOWED_EVENTS` de `push-dispatch` = affectation_creee, rapport_valide, rapport_a_valider, echantillon_cree, message_recu. Aucun événement d'échéance |
| push-dispatch | jamais appelé (aucun `dispatchNotificationEvent` dans `useNotifications.ts` / `useProactiveAlerts.ts`) |
| Abonnement / FCM / SW / téléphone | jamais atteints |

> **CAUSE RACINE : l'échéance existe uniquement côté client et ne passe jamais dans la chaîne Push.**

À noter : le seul événement « rapport » câblé est `rapport_a_valider` / `rapport_valide` (changement de statut dans `useRapportWorkflow.ts`) — ce n'est **pas** une échéance ; il n'existe aucune notion de date d'échéance de rapport côté serveur.

---

## B — Message reçu : chaîne complète

| Étape | État |
|---|---|
| Message envoyé | `useMessagerie.ts:232` (texte) et `:273` (vocal) → `dispatchNotificationEvent("message_recu", created.id)` ✅ |
| Message DB | table `messages` ✅ |
| push-dispatch | événement autorisé, destinataires = participants de la conversation sauf l'expéditeur, titre « Nouveau message » / « Nouveau message vocal », lien `/messagerie/:id` ✅ |
| Filtre préférences | **❌ STOP** — catégorie utilisée : `systeme`, présente dans `disabled_categories` → `pushAllowed()` renvoie `{inapp:false, push:false}` → le destinataire est ignoré (`continue`), pas d'insertion, pas de Push |
| Notifications `message_recu` en base | 8, **toutes destinées à `7cdbf9be…` (demigha wassim)** qui n'a **aucun abonnement Push** |
| Votre utilisateur (`66114a91…`) | **0 notification `message_recu`** |
| FCM / SW / téléphone | jamais atteints |

---

## C — Préférences (uniquement les 2 catégories concernées)

| Cas | Catégorie utilisée | État |
|---|---|---|
| Échéance rapport | *aucune* — n'utilise pas `notification_preferences` (logique purement client, filtrée par rôle/chantiers) | hors système de préférences |
| Message reçu | `systeme` | **désactivée** dans `disabled_categories` (maj 08/08 16:41) |

`push_enabled = true`, `inapp_enabled = true`, aucune quiet hour — mais `disabled_categories` a priorité et coupe tout.

---

## D — Abonnement (votre utilisateur `66114a91…`, Administrateur)

| Plateforme | Endpoint | Créé | Dernière maj |
|---|---|---|---|
| android | `fcm.googleapis.com/fcm/send/fbsN-I6j6_o:AP…` | 08/08 16:40 | 08/08 16:40 |
| windows | `fcm.googleapis.com/fcm/send/etSxMkSUy9k:AP…` | 07/08 16:03 | 07/08 16:30 |

2 abonnements **actifs**, valides. Rien créé ni supprimé.

---

## E — push-dispatch (2 événements)

| Événement | Destinataire | Abonnement trouvé | Push envoyé | Réponse FCM |
|---|---|---|---|---|
| échéance rapport | — (événement inexistant) | — | **non** | aucune |
| message_recu | `7cdbf9be…` (vous n'êtes pas destinataire) | 0 | **non** | aucune |
| message_recu (hypothèse vous) | `66114a91…` | 2 actifs | **non** — bloqué par `disabled_categories: systeme` | aucune |

`last_used_at` de l'abonnement Android = sa date de création → **aucun envoi Push n'a jamais été effectué** vers cet appareil. Logs Edge `push-dispatch` : vides sur la fenêtre de rétention.

## FCM
Jamais sollicité pour ces deux cas — aucune réponse 201/400/401/403/404/410/5xx à analyser. FCM hors de cause.

## Service Worker
`public/push-sw.js` : handlers `push` et `notificationclick` présents, payload lu exactement comme émis par `push-dispatch` (`title`, `body`, `target_url`, `notification_id`, `icon`, `badge`). Hors de cause.

---

## Cause racine
1. **Échéance rapport** — aucun événement Push n'existe pour les échéances ; elles sont calculées côté client et ne touchent jamais le serveur.
2. **Message reçu** — le câblage est complet, mais la catégorie `systeme` est désactivée dans vos préférences, donc `push-dispatch` saute le destinataire avant l'insertion et l'envoi. S'ajoute le fait que les 8 messages existants visaient un autre utilisateur, non abonné.

## Correction exacte à appliquer (non appliquée)
1. **Message reçu** : retirer `systeme` de `disabled_categories` pour `66114a91…` (ou décocher dans /parametres/notifications-preferences). Idéalement, donner à la messagerie sa propre catégorie dédiée plutôt que `systeme`, afin que couper « Système » ne coupe pas les messages.
2. **Échéance rapport** : ajouter un événement serveur (p. ex. `echeance_rapport`) dans `ALLOWED_EVENTS` de `push-dispatch`, avec la construction du titre/message/lien et la résolution du destinataire côté serveur, déclenché par une tâche planifiée (cron) qui évalue les échéances — l'alerte client actuelle ne peut pas servir de source.
3. Restreindre l'envoi Push à ces deux seuls événements (les autres restent in-app) une fois le point 2 en place.
