# La cour du gardien

Page d’essai : `royaume/atelier-3d.html`.
Après fusion et déploiement GitHub Pages : https://one-officiel.fr/royaume/atelier-3d.html

Cette petite scène sert à examiner trois nouveaux modèles avant de décider de leur intégration aux combats : château en pierre claire avec toitures orange, maison à colombages, gardien en armure bleue et or. Les géométries sont originales, générées dans `modeles.mjs`. La scène utilise la version de Three.js déjà présente dans le dépôt, sans service externe ni chargement de modèles distants.

## Essayer sur téléphone

- « Ensemble », « Château », « Maison » et « Gardien » changent le cadrage.
- Glisser tourne autour de la scène ; pincer ou utiliser +/− change le zoom.
- « Repos », « Marche » et « Attaque » animent le gardien. L’attaque frappe une cible d’entraînement, avec anticipation, impact et retour en position.
- « Éco » réduit la résolution, retire les ombres dynamiques et la fumée. Un démarrage avec `?eco=1` désactive aussi l’anticrénelage dès la création du contexte.
- Pause arrête les animations. La préférence système de réduction des animations est respectée.
- Si la 3D échoue ou perd son contexte, un panneau propose une nouvelle tentative en mode éco et un retour au combat.

Les commandes restent dans la hauteur visible de l’écran. Les flèches du clavier permettent aussi de tourner, +/− de zoomer, et Début de revenir à l’ensemble.

## Périmètre

C’est une scène de référence, pas un nouveau mode de combat. Aucun import du moteur de village, de la simulation de combat ou des sauvegardes. Les pages du village et du combat ne sont pas modifiées. Cette proposition est indépendante de la correction des commandes mobile dans la PR #7.

La géométrie statique est regroupée par matériau ; les accessoires du gardien sont regroupés à l’intérieur des articulations. Le budget testé reste sous 220 000 triangles et 36 maillages pour les modèles, hors sol, particules et passes d’ombres. Cela ne constitue pas une mesure de fluidité sur téléphone.

## Vérification

Depuis la racine du dépôt :

```sh
node --test royaume/tests/atelier-3d.test.mjs royaume/tests/battle3d.test.mjs royaume/tests/battle3d-art.test.mjs royaume/tests/battle-startup.test.mjs
```

Les tests de l’atelier vérifient les géométries et transformations finies, le budget des modèles, la continuité de la boucle d’attaque, les mouvements, le mode éco dès le premier affichage et la libération des ressources en cas d’erreur. Le graphe de scène est exécuté avec le moteur WebGL remplacé, à plusieurs dimensions d’écran.

Les modèles ont également été inspectés par projection 3D hors navigateur, en vue d’ensemble et en gros plan. Le rendu GPU, les interactions réelles du navigateur et les performances Android restent à vérifier sur appareil. La scène n’est pas présentée comme une équivalence graphique avec Clash of Clans.
