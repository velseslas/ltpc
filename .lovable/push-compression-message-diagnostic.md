# DIAGNOSTIC — PUSH LTPC : ÉCHÉANCES COMPRESSION + MESSAGES

Mode lecture seule. Aucun code, aucune migration, aucune notification, aucun Push, aucun abonnement modifié.

---

## A. Échéance essai de compression

**Source** : `src/hooks/useNotifications.ts` (lignes ~82-190). Requête client :
`echantillons_compression` → `select id, numero, numero_chantier, statut, date_coulage, jours_essai, resultats, ouvrage, chantier_id, is_laboratoire_chantier, clients:client_id(nom), chantiers:chantier_id(nom)` filtré `statut in ('a-faire','en-cours')`.

**Calcul** (100 % navigateur, à chaque exécution du `useQuery`) :
- pour chaque entrée de `jours_essai` : `testDate = date_coulage + jour (ou + heures)` ;
- échéance ignorée si déjà réalisée (`resultats` avec `joursEssai` correspondant et `resistance > 0` en nombre ≥ `nombre`) ;
- `daysUntilTest < 0` → `overdue_test` (severity `error`) ;
- `0 ≤ daysUntilTest ≤ 7` → `pending_test` (severity `warning`/`info`) ;
- 1 notification agrégée « retard » + 1 notification agrégée « échéance proche » par échantillon.

**Destinataire** : il n'y en a pas au sens serveur. Le filtrage est un **scope de lecture** :
- `useCurrentUserRole()` → `isTechnicien = role in (technicien, operateur)` ;
- `useCurrentUserChantiers()` → `utilisateurs.intervenant_id` puis union de
  `laboratoires_mobiles.responsable_id = intervenant` et `affectations.intervenant_id = intervenant`
  (affectations exclues si `statut in (inactif, termine/terminé)` ou `date_fin < now`) ;
- si technicien : `.in('chantier_id', allowedChantierIds)` (et `chantier_id = 000...0` si aucune affectation → 0 résultat) ;
- sinon (admin/manager/ingénieur/lecteur) : **aucun filtre chantier** → tous les échantillons.

**Pourquoi visible in-app** : parce que la liste est calculée dans le navigateur au moment du rendu du centre de notifications.

**Pourquoi Push absent** : ces objets n'existent **jamais** côté serveur.
- 0 ligne correspondante dans `notifications` ;
- aucun trigger PG sur `echantillons_compression` pour les échéances ;
- aucune tâche planifiée (pas de `pg_cron`, pas d'Edge Function d'échéance) ;
- `ALLOWED_EVENTS` de `push-dispatch` = `affectation_creee`, `rapport_valide`, `rapport_a_valider`, `echantillon_cree`, `message_recu` → **aucun événement d'échéance**.

**Chaîne actuelle** :
Échéance compression → détection **client** (`useNotifications`) → affichage in-app → ⛔ **STOP** (pas de destinataire serveur, pas d'événement, pas d'appel `push-dispatch`) → FCM/SW jamais atteints.

**Cause exacte** : notification **dérivée côté client**, non persistée et sans événement serveur ⇒ `push-dispatch` n'est jamais invoqué.

---

## B. Laboratoire mobile

Même hook, **même requête**, même table `echantillons_compression`. Différences uniquement d'affichage/filtrage :
- flag `is_laboratoire_chantier` ;
- l'échéance est **ignorée** si le `chantier_id` n'est plus rattaché à un `laboratoires_mobiles` (anti-alertes fantômes) ;
- numéro affiché = `numero_chantier`, lien = `/laboratoires-mobiles/chantier/{chantier_id}/echantillon/{id}`.

Destinataire : identique (scope chantier via `laboratoires_mobiles.responsable_id` + `affectations`). Les deux cas sont donc **distinguables** par `is_laboratoire_chantier`, mais partagent exactement la même logique de portée.

**Cause exacte** : identique à A.

---

## C. Message reçu

Chaîne **entièrement câblée** :
`useMessagerie.ts:232 / :273` → `dispatchNotificationEvent("message_recu", created.id)` → Edge Function `push-dispatch` (JWT requis, `sender_id` vérifié = appelant) → destinataires = `conversation_participants` moins l'expéditeur → insertion `notifications` → `pushToUser()` → abonnements actifs → FCM → Service Worker → lien `/messagerie/{conversation_id}`.

**Blocage réel unique** : la catégorie utilisée est `systeme` et `pushAllowed()` coupe **in-app ET Push** si la catégorie est dans `disabled_categories`.

État en base (lecture seule) :
- `push_subscriptions` : **2 abonnements actifs**, tous pour `66114a91-da63-4989-b14f-89407ba4338b` (Administrateur). Aucun autre utilisateur n'a d'abonnement.
- `notification_preferences` : une seule ligne, celle de ce même utilisateur, `push_enabled = true`, `inapp_enabled = true`, pas d'heures calmes, mais `disabled_categories` contient **les 17 catégories**, dont `systeme` et `compression` (mise à jour 08/08 16:41).

⇒ Le seul appareil abonné a toutes les catégories désactivées : `push-dispatch` fait `continue` avant même l'insertion.

---

## D. Administrateur

- Il voit ~60 échéances parce que `useNotifications` n'applique **aucun filtre chantier** quand `isTechnicien` est faux : la requête `echantillons_compression` retourne tous les échantillons `a-faire`/`en-cours`.
- C'est **normal** : c'est le périmètre de lecture attendu pour l'encadrement.
- Garantie de non-fuite vers les autres utilisateurs : le futur Push doit **calculer un destinataire par utilisateur**, pas diffuser une liste. Concrètement, réutiliser côté serveur exactement la logique de `useCurrentUserChantiers` :
  `utilisateurs.intervenant_id` → union(`laboratoires_mobiles.responsable_id`, `affectations` actives) → `chantier_id` ; technicien/opérateur = uniquement ses chantiers ; rôles d'encadrement = tous. Une notification est insérée par couple (utilisateur, échéance), jamais partagée.

---

## E. Conclusion

- Échéance compression : 🔴
- Laboratoire mobile : 🔴
- Message reçu : 🟠

**Cause racine** — deux causes distinctes, aucune liée au Push lui-même (permission, VAPID, SW, FCM sont opérationnels) :

1. **Échéances (compression + labo mobile)** : elles sont des **notifications dérivées calculées dans le navigateur**. Il n'existe ni persistance dans `notifications`, ni trigger, ni tâche planifiée, ni événement dans `ALLOWED_EVENTS`. La chaîne s'arrête donc à « notification affichée dans LTPC ». Aucun Push n'est possible en l'état.
2. **Message reçu** : la chaîne est complète et fonctionnelle ; elle est bloquée en aval par les **préférences utilisateur** — la catégorie `systeme` figure dans `disabled_categories` du seul compte disposant d'abonnements actifs.

**Corrections envisageables (non appliquées)** :
- A/B : introduire un événement serveur d'échéance (tâche planifiée quotidienne + fonction de résolution de destinataire répliquant `useCurrentUserChantiers`), avec clé d'idempotence par (user, échantillon, échéance) pour éviter les doublons.
- C : donner à la messagerie une catégorie dédiée (ex. `messagerie`) au lieu de `systeme`, et réactiver `compression` + `messagerie` dans les préférences — sans élargir les 15 autres catégories, qui restent in-app.
