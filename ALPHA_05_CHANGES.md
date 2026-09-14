# ONE Mobile Alpha 0.5

- Profil ONE local avec nom et ID ONE.
- Sauvegarde/restauration cloud chiffrée côté navigateur (AES-GCM).
- Les clés YouTube, Twitch et les jetons TikTok/Twitch sont exclus de la sauvegarde cloud.
- Worker Cloudflare `ONE_PROFILE_WORKER.js` fourni. Créer un namespace KV et le lier au Worker sous le nom `ONE_PROFILES`.
- Après déploiement du Worker, coller son URL dans Compte ONE > Sauvegarde cloud chiffrée.
- TikTok OAuth Alpha 0.4 conservé.

## ONE Cloud connecté
- Worker préconfiguré : `https://one-profile-api.moulinanthony60.workers.dev`
- Sauvegarde/restauration chiffrée activée sans saisie manuelle de l’URL.
- Cache PWA incrémenté pour forcer le chargement de cette version.
