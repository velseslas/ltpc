
# Module : Gestion des Mouvements de Matériel

Remplace l'actuel placeholder `Décharge Matériels` par un véritable module ERP de traçabilité, branché sur le matériel de laboratoire existant.

## 1. Modèle de données (migration Supabase)

Nouvelles tables (toutes en append-only, aucune suppression physique) :

- `materiel_movements`
  - `numero` (auto `MVT-YYYY-NNNN`), `type` (enum : `affectation`, `decharge`, `passation`, `restitution`), `statut` (`brouillon`, `valide`, `signe`, `annule`)
  - `chantier_id`, `technicien_sortant_id`, `technicien_entrant_id`, `responsable_id`
  - `date_mouvement`, `heure_mouvement`, `motif` (passation), `observations`
  - `created_by`, `created_at`, `parent_movement_id` (lien décharge → passation → restitution)
- `movement_items` : `movement_id`, `materiel_id`, `quantite`, `etat` (`bon`, `usage`, `casse`, `manquant`, `a_reparer`), `observations`
- `movement_signatures` : `movement_id`, `role` (`technicien_sortant`, `technicien_entrant`, `responsable`), `signataire_nom`, `signataire_fonction`, `signature_data` (base64), `signed_at`, `ip_address`, `user_id`
- `material_responsibility_history` : `materiel_id`, `technicien_id`, `chantier_id`, `date_debut`, `date_fin`, `movement_id_debut`, `movement_id_fin`
- `material_status_history` : `materiel_id`, `ancien_statut`, `nouveau_statut`, `movement_id`, `changed_by`, `changed_at`, `motif`
- `movement_documents` : `movement_id`, `type` (decharge/passation/restitution), `pdf_url`, `qr_code_data`, `generated_at`

Extension de `materiel_laboratoire` :
- `statut_courant` enum (`disponible`, `affecte`, `pris_en_charge`, `en_passation`, `restitue`, `en_maintenance`, `hors_service`, `perdu`, `vole`, `reforme`) — défaut `disponible`
- `responsable_courant_id` (intervenant), `chantier_courant_id`

Triggers PG :
- `trg_movement_apply` (AFTER INSERT signé) : met à jour `statut_courant`, `responsable_courant_id`, `chantier_courant_id`, et insère dans `material_status_history` + `material_responsibility_history` selon le type.
- `trg_block_delete` : empêche `DELETE` sur les tables `materiel_movements`, `movement_items`, `movement_signatures`, historiques.
- Numérotation auto via fonction `next_movement_numero(type)`.

RLS :
- Lecture : tout utilisateur authentifié pour les mouvements le concernant ; admin/manager voient tout.
- Insertion mouvements : manager/admin + responsable labo. Techniciens : uniquement signature.
- Aucune `DELETE` policy.

## 2. Hooks & services (React Query)

`src/hooks/useMouvementsMateriel.ts` :
- `useMovementsList(filters)`, `useMovementDetail(id)`, `useCreateMovement`, `useSignMovement`, `useMaterialTimeline(materielId)`, `useMaterialStatusCounts`, `useAlertes()` (non restitués, en maintenance > X jours, sans responsable).

## 3. Routes & écrans (React Router)

Sous `/materiel/mouvements` (le widget rose existant pointe ici, libellé renommé "Mouvements Matériel") :

- `/materiel/mouvements` — **Tableau de bord** : cartes statut (Disponible/Affecté/Pris en charge/Maintenance/Perdu/Retard), dernières passations, dernières restitutions, alertes.
- `/materiel/mouvements/liste` — liste filtrable + recherche, badges colorés, export Excel/PDF, impression.
- `/materiel/mouvements/nouveau/:type` — formulaire de création (affectation / décharge / passation / restitution) avec sélection multi-matériel, quantités, état, motif.
- `/materiel/mouvements/:id` — détail : timeline du mouvement, items, signatures, bouton "Signer" pour les rôles concernés, bouton "Générer PDF".
- `/materiel/mouvements/:id/pdf` — page imprimable A4 (logo, entreprise, n°, QR code, items, déclarations, signatures) → `window.print()`.
- Onglet **Historique des mouvements** ajouté dans `MaterielDetail.tsx` : timeline verticale (date/heure, type, chantier, technicien, état, utilisateur, lien document) + bandeau "Responsable actuel" toujours visible.

Composants partagés :
- `MovementTimeline`, `MovementStatusBadge`, `SignaturePad` (canvas), `MaterialPicker` (multi-sélection avec quantité/état), `MovementPdfLayout`.

## 4. Règles métier appliquées côté UI + DB

- Sélecteur de matériel filtré : pour affectation, uniquement `statut_courant = disponible`.
- Passation interdite si matériel `restitue` / `hors_service`.
- Restitution clôt la responsabilité et reroute le statut selon l'état saisi (bon → disponible, à réparer → en_maintenance, cassé/perdu → hors_service/perdu).
- Aucun bouton "Supprimer" ; uniquement "Annuler" (statut `annule`, conservé).

## 5. Signature électronique

`SignaturePad` (canvas HTML5) → image PNG base64 stockée dans `movement_signatures.signature_data`, avec capture nom, fonction, date/heure serveur, IP (via edge function `get-client-ip` légère ou en-tête `x-forwarded-for` lue à la création), user_id.

## 6. PDF officiel

Génération côté client via la route `/pdf` imprimable (cohérent avec le reste du projet qui utilise `window.print()` + `data-ref="report"`). Contenu : en-tête entreprise (`EntrepriseHeader`), numéro, QR code (lib `qrcode.react` déjà utilisée — sinon ajout), tableau items, déclaration légale selon type, blocs signatures avec images.

## 7. Autorisations

Réutilisation de `useCurrentUserRole` + `AdminOnly` / `NotTechnicien` :
- `manager` / `admin` / `super_admin` : création de tous les mouvements.
- `technicien` : lecture de ses mouvements + signature uniquement.
- Toute action loggée via `log_audit_action` (déjà en place).

## 8. Alertes & tableau de bord

Vue SQL `v_alertes_materiel` exposant : retards de restitution (`date_fin_chantier < today` et statut ≠ restitué), maintenance > 30 j, sans responsable, items déclarés `manquant`/`casse`. Affichage en cartes rouges/oranges sur le dashboard du module.

## Livraison en deux temps

1. **Étape 1 (cette itération)** : migration SQL complète + triggers + RLS, hooks, dashboard, liste, création/édition des 4 types de mouvements, signature, timeline matériel, mise à jour widget existant.
2. **Étape 2** : PDF imprimables polish, export Excel, QR code, alertes avancées, raffinements UI.

Souhaitez-vous que je lance l'étape 1 telle quelle, ou ajuster (ex. champs supplémentaires, libellés, périmètre des rôles) ?
