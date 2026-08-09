# Correction UI — Modal « Modifier la localisation » (Desktop)

## Cause technique exacte du débordement

1. **Leaflet ne créait aucun contexte d'empilement local.**
   `.leaflet-container` n'avait pas de `z-index` propre, alors que Leaflet
   positionne ses panes/contrôles en `absolute` avec des `z-index` élevés
   (tilePane 200, markerPane 600, `.leaflet-top/.leaflet-bottom` 1000).
   Ces valeurs dépassaient le `z-50` du `DialogContent` : tuiles, marqueur et
   contrôles `+ / −` s'affichaient **au-dessus / au-delà** de la fenêtre du modal.

2. **Le modal n'était pas en layout flex contraint.**
   `DialogContent` était `max-h-[90vh] overflow-y-auto` sans colonne flex :
   la carte imposait sa hauteur (`minHeight: 240` + `h-[340px]`) au lieu de
   s'adapter à l'espace restant, et le bas de la carte n'était pas borné.

3. **Taille de carte calculée avant l'animation d'ouverture du modal.**
   Leaflet mesurait un conteneur de taille 0/partielle → tuiles rendues hors
   zone visible tant qu'aucun `invalidateSize()` n'était déclenché.

## Corrections appliquées (UI uniquement)

- `src/index.css` : `.leaflet-container { position: relative; z-index: 0;
  width/height: 100%; max-width: 100%; contain: paint; }`
  → contexte d'empilement local + clipping ; **aucun** z-index global augmenté,
  les z-index internes des panes Leaflet restent inchangés (ordre tuiles/marqueur préservé).
- `src/components/localisation/ChantierMap.tsx` :
  - conteneur `relative … min-h-0 overflow-hidden` ;
  - suppression du `minHeight: 240` en dur (la carte ne dicte plus sa hauteur) ;
  - ajout d'un composant interne `InvalidateSize` (timeouts + `ResizeObserver`
    + `window.resize`) utilisant le mécanisme natif `map.invalidateSize()`.
    Nettoyage complet au démontage → une seule instance, pas de fuite.
- `src/components/localisation/LocalisationPicker.tsx` : carte plafonnée à
  `max-h-[45vh]` en plus de sa hauteur nominale.
- `src/components/localisation/ChantierLocalisationEditButton.tsx` :
  `DialogContent` en `flex flex-col max-h-[90vh] overflow-hidden`,
  header et footer `shrink-0`, corps `flex-1 min-h-0 overflow-y-auto`.

## Non modifié

Latitude/longitude, sauvegarde, drag du marqueur, recherche d'adresse,
« Ma position », géocodage, itinéraire, « Voir sur la carte », permissions,
API cartographique, base de données, Push/notifications.

## Contrôles + / −

Une seule paire : elle provient uniquement du contrôle zoom natif de Leaflet
(`MapContainer`). Aucun contrôle n'est créé par le composant parent, et aucune
double instance de `MapContainer` n'est montée — l'apparition multiple sur la
capture venait des tuiles/contrôles non clippés (cause 1), corrigée par le
confinement CSS.

## Validation

- Typecheck : **0 erreur**.
- Mobile : aucune classe mobile modifiée, le panneau replié « 📍 Localisation »
  et sa carte conservent leur comportement (la carte y hérite du même clipping).
