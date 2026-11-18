# Culinaire

Application personnelle, mobile-first, pour gérer des recettes structurées, planifier la semaine et consolider automatiquement la liste de courses.

## Démarrage local

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Ouvrir <http://localhost:3000>. Le seed crée 10 recettes et 14 repas sur la semaine courante.

## Qualité

```bash
npm test
npm run lint
npm run build
```

## Docker

```bash
docker compose up --build
```

Le fichier SQLite est conservé dans le volume `culinaire-data`. Au premier lancement, exécuter le seed avec `docker compose exec culinaire npm run db:seed`.

## Structure

- `src/app` : routes et mutations serveur
- `src/components` : composants interactifs
- `src/domain` : logique métier pure et tests
- `src/services` : orchestration des données
- `prisma` : modèle et données de démonstration
- `docs` : architecture, modèle et périmètre

La V1 inclut recettes CRUD, portions dynamiques, modes classique/compact/cuisine/diagramme, planning, courses consolidées avec provenance, checklist persistante, partage, impression, QR code et base PWA.

## Sauvegarder les données

La page `/settings/data` permet d’exporter et restaurer toutes les données en JSON. Une recette peut aussi être exportée depuis sa page puis importée dans la bibliothèque. La restauration complète est transactionnelle et remplace la base seulement après confirmation.

La copie brute SQLite est désactivée par défaut. Définir `ALLOW_DATABASE_DOWNLOAD=true` uniquement sur une installation protégée. Le seed refuse désormais d’écraser une base non vide ; une remise à zéro volontaire exige `FORCE_SEED_RESET=true npm run db:seed`.
