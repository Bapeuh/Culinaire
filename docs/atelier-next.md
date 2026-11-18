# Culinaire — plan de consolidation après la V1

## Base de la branche

Cette branche part de `codex/data-backup-export` et récupère donc les évolutions de sauvegarde/import-export (PR #2). La PR de cette branche doit être fusionnée **après** la PR #2 ou retargetée sur `main` une fois celle-ci intégrée.

## Modules codés dans l'atelier

- Recettes modulaires par composant, variantes « minimum / intermédiaire / maison », recalcul des quantités et des courses selon les portions.
- Préférences par ingrédient (aime/neutre/évite), export JSON.
- Saisonnalité indicative des ingrédients frais en France.
- Extraction déterministe d'un brouillon depuis un texte structuré, conservation locale et export JSON.
- Valeurs nutritionnelles saisies manuellement, avec provenance et export.
- Tests unitaires du cœur de calcul.

Route : `/atelier`.

## Limites explicites du prototype

L'atelier est une première interface de validation et **n'est pas encore raccordé** au moteur de planification et de courses en production.
Les données expérimentales sont stockées dans `localStorage`, par navigateur : elles ne sont ni multi-utilisateur ni comprises dans les sauvegardes serveur existantes.
Les variantes ne sont pas encore des recettes/sous-recettes persistées dans Prisma.
L'import texte ne comprend pas les textes libres complexes; importer un scan/photo nécessite un service de reconnaissance multimodal autorisé et configuré.
Les préférences sont par appareil, pas par profil. La saisonnalité est indicative; les valeurs nutritionnelles ne sont pas calculées automatiquement et ne doivent pas être présentées comme estimées sans source.
Il faut aussi une vérification de lint, build et navigation en environnement d'exécution avant de fusionner.

## Travaux restant à réaliser avant une V2 stable

1. Persistance Prisma, migrations, sauvegarde/restauration des nouvelles données, profils utilisateur et authentification éventuelle.
2. Sous-recettes réutilisables avec liens, détection de cycles et unités convertibles.
3. Intégration des niveaux de fabrication dans le planning, la liste de courses et les temps/étapes réellement exécutés.
4. Import de recettes assisté par IA depuis photo/texte, validation humaine, sécurité des fichiers, protection des données et gestion des coûts.
5. Personnalisation multi-profils, interface de swipe recettes et ingrédients, suggestions de menus.
6. Base de données nutritionnelles sourcée et calcul par ingrédient/portion avec indication de fiabilité.
7. Stocks, dates de péremption, déduction des courses, historique des préparations.
8. Exports du planning et des courses (PDF, partages mobiles, QR codes pour accès aux recettes).
9. Tests de bout en bout, accessibilité, conformité responsive et couverture des règles métier.
