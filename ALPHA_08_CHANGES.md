# ONE Mobile Alpha 0.8 — Account + Platform Sync

## Nouveautés
- Synchronisation automatique du profil ONE entre appareils.
- Coffre plateformes chiffré côté navigateur avant envoi au cloud.
- Restauration automatique de la clé YouTube Data API après connexion au compte ONE.
- Restauration automatique de l’identifiant client et du jeton Twitch tant que le jeton reste valide.
- Restauration de l’état TikTok et des données TikTok déjà chargées dans ONE.
- Sauvegarde automatique du coffre après connexion/déconnexion ou modification d’une plateforme.
- Vérification du cloud quand ONE revient au premier plan ou retrouve Internet.

## Sécurité
- La session ONE, la clé de chiffrement locale et les états OAuth temporaires ne sont jamais inclus dans le cloud.
- Le profil et le coffre plateformes sont chiffrés en AES-GCM dans le navigateur avant envoi.
- La clé de chiffrement est dérivée du mot de passe ONE et de l’identifiant du compte.
- Un jeton Twitch expiré devra être réautorisé par Twitch.
- TikTok 0.8 restaure l’état et le cache déjà autorisés ; une réautorisation peut être demandée si TikTok exige un nouvel accès.
