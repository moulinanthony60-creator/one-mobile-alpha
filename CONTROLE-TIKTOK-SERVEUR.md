# Contrôle TikTok : observations serveur à confirmer

Le workflow **Contrôle TikTok en arrière-plan** démarre toutes les six heures
(minute 17, UTC ; GitHub peut retarder un lancement) et manuellement dans Actions.
Le téléphone peut être éteint. Un lot contient au plus 40 contrôles séquentiels,
avec dix secondes entre les lecteurs et trente secondes au plus par vidéo.

L’historique est conservé sur la branche `one-tiktok-health-data`, dans
`state.json`. Chaque passage reprend les vidéos jamais contrôlées avant les
anciennes observations. Le catalogue est entièrement paginé avant toute écriture.
Les erreurs sont revérifiées après six heures, les lectures réussies après sept
jours. Une vidéo précédemment lisible peut servir de référence au début du lot.

## Portée des preuves

Une lecture confirmée exige l’état « playing » et au moins deux secondes de
progression dans le lecteur officiel. L’origine TikTok et la fenêtre source
sont vérifiées. Cela prouve le démarrage dans cet environnement à cet instant,
pas la lecture intégrale, le son ou la lecture sur un autre téléphone.

Le code 1001 `INVALID_VIDEO` signifie que le lecteur ne trouve pas le média.
Il reste un **signalement serveur à confirmer dans ONE**, même s’il se répète.
Plusieurs réponses d’un même lecteur ne sont pas des preuves indépendantes.
Les erreurs 2001, délais, erreurs réseau et restrictions de lecture automatique
restent incertains. Aucun résultat ne promet une certitude à 100 %.

Les limites TikTok (2005, HTTP 429) et refus HTTP 403 arrêtent le lot avec
une pause persistante d’au moins 24 heures ; `Retry-After` peut l’allonger.
Huit observations incertaines consécutives imposent une pause de six heures.
Aucun changement d’identité, de réseau ou d’origine ne contourne un refus.

## Retraits suspendus et signalements répétés

**Les observations du bot ne déclenchent plus aucun retrait automatique.**
La liste `hidden.json` publiée reste vide avec la politique `review_required`,
y compris si un ancien historique contient trois confirmations et `hiddenAt`.
Le bot continue de parcourir le catalogue et de conserver les observations.

Trois signaux 1001 sur des exécutions distinctes, espacés d’au moins six heures,
produisent seulement une entrée dans `reviewRequired` du rapport JSON.
Chaque passage qui ajoute un signal doit aussi réussir à lire une autre vidéo.
Le nombre apparaît dans `reviewRequiredCount` ; le rapport indique explicitement
`automaticWithdrawalsEnabled: false`. Une lecture réussie remet la série à zéro.
Les anciens compteurs servent au suivi ; ils ne sont pas une autorisation de retrait.

La vérification d’un signalement nécessite d’ouvrir le lien dans ONE et sur TikTok.
Le bot serveur ne sait pas effectuer cette confirmation sur le téléphone de l’utilisateur.
Une éventuelle future réactivation des retraits devra reposer sur des preuves
supplémentaires et une modification explicite de cette politique. Aucun bouton,
réglage ou variable d’environnement ne permet de réactiver les retraits actuels.

Aucun contenu TikTok, lien de la base ONE ou favori n’est effacé.
Le Worker Cloudflare et les lecteurs des utilisateurs ne sont pas modifiés.
La publication d’une liste vide rétablit les liens au prochain rafraîchissement
du catalogue. ONE garde au plus cinq minutes la réponse distante en mémoire.

## Rapports et validation

Les rapports JSON/Markdown distinguent les lectures démarrées, les vidéos
**signalées indisponibles (à confirmer)**, les erreurs incertaines et les vidéos
non testées. Ils conservent les dates, le nombre testé pendant le passage et
les signalements répétés à examiner. Les artefacts restent disponibles 30 jours.
Le statut rouge GitHub peut signaler des observations incertaines ; il ne prouve
pas une indisponibilité et n’indique pas la fin du passage sur tout le catalogue.

Le jeton GitHub Actions est transmis uniquement aux étapes de stockage, jamais
au navigateur. Le script écrit deux fichiers sur la branche de données, jamais
sur `main`, et refuse les écritures concurrentes. Un historique corrompu ou
inaccessible n’est pas remplacé. Le contrôle de diagnostic ne publie pas de données.

Tests :

- `node --test tests/tiktok-health.test.cjs tests/tiktok-availability.test.cjs tests/tiktok-playback.test.cjs`
- `python tests/tiktok-health-server-test.py`
- `python tests/tiktok-health-state-test.py`
- `python tests/tiktok-health-browser.py`
- `python tests/tiktok-availability-browser.py`

Référence du lecteur : https://developers.tiktok.com/docs/en/embed-player
