# Valdoria : bataille, vues Village et 3D

Après fusion et déploiement GitHub Pages :

**https://one-officiel.fr/royaume/bataille-3d.html**

L’essai est aussi accessible dans Valdoria par **Réglages → Tester la bataille 3D**, dès le niveau 1, et dans le menu des combats à partir du niveau 2. La navigation depuis le village sauvegarde normalement la partie avant d’ouvrir l’entraînement.

## Jouer

- Entrer sur le terrain, choisir une troupe, puis toucher la bordure bleue pour la déployer. Le chronomètre démarre au premier ordre.
- 8 gardiens, 6 archers et 3 mages sont fournis. Deux frappes magiques peuvent viser le terrain ennemi.
- La vue **Village** est sélectionnée au démarrage. Les boutons **Village / 3D** changent le rendu de la même bataille, sans dépenser de troupes ni réinitialiser le chronomètre.
- Glisser pour déplacer la caméra, pincer pour zoomer. Les boutons +, − et recentrage sont aussi disponibles.
- « Déployer au sud » permet de jouer sans viser le terrain. Au clavier : 1, 2, 3 pour les troupes, M pour la magie, Échap pour la pause.
- La bataille se met en pause quand la page est masquée. Elle peut être recommencée depuis la pause ou le résultat.

## Périmètre

Cette première version est un entraînement solo contre des défenses automatiques. L’armée et la bataille sont créées dans un état privé en mémoire. Aucun accès aux sauvegardes, au compte ONE, au réseau ou au stockage depuis le moteur de l’essai. Aucune récompense de cet entraînement ne rejoint le village. Recharger la page recommence l’essai.

Le moteur de campagne existant (`expeditions.mjs`) est réutilisé. Le terrain d’entraînement dispose maintenant de 11 bâtiments et de remparts reliés, avec quatre passages. Les positions et les forces de ce fort sont définies uniquement dans `battle3d-layout.mjs`. Des dimensions de collision facultatives permettent aux troupes de contourner les modèles 3D. Sans ces dimensions, les règles des campagnes existantes restent identiques ; les résultats des 12 missions ont été comparés à ceux du moteur précédent.

La vue **Village** utilise maintenant le **Canvas 2D natif**, avec les illustrations et les personnages animés déjà utilisés par Valdoria. Son démarrage ne charge ni Three.js ni la scène WebGL. Le château, les maisons, les bâtiments, les arbres et les petits décors proviennent des atlas `v27-*` existants ; les remparts utilisent `wall-art.mjs`. Les unités sont dessinées avec les articulations de `paintCartoonActor`. Le décor extérieur est mis en cache et redessiné uniquement lorsque la caméra, la résolution ou les illustrations changent.

Le bouton **3D** charge séparément Three.js et les modèles volumétriques. Un module manquant, un délai de chargement supérieur à 10 secondes, une erreur de création ou de rendu, ou une perte de contexte WebGL ramène automatiquement à la vue Village. La même bataille continue : armée, dégâts, sorts et chronomètre ne sont pas réinitialisés. La vue 3D fautive est désactivée jusqu’au rechargement de la page.

Cette séparation corrige la dépendance du mode Village envers le démarrage WebGL, qui pouvait bloquer tout l’écran. La cause exacte du signalement sur le téléphone n’a pas pu être confirmée : l’ancien écran masquait l’exception. Les fichiers de la version déployée ont été vérifiés en HTTP 200, avec les bons types MIME et des contenus identiques à ceux du dépôt. Le nouvel écran d’erreur affiche le détail si le chargement principal échoue encore.

La vue Village charge seulement cinq atlas existants (environ 1,15 Mo transférés avant cache). Si leurs images échouent ou dépassent 12 secondes de chargement, un terrain simplifié reste jouable et le dialogue explique comment réessayer. L’essai n’importe pas la disposition personnelle du joueur : le fort reste un adversaire prédéfini.

La résolution reste plafonnée à 1,6 fois la taille CSS ; **Éco** la réduit et désactive les ombres en vue 3D. Le rendu s’arrête pendant la pause et après l’animation du résultat. Aucun changement du moteur de combat ou des sauvegardes du village.

## Vérifications

Depuis la racine du dépôt, avec Node.js récent :

```sh
node --test royaume/tests/battle3d.test.mjs royaume/tests/battle3d-art.test.mjs royaume/tests/battle-startup.test.mjs
```

19 tests couvrent l’isolation, les positions invalides (y compris sur un rempart), les réserves, les deux sorts, la pause, les retards de simulation, la victoire, la limite de temps, le redémarrage, l’absence de persistance/réseau dans le moteur de l’essai, les gestes tactiles, le contournement des bâtiments, les géométries et articulations, le budget de triangles et la conservation des résultats des 12 campagnes existantes. Les nouveaux contrôles couvrent le chargement, les erreurs, le délai maximum et l’annulation des images, la couverture de tous les bâtiments par les atlas originaux et l’alignement isométrique des fondations. Les nouveaux tests de démarrage couvrent l’absence de dépendance statique à WebGL, les erreurs d’import/création/rendu, les délais, la perte de contexte, la conservation du combat, la sortie pendant un chargement et les coordonnées tactiles après zoom/déplacement. Les modules ont également été vérifiés par `node --check`.

**Validation encore nécessaire sur téléphone :** rendu dans le navigateur, gestes tactiles et fluidité. Le vrai rendu Canvas a été exécuté hors navigateur avec les atlas réels, 17 unités animées, le déplacement, le zoom, le mode Éco, le redémarrage et la libération des ressources. Les vues initiale et en mouvement ont été inspectées. Aucun navigateur de validation compatible n’était disponible ; ces contrôles ne remplacent pas un essai sur appareil.

Sur téléphone, ouvrir la bataille avec `?v=5`, entrer en vue Village et jouer. Comparer ensuite avec **3D** : si cette option échoue, le jeu doit rester en vue Village avec le même combat. Tester pause, reprise, glisser sans déployer, pincer, rejouer et retour au village.

## Ajustement de l’écran mobile

Le terrain est positionné dans son conteneur pour que la taille interne du canvas n’agrandisse pas la mise en page. La hauteur du jeu suit la zone visible du navigateur, y compris quand les barres Android changent de taille. Les commandes et la magie gardent leur place en bas ; une disposition compacte s’active sur les écrans courts.

Après la dernière troupe d’un type, le prochain type disponible est sélectionné. Quand toute l’armée est déployée, les touches sur le terrain ne déclenchent plus l’erreur de réserve vide ; déplacement et zoom restent disponibles. La magie doit toujours être choisie explicitement. Sans sort restant, l’aide n’invite plus à l’utiliser.
