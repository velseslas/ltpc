# Modification de la localisation chantier — Mobile + Desktop

## Principe
Un seul composant partagé : `src/components/localisation/ChantierLocalisationEditButton.tsx`.
Utilisé à l'identique par :
- `ChantierLocalisationSection` (fiche chantier — Desktop et Mobile)
- `ChantierLocalisationBanner` (workflow terrain / laboratoire mobile)

## Comportement
- Bouton `✏️ Modifier la localisation` (ou `➕ Ajouter la localisation` si aucune position).
- Ouvre une modale contenant le `LocalisationPicker` existant : recherche d'adresse,
  « Ma position » (GPS), déplacement du marqueur sur la carte.
- Brouillon local uniquement : l'ancienne localisation reste intacte tant que
  `💾 Enregistrer` n'est pas cliqué. `❌ Annuler` jette le brouillon, aucune écriture.
- `💾 Enregistrer` → `useUpdateChantier` (table `chantiers`, colonnes
  `adresse_localisation`, `latitude`, `longitude`).

## Synchronisation
Aucun nouveau mécanisme : `useUpdateChantier` invalide déjà
`["chantiers"]`, `["chantiers", id]` et `["chantiers","client",clientId]`.
Mobile → Desktop et Desktop → Mobile via ce cache React Query existant.

## Permissions
Le bouton n'est rendu que si `hasPermission("chantiers.modifier")` est vrai
(permission existante, aucun nouveau droit). Sinon seuls
`🗺 Voir sur la carte` et `🧭 Itinéraire` restent visibles.

## Vérification
- Typecheck : 0 erreur.
