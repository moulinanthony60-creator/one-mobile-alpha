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

## Visée orientable v10

`defense-foundations.webp` contient deux socles fixes sans tube : canon et mortier. Création avec l’outil intégré imagegen, puis conversion WebP en conservant l’alpha. Le moteur dessine séparément les pièces d’artillerie orientables ; leur bouche correspond exactement au départ du projectile. Les anciennes images complètes restent disponibles pour les anciens clients.

Prompt de production :

```text
Use case: stylized-concept. Production atlas for an original polished mobile isometric fantasy battle game named Valdoria, with chunky readable toy-like forms, rich clean warm colors, softly shaded bevels, and detailed blue-and-gold medieval craftsmanship.
TRUE TRANSPARENT background. Exactly TWO isolated objects side by side, centered in the left and right halves, ample empty transparent gutter. No text, no labels, no border, no ground shadow extending outside footprint. Camera elevated 30 degrees, isometric view, light from top left. Both objects are EMPTY STATIONARY TURRET FOUNDATIONS; a moving cannon barrel will be rendered separately in the game. Absolutely NO gun barrel, NO cannon, NO mortar tube, NO wheels, NO tall upright supports, NO cannonball.
LEFT object: squat broad octagonal defensive artillery foundation. Gray sandstone masonry plinth, beveled stone tiles, small navy blue inset panels on its vertical sides, gold trim, brass rivets, crossed golden sun insignia on front. On top a low circular polished brass rotary bearing with EMPTY dark navy central flat disk. Bearing flush with platform, nothing standing above. The platform is about three times wider than its height.
RIGHT object: squat circular mortar foundation. Eight chunky stone blocks forming a low stone plinth, navy enamel trim and warm gold bands. On top a LOW empty dark steel circular bearing with gold rim, ready for a separate rotating mortar assembly. Nothing in the central opening, no weapon. Same width and height scale as first object.
The art must look fully finished and tactile, consistent with illustrated fantasy village buildings, not a sketch or flat icon. Neutral upright fixed base, symmetrical footprints. Landscape canvas 1536x1024, each item fits within its own half.
```

# Nouveau rendu v12

Voir la section « Volumes et style unifié v12 » en fin de fichier pour les ressources actuellement utilisées. Les sections précédentes documentent les versions conservées pour les anciens clients en cache.


## Volumes et style unifié v12

`fortress-volume-v12.webp` remplace les bâtiments, les arbres et les socles ; `fortress-ruins-v12.webp` contient huit ruines assorties. Création avec l’outil intégré imagegen, sorties RGBA, conversion WebP qualité 90 conservant l’alpha. Les coordonnées de découpe explicites évitent de couper un toit ou une fondation.

Les planches `guardian-volume-v12.webp`, `archer-volume-v12.webp` et `mage-volume-v12.webp` proviennent de modèles originaux construits dans `royaume/tools/combat-volume-models.mjs`, puis rendus par `volume-raster.mjs` et `bake-volume-troops.mjs`. Ce sont 16 directions et 22 poses de personnages entiers, avec profondeur et éclairage, dessinées en une seule image par troupe. Aucun modèle ni texture du jeu de référence n’est importé. Les PNG intermédiaires ne sont pas nécessaires au déploiement.

Les trois atlas utilisent WebP qualité 78 avec alpha conservé. Ils mesurent 1920 × 3168 (cases 120 × 144, ancrage pied 60/122). La génération contrôle les bords alpha de toutes les poses ; la bouche des armes suit la même orientation quantifiée que le modèle. Le mélange des poses s’effectue sur une surface transparente pour préserver les couleurs du décor.

Prompts complets des nouveaux éléments :

