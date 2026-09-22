# Consignes pour les agents

Préserver trois distinctions : `Ingredient != Product`, `Recipe != Preparation`, et `Recipe -> RecipeComponent -> RecipeStep`. Les recettes référencent toujours un ingrédient canonique. Ne jamais convertir masse et volume sans densité.

L’interface est dans `src/app` et `src/components`; le métier pur dans `src/domain`; Prisma et les utilitaires dans `src/lib`; l’orchestration dans `src/services`. Les calculs de portions, unités et courses doivent rester purs et testés. Toute fonction visible doit fonctionner : aucun bouton factice.
