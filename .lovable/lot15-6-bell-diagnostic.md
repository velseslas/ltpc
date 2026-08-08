# LOT 15.6 — Diagnostic cloche (lecture seule)

## 1 — État réel de la base (`notifications`)

| catégorie | channel | total | non lues (non archivées) |
|---|---|---|---|
| compression | inapp | 2 | 2 |
| rapports | inapp | 2 | 1 |
| intervenants | inapp | 1 | 1 |
| systeme | push | 8 | 8 |
| echeance_compression | push | 120 | 118 |
| message_recu | push | 24 | 15 |

- **`channel IS NULL` : 0 ligne.** La migration a bien rempli toutes les lignes. Le filtre `.eq("channel","inapp")` n'exclut donc **aucune** donnée historique.

Détail des 5 lignes `inapp` :

| user_id | catégorie | lue | archivée |
|---|---|---|---|
| 7cdbf9be… (technicien) | compression | non | non |
| 7cdbf9be… | compression | non | non |
| 7cdbf9be… | rapports | non | non |
| **66114a91… (admin)** | rapports | **oui** | **oui** |
| 7cdbf9be… | intervenants | non | non |

## 2 — Filtre introduit par le LOT 15.6

`src/lib/notifications/NotificationRepository.ts`
- `list()` : `.eq("user_id", uid).eq("channel","inapp").eq("is_archived", false)`
- `unreadCount()` : `.eq("channel","inapp").eq("is_read", false).eq("is_archived", false)`

Ce filtre est **correct** : pas de lignes NULL à récupérer, et il exclut bien `echeance_compression` / `message_recu`.

## 3 — Cause exacte

**Ce n'est pas le filtre `channel`.** Deux effets cumulés :

1. **Fichier responsable : `src/hooks/useNotifications.ts` (ligne ~84)** — la constante `ECHEANCES_COMPRESSION_PUSH_ONLY = true` court-circuite la requête `echantillons_compression` (`{ data: [] }`). Or ces **alertes dérivées d'échéances représentaient la quasi-totalité du contenu de la cloche** (les ~120 lignes `echeance_compression` en base le confirment). Résultat : la liste dérivée est désormais vide.
2. **Données : l'utilisateur admin `66114a91…` n'a aucune notification persistante affichable** — sa seule ligne `inapp` est `is_read = true` **et** `is_archived = true`, donc légitimement exclue.

⇒ Pour l'admin, `dérivées (0) + persistées visibles (0) = cloche vide`. Le comportement est cohérent avec le code, mais l'admin a perdu son seul contenu (les échéances) sans rien pour le remplacer.

Le compte technicien `7cdbf9be…` verrait, lui, **4 notifications non lues** (2 compression, 1 rapports, 1 intervenants) : la chaîne cloche fonctionne.

**Réponse à la question 7 : cas A/B partiels — les données persistantes sont bien récupérées et affichées (vérifié pour 7cdbf9be), mais la source dérivée (échéances) est volontairement coupée et l'admin n'a aucune ligne `inapp` active.**

## 4 — Catégories : règle attendue

| catégorie | channel actuel | doit apparaître dans la cloche |
|---|---|---|
| compression (nouvel échantillon) | inapp | ✅ oui |
| rapports | inapp | ✅ oui |
| intervenants | inapp | ✅ oui |
| systeme | push (8 lignes, tests) | ⚠️ devrait être `inapp` — mal classée |
| echeance_compression | push | ❌ non (Push-only, conforme) |
| message_recu | push | ❌ non (Push-only, conforme) |
| historique sans channel | — | aucun (0 ligne) |

Anomalie détectée : les 8 lignes `systeme` ont été classées `push` (backfill/`PUSH_ONLY_CATEGORIES` trop large lors de tests). `systeme` est une catégorie **interne** et devrait rester visible dans la cloche.

## 5 — Badge

`src/components/layout/NotificationBell.tsx` : `totalCount = notifications.length + persistedUnread`.
- `persistedUnread` = `unreadCount()` filtré `channel='inapp'` → n'inclut ni `echeance_compression` ni `message_recu` ✅ conforme.
- Pour l'admin, il vaut légitimement 0.

## 6 — Test concret (notifications existantes, aucune créée)

| notification | attendu | constaté |
|---|---|---|
| ancienne interne « Rapport à valider » (admin) | visible | **non affichée** — `is_archived = true` (exclusion légitime, pas liée au channel) |
| ancienne interne « Nouvel échantillon » (technicien) | visible | affichée (channel `inapp`, non lue) |
| `echeance_compression` | masquée | masquée ✅ |
| `message_recu` | masquée | masquée ✅ |

## 7 — Correction minimale recommandée (non appliquée)

1. **Reclasser la catégorie `systeme` en `inapp`** (migration non destructive `UPDATE … SET channel='inapp' WHERE category='systeme'`) et retirer `systeme` de `PUSH_ONLY_CATEGORIES` dans `push-dispatch` s'il y figure.
2. **Ne pas toucher au filtre `channel='inapp'`** : il est correct (0 ligne NULL). Par sécurité future, tolérer NULL via `.or("channel.eq.inapp,channel.is.null")`.
3. **Décision produit à trancher** : la cloche est vide pour l'admin parce que les échéances compression sont devenues Push-only. Si l'on souhaite conserver un fil interne, réactiver une variante « in-app » des échéances (badge séparé) — sinon le comportement actuel est conforme au LOT 15.6.

Aucun code ni aucune donnée modifiés.
