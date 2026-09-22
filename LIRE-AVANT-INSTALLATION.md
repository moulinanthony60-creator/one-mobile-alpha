# ONE 0.14.109 — Lobby, menu et trois tables

## Installation
Paquet frontend différentiel à appliquer sur **0.14.108**. Décompresser puis copier les fichiers à la racine du site en conservant le dossier `ui`. Ce ZIP ne remplace pas un site complet et ne doit pas être utilisé seul. Aucun déploiement effectué.

## Changements
- Lobby premium : illustration du jeu, membres/acceptants, minimum, capacité, invitation, lancement par l’hôte et annulation.
- Rejoindre = prêt ; seuls les acceptants entrent dans le jeu. Un troisième membre non prêt reste dans ONE.
- Mode immersif interne après confirmation serveur. Plein écran natif facultatif, avec repli si le navigateur le refuse. Réduire et revenir au salon ne quittent pas le salon.
- Menu commun : plein écran, réduction, salon, micro/caméra/vocal/chat existants, règles, préférences réellement disponibles et confirmations de sortie.
- Bluff : table en bois, avatars/caméras, cartes en éventail, cartes adverses cachées, actions existantes, révélation serveur et deux vidéos préenregistrées de 3,2 secondes (clic/tir). Les portraits des éliminés sont figés en mémoire uniquement ; aucun envoi ni sauvegarde du visage.
- Poker : table verte, sièges et caméras, cartes privées/publiques, pot et jetons décoratifs, relance liée au montant existant, transitions de cartes/mises. Les blindes restent dans le message fourni par le moteur ; aucun badge de position SB/BB inventé.
- Douze : grille personnelle et grilles adverses, cartes colorées, pioche privée, remplacement/révélation, retrait animé des colonnes, résultats et nouvelle manche fournis par le serveur.

## Validation locale
73 contrôles fonctionnels navigateur : lobby et navigation (20), Douze (31), Poker/Bluff (22). Tests effectués contre le Worker original avec SQLite local et comptes de test. Scénarios de fin de manche Douze préparés dans la base de test puis exécutés par le moteur inchangé. Syntaxe des modules et des 52 scripts intégrés vérifiée ; ressources du cache présentes. Largeurs 360/390/430 contrôlées pour Douze et Bluff, aperçu Poker à 390.

## Limites explicites
- Pas encore testé sur les appareils physiques de l’utilisateur, ni avec leurs caméras/micros/liaisons réseau réelles. Le plein écran natif et les permissions audio/vidéo dépendent du navigateur ; le mode immersif reste disponible.
- Douze conserve le moteur actuel : 4 colonnes de 3 cartes et maximum 4 joueurs. La disposition à 6 a été testée comme fixture visuelle uniquement ; elle n’active pas 6 joueurs côté serveur. Aucun faux compte à rebours.
- Les vidéos Bluff sont un montage préenregistré d’éléments graphiques avec mouvement, recul et fumée. Elles ne sont pas un tournage ni une reproduction exacte du personnage de la référence. Si la lecture échoue ou si les animations sont réduites, le résultat serveur reste affiché sans animation.
- Les décors reprennent la direction artistique des maquettes ; avatars réels ou avatars ONE existants, sans faux participants ni faux flux caméra.
- Serveur, Workers, moteurs, mises et portefeuille non modifiés. Empreinte SHA256 Worker : 0E9BBA5F9E3654159F24E8E31D1105AB757E80A29216951691FC54FED03B5393.

## Assets
Génération d’images : outil imagegen, mode génération. Décor portrait lounge premium table de feutre vert, lumière ambre/violette, sans joueurs/cartes/texte ; décor portrait table ronde bois sombre, même ambiance ; accessoire revolver stylisé noir/or tenu par un gant, sans victime/sang. Images optimisées WebP, sources originales conservées. Vidéos WebM locales créées à partir de l’accessoire (pas de caméra utilisateur enregistrée).

## Fichiers livrés
- index.html
- sw.js
- ui/bluff-cinema-109.webp
- ui/bluff-click-109.webm
- ui/bluff-lounge-109.webp
- ui/bluff-shot-109.webm
- ui/douze-lounge-109.webp
- ui/game-lounge-109.webp
- ui/game-shell.css
- ui/game-shell.js
- ui/game-tables.css
- ui/game-tables.js
- ui/party-bluff.js
- ui/party-douze.css
- ui/party-douze.js
- ui/party-game.js
- ui/party.js
- ui/social-core.js
