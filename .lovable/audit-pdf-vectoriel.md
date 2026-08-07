# AUDIT — PDF VECTORIEL POUR LE PARTAGE DIRECT (LTPC ERP)

Date : 07/08/2026 — **AUDIT SEUL, AUCUNE MODIFICATION DE CODE.**
Périmètre : trouver un moteur produisant un **vrai PDF vectoriel** (texte sélectionnable/recherchable, A4 fidèle) réutilisable dans le flux de partage déjà validé.

---

## 1. Ce qui existe déjà (état vérifié)

| Brique | État | Verdict |
|---|---|---|
| `document-file` (Edge Function publique) | Opérationnelle, `contentTypeFor()` gère **déjà** `.pdf → application/pdf`, `Content-Disposition: inline`, HEAD/Range/CORS | ✅ **Aucune modification nécessaire** : le jour où l'archive est un `.pdf`, le lien direct fonctionne tel quel |
| `reportArchive.ts` | Archive du HTML natif (`buildStandaloneReportHtml`) + sha256 + token + `document_archives` | ✅ Pipeline réutilisable : seul le **format du blob** changerait |
| Bucket `documents-officiels` + `verify_archive_by_token` | OK, sécurisé par token | ✅ Réutilisable tel quel |
| `src/lib/print/PrintService.ts` + CSS `@media print` (Phase 11) | Rendu A4 de référence | 🔒 **Non touché** |
| `jspdf` + `html2canvas` (`DocumentGenerator.ts`) | Présents dans `package.json` | ❌ **Exclus** par la demande (rasterisation) |
| Chromium / Puppeteer | **Absent du projet ET absent du runtime Supabase Edge** (isolat Deno, pas de sous-processus, pas de binaire 150 Mo) | ❌ Non disponible en l'état |
| Service de génération PDF tiers déjà branché | **Aucun** | — |

**Conclusion de l'inventaire : il n'existe aujourd'hui aucun moteur vectoriel dans l'architecture. Il faudra en ajouter un — la seule question est lequel et où il s'exécute.**

Contrainte structurante : **Supabase Edge Functions = Deno isolé**. Impossible d'y lancer Chromium headless. Toute solution « Chromium » implique donc un hébergement **hors** Lovable Cloud.

---

## 2. Rapport comparatif

| # | Solution | Coût | Dépendance externe | Qualité PDF | Texte sélectionnable | Compat. Supabase | Sécurité | Maintenance | Perf. | Impact PWA | Complexité |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **S1** | **Chromium headless via Edge Function Supabase** | — | — | — | — | ❌ **impossible** (isolat Deno) | — | — | — | — | **écartée** |
| **S2** | **Gotenberg auto-hébergé** (Docker, Chromium `page.pdf`) | Serveur/VPS ~5-10 €/mois | Oui (infra à gérer par vous) | ⭐⭐⭐⭐⭐ identique au print Chrome | ✅ | ✅ (appelé depuis une Edge Function) | 🟢 réseau privé + token | 🟠 infra à maintenir/mettre à jour | 1-3 s/doc, cold start | 🟢 fallback `window.print()` offline | Moyenne |
| **S3** | **Browserless auto-hébergé** (Docker, Puppeteer) | idem S2 | Oui | ⭐⭐⭐⭐⭐ | ✅ | ✅ | 🟢 | 🟠 | idem | 🟢 | Moyenne |
| **S4** | **Browserless / PDFShift / DocRaptor (SaaS)** | 💰 **abonnement + clé API** | Oui, forte | ⭐⭐⭐⭐⭐ | ✅ | ✅ | 🟠 données rapports envoyées à un tiers | 🟢 | latence réseau | 🟢 | Faible |
| **S5** | **`@react-pdf/renderer` dans une Edge Function** (rendu vectoriel natif, sans navigateur) | **0 €** | **Aucune** | ⭐⭐⭐⭐ (fidèle si templates réécrits) | ✅ | ✅ 100 % Deno/npm | 🟢 tout reste dans Lovable Cloud | 🟢 code seul | < 1 s | 🟢 | **Élevée** : chaque rapport A4 doit être réécrit en composants PDF (≈ 30 rapports) |
| **S6** | **`pdf-lib` / `pdfmake` / jsPDF vectoriel (`autoTable`)** | 0 € | Aucune | ⭐⭐⭐ | ✅ | ✅ | 🟢 | 🟠 mise en page manuelle | < 1 s | 🟢 | Très élevée (aucune reprise du HTML) |
| **S7** | **Typst / WeasyPrint compilés en WASM dans Deno** | 0 € | Aucune | ⭐⭐⭐⭐ | ✅ | ⚠️ WASM lourd, CSS partiel, non éprouvé | 🟢 | 🔴 exotique | variable | 🟢 | Très élevée / risquée |
| **S8** | **Statu quo : `window.print()` côté client** (l'utilisateur enregistre en PDF) | 0 € | Aucune | ⭐⭐⭐⭐⭐ vectoriel | ✅ | n/a | 🟢 | 🟢 | instantané | 🟢 | Nulle — **mais ne produit aucun fichier archivable, donc ne résout pas le partage** |

---

## 3. Analyse

- **Exigence n°1 de la demande** : « réutiliser le rendu HTML/A4 existant autant que possible ». Seul **un moteur Chromium** sait transformer le HTML+CSS Tailwind existant en PDF vectoriel sans réécriture. → **S2/S3/S4**.
- **Exigence n°2** : pas de service payant / clé API sans validation explicite. → **S4 écartée pour l'instant**.
- **Exigence n°3** : rester dans l'écosystème actuel. → S2/S3 imposent **un hébergement supplémentaire que Lovable Cloud ne fournit pas** (Supabase n'expose pas de conteneurs Docker).

Il en résulte un arbitrage net, à trancher par vous :

| Direction | Ce qu'on gagne | Ce qu'on paie |
|---|---|---|
| **A — Gotenberg auto-hébergé (S2)** | Fidélité 100 % au rendu actuel, aucune réécriture de template, 0 € de licence | Vous devez fournir/héberger un petit serveur Docker (VPS, Fly.io, Railway, Render…) — donc une infra externe et son coût d'hébergement |
| **B — `@react-pdf/renderer` en Edge Function (S5)** | Zéro infra, zéro coût, zéro dépendance externe, 100 % Lovable Cloud, < 1 s | Les gabarits A4 doivent être réécrits une fois en composants PDF (≈ 30 rapports, effort important) ; le rendu sera *équivalent*, pas pixel-identique |
| **C — SaaS Chromium (S4)** | Le plus rapide à mettre en place | Abonnement + clé API + données rapports transmises à un tiers |

Dans les 3 cas, **le reste de la chaîne est déjà prêt** : archivage → token → `document-file` → `application/pdf` inline. Le moteur d'impression Phase 11 reste intact et continue de servir l'impression écran.

---

## 4. Recommandation

1. **Option B (`@react-pdf/renderer`)** si la priorité est : aucun coût, aucune dépendance externe, tout reste dans Lovable Cloud. Coût = effort de réécriture des gabarits, étalé par lots (pilote : rapport de compression).
2. **Option A (Gotenberg)** si la priorité est la **fidélité exacte** au rendu HTML actuel et que vous acceptez d'héberger un petit conteneur.
3. Option C uniquement si vous validez explicitement un abonnement.

**Aucune ligne de code n'a été écrite. Aucune dépendance ajoutée. Aucune clé API demandée.**
