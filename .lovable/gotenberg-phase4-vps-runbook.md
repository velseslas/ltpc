# PHASE 4 — Runbook de déploiement Gotenberg (VPS séparé)

**Statut : 🟠 EN RÉSERVE — aucun VPS joignable.**
Vérification effectuée maintenant :

```
getent hosts pdf.ltpc.dz   → NXDOMAIN
curl https://pdf.ltpc.dz/  → 000 (aucune connexion)
```

Conformément au §10 de la demande : **aucun déploiement inventé, aucune modification
fonctionnelle de LTPC, Phase 4 NON validée.** Ci-dessous la procédure exacte.

Rappel d'architecture (inchangée) :

```
https://ltpc.lovable.app  (application LTPC — NE PAS TOUCHER)
   └─> Edge Function pdf-render  (détient GOTENBERG_URL + GOTENBERG_SHARED_SECRET)
        └─> HTTPS → https://pdf.ltpc.dz  (VPS séparé : Caddy 443)
             └─> réseau Docker interne → Gotenberg 8 / Chromium (port 3000, non public)
                  └─> ouvre https://ltpc.lovable.app/__render/<token> (usage unique)
                       └─> PDF vectoriel → Supabase Storage → document-file → lien direct
```

Gotenberg n'a **aucun accès** à la base : il ne connaît qu'une URL `/__render/<token>`.

---

## 1. VPS — système et ressources

| Élément | Recommandation |
|---|---|
| OS | Ubuntu Server 24.04 LTS (x86_64) |
| vCPU | 2 (minimum) — 4 confortable pour 4 rendus parallèles |
| RAM | 4 Go (minimum 2 Go ; Chromium + `mem_limit: 2g`) |
| Disque | 20 Go SSD |
| Réseau | IPv4 publique fixe, 100 Mbps |
| Hébergeur | indifférent (Hetzner / OVH / Scaleway / Contabo…) |

## 2. Installation Docker + Compose (Ubuntu 24.04)

```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl gnupg ufw
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
docker --version && docker compose version
```

## 3. Fichiers à copier sur le VPS

Depuis le dépôt, dossier `infra/gotenberg/` (base à conserver telle quelle) :

```
/opt/ltpc-gotenberg/
├── docker-compose.yml     (copie de infra/gotenberg/docker-compose.yml)
├── Caddyfile              (copie de infra/gotenberg/Caddyfile)
└── .env                   (créé sur le VPS, JAMAIS commité)
```

```bash
sudo mkdir -p /opt/ltpc-gotenberg && cd /opt/ltpc-gotenberg
# scp depuis votre poste :
#   scp infra/gotenberg/{docker-compose.yml,Caddyfile} root@IP_VPS:/opt/ltpc-gotenberg/
```

## 4. Variables d'environnement (`/opt/ltpc-gotenberg/.env`)

```dotenv
GOTENBERG_DOMAIN=pdf.ltpc.dz
GOTENBERG_SHARED_SECRET=<valeur secrète — voir §6>
```

```bash
sudo chmod 600 /opt/ltpc-gotenberg/.env
sudo chown root:root /opt/ltpc-gotenberg/.env
echo ".env" | sudo tee -a /opt/ltpc-gotenberg/.gitignore
```

## 5. DNS — enregistrement exact

Chez le registrar/DNS de la zone **ltpc.dz** (ne toucher à rien concernant
`ltpc.lovable.app`) :

| Type | Nom | Valeur | TTL | Proxy |
|---|---|---|---|---|
| `A` | `pdf` | `IP_PUBLIQUE_DU_VPS` | 300 | **désactivé** (DNS only) |

Optionnel IPv6 : `AAAA` / `pdf` / `IPv6_DU_VPS`.
Si un CAA existe sur `ltpc.dz`, autoriser Let's Encrypt :
`CAA  @  0 issue "letsencrypt.org"`.

Vérification :

```bash
dig +short A pdf.ltpc.dz        # doit renvoyer l'IP du VPS
```

## 6. Secret partagé

Générer **une seule** valeur, sur le VPS ou votre poste :

```bash
openssl rand -hex 32
```

Elle doit être identique des deux côtés :

