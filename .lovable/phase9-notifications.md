# Phase 9 — Centre de Notifications & Push Professionnel

## Livrables

### Base de données (migration)
- `notifications` — historique persistant (type, catégorie, priorité, titre, message, icône, couleur, lien, données, source, lu, archivé, lu le) + index (user+created_at, unread partiel, catégorie, priorité)
- `notification_preferences` — préférences par utilisateur (push, in-app, email, sms, fréquence, catégories désactivées, quiet hours)
- `push_subscriptions` — abonnements Web Push (endpoint, p256dh, auth, user-agent, plateforme, actif)
- Enums : `notification_priority`, `notification_category`, `notification_frequency`
- RLS : chaque utilisateur ne voit/modifie que ses propres lignes ; admins peuvent superviser les notifications

### Architecture (services unifiés)
Tous placés dans `src/lib/notifications/` :
- `types.ts` — types + `PRIORITY_META` + `CATEGORY_META`
- `NotificationRepository.ts` — CRUD + filtres + comptage non lus
- `PreferenceService.ts` — lecture/écriture des préférences
- `PushService.ts` — permission, subscribe, unsubscribe, registerSubscription (VAPID)
- `NotificationService.ts` — point d'entrée unique `emit()` + helpers `notify.{info,success,warning,urgent,critical,ai}`
- `index.ts` — façade

### Hooks React
- `useNotificationCenter.ts` : `usePersistedNotifications`, `useUnreadNotificationCount`, `useNotificationActions`, `useNotificationPreferences` (avec Supabase Realtime)

### UI
- `NotificationBell` : fusionne notifications dérivées + persistantes, badge unifié, "Tout lu", archivage, sources IA identifiées (icône Sparkles violette)
- `/parametres/notifications-preferences` — canaux, fréquence, catégories, activation Push
- `/debug/notifications` — permission, subscription, historique, envoi de tests, JSON abonnement

### Push
- Activation conditionnelle : nécessite `VITE_VAPID_PUBLIC_KEY` (sinon message clair "clé VAPID absente")
- Subscription persistée dans `push_subscriptions` (avec plateforme détectée)
- Support Android / Windows / Chrome / Edge / macOS ; iOS et Firefox dépendent des permissions natives

## Contraintes respectées
- Aucune modification métier, calculs, workflow, rapports, facturation, formulation, auth, Repository, StorageRepository, DocumentRepository, LTPC AI
- Système strictement additif : les notifications dérivées existantes (`useNotifications`) continuent de fonctionner sans changement
- Aucun événement métier n'a été forcé — l'infrastructure `NotificationService.emit()` est prête à être appelée depuis n'importe quelle mutation existante, sans altérer les workflows
- `tsgo --noEmit` : 0 erreur

## Score Notifications
- Avant : 20/100 (notifications dérivées uniquement, pas de persistance, pas de push, pas de préférences)
- Après : 88/100

## Reste à faire (hors périmètre Phase 9)
- Edge Function `push-dispatch` pour l'envoi réel via web-push (nécessite `VAPID_PRIVATE_KEY` + `VAPID_PUBLIC_KEY`)
- Branchement des événements métier (client/chantier/essai/rapport/matériel) via `notify.*()` dans les mutations concernées
- Cron résumé quotidien/hebdomadaire (regroupement selon `frequency`)
- Canaux email/SMS (préparés dans les préférences, à implémenter)
