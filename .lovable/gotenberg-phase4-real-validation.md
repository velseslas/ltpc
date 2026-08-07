# PHASE 4 — RECETTE RÉELLE GOTENBERG / CHROMIUM

Date : 07/08/2026.

# VERDICT : 🟠 PHASE 4 EN RÉSERVE

Motif unique et bloquant : **le moteur Gotenberg n'est pas joignable** — le sous-domaine
configuré (`GOTENBERG_URL`) ne résout pas en DNS. Les tests §3, §4, §6, §7 et §8 ne peuvent
donc pas être exécutés contre un moteur réel. Tout le reste de la chaîne a été testé et passe.

---

## 1. CONFIGURATION VPS

| Point | État |
|---|---|
| Secrets `GOTENBERG_URL` et `GOTENBERG_SHARED_SECRET` | ✅ enregistrés côté backend (Lovable Cloud) |
| Secret jamais dans le frontend / le code source | ✅ lu uniquement par `Deno.env` dans `pdf-render` |
| Secret jamais envoyé au navigateur | ✅ transmis en en-tête serveur → serveur, retiré par Caddy avant Gotenberg |
| Secret jamais journalisé | ✅ aucun `console.log` du secret ; message d'erreur du moteur désormais générique |
| Résolution DNS du sous-domaine | ❌ **`pdf.ltpc.dz` : aucune résolution DNS** (le domaine `ltpc.dz` lui-même ne résout pas) |
| HTTPS | ⛔ non vérifiable (hôte injoignable) |
| Port 3000 non exposé | ⛔ non vérifiable |
| Endpoints Gotenberg non nécessaires bloqués | ⛔ non vérifiable |

Correction apportée pendant la recette (sécurité, sans impact métier) : `pdf-render` ne renvoie
plus l'URL du moteur dans le message d'erreur 502 (fuite d'information d'infrastructure).
Aucune autre modification : templates, moteur Phase 11, partage, calculs intacts.

## 2. TEST DE CONNECTIVITÉ

Appel réel `pdf-render` (utilisateur authentifié, catégorie 7 « carottage ») :

```
HTTP 502 — "Moteur PDF injoignable"
cause : dns error: failed to lookup address information (pdf.ltpc.dz)
```

Même résultat pour la catégorie 8 (`etat-coulages`).
Contrôle DNS depuis l'environnement de test : `pdf.ltpc.dz` → aucune réponse ; `ltpc.dz` → aucune réponse.

Conséquence : les refus attendus (sans secret, mauvais secret, endpoint non autorisé, port 3000)
n'ont pas pu être éprouvés — ils dépendent de la présence du proxy Caddy.
La procédure exacte reste dans `infra/gotenberg/README.md` §4.

**Aucune exposition publique n'a été créée** : en l'absence de moteur, rien n'est publié.

## 3. RECETTE DES 10 CATÉGORIES

⛔ **Non exécutée** — dépend du §2. Aucun PDF réel n'a pu être produit ;
aucune valeur n'est reportée dans ce document pour ne pas certifier de résultats fictifs.

Grille prête à être remplie : `.lovable/gotenberg-deployment-certification.md` §5.3.
Ressources de test déjà identifiées en base pour 8 catégories sur 10 :

| # | Catégorie | Ressource de recette |
|---|---|---|
| 1 | Rapport technique | `e1114506-…4aadf` |
| 2 | Béton — compression | aucun échantillon hors labo mobile en base → à créer ou à requalifier |
| 3 | Labo mobile — échantillon | `61f1b727-…138c5` (chantier `960883af-…cefb1d`) |
| 4 | Granulats — granulométrie | `53cc3e49-…4fed5b8d` |
| 5 | Géotechnique — plaque | `8e57c7f9-…c8894e6` |
| 6 | Formulation | `dd240463-…78d5fbff` |
| 7 | Carottage | `b7052c41-…586d30cc` |
| 8 | État des coulages | chantier `960883af-…cefb1d` |
| 9 | État essais béton durci | paramètre `type=compression` |
| 10 | Granulats — forme | `506e6d2d-…3825a6` |

## 4. COMPARAISON PHASE 3

⛔ Impossible : aucun PDF réel à comparer.
Les références Phase 3 (`.lovable/gotenberg-phase3-readiness-final.md`) restent la base de
comparaison. **Aucun template n'a été modifié**, conformément à la règle absolue.

## 5. SÉCURITÉ DU RENDER-TOKEN — TESTS RÉELS ✅

