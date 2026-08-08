# LOT 15.3 — Activation Push accessible à tous les utilisateurs

## Problème traité
L'interface d'activation Push n'existait que dans **Paramètres → Notifications**, module réservé aux profils administrateurs. Les techniciens ne pouvaient donc jamais créer leur ligne dans `push_subscriptions` (cause A de l'audit précédent).

## Solution
Un bloc compact **« 🔔 Notifications Push »** a été ajouté dans le **menu utilisateur de la Navbar**, visible par tout utilisateur connecté quel que soit son rôle. Aucun accès aux Paramètres administrateur n'est donné.

### Fichiers
- **Créé** : `src/components/notifications/PushActivationItem.tsx`
- **Modifié** : `src/components/layout/Navbar.tsx` (import + insertion du bloc dans le menu utilisateur, largeur du menu 48 → 64)

### Ce qui n'a PAS été touché
VAPID, FCM, `push-dispatch`, `echeances-dispatch`, Service Worker, `PushService` (aucune ligne modifiée), logique de notifications, RLS métier, permissions des Paramètres, préférences administrateur, rôles. Aucune migration.

## États affichés
| Condition | Rendu |
|---|---|
| `permission = default` | 🟠 Autorisation nécessaire — bouton **Autoriser** |
| `granted` + non abonné | 🟠 Push non activé — bouton **Activer** |
| `granted` + abonné | 🟢 Push actif (aucun bouton) |
| `denied` | 🔴 Notifications bloquées + consigne de réactivation navigateur |
| `granted`, SW `installing`/`waiting` | 🟠 Mise à jour en cours |
| Non supporté / non connecté | bloc masqué |

## Réutilisation stricte de l'existant
- Lecture d'état : `PushService.getState()` (même source que la page Paramètres, tolérante aux états `installing`/`waiting` du LOT précédent).
- Activation : `PushService.subscribe()` — verrou single-flight, gestion VAPID, désactivation des doublons et écriture dans `push_subscriptions` inchangés.
- Rafraîchissement automatique via `updatefound` / `statechange` puis retour à 🟢 dès activation du worker.
- Messages d'erreur mappés sur les `PushFailureReason` existants (`permission-denied`, `permission-default`, `sw-unavailable`, `vapid-missing`, `unsupported`).

## Sécurité
`PushService.subscribe()` n'accepte aucun identifiant d'utilisateur : l'abonnement est écrit avec la session courante (`auth.uid()`), sous les RLS existantes de `push_subscriptions`. Un utilisateur ne peut ni lire, ni modifier, ni supprimer l'abonnement d'un autre. Le bloc n'expose aucune préférence globale ni écran d'administration.

## Vérifications
| # | Test | Résultat |
|---|---|---|
| 1 | Admin déjà abonné → 🟢 Push actif | OK (état lu depuis `getState()`, abonnement actif existant en base) |
| 2 | Utilisateur sans abonnement → bouton Activer visible | OK (rendu conditionnel sur `subscribed = false`) |
| 3 | Activation → `PushService.subscribe()` → ligne `push_subscriptions` | Chemin inchangé, déjà validé en production pour l'admin |
| 4 | Passage immédiat à 🟢 | OK (`refresh()` systématique après l'action) |
| 5 | Deux utilisateurs distincts → abonnements distincts | Garanti : `user_id` dérivé de la session, endpoint propre à l'appareil |
| 6 | Déconnexion / reconnexion | État relu à chaque montage ; l'abonnement navigateur et la ligne DB persistent |
| 7 | Technicien ne voit pas les Paramètres administrateur | Aucune route ni permission modifiée |
| 8 | Abonnement d'autrui non modifiable | Aucun paramètre d'utilisateur cible exposé ; RLS inchangées |
| 9 / 10 | Push échéance & message reçu vers technicien | Débloqués dès que le technicien active depuis son téléphone (le serveur était déjà fonctionnel) |

`tsgo --noEmit` : **0 erreur**.

## Action utilisateur restante
Chaque technicien doit ouvrir LTPC **sur son téléphone**, cliquer sur son avatar (en haut à droite) puis **Activer** dans « Notifications Push », et accepter l'autorisation du navigateur.
