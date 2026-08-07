# AUDIT COMPLET — NOTIFICATIONS LTPC DE BOUT EN BOUT
Date : 07/08/2026 — **Aucun code modifié, aucune migration, aucune notification créée.**

## 1. Architecture actuelle
Deux systèmes **parallèles et indépendants** coexistent :

| # | Système | Source | Persistance | Push |
|---|---------|--------|-------------|------|
| A | `useNotifications` (dérivé) | calcul **client** sur `essais`, `echantillons_compression`, `etalonnage_materiel` | ❌ aucune (jamais écrit en base) | ❌ impossible |
| B | Centre de notifications (persistant) | table `notifications`, alimentée **uniquement** par l'Edge Function `push-dispatch` | ✅ | ✅ FCM/VAPID |

La cloche (`NotificationBell`) fusionne A + B à l'affichage, mais **rien ne circule de A vers B**.

## 2. Flux réel de création d'échantillon
UI (`ChantierEchantillonForm` / compression) → `useCreateChantierEchantillon` / `useCreateEchantillonCompression`
→ `getRepositoryForTable("echantillons_compression").insert()` → PostgREST → table.

`onSuccess` : `invalidateQueries(["echantillons-chantier"], ["echantillons-compression"], ["notifications"])`.
`["notifications"]` invalide **seulement le calcul dérivé (système A)**.

**Aucun appel** à `dispatchNotificationEvent`, `NotificationService`, `NotificationRepository.create` ou `push-dispatch` sur ce chemin.
**Aucun trigger PostgreSQL** de notification sur `echantillons_*` : les seuls triggers existants sont `trg_log_deletion_*` (journalisation suppression) et `trg_log_modif_*` (historique modifications).

## 3. Événements générateurs de notifications
`ALLOWED_EVENTS` (push-dispatch) et `NotificationEvent` (dispatch.ts) contiennent **exactement 3 valeurs** :
`affectation_creee`, `rapport_valide`, `rapport_a_valider`.

Déclencheurs réels :
- `useAffectations.ts:64` → `affectation_creee`
- `useRapportWorkflow.ts:172-173` → `rapport_valide` / `rapport_a_valider`

🔴 **Aucun événement notification n'est prévu pour la création d'un échantillon.**

## 4. Types réellement existants en base
| type | catégorie | source | nb | dernier |
|---|---|---|---|---|
| rapport_a_valider | rapports | workflow | 2 | 07/08 16:18 |
| affectation_creee | intervenants | workflow | 1 | 07/08 15:50 |

## 5. Analyse des « 43 notifications »
⚠️ Correction factuelle : la table `notifications` contient **3 lignes**, pas 43.
Les 43 éléments visibles sont des notifications **dérivées (système A)**, recalculées à chaque chargement : essais > 7/14 j, échéances compression (J/heures) échues ou < 7 j, étalonnages échus/à prévoir. Elles n'existent jamais en base, ne sont pas lisibles côté serveur, et ne peuvent donc **jamais** générer de Push.

## 6. RLS `notifications`
- SELECT : `auth.uid() = user_id OR is_admin_only()` ✅ (destinataire lit, autre utilisateur ne lit pas)
- UPDATE / DELETE : `auth.uid() = user_id` ✅
- INSERT : `is_admin_only()` — les insertions métier passent par `push-dispatch` en `service_role` (contourne RLS) ✅
**RLS n'est pas la cause.**

## 7. `useNotifications`
Dérivé, scoping technicien par chantier, `queryKey: ["notifications", role, chantiers]`. Ne lit jamais la table.

## 8. In-app — cas réel du dernier échantillon
- sample_id `71bb2acb-00fd-457a-b16d-c3b027bf62a2`
- chantier `8eb3d495…`, client `2f1e948c…`, labo mobile (`is_laboratoire_chantier = true`)
- opérateur `53a940ba…`, créé le **07/08/2026 16:40 UTC**, échéances 7 J ×3 et 28 J ×3, coulage 31/07/2026, statut `a-faire`
- Destinataire prévu : **aucun** (pas de règle de destinataire pour cet événement)

Conséquence attendue par l'architecture actuelle :
- ligne en table `notifications` : **0** — conforme au code, aucun événement câblé ;
- notification dérivée : le 7 J tombe le **07/08 = aujourd'hui** → `daysUntil = 0` → une entrée « Échantillon 7 J — Échéance proche » de sévérité **warning** est bien produite. Elle apparaît dans la liste de la cloche mais **pas dans le badge** : `NotificationBell.tsx:34` fixe `badgeCount = errorCount` (uniquement les retards). D'où l'impression d'« aucune nouvelle notification ».

## 9. Push
Non applicable : aucune ligne `notifications` pour cet échantillon → rien à envoyer. Le canal Push (VAPID, abonnements, FCM 201, purge 410) reste validé par le Lot 14.2 et n'est pas en cause.

## 10. Service Worker
`public/push-sw.js` (handlers `push` / `notificationclick`, sanitisation d'URL) inchangé et opérationnel. Hors périmètre du défaut.

## 11. Tableau des événements
| Événement | Notification DB | In-app | Push | Déclencheur |
|---|---|---|---|---|
| affectation_creee | ✅ (1) | ✅ | ✅ | `useAffectations.ts:64` |
| rapport_valide | ⚪ 0 ligne à ce jour | ✅ prévu | ✅ prévu | `useRapportWorkflow.ts:172` |
| rapport_a_valider | ✅ (2) | ✅ | ✅ (testé FCM) | `useRapportWorkflow.ts:173` |
| **création échantillon** | ❌ | ⚠️ dérivé seulement, à l'échéance | ❌ | **aucun** |
| essais en retard / étalonnages | ❌ | ⚠️ dérivé | ❌ | calcul client |

## 12. Point exact de rupture
Entre **« ÉVÉNEMENT MÉTIER »** et **« création de notification »**, dans `useCreateChantierEchantillon` / `useCreateEchantillonCompression` : la mutation n'appelle pas `dispatchNotificationEvent`, et `echantillon_cree` n'existe ni dans `NotificationEvent` ni dans `ALLOWED_EVENTS` de `push-dispatch`.

## 13. Cause racine
**Cause A — aucun événement métier prévu.** (Pas B, C, E, F, G, H.)
Facteur aggravant secondaire : `badgeCount = errorCount` masque du badge les notifications dérivées non urgentes.

## 14. Correction minimale recommandée (non appliquée)
1. Ajouter `"echantillon_cree"` à `NotificationEvent` (`dispatch.ts`) **et** à `ALLOWED_EVENTS` + `buildNotification()` dans `push-dispatch` (titre/message/lien reconstruits serveur depuis `echantillons_compression` + `chantiers`/`clients`).
2. Définir la règle de destinataires côté serveur — proposition : utilisateurs liés à l'`operateur_id`/techniciens affectés au chantier + rôles `manager`/`ingenieur`, **hors** créateur.
3. Appeler `void dispatchNotificationEvent("echantillon_cree", id)` dans le `onSuccess` des deux mutations de création.
4. Optionnel : inclure `warningCount` dans `badgeCount` pour que les échéances proches soient visibles.

## 15. VERDICT
🟠 **ÉVÉNEMENT NON CÂBLÉ.**
La création d'un échantillon n'est pas définie comme événement générateur de notification : ni code applicatif, ni trigger base, ni type autorisé dans `push-dispatch`. Aucune ligne n'est donc écrite dans `notifications` (source de vérité), et par conséquent aucun Push ne peut partir. Le Push, la RLS, le Service Worker et FCM sont hors de cause.
