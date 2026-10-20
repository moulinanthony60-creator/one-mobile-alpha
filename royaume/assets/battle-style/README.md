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
