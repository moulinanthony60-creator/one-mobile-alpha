# Contrôle du catalogue TikTok

Dans ONE, ouvrir les réglages, puis **Vérifier les vidéos TikTok**, ou utiliser
**Vérifier les vidéos** au-dessus du catalogue TikTok. Cliquer sur **Lancer le contrôle**.

Le contrôle charge un instantané du catalogue commun via sa pagination existante,
déduplique les identifiants et teste chaque vidéo dans le lecteur officiel TikTok.
Il vérifie un état de lecture actif et au moins une seconde de progression entre
deux mesures. Une réponse HTTP, des métadonnées ou un lecteur prêt ne suffisent pas.

| Résultat | Signification |
| --- | --- |
| Lecture démarrée | Le lecteur a confirmé une progression sur cet appareil. |
| Indisponible lors du test | Le lecteur a renvoyé `INVALID_VIDEO` (1001). |
| À vérifier | Délai dépassé, problème réseau, lecture bloquée ou autre résultat incertain. |
| Lien invalide | L’identifiant du catalogue n’est pas un identifiant TikTok valide. |
| Non testée | La vidéo attend encore son contrôle ou celui-ci a été interrompu. |

Les vérifications sont séquentielles, sans son, avec trois secondes de pause entre
les vidéos et un délai de vingt secondes par lecteur. Fermer la fenêtre, passer
ONE en arrière-plan ou perdre le réseau arrête le contrôle et retire le lecteur.
**Reprendre** continue les vidéos restantes tant que la page n’a pas été rechargée.
**Réessayer les problèmes** relance les résultats incertains et indisponibles.
**Exporter le rapport** télécharge toutes les lignes, y compris les vidéos non
testées et la date de chaque contrôle. L’écran affiche les trente derniers résultats.

Ce contrôle vérifie le **démarrage**, pas la vidéo entière, et ne garantit pas
la disponibilité future ni celle dans une autre région ou sur un autre appareil.
Les contenus ajoutés après le chargement seront inclus dans le prochain nouveau
contrôle. Les liens personnels, contenus du compte TikTok connecté, YouTube et
Twitch ne sont pas inclus. Aucun résultat ne supprime, ne masque ou ne republie
une vidéo. Les résultats restent en mémoire dans la page ; aucun serveur ne les reçoit.

Il s’agit d’un contrôle par lot lancé dans ONE, pas d’un service permanent lorsque
l’application est fermée. Cette version ne nécessite aucune modification du Worker
Cloudflare. L’API publique refusant les requêtes de l’environnement de développement
(HTTP 403), le parcours complet sur le catalogue de production reste à vérifier
depuis un téléphone ayant accès à ONE.

Validation locale : `node --test tests/tiktok-health.test.cjs tests/tiktok-playback.test.cjs`.
Test du panneau dans Chromium avec des réponses TikTok simulées :
`python tests/tiktok-health-browser.py` (nécessite Playwright et Chromium).
Ces simulations vérifient le comportement du contrôle, pas la disponibilité réelle des vidéos.

Référence du protocole officiel :
https://developers.tiktok.com/docs/en/embed-player
