# ONE Mobile Alpha 0.13.27 — Twitch stabilité palier 1

## Installation
Extraire le ZIP et déposer son contenu à la racine du dépôt du site, dossier icons compris. Aucune compilation nécessaire.

## ONE IA
La bulle déplaçable ouvre une question avec le titre et le créateur de la vidéo. Recherche via le service web ONE existant. ONE ne voit ni les images ni le son de la vidéo. Ajout de capture, bouton d’analyse visuelle et réglages OpenAI/ONE Vision retirés. Aucun appel à ONE Vision n’est effectué par cette version.
Le Worker one-vision-api déjà déployé et ses secrets ne sont pas supprimés par ce ZIP. Le serveur de recherche one-shopping-api reste nécessaire ; sa disponibilité et ses éventuels coûts dépendent de sa configuration.

## Fonctions conservées
Salon ONE vide ; studio multiplateforme sans publication simulée ; Pour toi TikTok ; priorité aux chaînes suivies sur Twitch et aux deux vidéos récentes des chaînes YouTube suivies, puis autres créateurs ; abonnements, tchat Twitch, avatars, connexions/sync, lecture paysage et contrôles natifs.
La lecture musicale YouTube écran verrouillé et les commentaires/likes externes YouTube/TikTok restent non activés.

Voir VALIDATION.md pour les vérifications et limites.

# 0.13.27 — Lecture native Twitch et chat agrandi

- Cartes live Twitch : lecteur natif chargé lorsque la carte devient visible, sans bouton Play/Lire ONE redondant. Autoplay demandé sans son ; un appui natif peut rester nécessaire sur mobile.
- Aucun masquage des bandeaux internes Twitch.
- Chat : Agrandir/Réduire, demande de plein écran avec repli sur toute la fenêtre ONE si refusé. Ce mode agrandit le chat seul ; le fullscreen natif vidéo ne permet pas de superposer le chat ONE.
- Moteur vertical TikTok inchangé.

# 0.13.27 — Bulle Chat et vue vidéo + chat

- Bulle Chat sur les lives visibles : vidéo à gauche/chat à droite en paysage, empilés en portrait. Retour au live sans déplacer ni recréer son iframe.
- Ouverture du chat depuis sa bulle : demande fullscreen sur la page ONE (vidéo et chat inclus), avec navigationUI hide. Repli sur la fenêtre disponible si le navigateur refuse.
- Fonds de page sombres pour éviter une zone blanche issue du site. Les barres système restent contrôlées par le téléphone.
- Plein écran natif Twitch inchangé : il ne contient pas le chat ONE.

# 0.13.27 — Chat escamotable

- Retire la barre Live + tchat / Retour au live et le titre ONE du chat dans la vue partagée.
- Flèche sur le bord gauche du chat pour masquer/afficher ; vidéo agrandie quand le chat est masqué.
- Les iframes vidéo/chat restent en place au basculement, sans rechargement.
- Cache et version actualisés.

# 0.13.27 — Son Twitch à 50 % au lancement

- Cartes live : lecteur interactif officiel préparé avec volume 0.5 et son activé ; lecture au clic sur Play natif (autoplay désactivé pour ces cartes).
- Le volume reste ensuite modifiable par les commandes Twitch.
- Conteneur compatible avec paysage et vidéo + chat.

# 0.13.27 — ONE IA accessible avec le chat

- La bulle IA reste visible lorsque la page ONE est en plein écran (vue vidéo + chat).
- Bulle placée au-dessus des panneaux vidéo/chat, sous son panneau de question.
- Plein écran natif Twitch inchangé ; bulle toujours masquée dans ce cas.

# 0.13.27 — Dimensions du lecteur mobile

- Mesure de la fenêtre visible au démarrage, resize, rotation et transition fullscreen.
- Nouvelles mesures à 100/300/700 ms pour suivre la stabilisation des barres du navigateur.
- Largeurs vidéo/chat complémentaires en pixels, sans écart d’arrondi. Aucun rechargement iframe.
- S’applique aux vues ONE ; ne peut pas modifier les barres système ou le contenu du fullscreen natif Twitch.

# 0.13.27 — Déclaration du thème sombre

- Ajoute color-scheme dark dans le document et le CSS racine. Couleurs theme-color et manifest déjà sombres, conservées.
- Corrige le titre de page resté en 0.11.
- La bande montrée sur les captures est la barre système Android. Sa couleur finale dépend du navigateur et du système ; cette déclaration ne garantit pas sa recoloration. Aucun changement supplémentaire aux dimensions du lecteur.

- Catalogue TikTok externe : limite portée à 5 000 vidéos ; liste repliée par défaut avec bouton « Gérer le catalogue ».
