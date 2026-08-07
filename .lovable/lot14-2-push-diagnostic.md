# LOT 14.2 — Diagnostic Push PWA (aucune modification de code)

Date : 2026-08-07 · Environnement : application publiée (ltpc.lovable.app)

## 1. Abonnements en base

`push_subscriptions` — 5 lignes, toutes pour **admin@labo.dz** (`66114a91…`, super_admin) :

| Plateforme | Endpoint | p256dh | auth | Actif |
|---|---|---|---|---|
| android | fcm.googleapis.com/fcm/send/fv66abP_B… | 87 car. | 22 car. | ✅ |
| android | fcm.googleapis.com/fcm/send/ctmDvZsXC… | 87 | 22 | ✅ |
| android | fcm.googleapis.com/fcm/send/fkUDyb1Nh… | 87 | 22 | ❌ (purgé 410 pendant le test) |
| windows | fcm.googleapis.com/fcm/send/etSxMkSUy… | 87 | 22 | ✅ |
| windows | fcm.googleapis.com/fcm/send/cPxW1Fndc… | 87 | 22 | ✅ |

- (1) Abonnement du téléphone : **présent** (2 actifs Android).
- (2) Rattaché au bon utilisateur : **oui** (admin@labo.dz).
- (3) Endpoint FCM valide : **oui** (accepté par le fournisseur, cf. §3).
- (4) Clés présentes : **oui** (p256dh 87 car. base64url = 65 octets ; auth 22 car. = 16 octets).
- (5) Clé VAPID : les envois signés avec `VAPID_PRIVATE_KEY`/`VAPID_PUBLIC_KEY` serveur sont **acceptés** par FCM → l'abonnement correspond bien à la clé publique configurée (un mismatch renverrait 403).

## 2. Préférences

`notification_preferences` admin : `push_enabled = true`, `inapp_enabled = true`,
catégories désactivées : `granulats, documents, compression`, pas d'heures calmes.
⚠️ Une notification de ces 3 catégories est volontairement bloquée (in-app **et** push).

## 3. Envoi réel (événement métier `rapport_a_valider`)

Appel signé de `push-dispatch` sur un rapport existant :

```json
{ "ok": true, "created": 2, "push_sent": 4, "pruned": 1 }
```

Log Edge Function :
`[push-dispatch] { event: "rapport_a_valider", recipients: 2, created: 2, pushSent: 4, pruned: 1 }`

- Abonnements trouvés : 5 (dont 1 périmé)
- Envois tentés : 5 · réussis : **4** · échoués/purgés : 1 (HTTP **410 Gone**, ancien abonnement Android désinscrit automatiquement)
- Codes fournisseur : 201 Created ×4, 410 ×1
- **(9) `push_sent` est passé de 0 à 4.** ✅
- (10) Aucune erreur 401 / 403 / 404 / VAPID / payload / endpoint invalide. Le seul 410 est le nettoyage attendu d'un abonnement remplacé.
- `last_used_at` des 4 abonnements mis à jour à 16:18:53 → preuve d'acceptation par FCM.

## 4. Service Worker publié

- `GET /sw.js` → 200, contient `importScripts("/push-sw.js")` ✅ (12)
- `GET /push-sw.js` → 200, contient `addEventListener("push")` et `addEventListener("notificationclick")` ✅ (11)
- Un seul SW à `/sw.js`, scope `/`, `registerType: autoUpdate` → pas d'ancien worker concurrent côté serveur (13). Réserve : un SW **déjà installé** sur le téléphone avant le déploiement peut rester actif jusqu'à la prochaine activation (fermeture complète de la PWA puis réouverture).
- Icônes `/icon-192.png` et `/icon-96.png` → 200 image/png ✅

## 5. Compatibilité payload ↔ handler (14)

Envoyé : `{ title, body, notification_id, target_url, icon: "/icon-192.png", badge: "/icon-96.png" }`
Attendu par `push-sw.js` : exactement ces clés (`target_url` filtré par `ltpcSafePath`). **Compatible.** ✅

## 6. Réception application fermée (15)

`userVisibleOnly: true` + handler `push` dans le SW enregistré → réception possible application fermée, sous réserve
qu'Android n'ait pas mis l'application en restriction batterie / « optimisée ».

## 7. Cause probable du « aucune notification reçue » avant ce test

Aucun **événement métier ciblant admin@labo.dz** n'avait été déclenché depuis l'abonnement :
la seule notification métier existante (`affectation_creee`, 15:50) visait `dem.wassim@gmail.com` (manager),
qui n'a **aucun abonnement Push**, et elle est antérieure à l'abonnement du téléphone (16:15/16:16).
De plus, `affectation_creee` ne peut jamais cibler l'admin (son compte `utilisateurs` n'a pas d'`intervenant_id`).

Deux limites structurelles constatées (non corrigées, hors périmètre de l'audit) :
1. Seuls 3 événements déclenchent un push (`affectation_creee`, `rapport_valide`, `rapport_a_valider`) ;
   les alertes dérivées de la cloche in-app n'émettent aucun push.
2. Les catégories `granulats`, `documents`, `compression` sont désactivées dans les préférences de l'admin.

## Verdict

🟢 **ABONNEMENT OK + ENVOI OK** — le fournisseur Push (FCM) a accepté 4 messages sur 4 abonnements valides
(`push_sent = 4`), avec purge automatique conforme d'un abonnement périmé (410).

Réception sur l'écran Android : **à confirmer par l'utilisateur** — le message a été accepté par FCM à 16:18:53.
Si rien n'apparaît sur le téléphone, la cause est côté appareil (SW installé antérieur à `push-sw.js`, ou restriction
système Android), et non côté serveur : fermer complètement la PWA, la rouvrir (activation du nouveau SW), puis relancer un test.
