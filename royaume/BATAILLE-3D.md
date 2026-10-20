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

Le rendu utilise la copie de Three.js déjà présente dans le dépôt. La vue **Village** est une vue isométrique en **2,5D** : les illustrations originales de Valdoria sont placées dans la scène, tandis que les troupes articulées et les effets restent en 3D. Le château, les maisons, la mine, la forge, la caserne, le moulin, la tour, le canon, les arbres et les petits décors proviennent directement des atlas `v27-*` existants. Les murs utilisent le même peintre de remparts reliés que le village (`wall-art.mjs`). Il ne s’agit pas d’une importation de la disposition personnelle du joueur : le fort d’entraînement reste un adversaire prédéfini.

La vue **3D** conserve les modèles volumétriques, les ombres et le moulin animé de la version précédente. Les cartes de troupes conservent les portraits de la caserne. Les bâtiments détruits laissent maintenant des débris irréguliers, au lieu de cercles de pierres.

La vue Village charge seulement cinq atlas existants (environ 1,15 Mo transférés avant cache) et regroupe les illustrations en instances. Les textures découpées occupent environ 15 Mo avec leurs mipmaps, pour 25 groupes et 434 instances au total. Le terrain retrouve le vert du village ; les illustrations gardent leurs couleurs originales. Les arbres restent hors de la zone de déploiement. Les textures et géométries sont libérées en quittant la page. Si les images échouent ou dépassent 12 secondes de chargement, la vue 3D reste jouable et le dialogue explique comment réessayer.

La résolution reste plafonnée à 1,6 fois la taille CSS ; **Éco** la réduit et désactive les ombres en vue 3D. Le rendu s’arrête pendant la pause et après l’animation du résultat. Les commandes, la simulation et les sauvegardes du village ne sont pas modifiées par le changement de vue.

## Vérifications

Depuis la racine du dépôt, avec Node.js récent :

```sh
node --test royaume/tests/battle3d.test.mjs royaume/tests/battle3d-art.test.mjs
```

14 tests couvrent l’isolation, les positions invalides (y compris sur un rempart), les réserves, les deux sorts, la pause, les retards de simulation, la victoire, la limite de temps, le redémarrage, l’absence de persistance/réseau dans le moteur de l’essai, les gestes tactiles, le contournement des bâtiments, les géométries et articulations, le budget de triangles et la conservation des résultats des 12 campagnes existantes. Les nouveaux contrôles couvrent le chargement, les erreurs, le délai maximum et l’annulation des images, la couverture de tous les bâtiments par les atlas originaux et l’alignement isométrique des fondations. Les modules ont également été vérifiés par `node --check`.

**Validation encore nécessaire sur appareil réel :** rendu WebGL, lisibilité des troupes, précision du toucher, zoom et fluidité en portrait/paysage. Une projection des illustrations réellement chargées a été inspectée hors navigateur pour vérifier les découpes et leur disposition. Le chargement complet des atlas, les matrices, la destruction, le redémarrage et la libération de la couche illustrée ont également été exercés avec un canvas hors navigateur. Aucun navigateur de validation compatible n’était disponible dans l’environnement de préparation ; cette inspection et les tests Node ne remplacent pas le contrôle WebGL sur appareil.

Sur téléphone, essayer une bataille complète, mettre en pause, changer d’application, reprendre, zoomer et glisser sans déployer, puis rejouer. Comparer également **Village / 3D** avant et pendant le combat, puis les modes détaillé et Éco. Vérifier que les barres de vie restent lisibles, que les personnages passent correctement devant et derrière les bâtiments et que changer de vue ne modifie pas la bataille. Vérifier ensuite le retour au village. Si WebGL ne démarre pas ou perd son contexte, l’essai affiche une explication et un lien de retour.
