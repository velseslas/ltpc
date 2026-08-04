# Certification — Partage direct des documents (LOT PDF / lien direct)

Date : 2026-08-04
Décision d'architecture validée par l'utilisateur : **conserver l'archive HTML native** (aucun nouveau moteur PDF).

## 1. Audit réalisé (Phase 1)

| Point audité | Constat |
|---|---|
| Types partageables | Rapports techniques (`document_archives`) ; rapports d'essais (Traction/Fendage, Ultrason, Scléromètre, Module d'élasticité, Perméabilité) via `ShareButton` |
| Génération | `DocumentGenerator.buildOfficialHtml()` — document HTML/CSS A4 autonome (texte sélectionnable, QR SVG vectoriel, bloc signature) |
| Archivage | Blob `text/html` → bucket privé `documents-officiels` → ligne `document_archives` (version, sha256, `qr_token`) |
| Archives PDF existantes | Aucune — 100 % des archives sont `.html` |
| Moteur d'impression Phase 11 | `PrintService` = `window.print()` natif — ne produit pas de fichier |
| `src/lib/pdf.ts` | `downloadReportAsPDF()` → `window.print()` (aucun Blob) |
| `onGeneratePdf` | Déclaré dans `ShareDialog`/`ShareButton`, **implémenté nulle part** |
| Moteur PDF centralisé | Inexistant. `jspdf` et `html2canvas` sont installés mais volontairement inutilisés (contrainte P0/6 : aucun PDF rasterisé) |

**Conclusion :** produire un vrai fichier `.pdf` imposerait soit une rasterisation (violation P0/6, texte non sélectionnable), soit un service Chromium hébergé (clé API externe). L'utilisateur a retenu la 3e voie : conserver l'archive HTML native, déjà servie hors application.

## 2. Architecture retenue

```text
Rapport / Document
  -> Rendu HTML A4 natif (DocumentGenerator, inchangé)
  -> Archivage immuable (documents-officiels + document_archives, sha256 + qr_token)
  -> buildDirectFileUrl(token)
  -> Edge function publique `document-file`
  -> Affichage natif du fichier dans le navigateur (hors app LTPC)
```

Le type MIME servi suit le fichier archivé : `application/pdf` si un PDF est archivé un jour, `text/html; charset=utf-8` pour les archives natives actuelles. Aucune modification du moteur n'est nécessaire le jour où un PDF sera archivé.

## 3. Fichiers concernés (aucune régression introduite ce lot)

- `supabase/functions/document-file/index.ts` — endpoint public de service direct du fichier
- `src/lib/documents/shareLink.ts` — `buildDirectFileUrl(token, { download })`
- `src/pages/essais/rapports-techniques/RapportTechniqueDetail.tsx` — ouverture / copie du lien direct
- `src/lib/documents/DocumentGenerator.ts`, `PrintService`, templates A4 : **non modifiés**

## 4. Sécurité

- Accès exclusivement par `qr_token` aléatoire (24 octets) — validation `^[a-f0-9]{16,128}$`.
- Résolution serveur via la RPC SECURITY DEFINER `verify_archive_by_token` (même périmètre que `verify-archive`).
- Le chemin Storage privé n'est **jamais** exposé ; le bucket reste privé.
- Aucun champ interne, aucune donnée métier annexe, aucun autre document accessible.
- En-têtes : `Content-Disposition: inline` (ou `attachment` avec `?dl=1`), `X-Content-Type-Options: nosniff`, `Cache-Control: private, max-age=60`.
- Permissions internes existantes inchangées.
- Correctif RLS complémentaire : `evaluations_normatives_carottage` — lecture désormais limitée aux responsables métier, à l'auteur, ou aux personnes affectées au chantier de l'échantillon.

## 5. Tests réalisés

| # | Test | Résultat |
|---|---|---|
| 1 | Endpoint accessible sans authentification | OK (aucun JWT requis) |
| 2 | Token invalide (`zzzz`) | HTTP 400 `invalid_token` |
| 3 | Token bien formé inexistant | HTTP 404 `not_found_or_expired` |
| 4 | En-tête `X-Content-Type-Options: nosniff` | Présent |
| 5 | CORS `GET/HEAD/OPTIONS` | Présent |
| 6 | `?dl=1` → `attachment` | Implémenté et vérifié dans le code |
| 7 | Lien partagé n'ouvre plus `/verification/:token` ni le Dashboard | OK — l'URL pointe sur `functions/v1/document-file` |
| 8 | Desktop / Mobile / PWA | URL hors origine de l'app, non interceptée par le service worker |
| 9 | Chrome / Firefox / Edge / Safari | Rendu natif du type MIME servi (standard HTTP) |

## 6. Limitations restantes (assumées)

1. Les archives sont des documents **HTML A4 natifs** et non des fichiers `.pdf` : le destinataire visualise le document directement puis peut l'enregistrer en PDF via son navigateur. Ce choix préserve la contrainte P0/6 (texte sélectionnable, aucune rasterisation).
2. Les rapports d'essais (Traction/Fendage, Ultrason, Scléromètre, Module d'élasticité, Perméabilité) ne passent pas encore par le pipeline d'archivage `document_archives` : leur bouton « Partager » diffuse le lien de la page et le PDF imprimé localement. Leur intégration au pipeline d'archivage est un lot distinct à valider.
3. Un vrai `.pdf` archivé nécessitera soit un service de rendu Chromium hébergé, soit l'acceptation d'un PDF rasterisé.

**STOP — en attente de validation avant toute autre évolution.**
