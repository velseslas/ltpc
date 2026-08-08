# LOT 15.5 — Activation Push guidée pour tous les utilisateurs

Date : 2026-08-08

## Emplacement choisi
Bannière discrète en haut de la zone de contenu (`src/components/layout/MainLayout.tsx`,
juste avant `children`) — visible après connexion sur n'importe quelle page, non bloquante,
masquée en mode `?embed=1` (impression/rendu). Le bloc existant du menu utilisateur
(`PushActivationItem`) reste inchangé et sert de point de réactivation permanent.

## Rôles concernés
Tous les utilisateurs connectés (administrateur, manager, ingénieur, technicien, autres rôles).
Aucun changement de permissions : aucun accès aux Paramètres n'est ouvert.

## Logique de détection
À la connexion / au montage : support navigateur (`PushService.isSupported()`), clé VAPID
présente, `window.isSecureContext` (HTTPS), puis `PushService.getState()` :
- `subscribed && permission === "granted"` → rien affiché (🟢 Push actif) ;
- `permission === "denied"` → 🔴 Notifications bloquées + procédure de réactivation ;
- SW `installing`/`waiting` → 🟠 Service Worker en mise à jour (jamais « indisponible »),
  ré-évaluation automatique sur `updatefound` / `statechange` ;
- sinon → 🟠 invitation « Activez vos notifications ».

## Comportement permission
Avant `Notification.requestPermission()`, la bannière affiche l'explication
« Autorisez les notifications pour recevoir vos échéances et vos nouveaux messages. »
puis le bouton [ Autoriser ] déclenche `PushService.subscribe()` (SW → permission →
subscribe → enregistrement en base). Refus → aucune nouvelle tentative immédiate, message
indiquant comment réactiver dans le navigateur.

## Comportement « Plus tard »
Mémorisé localement : `sessionStorage` (jamais 2× dans la même session) +
`localStorage` `ltpc.push-invite.<userId>` avec horodatage → pas de nouvelle invitation
avant **7 jours**. L'application n'est jamais bloquée.

## Multi-appareils
Aucune logique nouvelle : `PushService.registerSubscription()` fait un `upsert` sur
`(user_id, endpoint)` et ne désactive que les anciens endpoints du **même** `user_agent`.
Un abonnement Android et un abonnement Windows du même utilisateur restent actifs.

## Sécurité
`PushService.subscribe()` écrit avec la session courante uniquement — RLS de
`push_subscriptions` inchangées. Aucun accès aux préférences d'un autre utilisateur.

## Non modifié
VAPID, FCM, Service Worker, `PushService`, `push-dispatch`, `echeances-dispatch`, cron,
anti-doublon, destinataires, routes de clic, modèle de conversations, LOT 15.4
(présence/marquage lu/suppression du Push sur conversation active), messages vocaux.

## Tests
- Typecheck `tsgo --noEmit` : **0 erreur**.
- A. Abonnement actif → aucune bannière (état 🟢 conservé).
- B/C. Sans abonnement → invitation, puis [ Activer ] → écran d'explication → [ Autoriser ]
  → `PushService.subscribe()` → toast 🟢 Push actif, bannière masquée.
- D/E. [ Plus tard ] → masquée immédiatement, pas de réaffichage dans la session,
  rappel après 7 jours.
- G. SW `installing`/`waiting` → « Service Worker en mise à jour », jamais « indisponible ».
- H. Reconnexion avec abonnement existant → état restauré, pas d'invitation.
- F / I / J : nécessitent un appareil réel. **Le Push technicien n'est pas déclaré reçu**
  tant qu'un test physique sur un appareil technicien n'a pas été effectué.
