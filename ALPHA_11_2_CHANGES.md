# ONE Mobile Alpha 0.11.2 — Android Share Target

- Cible de partage Android déclarée avec des chemins absolus sous `/one-mobile-alpha/`.
- Identifiant PWA stable `/one-mobile-alpha/`.
- `start_url`, `scope`, icônes et `share_target.action` alignés sur le chemin GitHub Pages réel.
- `prefer_related_applications: false` explicite pour l’installabilité Chromium.
- Réception des paramètres `share_title`, `share_text` et `share_url` sans dépendre d’un marqueur supplémentaire.
- Cache Service Worker renouvelé pour forcer la prise en compte du manifeste.

Important : désinstaller l’ancienne PWA ONE puis installer cette version depuis Google Chrome Android. Le Web Share Target n’apparaît dans le sélecteur Android qu’après installation par un navigateur compatible.
