
# 0.13.25 — Déclaration du thème sombre

- Ajoute color-scheme dark dans le document et le CSS racine. Couleurs theme-color et manifest déjà sombres, conservées.
- Corrige le titre de page resté en 0.11.
- La bande montrée sur les captures est la barre système Android. Sa couleur finale dépend du navigateur et du système ; cette déclaration ne garantit pas sa recoloration. Aucun changement supplémentaire aux dimensions du lecteur.


# 0.13.24 — Dimensions du lecteur mobile

- Mesure de la fenêtre visible au démarrage, resize, rotation et transition fullscreen.
- Nouvelles mesures à 100/300/700 ms pour suivre la stabilisation des barres du navigateur.
- Largeurs vidéo/chat complémentaires en pixels, sans écart d’arrondi. Aucun rechargement iframe.
- S’applique aux vues ONE ; ne peut pas modifier les barres système ou le contenu du fullscreen natif Twitch.


# 0.13.23 — ONE IA accessible avec le chat

- La bulle IA reste visible lorsque la page ONE est en plein écran (vue vidéo + chat).
- Bulle placée au-dessus des panneaux vidéo/chat, sous son panneau de question.
- Plein écran natif Twitch inchangé ; bulle toujours masquée dans ce cas.


# 0.13.22 — Son Twitch à 50 % au lancement

- Cartes live : lecteur interactif officiel préparé avec volume 0.5 et son activé ; lecture au clic sur Play natif (autoplay désactivé pour ces cartes).
- Le volume reste ensuite modifiable par les commandes Twitch.
- Conteneur compatible avec paysage et vidéo + chat.


# 0.13.21 — Chat escamotable

- Retire la barre Live + tchat / Retour au live et le titre ONE du chat dans la vue partagée.
- Flèche sur le bord gauche du chat pour masquer/afficher ; vidéo agrandie quand le chat est masqué.
- Les iframes vidéo/chat restent en place au basculement, sans rechargement.
- Cache et version actualisés.

# 0.13.20 — Plus de place pour le tchat

- Retire le message ONE « Connecte-toi à Twitch… » au-dessus du chat.
- La zone du chat utilise la place libérée ; connexion et lecteur Twitch inchangés.
- Version et cache actualisés.


# 0.13.19 — Bulle Chat et vue vidéo + chat

- Bulle Chat sur les lives visibles : vidéo à gauche/chat à droite en paysage, empilés en portrait. Retour au live sans déplacer ni recréer son iframe.
- Ouverture du chat depuis sa bulle : demande fullscreen sur la page ONE (vidéo et chat inclus), avec navigationUI hide. Repli sur la fenêtre disponible si le navigateur refuse.
- Fonds de page sombres pour éviter une zone blanche issue du site. Les barres système restent contrôlées par le téléphone.
- Plein écran natif Twitch inchangé : il ne contient pas le chat ONE.


# 0.13.18 — Lecture native Twitch et chat agrandi

- Cartes live Twitch : lecteur natif chargé lorsque la carte devient visible, sans bouton Play/Lire ONE redondant. Autoplay demandé sans son ; un appui natif peut rester nécessaire sur mobile.
- Aucun masquage des bandeaux internes Twitch.
- Chat : Agrandir/Réduire, demande de plein écran avec repli sur toute la fenêtre ONE si refusé. Ce mode agrandit le chat seul ; le fullscreen natif vidéo ne permet pas de superposer le chat ONE.
- Moteur vertical TikTok inchangé.

# 0.13.17 — Retour à la recherche web uniquement

- Retire capture, analyse visuelle, configuration du serveur et code d’accès du panneau IA.
- Conserve bulle, question, titre/créateur et recherche web.
- Exclut le Worker vision et son guide du ZIP ; aucune suppression sur Cloudflare.
- Version, manifests, cache et documentation actualisés.


# 0.13.16 — Analyse de capture et tchat Twitch

Intégration serveur vision préparée avec bouton Analyser la capture, adresse de serveur et code privé. Worker séparé fourni : voir VISION_SETUP.md. Activation réelle requiert son déploiement et une clé API configurée côté serveur. Tchat Twitch officiel intégré dans les cartes live et fiches live ; connexion Twitch nécessaire pour écrire. Commentaires/likes YouTube et TikTok non activés.


# 0.13.15 — Lecture paysage automatique

Sur appareil tactile, un lecteur vidéo ouvert est agrandi dans l’espace disponible en paysage. Retour à la disposition normale en portrait, sans recréer l’iframe. Bulle IA conservée. Aucun bouton fullscreen ajouté ; les barres du navigateur peuvent rester visibles. Le plein écran natif garde son fonctionnement. Le feed vertical conserve sa présentation actuelle.


# 0.13.14 — Bulle ONE IA et découverte YouTube

- Retire le bouton Grand lecteur ONE ajouté en 0.13.13 ; conserve les contrôles fullscreen natifs.
- Bulle IA déplaçable pendant la lecture dans ONE, position locale mémorisée, déplacement au clavier et séparation clic/glissement. Masquée en plein écran natif et lorsque le panneau IA est ouvert.
- YouTube : deux vidéos par chaîne suivie, puis autres créateurs sans doublons ; complément via vidéos populaires publiques YouTube (région FR), avec la clé existante.
- Analyse visuelle et musique écran verrouillé toujours non activées.


