# Déploiement du moteur PDF Gotenberg (VPS séparé)

Environnement **hors Lovable Cloud et hors Supabase Edge Functions**, conformément à la Phase 4.

## 1. Pré-requis VPS

- 2 vCPU / 4 Go RAM minimum (Chromium est gourmand), 20 Go de disque.
- Docker + Docker Compose v2.
- Un sous-domaine dédié pointant sur l'IP du VPS, ex. `pdf.ltpc.dz` (enregistrement A).
- Ports 80 et 443 ouverts **uniquement**. Le port 3000 de Gotenberg n'est jamais publié.

## 2. Installation

```bash
git clone <ce dépôt> && cd infra/gotenberg
cp .env.example .env
openssl rand -hex 32        # → coller la valeur dans GOTENBERG_SHARED_SECRET
nano .env                   # renseigner GOTENBERG_DOMAIN et le secret
docker compose up -d
docker compose ps           # les deux conteneurs doivent être "healthy"
```

## 3. Pare-feu recommandé

```bash
ufw default deny incoming
ufw allow 22/tcp
ufw allow 80,443/tcp
ufw enable
```

Si votre hébergeur fournit des IP sortantes fixes pour les Edge Functions, restreindre
encore : `ufw allow from <IP> to any port 443`. Sinon, le secret d'appel + la liste
blanche d'URL de Chromium constituent le contrôle d'accès.

## 4. Vérifications de sécurité

```bash
# Sans secret → 404 (le service reste invisible)
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://pdf.ltpc.dz/forms/chromium/convert/url

# Endpoints Gotenberg non routés → 404
curl -s -o /dev/null -w '%{http_code}\n' https://pdf.ltpc.dz/forms/libreoffice/convert
curl -s -o /dev/null -w '%{http_code}\n' https://pdf.ltpc.dz/health

# Port interne inaccessible depuis l'extérieur
nc -z -w3 pdf.ltpc.dz 3000 ; echo $?     # doit échouer
```

## 5. Côté LTPC

Enregistrer deux secrets backend (Lovable Cloud) :

| Secret | Valeur |
|---|---|
| `GOTENBERG_URL` | `https://pdf.ltpc.dz` |
| `GOTENBERG_SHARED_SECRET` | la valeur générée à l'étape 2 |

La fonction `pdf-render` les utilise ; **aucun identifiant Supabase, aucune session
utilisateur, aucune donnée métier n'est transmis à Gotenberg** — uniquement une URL
`/__render/<token>` à usage unique valable 2 minutes.

## 6. Garanties d'étanchéité

- Conteneur Gotenberg en `read_only`, sans volume, `/tmp` en tmpfs → **aucune persistance**.
- `--chromium-allow-list` limite Chromium aux seules URL `https://ltpc.lovable.app/__render/...`.
- `--log-level=error` : aucune URL ni donnée métier journalisée.
- Aucun accès réseau vers la base : Gotenberg ne connaît ni l'URL ni les clés Supabase.

## 7. Exploitation

```bash
docker compose logs -f --tail=50     # erreurs uniquement
docker compose pull && docker compose up -d   # mise à jour
```
