# Combat v15 — silhouettes et matières des troupes

Les trois modèles animés remplacent les membres en capsules, mains en boules et visages ronds de la v14 par des volumes continus et effilés. Le gardien porte une cuirasse, des épaulières à bordures et un bouclier en écu ; l'archère a une silhouette plus fine, des mèches et un carquois ; le mage porte une robe plissée, une capuche ouverte et une barbe en mèches. Les capes suivent le cycle de marche.

Les portraits sont rendus à partir des mêmes modèles. Le rasteriseur ajoute des ombres portées entre les éléments du personnage, un biais adapté à l'inclinaison des surfaces et des reflets plus sobres. Tout est précalculé : le téléphone dessine des images transparentes et ne charge aucun de ces maillages.

Les trois planches conservent 16 directions × 22 poses, des cellules de 120 × 98 pixels et un total de 47,37 Mio décompressés. Les positions de départ des projectiles, le moteur de combat et la portée des canons ne changent pas. Les canons continuent à viser à travers les murs dans un rayon de 4,5 cases.

## Reproduire les ressources

Depuis la racine du dépôt, avec `@napi-rs/canvas` installé (ou `VALDORIA_CANVAS_MODULE` défini sur son chemin) :

```sh
node royaume/tools/bake-volume-troops.mjs
node royaume/tools/bake-troop-portraits.mjs
node royaume/tools/render-troop-review.mjs
```

Les deux premières commandes écrivent les PNG v15. Les convertir en WebP avec Pillow, qualité 94, méthode 6. Le générateur contrôle les quatre bords de chacune des 1 056 poses pour détecter tout rognage.

```sh
VALDORIA_RENDER_VIDEO=1 node royaume/tools/render-combat-preview.mjs
```

Ce rendu utilise les ressources et la simulation de production en 1024 × 576 et 390 × 720. Il n'inclut pas l'interface HTML. La vidéo dure 16 secondes à 15 images par seconde ; elle ne constitue pas une mesure des performances Android.

## Vérifications

59 tests couvrent notamment la sélection et le déploiement, la marche et les points de départ des tirs, la limite mémoire des planches, la navigation, la victoire des 40 soldats, les 12 missions historiques, la pause/reprise et la portée des canons à travers les murs.

La planche `troupes-v15.webp` montre l'attente, la préparation, la frappe et la vue de dos des modèles utilisés dans le combat. Les exports `combat-v15` montrent un assaut avec les 40 troupes, ainsi que le rendu portrait. La fluidité sur un téléphone Android physique reste à mesurer.
