# CHANGELOG — 0.12.5 FAST SWIPE

- Prépare 1 TikTok précédent et 2 suivants autour de la vidéo active.
- Le lecteur N+2 démarre avec un léger décalage pour ne pas voler la priorité réseau à la vidéo visible.
- Une vidéo préchargée n’est plus affichée immédiatement sur sa frame figée : le poster reste visible jusqu’à une vraie progression après activation.
- Transition vers la vidéo accélérée dès la première progression confirmée.
- Relance `play` rapide si la vidéo visible tarde à progresser.
- Aucun overlay de chargement TikTok pendant le buffering.
- Safe-Sync, partage Android et catalogue TikTok conservés.
