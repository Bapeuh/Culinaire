# Consignes pour les agents

Préserver trois distinctions : `Ingredient != Product`, `Recipe != Preparation`, et `Recipe -> RecipeComponent -> RecipeStep`. Les recettes référencent toujours un ingrédient canonique. Ne jamais convertir masse et volume sans densité.

L’interface est dans `src/app` et `src/components`; le métier pur dans `src/domain`; Prisma et les utilitaires dans `src/lib`; l’orchestration dans `src/services`. Les calculs de portions, unités et courses doivent rester purs et testés. Toute fonction visible doit fonctionner : aucun bouton factice.

Le format de sauvegarde est versionné dans `src/domain/backup`. Toute restauration doit être validée puis exécutée dans une transaction. Ne jamais rendre le téléchargement SQLite public par défaut et ne jamais contourner la protection du seed.
