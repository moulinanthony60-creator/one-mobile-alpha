# Validation ONE 0.13.7

## Résultats automatisés
- Syntaxe : 6 blocs JavaScript inline de index.html + 1 bloc de share.html valides avec node --check ; sw.js et ONE_PROFILE_WORKER.js également valides. Le script Twitch distant est une dépendance externe, non inclus dans cette validation.
- Exécution des 6 blocs de l’application avec DOM simulé : démarrage sans erreur ; 2 vidéos compte + 8 imports donnent 10 candidats et 10 résultats dans TikTok.
- Pool avec doublon, ID invalide, entrée nulle, photo explicite et durée absente : 10 vidéos exploitables attendues, 10 obtenues. Un import valide reste disponible si sa version compte est invalide.
- Simulation de 20 nouvelles sessions, avec deux scores fixés à près d’un million : les 10 vidéos passent chacune en tête dans chacun des deux cycles.
- Réaffichage et rechargement du pool dans la même session : ordre identique et absence de double consommation du tour.
- Pool vide, candidat unique et historique JSON corrompu : gestion validée.
- Mélange Pour toi avec les trois plateformes : une vidéo de chaque plateforme dans les trois premières places.
- Onglet Twitch : 100 viewers classés avant 10 viewers.
- Comparaison textuelle : ensemble des fonctions du lecteur vertical et chargement/classement Twitch inchangés par rapport à la 0.13.6 récupérée.
- Fiches chaînes : bouton et fonction fullscreen ONE absents ; fs=1 et permissions natives conservés.

## Limites
Tests de logique avec données de contrôle et DOM simulé, sans lecture réelle des embeds ni validation visuelle Android/PWA. Le stockage privé de l’utilisateur n’était pas disponible ; la cause exacte du pool observé sur son téléphone n’a donc pas été mesurée. Les défauts identifiés dans le code ont été corrigés et les scénarios de diversité ont été reproduits automatiquement.

## Provenance
Dépôt : https://github.com/moulinanthony60-creator/one-mobile-alpha
Commit de base : 0062b7f310f8e825d88551a9f9bb0a8ba58f3f75
Version du site récupéré : 0.13.6, identique au fichier du dépôt.
