# ONE Mobile Alpha 0.4 — TikTok OAuth

- Traite le retour TikTok `?code=...` dans ONE.
- Envoie le code OAuth au Worker Cloudflare `/exchange`.
- Enregistre localement le profil TikTok renvoyé par le Worker.
- Affiche TikTok comme connecté dans Compte ONE.
- Vérifie le paramètre OAuth `state`.
- Nettoie l’URL après le retour TikTok.
- Demande uniquement le scope `user.info.basic`, correspondant au scope actuellement configuré pour la review TikTok.
- Cache PWA passé en Alpha 0.4 pour forcer la mise à jour.

Worker attendu : `https://one-tiktok-api.moulinanthony60.workers.dev` avec la route POST `/exchange`.
Redirect URI attendu : `https://moulinanthony60-creator.github.io/one-mobile-alpha/`.