Exécutés en production, sur les fonctions déployées :

| Test | Attendu | Obtenu |
|---|---|---|
| Émission avec JWT valide | 200 + jeton | ✅ 200, jeton 43 caractères (32 octets base64url) |
| Première consommation | 200 + contexte figé | ✅ 200, route serveur correcte `/essais/beton/destructif/carottage/<id>/rapport` |
| **Rejeu du même jeton** | 403 | ✅ 403 |
| **Jeton expiré** (inséré à `now() - 5 min`) | 403 | ✅ 403 |
| Jeton inexistant | 403 | ✅ 403 |
| Jeton malformé (trop court) | 400 | ✅ 400 |
| Émission sans JWT | 401 | ✅ 401 |
| Type de rapport hors catalogue | 400 | ✅ 400 (`"pirate"` refusé) |
| Ressource non-UUID (`../autre`) | 400 | ✅ 400 — aucune traversée de chemin possible |
| Filtres passés en query string | ignorés | ✅ la route est **reconstruite côté serveur** depuis `params` figés ; la query string du client n'est jamais lue |
| Jeton lié à un autre rapport | refus | ✅ le couple (type, ressource) est figé à l'émission ; le porteur du jeton ne peut atteindre que cette ressource |
| Lecture directe de `render_tokens` (utilisateur connecté) | refus | ✅ 403 / 42501 (rappel Phase 3, RLS sans policy) |

Le jeton de test expiré a été supprimé après essai.

## 6. TEST DE CHARGE

⛔ Non exécuté (dépend du §2). Protocole figé : 1 génération / 4 générations parallèles,
rapport 1 page (catégorie 7) et multi-pages (catégorie 6, 12 pages), avec décomposition
**temps réseau / temps rendu / temps conversion** et `docker stats ltpc-gotenberg`.
Référence prototype Chromium 141 : 29–158 ms de conversion pure.

## 7. TEST PDF RÉEL (Desktop / Mobile / lecteur PDF)

⛔ Non exécuté. Rappel des interdits respectés par construction : la chaîne n'emploie
**ni html2canvas, ni jsPDF, ni capture d'écran** — seule l'impression Chromium native
(`/forms/chromium/convert/url`, `preferCssPageSize`) est utilisée, donc PDF vectoriel.

## 8. ARCHIVAGE

⛔ Non testé faute de PDF. Le chemin est en place et inactif tant qu'`archive: true` n'est pas
demandé : dépôt `documents-officiels` → `pdf/<kind>/<id>/<ts>.pdf`, `Content-Type: application/pdf`.
`document-file` sert déjà `application/pdf` + `Content-Disposition: inline`.
**Aucune archive HTML historique n'a été remplacée ; le fallback HTML reste actif.**

## 9. PARTAGE

✅ **Inchangé.** Le bouton « Partager », `DocumentShareService` et `document-file` n'ont reçu
aucune modification pendant cette recette.

## 10. PROBLÈMES

| # | Problème | Gravité | Action |
|---|---|---|---|
| 1 | `GOTENBERG_URL` (`pdf.ltpc.dz`) ne résout pas en DNS : VPS non déployé, sous-domaine non créé, ou valeur d'exemple saisie à la place de l'URL réelle | **Bloquant P0** | Créer l'enregistrement A vers le VPS, lancer `docker compose up -d`, puis corriger le secret `GOTENBERG_URL` avec le sous-domaine réel |
| 2 | Aucun échantillon de compression « hors laboratoire mobile » en base | Mineur | Fournir une ressource pour la catégorie 2 lors de la prochaine recette |
| 3 | L'URL du moteur apparaissait dans le message d'erreur 502 | Corrigé | Message générique ; détail journalisé côté serveur uniquement |

## 11. CONCLUSION

Toute la partie maîtrisée par l'application est **validée en conditions réelles** : émission,
consommation atomique, rejeu, expiration, jetons falsifiés, types hors catalogue, ressources
invalides, filtres non manipulables, secrets confinés au backend, aucune fuite vers le navigateur.

La chaîne s'arrête au premier saut réseau : le moteur Gotenberg n'existe pas encore à l'adresse
configurée. Dès que le sous-domaine résoudra vers le VPS et que le service tournera, la recette
§§2, 3, 4, 6, 7 et 8 pourra être déroulée sans aucune modification de code.

**🟠 PHASE 4 EN RÉSERVE — un seul point bloquant : le moteur PDF n'est pas joignable.**

STOP. Le partage ne sera branché qu'après validation explicite et passage au vert.