1. **VPS** : `GOTENBERG_SHARED_SECRET=` dans `/opt/ltpc-gotenberg/.env`.
2. **Backend LTPC** : secret `GOTENBERG_SHARED_SECRET` (déjà déclaré, à mettre à jour
   avec cette valeur) + `GOTENBERG_URL=https://pdf.ltpc.dz`.

Le secret n'apparaît **jamais** : ni frontend, ni Git, ni logs (Caddy `level ERROR`,
Gotenberg `--log-level=error`), ni URL — il transite uniquement dans l'en-tête
`X-LTPC-Render-Secret`, retiré par Caddy avant le proxy vers Gotenberg.

## 7. Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp      # SSH (restreindre à votre IP si possible)
sudo ufw allow 80/tcp      # ACME HTTP-01 (Let's Encrypt)
sudo ufw allow 443/tcp     # HTTPS — point d'entrée unique
sudo ufw enable && sudo ufw status verbose
```

Le port **3000 (Gotenberg) reste fermé et non publié** : `docker-compose.yml`
n'expose aucun port pour le conteneur `gotenberg` (`expose:` uniquement, réseau
`pdfnet` interne). Ne jamais ajouter de section `ports:` sur ce service.

## 8. Démarrage

```bash
cd /opt/ltpc-gotenberg
docker compose up -d
```

Caddy obtient automatiquement le certificat Let's Encrypt pour `pdf.ltpc.dz`
(le DNS du §5 doit être propagé **avant** ce démarrage).

## 9. Commandes de vérification (sur le VPS)

```bash
docker compose ps                       # 2 conteneurs "running"/"healthy"
docker compose logs --tail=50 caddy     # "certificate obtained successfully"
curl -sS https://pdf.ltpc.dz/healthz    # → ok
# Gotenberg NON exposé :
curl -sS -m 5 http://IP_PUBLIQUE:3000/health   # doit échouer (timeout/refused)
# Sans secret → 404 (aucune fuite d'existence) :
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://pdf.ltpc.dz/forms/chromium/convert/url
# Avec secret → PDF :
curl -sS -X POST https://pdf.ltpc.dz/forms/chromium/convert/url \
  -H "X-LTPC-Render-Secret: $GOTENBERG_SHARED_SECRET" \
  -F 'url=https://ltpc.lovable.app/__render/TOKEN_DE_TEST' \
  -o /tmp/test.pdf && file /tmp/test.pdf   # → PDF document
```

Vérification « vectoriel » : `pdftotext /tmp/test.pdf - | head` doit renvoyer du texte.

## 10. Procédure de test à exécuter une fois `pdf.ltpc.dz` joignable

1. **DNS/HTTPS** : `dig +short pdf.ltpc.dz`, `curl https://pdf.ltpc.dz/healthz`.
2. **Chaîne complète** : appel de `pdf-render` depuis LTPC → PDF retourné.
3. **Render-tokens** (déjà validés en Phase 3, à re-jouer en réel) :
   token valide → 200 · rejeu → 403 · expiré → 403 · inconnu → 403 ·
   malformé → 400 · sans JWT → 401.
4. **Recette des 10 catégories** de `.lovable/gotenberg-phase3-readiness-final.md` :
   PDF vectoriel, A4, texte sélectionnable/recherchable, tableaux, Recharts, QR,
   signatures, cachets, logos, pagination, annexes. Toute différence de rendu
   doit être remontée avant validation.
5. **Archivage** : PDF → Supabase Storage → `document-file` →
   `Content-Type: application/pdf` + `Content-Disposition: inline` ; ouverture
   anonyme du lien direct → lecteur PDF du navigateur (jamais HTML/page LTPC).
6. **Performance** : 1 rendu puis 4 rendus parallèles (`--chromium-max-queue-size=8`).

## 11. Ce qui reste explicitement NON fait

- Bouton **Partager** : inchangé (branchement seulement après validation réelle).
- `document-file`, templates, moteur d'impression Phase 11, render-tokens, métier :
  inchangés.
- Aucun fallback jsPDF / html2canvas / PDF rasterisé.

**STOP** — reprise dès que `pdf.ltpc.dz` résout vers le VPS.
