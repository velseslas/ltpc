# PHASE 4 — CERTIFICATION DE DÉPLOIEMENT GOTENBERG

Date : 07/08/2026.
Statut global : **code et infrastructure prêts — déploiement VPS en attente d'exécution par LTPC.**

**Non modifié, conformément à la consigne** : bouton Partager, `document-file`, templates de
rapport, moteur d'impression Phase 11 (`PrintService`, `print.css`), archives HTML existantes.

---

## 1. ARCHITECTURE

```text
Navigateur LTPC (utilisateur authentifié)
        │  invoke("pdf-render", { report_kind, resource_id, params })
        ▼
Edge Function pdf-render (Lovable Cloud)
        │  1. crée un render-token (usage unique, 2 min, filtres figés serveur)
        │  2. POST https://pdf.ltpc.dz/forms/chromium/convert/url
        │     en-tête X-LTPC-Render-Secret  •  corps = URL /__render/<token> seule
        ▼
Caddy (VPS, HTTPS, secret d'appel)  ──réseau Docker interne──> Gotenberg 8 / Chromium
        │                                        │  ouvre https://ltpc.lovable.app/__render/<token>
        │                                        │  → render-context consomme le jeton
        │                                        │  → redirection vers la ROUTE D'IMPRESSION RÉELLE
        │                                        │  → attente window.__LTPC_PRINT_READY
        ◄──────────── PDF vectoriel ─────────────┘
        │
        └─ (option archive:true) → Storage `documents-officiels` : pdf/<kind>/<id>/<ts>.pdf
```

Aucun HTML autonome n'est utilisé : la conversion passe exclusivement par la route
d'impression réelle LTPC (mode URL validé en Phase 3).

## 2. HÉBERGEMENT

