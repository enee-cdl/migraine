# Déploiement gratuit (GitHub + Vercel)

## 1. GitHub

```bash
git init
git add .
git commit -m "Initial import: migraine dashboard"
```

Créez un dépôt vide sur GitHub, puis :

```bash
git remote add origin https://github.com/VOTRE_USER/VOTRE_REPO.git
git branch -M main
git push -u origin main
```

Ne commitez **pas** `.env` (déjà dans `.gitignore`).

## 2. Vercel

1. Connectez-vous sur [vercel.com](https://vercel.com) avec GitHub.
2. **Add New Project** → importez le dépôt.
3. Framework : **Vite** (détecté automatiquement en général).
4. Build : `npm run build` — Output : `dist`.
5. **Environment Variables** (Production + Preview) :
   - `VITE_GOOGLE_API_KEY`
   - `VITE_SHEET_ID`
   - `VITE_SHEET_RANGE`
6. Déployez.

## 3. Clé API Google

Dans Google Cloud Console → votre clé → **Restrictions des applications** → **Référents HTTP** : ajoutez

- `https://votre-projet.vercel.app/*`
- `http://localhost:5173/*` (pour le dev local)

Puis enregistrez et attendez quelques minutes si besoin.

## 4. Vérification

Ouvrez l’URL Vercel : le dashboard doit se charger. En cas de **403**, vérifiez le partage du tableur et les restrictions de clé.
