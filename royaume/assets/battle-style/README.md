# Illustrations du combat de Valdoria

## Version 7

- `fortress-kit.webp` : seize éléments originaux dans une planche 4 × 4, utilisés pour les bâtiments, la forêt, les rochers et les débris. Les bâtiments restent des objets séparés du moteur de combat.
- `guardians-smooth.webp`, `archers-smooth.webp`, `mages-smooth.webp` : huit poses par personnage, quatre vues de face et quatre de dos. Le moteur recale leur torse et leurs pieds et précalcule les transitions de marche. Les cartes emploient les mêmes personnages.

Création avec l’outil intégré imagegen, sortie avec transparence, puis conversion WebP conservant l’alpha. Aucun modèle 3D ni personnage de Clash of Clans n’est repris. Ces éléments sont des illustrations 2D utilisées en vue isométrique, et non des maillages 3D animés par un squelette.

Prompts de production :

- Fort : planche transparente 4 × 4 d’objets isolés, caméra isométrique orthographique plongeante, volumes compacts, grandes formes sculptées, pierre chaude, bleu marine et or, soleil héraldique original, lumière en haut à gauche. Château, tour, canon, mortier, mine, coffre, réservoir violet, caserne, tour magique, maison, forge, moulin, feuillus, pins, rochers et débris. Sans texte ni interface.
- Gardiens : planche transparente 4 × 2 d’un personnage cartoon aux proportions compactes, casque ouvert en acier, écharpe bleue, épée et bouclier bleu/or ; poses de marche de face et de dos, même échelle et même éclairage.
- Archers : même cadrage, archère rousse à capuche verte, arc court, bottes et carquois ; poses de marche de face et de dos.
- Mages : même cadrage, mage âgé à barbe blanche, capuche violette bordée d’or, bottes visibles et bâton à cristal cyan ; poses de marche de face et de dos.

Les anciennes planches sans suffixe `-smooth` sont conservées pour la compatibilité avec les anciennes versions en cache, mais ne sont plus chargées par le combat v7.

## Version 8

`fortress-detail.webp` contient six bâtiments originaux plus détaillés : château, tour d’archers, canon, mortier, caserne et forge. Les découpes de production sont explicites dans `battle-fortress-art.mjs`. `fortress-ruins.webp` contient huit ruines correspondantes ou complémentaires (château, tour, canon, mortier, caserne, maison, mine et réservoir magique).

Création avec l’outil intégré imagegen, à partir de la palette et du style des ressources précédentes ; conversion WebP conservant l’alpha. Les fichiers sont consommés par le moteur, pas employés comme une image de fond de bataille.

Direction des prompts : sprites isométriques originaux de Valdoria, vue orthographique plongeante à 35 degrés, lumière chaude en haut à gauche, pierre claire, bois et fer, bleu royal et or. Architecture plus lisible, entrée et remparts du château, plateforme ouverte des tours, roues et engrenages du canon, munitions du mortier, râtelier de la caserne, soufflet et enclume de la forge. Objets isolés sur fond transparent, sans texte ni interface. Pour les ruines : silhouettes distinctes et construction effondrée, ardoises bleues, tuiles rouges, charpentes, morceaux de canon, minerai ou cristaux suivant le bâtiment.
## Animation articulée v9

Deux nouvelles planches `troop-rig-front.webp` et `troop-rig-back.webp`, générées avec l’outil intégré imagegen puis converties en WebP en conservant leur transparence. Elles contiennent six pièces par personnage : tête, buste, bras, avant-bras, cuisse et botte. Les trois rangées représentent le gardien, l’archère et le mage. Les joints, armes, ombres et gestes sont dessinés par `battle-troop-rig.mjs` ; ce ne sont pas des images complètes simplement déplacées. Les anciennes planches restent disponibles pour les vues qui les utilisent encore.

Prompt de création (outil intégré, pas de CLI) :

```text
Use case: stylized-concept. Production transparent game sprite atlas for Valdoria, a polished isometric fantasy mobile strategy game. Create a precise SIX COLUMN by THREE ROW grid of 18 DISCONNECTED modular character body parts. No complete characters, no labels, no text, no frames, no cast ground shadows. Real transparent background and generous clear gutter in every cell.
Each row belongs to one chunky heroic cartoon character, three-quarter FRONT view facing right, seen from elevated isometric camera, soft upper left light, rich rounded 3D-painted volume, crisp readable silhouettes. Parts are for continuous skeletal animation, joint ends rounded and hidden by overlaps. Every piece upright, one single body part per cell; arm segments point straight down; boots toe right. No weapons included.
COLUMN 1: detached large head including neck. COLUMN 2: torso only from shoulders to hips, no head no arms no legs. COLUMN 3: ONE upper arm from shoulder to elbow with shoulder pad. COLUMN 4: ONE forearm from elbow to closed fist, no upper arm. COLUMN 5: ONE thigh from hip to knee. COLUMN 6: ONE shin from knee to chunky boot, a single lower leg with boot, no thigh.
ROW 1: stout guardian knight, expressive friendly brown-bearded head inside open steel helmet with gold rim; navy blue scarf and tunic with steel breastplate and gold-trim brown leather belt; steel armored upper arm; brown leather and steel gauntlet; navy padded thigh with gold knee guard; brown boots with steel shin guard.
ROW 2: auburn-haired young female woodland archer with green hood and alert green eyes; fitted emerald green leather torso and gold clasp belt with short split tunic, no dangling full cape; green sleeved upper arm; brown leather bracer forearm with bare hand; dark green trouser thigh; brown knee-high boot.
ROW 3: elderly white-bearded kindly wizard wearing royal purple hood; deep purple tunic torso with gold trim, turquoise clasp and SHORT skirt ending at hips, no long robe hiding legs; purple sleeved upper arm; purple bracer and bare hand; plum trousers thigh; dark violet boot with gold trim.
Each of the 18 pieces fills about 65-80 percent of its own equal-sized cell, centered. Clearly separated accurate row and column boundaries. Large empty alpha gutters. Final canvas landscape 1536x1024. This is an animation production asset, not an infographic.
```

Prompt de la variante de dos, avec la planche de face comme référence :

```text
Use case: precise-object-edit. This input is the front-view modular animation atlas for Valdoria. Make its MATCHING REAR VIEW atlas. Preserve the exact SIX COLUMN x THREE ROW layout and character materials, colors, identities, proportions and polished 3D cartoon lighting. All 18 parts must be individually isolated on TRUE TRANSPARENT alpha, centered in their own cells with clear empty gutters.
Change only the viewing angle: show each part from a three-quarter BACK view facing away toward upper right. In column 1 show the BACK of the helmet or hood, NO faces. Column 2 show BACK of torso with straps or seams, no arms or head. Column 3 single upper arm shoulder-to-elbow. Column 4 single forearm elbow-to-fist. Column 5 single thigh hip-to-knee. Column 6 single shin and boot knee-to-foot. Upper limb joints at top and distal joints at bottom, vertical neutral pose. No weapons. No complete characters, no paired limbs, no labels, no text, no frames, no background shadow. Row1 navy and steel guardian, row2 green hooded archer, row3 purple white-bearded wizard. Match original grid 1536x1024.
```