| Élément | Choix |
|---|---|
| Emplacement | VPS dédié, **hors Lovable Cloud et hors Supabase Edge Functions** |
| Orchestration | Docker Compose (`infra/gotenberg/docker-compose.yml`) |
| Image | `gotenberg/gotenberg:8` (Chromium intégré) |
| Reverse proxy | `caddy:2-alpine`, HTTPS Let's Encrypt automatique |
| Dimensionnement | 2 vCPU / 4 Go RAM ; conteneur limité à 2 vCPU / 2 Go |
| Domaine | sous-domaine dédié, ex. `pdf.ltpc.dz` (distinct de l'application) |
| Ports publiés | 80 et 443 uniquement — le port 3000 de Gotenberg n'est jamais exposé |

## 3. SÉCURITÉ

| Exigence | Mise en œuvre |
|---|---|
| Non exposé librement à Internet | Aucun `ports:` sur le conteneur Gotenberg ; seul Caddy est publié |
| Secret d'appel | En-tête `X-LTPC-Render-Secret` exigé par Caddy ; retiré avant transmission à Gotenberg |
| Aucun endpoint public | Une seule route routée (`POST /forms/chromium/convert/url`) ; tout le reste → **404**, y compris sans secret (aucune fuite d'existence) |
| HTTPS | Obligatoire, HSTS 1 an, `nosniff`, `Referrer-Policy: no-referrer` |
| Accès réseau limité | UFW : 22/80/443 ; restriction par IP source documentée si IP sortantes fixes |
| Aucune donnée métier stockée | Conteneur `read_only`, aucun volume, `/tmp` en tmpfs volatil |
| Aucun accès à la base | Gotenberg n'a ni URL ni clé Supabase ; il ne reçoit qu'une URL opaque |
| Aucun credential transmis | Ni JWT, ni cookie, ni clé de service — uniquement `/__render/<token>` |
| Portée du navigateur | `--chromium-allow-list=^https://ltpc\.lovable\.app/__render/.*$` : toute autre URL est refusée |
| Journalisation | `--log-level=error` côté Gotenberg, logs Caddy en niveau ERROR sans query string |
| Jeton | 32 octets aléatoires, usage unique (consommation atomique), expiration 2 min, rejeu → 403 |
| Émetteur autorisé | `pdf-render` exige un JWT valide ; le backend LTPC est le seul appelant possible du moteur |

## 4. CONFIGURATION

Fichiers livrés :

| Fichier | Rôle |
|---|---|
| `infra/gotenberg/docker-compose.yml` | Services Gotenberg + Caddy, durcissement, healthchecks |
| `infra/gotenberg/Caddyfile` | HTTPS, secret d'appel, route unique, 404 par défaut |
| `infra/gotenberg/.env.example` | `GOTENBERG_DOMAIN`, `GOTENBERG_SHARED_SECRET` |
| `infra/gotenberg/README.md` | Procédure d'installation, pare-feu, tests de sécurité |
| `supabase/functions/pdf-render/index.ts` | Orchestration jeton → conversion → archivage |
| `src/lib/render/printReady.ts` | Signal `window.__LTPC_PRINT_READY` (polices, images, SVG prêts) |
| `src/pages/render/RenderBootstrap.tsx` | Armement du signal en contexte de rendu uniquement |

Secrets backend à renseigner côté LTPC : `GOTENBERG_URL`, `GOTENBERG_SHARED_SECRET`.
Tant qu'ils sont absents, `pdf-render` répond **503** et rien n'est modifié dans l'application.

Paramètres de conversion figés côté serveur (aucun contrôle client) :
`preferCssPageSize=true`, marges 0 (les marges A4 restent celles de `print.css`),
`printBackground=true`, `emulatedMediaType=print`, `waitDelay=2s`,
`waitForExpression=window.__LTPC_PRINT_READY === true`, timeout 90 s,
format 8,27 × 11,69 in (portrait) ou 11,69 × 8,27 in (paysage pour les états).

## 5. TESTS

### 5.1 Exécutés dans cet environnement

| Test | Résultat |
|---|---|
| Typage TypeScript du projet (`tsgo --noEmit`) | ✅ 0 erreur |
| Cohérence du catalogue `pdf-render` avec `render-token` / `render-context` | ✅ 9 types, mêmes routes |
| Orientation paysage des états (catégories 8 et 9) | ✅ figée serveur |
| Absence de credential dans la requête vers Gotenberg | ✅ seul l'en-tête secret + l'URL du jeton |
| Comportement sans secrets configurés | ✅ 503, aucune régression applicative |
| Rendu écran hors contexte de rendu | ✅ inchangé (`frozen === null`) |

### 5.2 Non exécutables ici

Le bac à sable de développement **ne dispose pas de Docker ni d'un VPS** : l'image Gotenberg
ne peut pas être lancée. Les mesures réelles doivent être relevées après déploiement, avec le
banc de recette du §5.3. Les valeurs de référence restent celles du prototype Chromium 141
(Phase 3), Gotenberg 8 embarquant le même moteur Chromium headless.

### 5.3 Grille de recette des 10 catégories (à remplir après déploiement)

Référence Phase 3 = prototype Chromium 141, mode URL.

| # | Rapport | Réf. pages | Réf. format | Réf. caractères | Réf. taille | Réf. ms | Gotenberg |
|---|---|---|---|---|---|---|---|
| 1 | Rapport technique | 1 | A4 portrait | 732 | 82 Ko | 50 | ⬜ |
| 2 | Béton — compression | 1 | A4 portrait | 1 336 | 60 Ko | 56 | ⬜ |
| 3 | Labo mobile — échantillon | 2 | A4 portrait | 1 390 | 61 Ko | 38 | ⬜ |
| 4 | Granulats — granulométrie | 2 | A4 portrait | 1 817 | 90 Ko | 74 | ⬜ |
| 5 | Géotechnique — plaque | 1 | A4 portrait | 873 | 79 Ko | 45 | ⬜ |
| 6 | Formulation Dreux-Gorisse | 12 | A4 portrait | 13 418 | 253 Ko | 158 | ⬜ |
| 7 | Carottage | 1 | A4 portrait | 706 | 57 Ko | 29 | ⬜ |
| 8 | État des coulages | 1 | A4 paysage | 1 153 | 79 Ko | 47 | ⬜ |
| 9 | État essais béton durci | 1 | A4 paysage | 510 | 66 Ko | 45 | ⬜ |
| 10 | Granulats — forme | 1 | A4 portrait | 1 317 | 49 Ko | 39 | ⬜ |

Contrôles par catégorie : PDF non vide, format A4 exact (595,92 × 842,88 pt ou l'inverse),
texte extractible (`pdftotext`), pagination identique, graphiques Recharts vectoriels,
QR net, cachet et signature présents, temps de génération, taille.

### 5.4 Recette de sécurité (à exécuter sur le VPS)

Commandes fournies dans `infra/gotenberg/README.md` §4 : appel sans secret → 404,
endpoints non routés → 404, port 3000 injoignable depuis l'extérieur, rejeu du jeton → 403.

## 6. PERFORMANCE

Protocole à appliquer après déploiement :

| Scénario | Mesures |
|---|---|
| 1 génération, rapport 1 page (catégorie 7) | temps moyen sur 5 essais, taille |
| 1 génération, rapport multi-pages (catégorie 6, 12 pages) | temps moyen, temps max, taille |
| 4 générations parallèles, 1 page | temps moyen, temps max, taux d'erreur |
| 4 générations parallèles, multi-pages | temps moyen, temps max, taux d'erreur |

Mémoire : `docker stats ltpc-gotenberg` pendant la charge.
Seuils d'acceptation proposés : temps max < 25 s par rapport, 0 erreur sur 4 requêtes
parallèles, mémoire < 2 Go (limite du conteneur). `--chromium-max-queue-size=8` protège le
service au-delà : les requêtes excédentaires sont mises en file plutôt que de saturer le VPS.

## 7. ARCHIVAGE

- `pdf-render` accepte `archive: true` → dépôt dans le bucket `documents-officiels`,
  chemin `pdf/<report_kind>/<resource_id>/<timestamp>.pdf`, `contentType: application/pdf`.
- La référence retournée (`bucket`, `storage_path`) est prête à être rattachée à une archive.
- **Le fallback HTML actuel est conservé intégralement.** Aucune archive HTML historique
  n'est remplacée. Le bouton Partager continue de servir l'archive existante via `document-file`.

## 8. INCIDENTS

| # | Incident | Résolution |
|---|---|---|
| 1 | Chromium capturait la page avant la fin du rendu React/Recharts | Ajout du signal `window.__LTPC_PRINT_READY` (polices chargées, images décodées, 2 frames) + `waitForExpression` côté Gotenberg |
| 2 | Risque de blocage si la route de rendu échoue | Garde-fou : le signal passe à `true` après 45 s (`data-print-ready="timeout"`) et `pdf-render` coupe à 90 s → 502 explicite |
| 3 | Docker indisponible dans l'environnement de développement | Déploiement et mesures reportés sur le VPS ; aucune valeur de test n'a été inventée |

## 9. LIMITES CONNUES

1. **Déploiement non exécuté** : le VPS, le domaine et les deux secrets doivent être fournis
   par LTPC. Tant qu'ils manquent, `pdf-render` reste inactif (503).
2. **Session de rendu** : Gotenberg ouvre `/__render/<token>` en navigateur anonyme. Si une
   route d'impression exige une session applicative, le rendu sera vide — à confirmer lors de
   la recette §5.3 ; solution prévue : résolution des données côté serveur via le jeton.
3. **Restriction par IP** : les Edge Functions n'exposent pas d'IP sortantes fixes garanties ;
   le contrôle d'accès repose sur le secret d'appel, la route unique et la liste blanche d'URL.
4. **Charge** : au-delà de 8 conversions simultanées, la file d'attente Gotenberg allonge les
   temps de réponse ; augmenter les vCPU ou ajouter une réplique si nécessaire.

## 10. CONCLUSION

L'architecture Gotenberg est **prête au déploiement** : service isolé sur VPS, jamais exposé
librement, HTTPS, secret d'appel, aucune donnée métier persistée, aucun accès à la base, aucun
credential transmis, chaîne `render-token → /__render/:token → Gotenberg → PDF vectoriel`
implémentée sans toucher au partage, à `document-file`, aux templates ni au moteur Phase 11.

**Reste à faire par LTPC avant validation finale** : mettre à disposition le VPS et le
sous-domaine, exécuter `docker compose up -d`, enregistrer `GOTENBERG_URL` et
`GOTENBERG_SHARED_SECRET`, puis dérouler les recettes §5.3, §5.4 et §6.

**STOP.** Le partage ne sera branché qu'après validation explicite.
