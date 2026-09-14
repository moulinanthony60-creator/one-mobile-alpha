# ONE Mobile Alpha 0.7 — Sync

## Nouveautés

- Synchronisation automatique du profil ONE, activée par défaut.
- Après connexion sur un nouvel appareil, ONE tente de restaurer automatiquement la sauvegarde cloud chiffrée.
- À la création d'un compte, le profil local existant est migré automatiquement vers le cloud lorsque la synchronisation est activée.
- Détection au démarrage d'une sauvegarde cloud plus récente et restauration intelligente.
- Affichage de la dernière synchronisation dans Compte ONE.
- Les modifications du profil de recommandation déclenchent une sauvegarde cloud différée pour éviter les requêtes excessives.
- Boutons de sauvegarde/restauration manuels conservés.

## Sécurité

- Le chiffrement AES-GCM reste effectué dans le navigateur.
- La clé de chiffrement reste dérivée du mot de passe du compte ONE et de l'ID ONE.
- Les clés API, tokens OAuth, session ONE et informations de chiffrement locales restent exclus de la sauvegarde cloud.
- La synchronisation automatique n'envoie pas le mot de passe.

## Compatibilité

- Compatible avec le Worker `one-profile-api` v0.6.2 et les bindings `ONE_ACCOUNTS` / `ONE_PROFILES`.
- TikTok, Twitch, YouTube, Shopping Live et l'ancien export/import manuel sont conservés.
