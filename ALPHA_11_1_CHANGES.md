# ONE Alpha 0.11.1 — Android Share Fix

## Correction
- cible de partage Android déclarée explicitement dans le manifeste PWA ;
- ajout d’un `id` stable pour l’application installée ;
- cible de partage ramenée à la racine de la PWA (`./?one_share=1`) ;
- manifeste versionné dans `index.html` pour forcer sa relecture ;
- cache du service worker incrémenté ;
- réception TikTok conservée : le lien partagé préremplit le catalogue TikTok.

## Important sur Android
Une cible de partage est enregistrée par Android lors de l’installation de la PWA. Après déploiement de cette version, désinstaller l’ancienne ONE du téléphone puis réinstaller ONE depuis Chrome. Une simple mise à jour de la PWA peut ne pas suffire à faire apparaître ONE dans la feuille de partage.
