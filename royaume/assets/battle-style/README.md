# Planches des troupes de Valdoria

`guardians.webp`, `archers.webp` et `mages.webp` sont les trois nouvelles planches utilisées par le terrain et les cartes. Créées avec l’outil intégré imagegen, puis converties en WebP en conservant le canal alpha ; aucun modèle ou personnage de Clash of Clans n’a été repris.

Chaque image mesure 1536 × 1024 et contient quatre colonnes et deux rangées. Rangée du haut : face trois quarts droite. Rangée du bas : dos trois quarts droite. Colonnes : repos, pas gauche, pas droit, attaque. Le moteur inverse horizontalement les poses pour les déplacements vers la gauche. Le découpage et l’ancrage des pieds sont calculés depuis le canal alpha par `battle-style-art.mjs`.

Direction utilisée pour la génération : personnages originaux pour un jeu de stratégie isométrique, volumes arrondis, proportions lisibles à petite taille, éclairage venant du haut à gauche, silhouette entière, même échelle entre les huit cellules et fond transparent. Le gardien porte une armure d’acier, du bleu et de l’or, une crête bleue, une moustache brune, une épée et un bouclier au soleil doré. L’archère rousse porte une capuche verte, du cuir et un arc. La mage porte une robe à capuche violette bordée d’or et un bâton à cristal cyan.

Ces images sont des éléments de jeu animés par poses. Elles ne constituent pas des modèles 3D et ne sont pas la maquette de bataille générée précédemment.
