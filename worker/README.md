# Cloudflare Worker - Publication automatique SpinApp

Ce Worker reçoit le catalogue depuis `admin.html`, vérifie un secret de publication, puis met à jour automatiquement `data/apps.json` dans le dépôt GitHub `keppler999/SpinApp-1`.

## 1. URL du Worker

URL prévue :

```txt
https://spinapp.erikaekepler.workers.dev
```

Le portail admin est déjà configuré dans `scripts/publisher.js` avec cette URL.

## 2. Variables Cloudflare à configurer

Dans Cloudflare :

```txt
Workers & Pages → spinapp → Settings → Variables
```

Ajoutez ces variables non secrètes :

```txt
GITHUB_OWNER = keppler999
GITHUB_REPO = SpinApp-1
GITHUB_BRANCH = main
GITHUB_FILE_PATH = data/apps.json
ALLOWED_ORIGIN = https://keppler999.github.io
```

Si GitHub Pages donne plus tard une autre origine, remplacez `ALLOWED_ORIGIN`. Exemple avec domaine personnalisé :

```txt
ALLOWED_ORIGIN = https://spinapp.votre-domaine.com
```

Important : pour `https://keppler999.github.io/SpinApp-1/`, l'origine est seulement :

```txt
https://keppler999.github.io
```

## 3. Secrets Cloudflare à configurer

Toujours dans Cloudflare, ajoutez ces valeurs comme secrets/encrypted variables :

```txt
GITHUB_TOKEN = votre token GitHub
PUBLISH_SECRET = votre mot de passe de publication
```

Ne mettez jamais ces valeurs dans `admin.html`, `publisher.js` ou GitHub public.

## 4. Token GitHub recommandé

Créez un **Fine-grained personal access token** sur GitHub :

```txt
GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
```

Configuration recommandée :

```txt
Repository access : Only selected repositories
Repository : keppler999/SpinApp-1
Permissions :
- Contents : Read and write
- Metadata : Read-only
```

Ce token permettra uniquement au Worker de mettre à jour `data/apps.json`.

## 5. Déploiement simple depuis le dashboard Cloudflare

Méthode la plus simple :

1. Ouvrez Cloudflare.
2. Allez dans `Workers & Pages`.
3. Ouvrez ou créez le Worker `spinapp`.
4. Cliquez sur `Edit code`.
5. Copiez-collez le contenu de `worker/src/index.js`.
6. Cliquez sur `Save and deploy`.
7. Ajoutez les variables et secrets listés ci-dessus.
8. Testez l'URL :

```txt
https://spinapp.erikaekepler.workers.dev/health
```

Vous devez recevoir une réponse JSON avec `ok: true`.

## 6. Déploiement avec Wrangler, optionnel

Si vous utilisez un terminal :

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put PUBLISH_SECRET
npx wrangler deploy
```

## 7. Utilisation depuis SpinApp

Dans `admin.html` :

1. Connectez-vous.
2. Ajoutez ou modifiez les applications.
3. Cliquez sur `Publier sur GitHub`.
4. Entrez le `PUBLISH_SECRET` configuré dans Cloudflare.
5. Le Worker crée automatiquement un commit qui remplace `data/apps.json`.
6. GitHub Actions/GitHub Pages redéploie ensuite le site.

## 8. Test rapide avec cURL

Remplacez `VOTRE_SECRET` par votre `PUBLISH_SECRET` :

```bash
curl -X POST "https://spinapp.erikaekepler.workers.dev/publish" \
  -H "Content-Type: application/json" \
  -H "X-Publish-Secret: VOTRE_SECRET" \
  --data '{"message":"test publish","database":{"apps":[],"stats":{"totalApps":0,"totalDownloads":0,"lastUpdate":"2026-07-06"}}}'
```

Si tout est configuré, un commit sera créé sur GitHub.
