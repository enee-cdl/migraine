# Développement — commandes rapides

## Une fois

```bash
cd migraine
npm install
copy .env.example .env
```

Éditez `.env` : `VITE_GOOGLE_API_KEY`, `VITE_SHEET_ID`, `VITE_SHEET_RANGE`.

## Quotidien

| Commande | Effet |
|----------|--------|
| `npm run dev` | Serveur local (souvent http://localhost:5173) |
| `npm test` | Lance Vitest une fois |
| `npm run test:watch` | Tests en mode watch |
| `npm run build` | Vérif TypeScript + build production dans `dist/` |
| `npm run preview` | Sert le build localement pour vérifier avant déploiement |

## Dépannage local

- **Écran d’erreur au chargement** : lire le message (403 = partage Sheet + clé API ; 404 = ID ou nom d’onglet dans `VITE_SHEET_RANGE`).
- **Aucune crise** : vérifier que la plage inclut bien la ligne d’en-têtes (ligne 2) et les données ; que `INTENSITE MIGRAINE` est remplie pour chaque ligne utile.
