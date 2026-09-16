# ONE Mobile Alpha 0.13.37 — Audio Stop + State Hard + Twitch FS

Correctif ciblé :
- l’onglet courant est persisté immédiatement et reste prioritaire après refresh ;
- un seul lecteur TikTok peut produire du son : l’ancien est muté + mis en pause avant le suivant ;
- J’aime / Pas pour moi / Favori ne reconstruisent pas le lecteur vertical actif ;
- bouton ⛶ Twitch injecté au-dessus des cartes ; tentative plein écran paysage après 5 s quand le navigateur l’autorise.

Note Android : un navigateur peut refuser un passage automatique en plein écran sans geste utilisateur. Le bouton ⛶ est donc la voie garantie quand l’API Fullscreen est autorisée.
