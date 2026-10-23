# Combat v18

Les personnages utilisent désormais des animations complètes précalculées à partir des illustrations et de l’articulation du projet. Chaque rôle dispose de 29 poses dans 16 directions : attente, 12 pas, préparation et huit phases de frappe. Les trois atlas WebP contiennent 1 392 poses, pour environ 1,48 Mio à télécharger et 33,98 Mio décodés. Aucun contenu du joueur ni image de référence fournie dans la conversation n’est inclus.

Le gardien baisse son centre de gravité et tourne le buste pendant sa frappe. La foulée, le mouvement des bras et la hauteur des pas diffèrent entre gardiens, archers et mages. Les silhouettes se resserrent de profil, les têtes sont moins larges et les capes ont un mouvement indépendant. Le mage prépare un éclat sur son bâton. Les coups reçus inclinent brièvement le personnage autour de ses pieds. Les effets d’impact ont un éclair bref, des débris et une poussière qui se dissipe ; le rayon arcanique utilise un éclair segmenté. Le cadrage accorde davantage de place aux bâtiments défendus.

Chaque personnage animé nécessite un seul dessin d’image, sans découpage de membres, allocation de Canvas ou fusion de poses à chaque frame. Un repli articulé, puis l’ancien atlas de volume, restent disponibles si le chargement échoue. Le déplacement reste interpolé entre les pas de simulation ; les poses de marche suivent la distance parcourue. Les silhouettes sont échantillonnées, pas de vrais modèles 3D. À un très fort agrandissement, elles restent moins détaillées que les grandes illustrations sources.

Les dégâts, la portée, les délais des attaques, les obstacles et les règles du village sont inchangés. Les canons tirent toujours à travers les murs dans leur portée de 4,5 cases. Les points de départ des tirs restent cohérents avec les armes au moment de la libération.

## Validation

- 72 tests passent après correction d’une limite numérique du cycle de marche et mise à jour de l’attente de version des points d’entrée.
- Le générateur vérifie l’absence de pixels coupés sur les quatre bords de chacune des 1 392 poses.
- Le moteur réel charge les trois atlas et est rendu en paysage (1024 × 576) et portrait (390 × 720), puis passe en mode éco et se réinitialise. L’assaut de référence atteint 42 % après 16 secondes, comme en v17.
- Le test de dessin de 40 personnages sur 60 images compte 28 020 dessins d’images pour le chemin articulé de repli et 2 400 pour le nouveau chemin, soit 91,4 % de moins. Le Canvas natif utilisé ici mesure 537 ms et 115 ms pour ces deux boucles. Ce résultat porte uniquement sur le dessin des personnages : ce n’est ni un FPS global du jeu, ni une mesure Android.
- La vidéo MP4 est un export à 15 images/seconde du véritable moteur. La fluidité sur le téléphone du joueur reste à vérifier.

## Reproduction

Configurer `VALDORIA_CANVAS_MODULE` vers le module installé `@napi-rs/canvas`, puis exécuter `node royaume/tools/bake-animated-troops.mjs`. Convertir les trois PNG `*-animated-v18.png` en WebP qualité 94, méthode 6 avec Pillow. `tools/render-combat-preview.mjs` exporte le combat ; `tools/render-animated-review.mjs` prépare une revue agrandie des animations ; `tools/benchmark-troop-rendering.mjs` reproduit la comparaison CPU. Les images sources sont les ressources publiques v16 déjà présentes dans le dépôt, complétées par des formes vectorielles animées pour les capes et les effets.
