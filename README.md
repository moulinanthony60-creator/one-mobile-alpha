# ONE 0.13.50

Publier le contenu du ZIP à la racine du site.

- TikTok / Pour toi : renouvellement de toute la sélection avec tirage pondéré par les préférences, historique sur les 60 premières vidéos et alternance des créateurs. Ordre conservé durant la consultation.
- Pour toi : actualiser efface la recherche et revient au feed normal. Les recherches des autres onglets sont conservées.
- Chaînes : résolution du compte YouTube par son identifiant public et priorité aux correspondances exactes, puis aux abonnés pour départager les noms identiques. Aucune certification de compte officiel n'est inventée.
- Twitch : contrôle de l'état réellement en pause après l'ouverture du plein écran et du chat, reprise limitée à la transition, conservation du lecteur existant. Correction à confirmer sur téléphone.

Vérifications locales : syntaxe, renouvellement au-delà de la première vidéo, stabilité pendant une session, historique, recherche après refresh, priorité des chaînes suivies, commande pause/reprise TikTok, reprise Twitch simulée et arrêt des lecteurs hors écran. Pas de validation Android réelle.

Références API :
https://developers.google.com/youtube/v3/docs/channels/list
https://dev.twitch.tv/docs/embed/video-and-clips/
