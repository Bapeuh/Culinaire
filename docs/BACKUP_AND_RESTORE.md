# Sauvegarde et restauration

La page `/settings/data` exporte toutes les données dans un JSON versionné et restaure une sauvegarde après validation. La restauration complète remplace le contenu dans une transaction : une erreur annule toute l’opération. Chaque recette possède aussi un export JSON individuel et la bibliothèque permet son import.

La copie SQLite est une sauvegarde technique, désactivée par défaut. L’activer uniquement sur une installation protégée avec `ALLOW_DATABASE_DOWNLOAD=true`.

Le seed refuse une base contenant des recettes. La remise à zéro volontaire exige `FORCE_SEED_RESET=true npm run db:seed`.
