# ONE Mobile Alpha 0.13.30 — IA Router + Audio

Base : 0.13.29 hotfix.

- ONE IA sépare maintenant les questions personne / action-contexte / produit / général.
- Les questions « qui est sur la vidéo ? » ne doivent plus déclencher une réponse Shopping/matériel.
- Les recherches ONE IA demandent une réponse en français et privilégient la publication exacte (URL/ID + titre + créateur).
- TikTok : nouvelle relance audio sur le geste de swipe pour réappliquer `unMute` au lecteur actif.
- TikTok : remise au début lorsqu'une vidéo quitte l'écran (`seekTo(0)`), tout en conservant le préchargement rapide.

À tester sur Android réel : le navigateur/TikTok peut encore appliquer ses propres règles d'autoplay audio.


## 0.13.33
- Correctif audio TikTok direct au geste conservé.
- Bouton ONE plein écran disponible sur Twitch.
- Tentative de verrouillage paysage lors du plein écran, avec retour propre si Android le permet.
- ONE IA et Chat restent dans le conteneur ONE plein écran.
