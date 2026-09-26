# ONE 0.14.117 — passe visuelle

## Statut

Version frontend complète, modifiée dans le vrai projet ONE et non publiée. Cette passe est livrée pour validation visuelle par Anthony ; elle n’est pas déclarée identique pixel par pixel à la planche.

Les captures sont des captures du frontend réel exécuté localement, avec des comptes et salons de test. Les états des trois jeux proviennent du Worker existant exécuté localement avec une base de test. Les silhouettes sont les avatars réellement affichés lorsque ces comptes n’ont ni photo ni caméra. Aucune photo de maquette n’a été utilisée pour faire croire à un flux caméra.

## Changements

- **Bluff** : sièges adverses agrandis et répartis autour de la table, surface violette, main au premier plan, centre rapproché, header compact. Les deux boutons sont dans la zone visible, même désactivés lorsque ce n’est pas le tour du joueur. Les cartes restent les boutons existants, avec leurs vrais états.
- **Poker** : table moins haute, commandes rapprochées, champs et présélections compactés. Boutons testés dans des viewports de 360/390/430 px de large et 640/740/844 px de haut.
- **Douze** : grille locale 3×4 au premier plan, grilles adverses lisibles, pioche/défausse centrées. La carte piochée utilise la place de la pioche au lieu de chevaucher les commandes. Les emplacements et les espaces réservés restent stables entre préparation, pioche et changement de tour.
- **Salon** : cartes membres compactes, choix « Que fait-on ? » immédiatement accessible, discussion repliée jusqu’à son ouverture. Création privé/public et vignettes d’ambiance. Le choix d’ambiance persiste localement, par salon, sur l’appareil ; il n’est pas synchronisé au groupe.
- **Liste des salons** : accès depuis un salon actif, recherche existante conservée, cartes illustrées, retour au salon courant. Les salons privés ne sont pas exposés dans la liste publique. Les capacités et restrictions de jonction restent celles du serveur.
- **Party** : catalogue remonté sous le header, ordre Bluff/Poker/Douze comme sur la cible, cartes et bordures harmonisées. Tous les jeux réels sont conservés.
- **Menu** : panneau glass compact superposé, table visible derrière, sections PARTIE/SOCIAL/JEU, interrupteurs reflétant l’état média existant, actions de sortie séparées et fermeture explicite.
- **Stabilité** : le message de confirmation n’ajoute plus une ligne au-dessus de la table. La hauteur et le défilement sont préservés pendant la reconstruction du rendu ; l’espace des indications de préparation Douze est réservé.
- Version et cache frontend passés en 0.14.117. Le catalogue TikTok et ses protections de la version 116 sont conservés.

## Vérification

Les tests dans `tests-visuels.json` passent. Ils exécutent les actions sur le Worker local inchangé : Bluff jouer/accuser, Poker relancer/suivre, Douze révéler/pioche/remplacer/défausse. Les rectangles de la table et des commandes sont mesurés à chaque image pendant ces actions : déplacement maximal observé **0 px** dans ces scénarios. Ce résultat ne prétend pas couvrir tous les appareils ou tous les cas réseau.

Les dispositions Douze 2 à 6 sièges ont été vérifiées sans chevauchement des grilles. **Les scénarios 5–6 sièges sont des tests de présentation seulement : le moteur actuel autorise 2–4 participants pour Douze.** Aucun nombre de joueurs serveur n’a été changé.

Vérification manuelle supplémentaire : création d’un salon local, choix d’ambiance violette, application effective, conservation après rechargement ; consultation des salons publics depuis un salon actif ; captures des écrans demandés.

`build-validation.json` contient la vérification de syntaxe des scripts et des ressources du cache. `backend-inchange.json` confirme que les 11 fichiers serveur/SQL audités sont inchangés. Aucun Worker n’a été déployé ni modifié.

## Caméras : test restant sur tes appareils

Le chemin existant est conservé : le flux reçu par `RTCPeerConnection.ontrack` alimente la vidéo, puis la bulle est rattachée au siège ayant le même identifiant de compte. Les sièges et leurs vidéos sont cadrés avec `object-fit: cover`.

Le test avec deux comptes et deux caméras physiques n’a pas été réalisé ici : Anthony a indiqué qu’il le fera sur ses appareils. Vérifier dans les deux sens : caméra ON, image animée dans le bon siège, caméra OFF, puis transition salon → jeu → salon sans disparition ni changement de propriétaire du flux.

## Validation visuelle restante

La planche est la référence, mais les captures livrées doivent encore être validées par Anthony. Les décors et illustrations disponibles dans le projet ont été réutilisés et la composition a été refaite. Les photos de participants, valeurs de cartes, timers, mises et effectifs sont déterminés par les vrais comptes et le jeu : ils ne sont pas remplacés par les valeurs de démonstration de la maquette.

Les captures de la liste publique contiennent deux salons de test locaux, pas des données de production. La feuille `captures.html` rassemble uniquement des captures ; ce n’est pas un nouvel écran alternatif de l’application.

## Installation / publication

1. Décompresser l’archive.
2. Copier le **contenu de `site/`** à la racine du dépôt frontend `one-mobile-alpha`, en conservant les fichiers serveur présents dans le dépôt.
3. Ne pas copier le dossier `site` comme sous-dossier du site. Aucun fichier Worker/SQL n’est fourni dans ce dossier.
4. Publier via le déploiement GitHub Pages existant.
5. Après le déploiement réussi, recharger ONE et vérifier la version **0.14.117**. Fermer et rouvrir la PWA si le cache ancien est encore utilisé. Ne pas effacer les données du navigateur.
6. Tester sur les deux appareils : boutons Bluff, actions Poker, enchaînements Douze, caméras, retour au salon et navigation persistante.

La version en ligne n’a pas été remplacée dans cette passe. Le ZIP 0.14.116 ne contient pas ces corrections ; utiliser le ZIP **0.14.117**.

## Fichiers

- `site/` : projet frontend complet.
- `captures/01-salon.png` à `06-menu.png` : les six captures demandées.
- `captures/07-salons-publics.png`, `08-entree-salons.png`, `09-creation-salon.png` : autres écrans des salons.
- `tests-visuels.json`, `build-validation.json`, `backend-inchange.json` : vérifications.
- `fichiers-modifies-depuis-116.json` : différences depuis la livraison 116.
- `CONTRAINTE-CATALOGUE-PARTAGE.md` : contrainte backend du partage TikTok, inchangée par cette passe.
