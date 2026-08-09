# LOT — Localisation chantier mobile

## Composant modifié
- `src/components/localisation/ChantierLocalisationBanner.tsx` (seul fichier applicatif modifié).
- Utilisé par `LaboratoireMobileChantier.tsx` et `rh/AffectationForm.tsx`.

## Logique Desktop réutilisée (aucune modification)
- `src/lib/geo.ts` : `hasCoords`, `displayAdresse`, `buildVoirSurCarteUrl`, `buildItineraireUrl`.
- `src/components/localisation/ItineraireButton.tsx` : `VoirSurCarteButton`, `ItineraireButton`.
- Même source de coordonnées (chantier sélectionné), même validation, même destination, même navigation externe.

## Avant / après
- Avant : bandeau localisation toujours déplié sur mobile, actions peu lisibles.
- Après (mobile uniquement, `useIsMobile`) : bouton principal « 📍 Localisation » pleine largeur (44px min) qui déplie le panneau existant : adresse du chantier + `Voir sur la carte` + `Itinéraire`.
- Desktop / tablette ≥768px : rendu strictement identique à avant.

## Coordonnées absentes
- Message « Localisation du chantier non renseignée ».
- `Voir sur la carte` et `Itinéraire` restent désactivés tant qu'aucune destination (GPS ou adresse) n'est disponible — comportement Desktop inchangé, aucune activation artificielle.

## Activation Itinéraire
- Actif dès que le chantier fournit une destination valide (GPS prioritaire via `hasCoords`, sinon adresse).
- Ouverture via URL universelle `google.com/maps/dir/?api=1&destination=...` → application de navigation du téléphone, fallback navigateur.

## Tests
- Mobile : A→H vérifiés (bouton visible, panneau au clic, actions actives avec GPS, désactivées sans, état réinitialisé au changement de chantier puis correct au retour).
- Desktop : aucun changement de rendu ni de comportement.
- Typecheck : 0 erreur.
