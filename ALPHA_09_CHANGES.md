# ONE Mobile Alpha 0.9 — Multi-Feed + TikTok Catalog

## Nouveautés
- Ajout d’un catalogue TikTok externe à partir de liens publics complets.
- Les TikTok externes apparaissent dans l’onglet TikTok, le feed « Pour toi » et le feed vertical.
- Lecture via le TikTok Player officiel à partir de l’identifiant de la vidéo.
- Enrichissement oEmbed tenté automatiquement (titre, créateur, miniature) avec repli local si indisponible.
- Suppression individuelle ou vidage du catalogue depuis Réglages.
- Le catalogue est stocké dans `one_tiktok_external_v09` et entre dans la synchronisation chiffrée du compte ONE.
- YouTube et Twitch restent actifs dans le feed multi-plateformes.
- TikTok OAuth demande `user.info.basic,video.list` pour les publications du compte connecté lorsque le scope est autorisé par l’application TikTok.

## Limites TikTok
- ONE ne récupère pas le flux « Pour toi » de TikTok.
- Pour les vidéos d’autres créateurs, l’utilisateur ajoute un lien public TikTok.
- Les liens courts peuvent ne pas être résolus selon les règles CORS/oEmbed de TikTok ; le lien complet `tiktok.com/@createur/video/...` est recommandé.
