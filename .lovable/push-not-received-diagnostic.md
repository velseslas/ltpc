# Diagnostic — Push non reçu (lecture seule)

Date : 2026-08-08 · Aucun fichier applicatif modifié, aucune notification/abonnement créé ou supprimé.

## Verdict
**Cause G (démontrée) — les préférences de notification de votre utilisateur désactivent TOUTES les catégories.**
`push-dispatch` s'arrête avant l'insertion et avant l'envoi Push (`continue` sur `!inapp && !push`).
Cause secondaire : les notifications récentes ne sont pas destinées à l'utilisateur abonné.

## Notifications in-app existantes
Les « ~60 notifications » visibles dans LTPC sont majoritairement des **alertes dérivées** calculées côté client (`useNotifications`, `useProactiveAlerts`) : elles n'existent pas en base et **ne peuvent structurellement jamais déclencher de Push**.

## Notifications réellement persistées
Table `notifications` : **13 lignes** au total.

| type | catégorie | nb | dernière |
|---|---|---|---|
| message_recu | systeme | 8 | 07/08 22:43 |
| echantillon_cree | compression | 2 | 07/08 17:54 |
| rapport_a_valider | rapports | 2 | 07/08 16:18 |
| affectation_creee | intervenants | 1 | 07/08 15:50 |

## Événements Push
| Événement | Notif créée | Push prévu | Push déclenché |
|---|---|---|---|
| affectation_creee | oui | oui | non (destinataire sans abonnement) |
| echantillon_cree | oui | oui | non (idem) |
| rapport_a_valider | oui | oui | non (idem) |
| rapport_valide | câblé | oui | jamais émis |
| message_recu | oui | oui | non (idem) |
| Alertes dérivées (péremption, retards, stats…) | **non** | **non** | jamais — n'appellent pas `push-dispatch` |

## Destinataires
- `7cdbf9be…` (demigha wassim) : **12 notifications sur 13** → **0 abonnement Push**. Aucun Push possible.
- `66114a91…` (Administrateur, votre appareil abonné) : **1 seule notification** (`dc2c0486…`, rapport_a_valider, 07/08 16:18) — créée avant le blocage des catégories.

## Abonnements
Utilisateur `66114a91…` : 12 lignes, dont **2 actives** :
- Android (FCM `…fbsN-I6j6…`), créée 08/08 16:40, `last_used_at` 08/08 16:40
- Windows (FCM `…etSxMkSUy…`), créée 07/08 16:03
Les 10 autres sont désactivées (déduplication). Aucun abonnement pour l'autre utilisateur.

## push-dispatch
Code conforme (JWT, reconstruction serveur, VAPID, purge 404/410). Mais avant toute insertion/envoi il applique `pushAllowed(prefs, category)` :

```
notification_preferences (66114a91…)
push_enabled = true, inapp_enabled = true
disabled_categories = {granulats, documents, geotechnique, facturation, materiel,
 etalonnage, intervenants, rh, ltpc_ai, administration, systeme, laboratoire,
 essais, compression, formulation, rapports, pwa}   ← 17/17 catégories
updated_at = 2026-08-08 16:41
```
→ pour toute catégorie, `{inapp:false, push:false}` → destinataire **ignoré silencieusement**. `created = 0`, `push_sent = 0`.

## FCM
Aucune réponse FCM à analyser : **aucun envoi Push n'a jamais été effectué** vers l'abonnement Android actuel (créé 08/08 16:40, `last_used_at` = sa création, jamais mis à jour par un envoi). Les logs Edge de `push-dispatch` sont vides sur la fenêtre de rétention.

## Service Worker
`public/push-sw.js` contient bien les handlers `push` et `notificationclick`, et lit exactement le payload émis par `push-dispatch` (`title`, `body`, `target_url`, `notification_id`, `icon`, `badge`). Hors de cause.

## Chaîne complète
événement métier ✅ → dispatch client ✅ → push-dispatch ✅ → **filtre préférences ❌ (STOP)** → insertion notifications ⛔ → abonnements ⛔ → FCM ⛔ → SW ⛔ → téléphone ⛔

Et, pour les 12 notifications existantes : destinataire ≠ utilisateur abonné (**cause B** en second rang).

## Cause racine
Toutes les catégories sont désactivées dans `notification_preferences` de l'utilisateur abonné → `push-dispatch` saute ce destinataire avant l'envoi.

## Causes écartées
- Permission navigateur / subscribe / VAPID / AbortError : réglés, abonnement actif présent.
- Service Worker : handlers présents et payload compatible.
- FCM : jamais sollicité, donc pas en cause.
- RLS / Realtime / badge : hors chaîne Push.

## Correction proposée (non appliquée)
1. Réactiver les catégories : vider `disabled_categories` pour `66114a91…` (ou décocher dans /parametres/notifications-preferences).
2. Vérifier l'UI des préférences : elle a enregistré 17 catégories désactivées le 08/08 à 16:41 — probable inversion (liste des « activées » écrite comme « désactivées »).
3. Ensuite seulement, tester un événement autorisé destiné à l'utilisateur abonné et lire `push_sent` dans la réponse de `push-dispatch`.
