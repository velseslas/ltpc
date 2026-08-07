# LOT 15 — Audit préalable : Messagerie interne LTPC

## Utilisateurs / rôles
- `auth.users` (Cloud) ↔ `public.utilisateurs` (`user_id`, `nom`, `email`, `statut`, `intervenant_id`, `poste_id`).
- Rôles dans `public.user_roles` (enum `app_role` : super_admin, admin, manager, technicien, operateur, lecteur, ingenieur), lus via `get_user_role()` / `has_role()`.
- Contexte front : `usePermissionContext` (role + permissions `role_permissions`/`permissions`).

## Entreprise
- Pas de multi-tenant SQL : table `entreprise` unique (paramétrage), **aucune fonction `current_entreprise_id()`**. L'isolation métier réelle passe par les chantiers/affectations. Rien à casser côté multi-entreprise.

## Chantiers / accès
- `can_access_chantier_data(_chantier_id)` (SECURITY DEFINER) : privileged staff OU intervenant affecté (`affectations`) OU responsable d'un `laboratoires_mobiles` du chantier.
- `current_intervenant_id()` mappe `auth.uid()` → `utilisateurs.intervenant_id`.
- Front : `useCurrentUserChantiers()`.

## Notifications (existant, à réutiliser)
- Table `notifications` (source de vérité), `notification_preferences`, `push_subscriptions`.
- Front : `NotificationRepository`, `useNotificationCenter`, `NotificationBell`, `dispatchNotificationEvent(event, resourceId)`.
- Serveur : Edge Function `push-dispatch` avec `ALLOWED_EVENTS` + `buildNotification()` (contenu reconstruit côté serveur, expéditeur exclu). Push VAPID optionnel — les échecs Push n'empêchent pas l'insertion in-app.

## Realtime
- Déjà utilisé (`supabase.channel` + `postgres_changes` sur `notifications`). Publication `supabase_realtime` disponible → ajouter `messages` et `conversations`.

## Navigation / UI
- `menuItems` dans `src/components/layout/Sidebar.tsx` (+ `MobileDrawer`, `BottomNavigation` réutilisent `useVisibleMenuItems`).
- Routes par domaine dans `src/routes/*.tsx`, montées dans `App.tsx` sous `ProtectedLayout`.
- Design system shadcn complet (Button, Input, Avatar, Badge, ScrollArea, Dialog, Card…).

## Conclusion
Aucune contradiction : la messagerie s'ajoute en module strictement additif
(3 tables + RLS via fonctions SECURITY DEFINER, Realtime, événement `message_recu`
branché sur `push-dispatch` existant, route `/messagerie`).
