# ONE Mobile Alpha 0.11.3 — Android Share POST

- Passage du Web Share Target Android de GET vers POST.
- Action dédiée : `/one-mobile-alpha/share-target`.
- Le service worker intercepte le POST, lit `title`, `text` et `url`, puis redirige vers ONE.
- Le flux d’import TikTok existant reçoit ensuite le lien partagé et préremplit le catalogue TikTok.
- Cache du service worker passé à `one-mobile-alpha-113-sharepost-v1`.
- Après déploiement, désinstaller l’ancienne PWA ONE puis la réinstaller depuis Google Chrome afin qu’Android réenregistre la cible de partage.
