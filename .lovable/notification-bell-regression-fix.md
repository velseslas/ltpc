# Correction régression Centre de notifications (F1–F3)

Aucune migration, aucune donnée modifiée en base, moteur Push intact (VAPID, FCM, SW, `PushService`, `push-dispatch`, `echeances-dispatch`, RLS, messagerie).

## F1 — « Voir tout » restauré
`src/pages/Notifications.tsx` lit désormais la source de vérité persistante via `usePersistedNotifications({ limit: 200 })` (même repository et mêmes filtres que la cloche : `channel = 'inapp'`, non archivées, RLS utilisateur), fusionnée avec les alertes dérivées de `useNotifications` (conservé, non supprimé).
- Modèle unifié `UnifiedNotification` : `severity` (dérivée de `priority`), `type`, `category`, `is_read`, `created_at`, `link`.
- Tri : sévérité puis `created_at` décroissant.
- Clic sur une notification persistante non lue → `markRead` puis navigation ; lignes lues atténuées.
- Cartes Total / Urgents / Avertissements / Informations et filtres sévérité/type recalculés sur la liste fusionnée (aucun doublon : clés `p-<id>` / `d-<id>`).
- `message_recu` reste exclu (filtre `channel='inapp'` du repository inchangé).

## F2 — Visuels de sévérité restaurés dans la cloche
`src/components/layout/NotificationBell.tsx` : les notifications persistantes utilisent désormais `getSeverityIcon` / `getSeverityBg` (🔴 `AlertCircle` / 🟠 `AlertTriangle` / 🔵 `Info`) au lieu de l'icône `Bell` générique. Sévérité dérivée uniquement de `priority` via le nouveau helper `severityFromPriority` (`src/lib/notifications/types.ts`) — jamais du `channel`. Compteurs urgent/avertissement alignés sur le même helper. Badge inchangé (non lues in-app).

## F3 — Libellés de catégorie corrigés
`CATEGORY_META` (`src/lib/notifications/types.ts`) :
- `echeance_compression` : « Échéances compression (Push) » → **« Échéance d'essai de compression »**
- `message_recu` : « Messages reçus (Push) » → **« Messages »**
Le canal n'apparaît plus nulle part dans l'interface.

## Tests / validation
- Typecheck `tsgo --noEmit` : **0 erreur**.
- Base inspectée en lecture seule avant/après : 125 échéances `inapp` (92 warning, 33 info), 5 autres `inapp` (compression/rapports/intervenants), 32 `message_recu` en `push` — **inchangées**.
- Règles métier conservées : échéance = cloche + Push (une seule ligne DB) ; `message_recu` = messagerie + Push, absent de la cloche ; autres notifications internes visibles selon leur catégorie.
