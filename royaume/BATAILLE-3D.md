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

Le moteur de campagne existant (`expeditions.mjs`) est réutilisé sans modification. La disposition du fort est celle de la mission 2. Ses points de vie sont multipliés par 3 et ses dégâts par 2,5 dans la copie d’entraînement uniquement, pour laisser le temps de tester les trois rôles.

Le rendu utilise la copie de Three.js déjà présente dans le dépôt, avec des modèles procéduraux originaux : village, remparts, forêt, soldats, projectiles, magie et effondrements. Les formes sont regroupées avec `InstancedMesh`, sans textures supplémentaires ni ombres calculées. La résolution est plafonnée à 1,5 fois la taille CSS. Le rendu s’arrête pendant la pause et après l’animation du résultat.

## Vérifications

Depuis la racine du dépôt, avec Node.js récent :

```sh
node --test royaume/tests/battle3d.test.mjs
```

10 tests couvrent l’isolation, les positions invalides, les réserves, les deux sorts, la pause, les retards de simulation, la victoire, la limite de temps, le redémarrage, l’absence de persistance/réseau dans les dépendances du moteur, les gestes tactiles et la validité des transformations du décor. Les modules ont également été vérifiés par `node --check`.

**Validation encore nécessaire sur appareil réel :** rendu WebGL, lisibilité des troupes, précision du toucher, zoom et fluidité en portrait/paysage. Aucun navigateur de validation compatible n’était disponible dans l’environnement de préparation ; les tests Node ne remplacent pas ce contrôle visuel.

Sur téléphone, essayer une bataille complète, mettre en pause, changer d’application, reprendre, zoomer et glisser sans déployer, puis rejouer. Vérifier ensuite le retour au village. Si WebGL ne démarre pas ou perd son contexte, l’essai affiche une explication et un lien de retour.