```text
Use case: stylized-concept.
Asset type: production transparent sprite atlas for the playable mobile strategy game Valdoria. The visual reference is the clean, chunky, cheerful 3D-rendered in-game buildings of Clash of Clans, viewed from its fixed high isometric battle camera. Create original Valdoria buildings in that rendering style. This is gameplay art, not a cinematic illustration, not a decorative medieval painting.
Exactly FOUR columns by FOUR rows, equal cells, 16 separate complete objects, one centered object per cell, generous clear transparent gutters, no labels or text or frames. 2048 x 2048 square atlas. Real transparent background.
All buildings share the exact same orthographic isometric view: front and right walls visible, 35 degree downward view, consistent scale, sunlight upper left, soft contact occlusion, clean rounded beveled shapes, richly shaded smooth volumes, crisp edges. Broad squat proportions, thick walls, big readable roofs, deliberately restrained surface detail, large color blocks. Smooth bright sandstone, royal blue roofing, warm gold iron fittings, orange terracotta secondary roofs, original golden sun emblem. Soft stylized physically shaded materials, no black outlines, no photo texture, no tiny ornament. Each object centered on a compact square grassless foundation.
Row 1 left to right:
1. Town hall: stout square fortified keep, large royal blue pyramidal roof, gold sun on front, two short chunky cream stone front towers, broad arched wooden door, bold gold trims. No soaring spires.
2. Archer tower: broad squat cream stone base, chunky wooden upper balcony with four short railings, open platform with two tiny blue-clad defenders and crossbow, small blue canopy at rear only; clearly defensive silhouette.
3. Gold mine: dark rock entrance, timber supports, glowing pile of gold, chunky little mining cart and blue mechanical winch.
4. Gold storage: squat round blue-and-gold armored vault, broad domed roof, visible giant embossed coin on front and piles of gold at side.
Row 2 left to right:
1. Mana reservoir: spherical clear glass tank full of luminous purple elixir on stout gold-and-blue stone supports, simple thick pipes, fantasy game storage.
2. Barracks: stout cream stone training building, royal blue roof with crossed gold swords emblem, open orange-lit doorway, simple shield and weapons rack at side.
3. Arcane defense: broad stepped dark blue stone pedestal and short cream tower with a large floating faceted cyan crystal, thick gold supports, readable compact silhouette.
4. Cottage: compact cream plaster house, thick orange tiled roof, round timber door, one small window and squat stone chimney.
Row 3 left to right:
1. Forge: squat dark stone smithy with thick terracotta roof, big glowing furnace, chunky anvil, iron tools and a small woodpile.
2. Windmill: compact cream building, blue conical roof, four broad wooden sails with cream fabric, short stout proportions.
3. Cannon FOUNDATION ONLY: squat octagonal gray stone plinth, low polished brass rotary bearing, navy and gold inset panels, EMPTY flat top, NO barrel, NO wheels, nothing above bearing.
4. Mortar FOUNDATION ONLY: squat circular stone and navy metal base, gold rim, EMPTY circular central bearing, NO tube, NO weapon.
Row 4 left to right:
1. ONE dense round deciduous tree, layered fluffy lime and olive green foliage, thick short trunk, strong rounded 3D volume.
2. ONE full pine tree, layered rounded sweeping dark green branches with lime tips, thick short trunk, polished 3D game foliage.
3. One compact cluster of three rounded granite boulders, softly beveled, gray warm highlights, small green moss patch.
4. One compact collapsed building rubble pile, cream masonry blocks, blue roof shards and brown timber, clear low silhouette.
Objects must never touch adjacent cells. Consistency and readability at 64-pixel gameplay size are the priority. No characters outside the tower, no terrain tiles, no whole village, no interface.
```

```text
Use case: stylized-concept. Transparent production sprite atlas for Valdoria. Match the clean chunky, smoothly shaded 3D mobile strategy gameplay art of Clash of Clans, with original royal blue, warm sandstone and gold Valdoria materials. Exactly FOUR columns by TWO rows, 8 complete separate LOW piles of destroyed buildings, one centered object per equal cell with generous transparent gutters. Landscape 1536x1024. Isometric orthographic view 35 degrees down, sun upper left, smooth rounded beveled pieces, restrained detail, clear silhouette at 64 pixels. REAL transparent background. No labels, no text, no smoke, no fire, no terrain tiles or brown oval ground stamps, no living characters.
Top row: 1 ruins of a royal blue-roofed cream stone keep, broken arch and large blue roof slabs with gold finial; 2 ruins of a cream stone archer tower with collapsed timber balcony and broken blue canopy; 3 destroyed cannon with a recognizable broken dark gunmetal tube, gold bands, one wheel and navy fragments on stone; 4 destroyed mortar with a broken short dark steel bowl, gold ring and round stone base.
Bottom row: 1 barracks ruins, cream blocks and blue roof slabs, broken crossed-swords crest and timber; 2 cottage ruins, terracotta roof shards, cream wall remnants and broken door; 3 gold mine ruins, chunky gray rocks and timber, small broken cart and scattered gold coins; 4 magic reservoir ruins, large broken glass sections and gold supports, a small bright purple mana puddle inside the debris footprint.
Make all piles equally scaled and compact, with a few large readable pieces instead of tiny debris. Smooth saturated 3D rendering, rounded corners, soft contact shadows confined to each pile. No cinematic or realistic distressed textures.
```


## Refonte du combat v13

`fortress-v13.webp` : 16 illustrations produites avec l’outil intégré imagegen depuis la planche v12 ; objets isolés par leur alpha puis regroupés dans des cases 384 × 384, avec marges. La tour est vide afin de ne pas figer des soldats dans l’image.

Prompt de production :

> Production sprite atlas for mobile village battle game Valdoria. Redesign the reference in polished Clash of Clans inspired 3D cartoon style: strong rounded bevels, rich ambient occlusion, matte materials, clean readable silhouettes, thick masonry and tactile timber, deep blue and terracotta roofs, restrained gold. True transparent background. Square image, strict 4 by 4 equal grid. Identical 30 degree isometric camera and upper-left light. Row 1: blue-roof stone keep, empty archer tower without people or crossbow, gold mine, gold storage. Row 2: violet reservoir, barracks, crystal defense, cottage. Row 3: forge, windmill, empty cannon foundation, empty mortar foundation. Row 4: oak, evergreen, boulders, rubble. No labels, no ground floor, no UI.

`guardian-volume-v13.webp`, `archer-volume-v13.webp`, `mage-volume-v13.webp` : modèles natifs dans `tools/combat-volume-models.mjs`, rendus avec `tools/bake-volume-troops.mjs` à double résolution puis réduits et encodés en WebP qualité 84. 16 directions et 22 poses par rôle ; dimensions 1536 × 2552. Les portraits v13 sont recalculés à haute résolution depuis ces mêmes modèles avec `tools/bake-troop-portraits.mjs`, dans la direction 2 de la pose de repos, puis réduits à 216 × 261 pixels. Les PNG intermédiaires ne sont pas requis en production.
