# Combat v16 — direction visuelle et animation des troupes

La v15 mélangeait des bâtiments illustrés avec des soldats aux volumes simples. Ses petites images animées étaient agrandies et superposées entre deux poses, ce qui floutait les membres et les armes. La v16 utilise trois nouveaux personnages aux grandes surfaces de couleur : guerrier cuivré massif, archère verte aux cheveux magenta et mage à capuche bleue.

## Rendu utilisé en jeu

Les personnages sont assemblés à partir de pièces illustrées, animées directement par les articulations du moteur. Ils disposent de vues de face et de dos en trois quarts, retournées horizontalement selon l'orientation ; il ne s'agit pas de maillages 3D ni de seize vues de texture indépendantes. Les coudes sont moins écartés et la marche rebondit moins. Les mains restent attachées aux mêmes points de départ des tirs. Le rendu ne superpose plus deux images complètes d'un soldat.

Des niveaux de détail précalculés au chargement évitent les scintillements lors de la réduction des pièces à la taille du téléphone. Les surfaces de personnages, équipement et niveaux de détail occupent 12 811 580 octets (12,22 Mio), contre 47,37 Mio pour les trois planches complètes v15. Cela décrit les surfaces de troupes, pas la mémoire totale du navigateur ni les performances Android.

Les cartes présentent des portraits en buste réalisés par le même moteur. L'épée, le bouclier, l'arc, le carquois et le bâton sont de nouvelles illustrations. La corde de l'arc suit la main qui la tend et le projectile magique utilise la nouvelle flamme. Les murailles ont des pierres et des arêtes plus marquées. La poussière est plus courte et plus transparente ; les barres de vie des troupes s'affichent pendant 1,5 seconde après un impact. Le bouton de déploiement indique « Armée déployée » lorsque la réserve est vide.

Les règles de combat, les 40 soldats et la portée de 4,5 cases des canons à travers les murs sont conservés. Les anciennes planches v15 restent un secours si les nouvelles illustrations ne chargent pas ; l'interface indique alors le repli.

## Ressources et génération

Création avec le skill imagegen et l'outil intégré `image_gen__imagegen`, sans CLI. Les prompts complets et les références sont dans [`prompts-v16.json`](../assets/battle-style/prompts-v16.json).

- `royaume/assets/battle-style/troop-sculpt-front-v16.webp` : pièces des trois personnages, face.
- `royaume/assets/battle-style/troop-sculpt-back-v16.webp` : mêmes pièces, dos.
- `royaume/assets/battle-style/equipment-v16.webp` : six équipements et effet de magie.
- `royaume/assets/battle-style/{guardian,archer,mage}-portrait-v16.webp` : portraits en buste issus du rendu de production.

Les PNG de génération sont convertis en WebP qualité 94, méthode 6, en conservant l'alpha. L'intégration des pièces, leur mise à l'échelle et leurs mouvements sont réalisés dans `battle-painted-troops.mjs`.

## Reproduction et validation

Avec `@napi-rs/canvas` installé, ou son chemin dans `VALDORIA_CANVAS_MODULE` :

```sh
node royaume/tools/render-painted-troops.mjs
VALDORIA_RENDER_VIDEO=1 node royaume/tools/render-combat-preview.mjs
```

Le premier export produit les portraits et `troupes-v16.png`. Le second utilise la simulation et les ressources de production en 1024 × 576 et 390 × 720 ; il n'inclut pas l'interface HTML. La vidéo exportée dure 16 secondes à 15 images par seconde et ne mesure pas la fluidité du jeu sur téléphone.

61 tests vérifient les commandes, les tirs à travers les murs, les positions de lancement, les animations, la sélection des niveaux de détail, la libération des surfaces, les 40 soldats et les 12 missions historiques. L'assaut exporté atteint 45 % de destruction après 16 secondes. La fluidité sur un appareil Android physique reste à vérifier.
