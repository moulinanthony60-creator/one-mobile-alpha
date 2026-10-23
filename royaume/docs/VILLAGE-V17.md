# Village et combat v17

Le signalement Android montrait un village sans bâtiments ni arbres, alors que les cabanes d’ouvriers, le sol, les compteurs et les échafaudages restaient visibles. Les bâtiments disparus provenaient de surfaces Canvas mises en cache ; les cabanes encore visibles provenaient directement d’images. Le rendu recréait également une surface de terrain de 4096 × 2304 pixels après chaque placement ou déplacement. La perte des caches graphiques sous pression mémoire est une explication compatible avec la capture, mais elle n’a pas été reproduite à l’identique sur un appareil Android physique.

## Correction du rendu

Les bâtiments, leur vignette de profil et les éléments naturels sont désormais dessinés directement depuis cinq images WebP préparées à l’avance. Leurs masques de sélection restent précis. Le chargement ne découpe plus ces éléments dans des dizaines de Canvas permanents. Les atlas occupent 24 596 480 octets décodés (23,46 Mio). Les morceaux animés des ouvriers sont réduits à 128 pixels maximum et leurs anciennes grandes surfaces sont libérées.

Le terrain réutilise une seule surface de 2048 × 1152 pixels : 9 Mio au lieu de 36 Mio par création. Les vignettes temporaires sont libérées après export. Les restaurations de contexte redessinent la vue ou invalident le terrain. Les sauvegardes, ressources, bâtiments et règles de progression ne sont pas modifiés par cette correction.

Le cadrage de la cité reste plus proche. Commencer un placement en vue trop lointaine rapproche le chantier ; le zoom manuel ne descend plus jusqu’à un village presque invisible. La vue Domaine conserve l’aperçu global. Le terrain utilise une herbe plus détaillée, et treize bâtiments ou éléments naturels reprennent les illustrations plus travaillées du champ de bataille. Les ressources proviennent du projet existant ; aucune image nouvelle n’a été générée pour cette version.

## Comparaison avec la vidéo fournie

La vidéo de référence montre des troupes plus petites face aux constructions et une vue qui consacre davantage de place au village. La v17 réduit les soldats d’environ 31 % et ajuste leur foulée ainsi que l’origine de leurs projectiles avec le même facteur. Le suivi cadre une zone entre les troupes et les bâtiments défendus, avec un zoom moins serré, pour éviter de remplir la moitié de l’écran avec le rivage.

Cette version reste un rendu isométrique à illustrations et articulations 2D. Elle ne remplace pas ces éléments par de vrais personnages 3D à animations multidirectionnelles et n’atteint pas à elle seule toute la richesse visuelle de Clash of Clans. La portée des canons de 4,5 cases à travers les murs est conservée.

## Vérification

- 70 tests couvrent notamment la construction, sa fin, la restauration de sauvegarde, le catalogue complet, les masques, les versions en cache, les tirs, les points de lancement et les 12 missions historiques.
- Le moteur du village est rendu en 390 × 700, 844 × 390 et 1024 × 640. Après le lancement et la fin d’un chantier, douze modifications successives reconstruisent les chemins en réutilisant une seule surface de terrain ; les bâtiments et leur sélection restent disponibles.
- Le moteur de combat est exporté en 1024 × 576 et 390 × 720. L’assaut atteint 42 % de destruction après 16 secondes. Le MP4 est un export à 15 images/seconde, pas une mesure de fluidité sur téléphone.
- Le bug Android précis et la fluidité sur le téléphone de l’utilisateur restent à confirmer sur cet appareil.

Les scripts `tools/prepare-village-art.mjs` et `tools/render-village-preview.mjs` utilisent `@napi-rs/canvas` (chemin configurable via `VALDORIA_CANVAS_MODULE`) et Python/Pillow pour normaliser les anciens PNG. Convertir les atlas PNG en WebP qualité 92, méthode 6. Les coordonnées et masques sont générés dans `assets/village-v17/manifest.mjs`.