# 0.13.13 — Priorité aux chaînes suivies

- Twitch : récupération directe des lives suivis et priorité avant les autres, tri par spectateurs dans chaque groupe.
- YouTube : deux derniers éléments publics disponibles de la playlist Uploads par chaîne suivie, avant les autres vidéos, sans doublons.
- Priorité dans les onglets sans recherche active ; rafraîchissement à la consultation, cache mémoire de trois minutes. Connexions existantes nécessaires.
- Grand lecteur ONE conserve le bouton IA ; le plein écran natif reste disponible mais masque les commandes ONE.
- Musique écran verrouillé/arrière-plan toujours non disponible pour les playlists YouTube intégrées ; nécessite une autre source audio compatible.


# 0.13.12 — ONE IA depuis les lecteurs

Bouton contextuel dans cartes, lecteur vertical, lecteur vidéo et fiches chaînes. Panneau avec question, recherche web existante et capture locale (10 Mo max). Aucune analyse des images/son/transcription du lecteur. Service vision non connecté : identification visuelle et résumé réel de vidéo non disponibles. Aucun envoi de capture. Fermeture sans navigation hors du lecteur.


## 0.13.11 — Chaînes et navigation
- Barre du bas : Créer, ONE IA, Abonnements, Réglages. Logo ONE cliquable pour revenir à l’accueil.
- Bouton Retour à l’accueil dans Abonnements ; croix du studio conservée.
- Ouvrir et noms des chaînes affichent les fiches internes ONE (YouTube/Twitch/TikTok disponibles).
- Avatars officiels YouTube/Twitch chargés par lots avec les connexions existantes, cache en mémoire, initiale en secours. Les miniatures de vidéos TikTok ne sont plus présentées comme logos.
- Cartes créateurs : espacement, retour à la ligne et images circulaires.
- Musique : lecture arrière-plan/écran verrouillé NON implémentée pour les playlists YouTube. L’interface indique cette limite. Une source audio compatible sera nécessaire.
- Règles du lecteur YouTube : https://developers.google.com/youtube/terms/developer-policies#i.-additional-prohibitions

# 0.13.10 — Pour toi sans YouTube ni Twitch

- Filtre Pour toi dans la liste, le lecteur vertical et l’historique de sélection.
- Conserve la rotation TikTok et les onglets dédiés, abonnements, connexions et studio.
- État vide orienté TikTok ; version, manifests et cache actualisés.

# 0.13.9 — Fermer Créer

- Croix accessible en haut à droite, visible au défilement.
- Retour à l’accueil Pour toi, aperçu vidéo mis en pause et préparation conservée.
- Échap et bouton Retour au Feed utilisent la même fermeture.
- Version, manifests et cache actualisés.

# 0.13.8 — Salon ONE et studio multiplateforme

- Remplace Découvrir dans la barre du bas par Créer.
- Catégories : Pour toi, ONE, TikTok, YouTube, Twitch, Musique, Ciné.
- Salon ONE vide réservé au futur contenu natif.
- Studio vidéo courte/photo/texte/live avec aperçu local et choix de destinations, toutes non activées ; aucune simulation de publication.
- Rotation, moteurs, abonnements, fiches et connexions/sync conservés.
- Fullscreen natif des fiches conservé sans bouton ONE redondant.
- Version, README, manifests et cache actualisés ; clés d’historique conservées.
# 0.13.7 — Diversité TikTok et fullscreen natif

## Corrigé
- Réunit et valide les sources TikTok avant classement, avec dédoublonnage après validation.
- Charge le catalogue après initialisation de ses clés de stockage ; une donnée compte malformée n’empêche pas le chargement externe.
- Ne confond plus absence de durée et impossibilité de lecture ; exclut les publications explicitement non vidéo.
- Retire le filtre par noms de créateurs fictifs du pool TikTok issu de données réelles.
- Remplace le biais lié à la position par les statistiques disponibles et garantit un passage en tête de chaque candidat éligible avant répétition, indépendamment de l’écart de score.
- Mémorise les passages en tête par ID vidéo canonique, en conservant un ordre TikTok stable pendant la session.
- Supprime le bouton ONE et sa fonction fullscreen des fiches chaînes. Conserve fs=1 et allowfullscreen.
- Met à jour les deux manifests, leur URL de cache, le README et le service worker.

## Conservé
- Moteur vertical TikTok stable hérité de 0.12.6, inchangé par rapport à la base 0.13.6.
- Classement Twitch par viewers, abonnements et lecteurs natifs.
- Mélange des plateformes dans Pour toi.

---

# 0.13.6 — Rotation + Fullscreen

## Corrigé
- Supprime la rotation en ping-pong entre deux Tops : mémoire glissante sur 5 ouvertures.
- Rotation appliquée au Pour toi et renforcée pour TikTok.
- Ajoute un bouton Plein écran aux lecteurs de fiches chaînes YouTube/Twitch.
- Active explicitement le fullscreen YouTube (`fs=1`) et les permissions fullscreen des iframes.

## Conservé
- Classement Twitch par viewers de 0.13.3.
- Abonnements séparés par plateforme.
- Channel Hub/Player de 0.13.5.
- Moteur vidéo vertical TikTok stable.

## 0.13.26
Croix flottante pour quitter le plein écran ONE en portrait ou paysage, chat ouvert ou replié. Empêche la réouverture immédiate du mode paysage après fermeture.
