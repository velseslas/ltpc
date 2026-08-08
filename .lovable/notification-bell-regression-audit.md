# Audit de régression — Centre de notifications / Cloche (post LOT 15.6 / 15.7 / 15.8)

Mode : **lecture seule**. Aucun code modifié, aucune migration, aucune notification créée/supprimée, aucun Push envoyé.

---

## A. État AVANT (historique)

- La cloche et la page `/notifications` étaient alimentées **exclusivement** par le hook dérivé `useNotifications` (calcul client à partir des essais/étalonnages).
- Ce hook produit un champ **`severity`** : `error` (🔴 Urgent) / `warning` (🟠 Avertissement) / `info` (🔵 Information), avec icônes `AlertCircle` / `AlertTriangle` / `Info` et tri par sévérité (`severityOrder`).
- Le gros du volume affiché provenait des **échéances de compression** calculées côté client.
- « Voir tout » → `/notifications` (`src/pages/Notifications.tsx`) : 4 cartes (Total / Urgents / Avertissements / Informations) + filtre sévérité + filtre type, tous basés sur `useNotifications`.

## B. État APRÈS

Fonctionne encore :
- Les notifications persistantes existent bien en base et remontent dans la cloche (`usePersistedNotifications` → `NotificationRepository.list`), badge non-lu inclus.
- Realtime, archivage, « Tout lu », Push : opérationnels.

Cassé :
1. **`/notifications` (« Voir tout ») est vide.** La page n'a **jamais** été branchée sur les notifications persistantes ; elle lit uniquement `useNotifications`. Or, depuis le LOT 15.6, `ECHEANCES_COMPRESSION_PUSH_ONLY = true` (`src/hooks/useNotifications.ts:88`) court-circuite la requête des échantillons de compression (ligne 101) → la source qui remplissait la page ne produit plus rien. Résultat : Total 0, Urgents 0, Avertissements 0, Informations 0.
2. **La cloche affiche « Push » comme s'il s'agissait d'une catégorie.** Ce n'est pas le `channel` : c'est le **libellé** de `CATEGORY_META` dans `src/lib/notifications/types.ts:81-82` :
   - `echeance_compression → "Échéances compression (Push)"`
   - `message_recu → "Messages reçus (Push)"`
   Le badge de chaque ligne affiche donc littéralement « … (Push) ». Après le LOT 15.8 l'échéance est redevenue `inapp`, mais le libellé « (Push) » est resté.
3. **Perte de la présentation Urgent / Avertissement / Information dans la cloche.** Les lignes persistantes sont rendues avec une icône `Bell` générique simplement colorée par `getPriorityMeta(p.priority).color` (`NotificationBell.tsx:143`), sans icône ni fond de sévérité, et sans regroupement/tri par priorité. Les compteurs `errorCount` / `warningCount` existent mais n'apparaissent qu'en pied de popover.

## C. Cause racine (fichiers exacts)

| # | Fichier | Ligne | Effet |
|---|---------|-------|-------|
| 1 | `src/hooks/useNotifications.ts` | 88, 101 | `ECHEANCES_COMPRESSION_PUSH_ONLY = true` supprime toutes les alertes dérivées de compression → page « Voir tout » vide |
| 2 | `src/pages/Notifications.tsx` | 35, 39-58 | Page branchée uniquement sur `useNotifications` ; n'utilise ni `usePersistedNotifications` ni `NotificationRepository` |
| 3 | `src/lib/notifications/types.ts` | 81-82 | Libellés de catégorie contenant « (Push) » → le canal fuit dans l'UI |
| 4 | `src/components/layout/NotificationBell.tsx` | 131-163 | Rendu des lignes persistantes sans sévérité visuelle (icône `Bell` générique) |

Non coupables :
- `NotificationRepository.list()` filtre `channel = 'inapp'` (ligne 32) — **correct** après LOT 15.8 : les 125 échéances sont `inapp` et passent le filtre. Seul `message_recu` est exclu, ce qui est la règle voulue (LOT 15.4/15.6).
- `push-dispatch` : `PUSH_ONLY_CATEGORIES = ["message_recu"]` uniquement (ligne 243) — correct.
- `echeances-dispatch` : insère `channel: "inapp"` (ligne 291) — correct.
- RLS, Push, FCM, Service Worker : hors de cause.

## D. Données réelles en base (aucune modification)

| catégorie | priorité | channel | lu | archivé | nombre |
|---|---|---|---|---|---|
| echeance_compression | warning | inapp | non | non | 92 |
| echeance_compression | info | inapp | non | non | 23 |
| echeance_compression | info | inapp | non | oui | 3 |
| echeance_compression | info | inapp | oui | non | 2 |
| compression | info | inapp | non | non | 2 |
| rapports | warning | inapp | non | non | 1 |
| rapports | warning | inapp | oui | oui | 1 |
| intervenants | info | inapp | non | non | 1 |
| message_recu | info | push | non | non | 23 |
| message_recu | info | push | oui | non | 6 |
| message_recu | info | push | oui | oui | 3 |

Répartition par utilisateur : `7cdbf9be…` 64 inapp / 21 push ; `66114a91…` 61 inapp / 8 push ; `ef14f647…` 3 push.

**Aucune donnée perdue.** `priority` et `category` sont intacts partout ; 125 échéances sont bien visibles côté base pour la cloche.

## E. Régression imputable aux LOT 15.6 / 15.7 / 15.8

- **15.6** : ajout de `channel` + désactivation des alertes dérivées de compression → a vidé la page « Voir tout » (jamais migrée vers les données persistantes) ; libellés « (Push) » introduits.
- **15.7** : reclassement de 8 lignes `systeme`→`message_recu` : conforme, sans impact sur la cloche.
- **15.8** : remise à `inapp` des 120 échéances : correction déjà effective en base ; mais le libellé « (Push) » et l'absence de sévérité dans le rendu n'ont pas été révisés.

## F. Correction minimale recommandée (NON appliquée)

1. `src/lib/notifications/types.ts` : renommer `echeance_compression` → « Échéances compression » (retirer « (Push) »), idem `message_recu` → « Messages ».
2. `src/pages/Notifications.tsx` : brancher la page sur `usePersistedNotifications` (fusion avec les alertes dérivées comme le fait la cloche), mapper `priority` → sévérité (`critical|urgent → error`, `warning → warning`, `info|success → info`) pour alimenter cartes, filtres et tri existants.
3. `src/components/layout/NotificationBell.tsx` : rendre les lignes persistantes avec l'icône et le fond de sévérité dérivés de `priority` (mêmes visuels que les alertes dérivées) et trier par priorité puis date.
4. Optionnel : réévaluer `ECHEANCES_COMPRESSION_PUSH_ONLY` — le garder à `true` reste correct puisque les échéances sont maintenant persistées côté serveur (évite le doublon).

Aucune migration n'est nécessaire : la base est déjà conforme au modèle cible.

## G. Modèle cible

- **CATEGORY** = domaine métier (`echeance_compression`, `compression`, `rapports`, `intervenants`, `message_recu`…). Libellé métier uniquement, sans mention de canal.
- **PRIORITY** = `info` / `success` / `warning` / `urgent` / `critical` → présentation 🔵 Information / 🟠 Avertissement / 🔴 Urgent.
- **CHANNEL** = `inapp` / `push` : routage technique uniquement, jamais affiché, jamais utilisé comme catégorie ni priorité. Exception unique et volontaire : `message_recu` reste `push` (visible dans la messagerie, pas dans la cloche).
