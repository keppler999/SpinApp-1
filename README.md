# SpinApp - Plateforme de Distribution Spirale Agence

SpinApp est une plateforme web statique, propre et responsive, conçue pour centraliser les applications développées par Spirale Agence et distribuer les APK sans dépendre d'un store tiers.

Cette version contient aussi une architecture **Cloudflare Worker** pour publier automatiquement `data/apps.json` sur GitHub depuis le portail administrateur.

## Contenu

- `index.html` : page d'accueil premium
- `all-apps.html` : catalogue avec recherche, filtres et pagination
- `app-detail.html` : fiche détaillée d'une application
- `admin.html` : portail administrateur côté navigateur
- `scripts/publisher.js` : publication automatique vers Cloudflare Worker
- `worker/src/index.js` : backend Cloudflare Worker sécurisé
- `worker/wrangler.toml` : configuration Worker pour `keppler999/SpinApp-1`
- `data/apps.json` : base des applications, vide au départ
- `assets/logo.png` : logo principal Spirale Agence généré en PNG
- `asset/logo.png` : copie du logo principal pour compatibilité avec la demande initiale
- `assets/stickers/` : stickers SVG premium, non basiques
- `.github/workflows/deploy.yml` : déploiement GitHub Pages

## Configuration prévue

```txt
GitHub owner : keppler999
GitHub repo : SpinApp-1
Branche : main
Fichier catalogue : data/apps.json
Worker URL : https://spinapp.erikaekepler.workers.dev
GitHub Pages probable : https://keppler999.github.io/SpinApp-1/
Allowed origin Worker : https://keppler999.github.io
```

## Mot de passe administrateur

Mot de passe initial : `Spirale@2026`

Le portail utilise un hash SHA-256 côté navigateur. Pour un site statique GitHub Pages, cela sert de barrière légère d'administration locale. La publication sensible passe par Cloudflare Worker afin que le token GitHub ne soit jamais exposé dans le code public.

## Ajouter des applications

1. Ouvrez `admin.html`.
2. Connectez-vous.
3. Ajoutez ou modifiez les applications.
4. Deux choix :
   - **Exporter apps.json** : télécharge le fichier, puis vous remplacez manuellement `data/apps.json` sur GitHub.
   - **Publier sur GitHub** : envoie automatiquement le catalogue vers Cloudflare Worker, qui crée le commit GitHub.

## Publication automatique avec Cloudflare Worker

Voir le guide complet ici :

```txt
worker/README.md
```

Secrets à créer dans Cloudflare :

```txt
GITHUB_TOKEN
PUBLISH_SECRET
```

Variables à créer dans Cloudflare :

```txt
GITHUB_OWNER = keppler999
GITHUB_REPO = SpinApp-1
GITHUB_BRANCH = main
GITHUB_FILE_PATH = data/apps.json
ALLOWED_ORIGIN = https://keppler999.github.io
```

## Déploiement GitHub Pages

Le workflow inclus publie automatiquement le site avec `peaceiris/actions-gh-pages` à chaque push sur `main`.

## Contact Spirale Agence

- WhatsApp : +24383009563
- Email : info.elysafly@gmail.com

© 2026 Spirale Agence - Tous droits réservés.
