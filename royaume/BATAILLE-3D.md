# Valdoria : essai de bataille 3D

Après fusion et déploiement GitHub Pages :

**https://one-officiel.fr/royaume/bataille-3d.html**

L’essai est aussi accessible dans Valdoria par **Réglages → Tester la bataille 3D**, dès le niveau 1, et dans le menu des combats à partir du niveau 2. La navigation depuis le village sauvegarde normalement la partie avant d’ouvrir l’entraînement.

## Jouer

- Entrer sur le terrain, choisir une troupe, puis toucher la bordure bleue pour la déployer. Le chronomètre démarre au premier ordre.
- 8 gardiens, 6 archers et 3 mages sont fournis. Deux frappes magiques peuvent viser le terrain ennemi.
- Glisser pour déplacer la caméra, pincer pour zoomer. Les boutons +, − et recentrage sont aussi disponibles.
- « Déployer au sud » permet de jouer sans viser le terrain. Au clavier : 1, 2, 3 pour les troupes, M pour la magie, Échap pour la pause.
- La bataille se met en pause quand la page est masquée. Elle peut être recommencée depuis la pause ou le résultat.

## Périmètre

Cette première version est un entraînement solo contre des défenses automatiques. L’armée et la bataille sont créées dans un état privé en mémoire. Aucun accès aux sauvegardes, au compte ONE, au réseau ou au stockage depuis le moteur de l’essai. Aucune récompense de cet entraînement ne rejoint le village. Recharger la page recommence l’essai.

Le moteur de campagne existant (`expeditions.mjs`) est réutilisé. Le terrain d’entraînement dispose maintenant de 11 bâtiments et de remparts reliés, avec quatre passages. Les positions et les forces de ce fort sont définies uniquement dans `battle3d-layout.mjs`. Des dimensions de collision facultatives permettent aux troupes de contourner les modèles 3D. Sans ces dimensions, les règles des campagnes existantes restent identiques ; les résultats des 12 missions ont été comparés à ceux du moteur précédent.

Le rendu utilise la copie de Three.js déjà présente dans le dépôt. Il réutilise les architectures détaillées de Valdoria, avec pierre claire, toits orange et bannières bleues/dorées, ainsi qu’une nouvelle citadelle à tours rondes. Les personnages ont des visages, des membres articulés, des armures et des équipements. Les cartes de troupes réutilisent les portraits de la caserne.

Les géométries sont regroupées par bâtiment et les personnages utilisent des formes instanciées. Le sol et les chemins sont dessinés en textures procédurales. Les ombres du village sont recalculées seulement quand nécessaire. La résolution est plafonnée à 1,6 fois la taille CSS ; le bouton **Éco** désactive les ombres et réduit la résolution. Le rendu s’arrête pendant la pause et après l’animation du résultat.

## Vérifications

Depuis la racine du dépôt, avec Node.js récent :

```sh
node --test royaume/tests/battle3d.test.mjs
```

12 tests couvrent l’isolation, les positions invalides (y compris sur un rempart), les réserves, les deux sorts, la pause, les retards de simulation, la victoire, la limite de temps, le redémarrage, l’absence de persistance/réseau dans le moteur de l’essai, les gestes tactiles, le contournement des bâtiments, les géométries et articulations, le budget de triangles et la conservation des résultats des 12 campagnes existantes. Les modules ont également été vérifiés par `node --check`.

**Validation encore nécessaire sur appareil réel :** rendu WebGL, lisibilité des troupes, précision du toucher, zoom et fluidité en portrait/paysage. Une projection des modèles a été inspectée hors navigateur pour vérifier leurs formes et leur disposition. Aucun navigateur de validation compatible n’était disponible dans l’environnement de préparation ; cette inspection et les tests Node ne remplacent pas le contrôle WebGL sur appareil.

Sur téléphone, essayer une bataille complète, mettre en pause, changer d’application, reprendre, zoomer et glisser sans déployer, puis rejouer. Comparer également les modes détaillé et Éco. Vérifier ensuite le retour au village. Si WebGL ne démarre pas ou perd son contexte, l’essai affiche une explication et un lien de retour.
