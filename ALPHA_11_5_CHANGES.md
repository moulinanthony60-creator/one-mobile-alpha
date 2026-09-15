# ONE Mobile Alpha 0.11.5 — Android Share Target

- Conserve le correctif d’installation Chrome de 0.11.4.
- Remplace la cible de partage par une page dédiée `share.html`, selon le modèle GET documenté par Chrome/MDN.
- `share_target.action` ne contient plus de query string.
- Suppression de `enctype` pour GET (inutile).
- `share.html` retransmet `share_title`, `share_text` et `share_url` vers ONE.
- `share.html` est préchargée par le service worker.
- `manifest.webmanifest` est aligné sur `manifest.json` pour éviter deux définitions différentes.
- Une désinstallation/réinstallation depuis Chrome est nécessaire pour forcer Android à réenregistrer la cible de partage.
