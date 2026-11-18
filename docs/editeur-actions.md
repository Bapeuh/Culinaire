# Éditeur de recettes par actions — prototype

## Accès
- `/recipes/new` : nouvel éditeur en trois colonnes (ingrédients, actions, recette générée).
- `/recipes/[slug]/atelier` : éditeur d'actions pour une recette existante.
- `/recipes/[slug]/edit` : ancien éditeur, conservé pour les recettes historiques.

## Règles implémentées
- Ajout d'un ingrédient depuis n'importe quel moment de la création.
- Chaque ingrédient est représenté par un lot identifié, avec quantité/unité.
- Une action de découpe transforme plusieurs entrées en **résultats séparés** et réutilisables indépendamment.
- Les actions de mélange/cuisson créent un résultat commun en conservant les origines des ingrédients.
- Une quantité ne peut pas être utilisée deux fois ; les disponibilités sont recalculées à chaque modification.
- Une préparation produite dans une étape peut devenir une entrée d'une étape ultérieure.
- Destinations : plat servi / élément volontairement retiré.
- Vérification : ingrédients inutilisés, préparations restantes, ingrédients absents des plats servis, résultats cassés.
- Génération automatique de descriptions d'étapes à partir des actions.
- Persistance via `Recipe.graphJson`, projection également dans `RecipeIngredient` et `RecipeStep` pour garder les vues, plannings et courses existants fonctionnels.
- Export et sauvegarde/restauration du graphe ; anciens exports acceptés.

## Avant validation

1. **Sauvegarder la base SQLite** avant migration.
2. Lancer `npm install`, `npx prisma generate`, `npx prisma migrate deploy`, `npm test`, `npm run lint`, `npm run build`.
3. Tester : découper oignon et tomate ; n'utiliser que l'oignon ; reprendre la tomate plus tard ; ajouter de l'ail en cours de route ; vérifier les disponibilités ; marquer la préparation finale comme servie ; enregistrer et rouvrir.
4. Tester la sauvegarde JSON, la restauration et l'import individuel d'une recette à plusieurs actions.
5. Tester l'édition d'une ancienne recette **sur une copie** : la conversion vers l'éditeur d'actions n'est pas automatique. Sauvegarder un graphe sur une ancienne recette remplace ses étapes historiques.

## Limites à améliorer
- Prototype non validé en conditions réelles : build, lint et tests non exécutés dans l'environnement de création.
- Les actions complexes de cuisson représentent leurs rendements comme une « préparation » unitaire et ne modélisent pas encore les pertes physiques de masse.
- Le texte généré constitue une première version grammaticale, à affiner.
- Le mode « ingrédients facultatifs » conserve le drapeau mais ne le traite pas encore comme une exception à la règle de traçabilité.
- Les sorties sont marquées intégralement servies/retirées dans l'interface (le moteur sait suivre une quantité partielle).
- L'éditeur a une liste d'actions, pas encore de diagramme interactif de type drag-and-drop.
- La conversion des anciennes recettes exige encore une reconstruction manuelle des actions.
