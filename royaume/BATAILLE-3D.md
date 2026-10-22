# Combat d’entraînement de Valdoria — version 11

`bataille-3d.html?v=11` ouvre le terrain privé de 35 bâtiments et 170 segments de remparts. La scène utilise des illustrations animées en vue isométrique sur Canvas 2D. L’entraînement reste indépendant du village sauvegardé, des ressources et du PvP.

## Visée et attaques de la version 11

Les tubes des canons et des mortiers tournent réellement vers leur cible. Leur géométrie, la bouche de tir et le départ du projectile partagent les mêmes coordonnées. Les défenses suivent une cible vivante, anticipent son déplacement, terminent leur rotation et arment leur tir. Les dégâts sont appliqués à l’arrivée du projectile. Le mortier suit une trajectoire en cloche ; son impact inflige des dégâts de zone.

Les soldats accélèrent, tournent avant de repartir, s’arrêtent à portée, préparent leur attaque puis récupèrent. Une unité en train de frapper n’est plus poussée par ses voisines. Les pieds restent fixés au sol pendant la phase d’appui de la marche. Les gestes du gardien, de l’archère et du mage restent distincts. L’orientation des troupes et des défenses est interpolée entre les étapes de simulation.

Un appui maintenu déploie plusieurs soldats du type sélectionné. Glisser, pincer, relâcher ou changer de type interrompt cette répétition. Une position interdite affiche un marqueur rouge et ne dépense aucune troupe.

![Combat v11 rendu par le moteur Canvas](docs/combat-v11.webp)

[Vidéo du combat v11 — huit secondes du moteur réel](docs/combat-v11.mp4)

Cette capture utilise les vraies ressources, la simulation et le moteur Canvas, exécutés hors navigateur. Elle ne comprend pas l’interface HTML et ne mesure pas la fluidité d’un téléphone Android. Le résultat reste une scène isométrique 2,5D originale, pas une reproduction exacte de Clash of Clans.

La reprise v11 calcule les genoux et les coudes dans l’espace du personnage avant leur projection. Le buste accompagne la marche et la frappe ; l’archère tend réellement son arc. Le départ des projectiles est vérifié contre la pointe de l’épée, l’arc et le cristal du bâton dans 16 directions pour chaque troupe. Les impacts déclenchent une réaction visuelle et les soldats vaincus chutent brièvement avant de disparaître. La préférence de mouvement réduit supprime la chute et le flash.

Historique : [animation articulée v9](docs/ANIMATION-V9.md).

## Choix des cibles et déplacements

La version précédente cherchait le bâtiment le plus proche à vol d’oiseau puis, si le trajet échouait, le mur le plus proche. Elle pouvait donc ignorer un autre bâtiment accessible et attaquer une portion de rempart sans intérêt.

La nouvelle navigation cherche d’abord une position d’attaque accessible pour les bâtiments vivants. Elle tient compte des passages libres et des empreintes de collision. Si aucun bâtiment n’est accessible, une recherche pondérée estime le coût du trajet et de la destruction des murs ; l’unité vise alors le premier mur qui bloque ce trajet. Une destruction déclenche une réévaluation immédiate. Les archers et les mages peuvent tirer par-dessus les murs à portée.

Les chemins autorisent les diagonales libres, interdisent de couper les coins des obstacles et retirent les points intermédiaires inutiles après vérification du segment complet. Une route valide reste stable jusqu’à un changement de terrain. L’interpolation entre étapes de simulation est conservée.

Cette navigation s’active uniquement pour le grand terrain privé. Les douze missions historiques conservent leurs règles de déplacement.

## Bâtiments et rendu

Les illustrations détaillées du château, de la tour, de la caserne et de la forge sont conservées. Le canon et le mortier utilisent maintenant un socle illustré et une pièce d’artillerie orientable projetée dans Canvas ; ils ne dépendent pas de WebGL. Les bâtiments montrent des traces de dommages à deux seuils de santé. Huit illustrations de ruines distinguent les matériaux et les fonctions du bâtiment détruit.

Le cache du décor reconstruit uniquement les groupes dont l’apparence a changé. Les groupes traversés par une troupe conservent leur dessin individuel afin de respecter l’ordre de profondeur. Le mode éco et la préférence de mouvement réduit restent pris en compte.

Les poses de l’artillerie utilisent un cache limité à 40 images de 256 × 256 pixels. Le dessin simplifié reste disponible si les nouveaux socles ne chargent pas.

## Vérifications

```sh
node --test royaume/tests/battle3d.test.mjs royaume/tests/battle3d-art.test.mjs royaume/tests/battle-startup.test.mjs royaume/tests/battle-style.test.mjs royaume/tests/battle-motion.test.mjs royaume/tests/battle-navigation.test.mjs royaume/tests/battle-animation.test.mjs royaume/tests/battle-coherence.test.mjs
```

49 tests réussis : 48 combinaisons défense/direction pour l’alignement du tir, délai des dégâts, anticipation des cibles mobiles, arrêt des trois types de troupes pendant leur attaque, annulation si la cible meurt, pieds en appui, rotations interpolées, articulation des genoux, tension de l’arc, 48 correspondances arme/projectile, réaction aux impacts et chute, armée complète depuis chacun des quatre côtés, déploiement continu et annulation des gestes. Les contrôles précédents couvrent aussi les cibles accessibles, les brèches, les collisions, la pause, le replay, les sorts, la victoire, le chargement, le cache du décor et l’isolation du village. Les résultats de référence des 12 missions historiques sont inchangés.

Chargement réel des planches, rendu, mode éco et redémarrage contrôlés avec Canvas natif. Interface et fluidité Android restent à vérifier sur appareil.

Après fusion et déploiement : `https://one-officiel.fr/royaume/bataille-3d.html?v=11`.
