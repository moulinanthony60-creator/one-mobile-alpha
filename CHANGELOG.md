
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
