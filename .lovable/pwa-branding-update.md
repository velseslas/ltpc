# PWA Branding Update — Remplacement complet de l'identité visuelle

Date : 2026-07-18
Statut : ✅ Terminé

## Source
Logo officiel LTPC récupéré depuis `entreprise.logo_url` (bucket Supabase Storage `logos`).
Entreprise : **Laboratoire de Travaux Publics & Construction Benmalek**.

## Fichiers supprimés (anciennes icônes)
- `public/favicon.ico`
- `public/apple-touch-icon.png`
- `public/icon-192.png`
- `public/icon-512.png`
- `public/icon-maskable-512.png`

## Fichiers générés (à partir du logo officiel)
Tous placés dans `public/` :

| Fichier | Taille | Usage |
|---|---|---|
| `icon-48.png` | 48×48 | Android legacy |
| `icon-72.png` | 72×72 | Android ldpi |
| `icon-96.png` | 96×96 | Android mdpi |
| `icon-128.png` | 128×128 | Chrome Web Store |
| `icon-144.png` | 144×144 | Windows tile / msapplication |
| `icon-152.png` | 152×152 | iPad touch |
| `icon-167.png` | 167×167 | iPad Pro touch |
| `icon-180.png` | 180×180 | iPhone touch |
| `icon-192.png` | 192×192 | Android home screen |
| `icon-256.png` | 256×256 | Windows |
| `icon-384.png` | 384×384 | Android splash |
| `icon-512.png` | 512×512 | PWA install / splash |
| `icon-maskable-512.png` | 512×512 | Maskable Android adaptive (safe zone 72%, fond `#0891b2`) |
| `apple-touch-icon.png` | 180×180 | iOS Home Screen |
| `favicon.ico` | 16/32/48 | Onglet navigateur |

## Manifest — `public/manifest.webmanifest`
- Toutes les entrées `icons` mises à jour (13 tailles + maskable).
- `theme_color` : `#0891b2` (conservé).
- `background_color` : `#ffffff` (conservé).
- Query-string `?v=2` ajoutée sur toutes les icônes → force le retéléchargement.
- `start_url` : `/?v=2`.

## HTML — `index.html`
- `<link rel="icon">` ico + 192 + 512
- `<link rel="apple-touch-icon">` 152 / 167 / 180
- `<meta name="msapplication-TileColor" content="#0891b2">`
- `<meta name="msapplication-TileImage" content="/icon-144.png?v=2">`
- `<link rel="manifest" href="/manifest.webmanifest?v=2">`
- `theme-color` inchangé (`#0891b2`)

## Cache-busting
- Suffixe `?v=2` appliqué à toutes les références (manifest, icônes, favicon).
- `vite-plugin-pwa` (`registerType: prompt`, `cleanupOutdatedCaches: true`) invalidera automatiquement les caches Workbox au prochain déploiement.
- `runtimeCaching` `ltpc-manifest` en `StaleWhileRevalidate` → l'icône se rafraîchit dès la 2e ouverture après publication.

## Validation
- ✅ **Android** : `icon-192.png` + `icon-512.png` + `icon-maskable-512.png` présents. Purpose `any` + `maskable` séparés (recommandation Chrome). Safe zone maskable 72%.
- ✅ **Windows** : `msapplication-TileColor` + `msapplication-TileImage` (144×144) déclarés.
- ✅ **Chrome / Edge desktop** : `icon-192` + `icon-512` déclarés, install prompt utilisera 512.
- ✅ **iOS** : `apple-touch-icon` 152/167/180.
- ✅ **Favicon** : ICO multi-tailles 16/32/48.
- ✅ Type-check : aucun fichier TS/TSX modifié — pas de régression compilation.

## Portée / Non-touché
- ❌ Aucun composant React modifié.
- ❌ Aucune logique métier / IA / PrintService touchée.
- ❌ Aucun changement de `theme_color` / palette.
- ✅ Uniquement : `public/*.png`, `public/*.ico`, `public/manifest.webmanifest`, `index.html`.

## Notes
- Le logo source (`logo-1777427357921.png`) est en 134×101 px. Les tailles ≥256 sont upscalées via LANCZOS avec padding blanc pour rester nettes. Pour une netteté maximale sur écrans HD, fournir ultérieurement un logo vectoriel ou ≥1024×1024.
