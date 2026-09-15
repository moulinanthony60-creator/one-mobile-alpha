# ONE Mobile Alpha 0.12.3 — Instant Swipe

- Base fonctionnelle TikTok Safe-Sync conservée.
- Un seul lecteur TikTok actif + un lecteur N+1 préchauffé en arrière-plan.
- Le lecteur suivant est préchargé muet, avance jusqu’à une première frame puis se met en pause.
- Au swipe, ONE réutilise ce lecteur déjà chaud au lieu de recréer un iframe.
- La première frame TikTok peut remplacer immédiatement la miniature, puis la lecture reprend.
- Nettoyage automatique des anciens préchargements : deux lecteurs TikTok maximum.
- Miniature de secours conservée si le préchauffage échoue.
