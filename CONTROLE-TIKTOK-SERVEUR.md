# Contrôle automatique TikTok avec lectures réelles de ONE

Le contrôle croise les essais du serveur avec les démarrages réellement observés dans ONE. Il ne prétend pas certifier une suppression ni garantir la lecture complète, le son ou tous les appareils.

## Comportement

- Une vidéo avance de deux secondes dans le lecteur actif et visible de ONE : elle redevient visible immédiatement sur cet appareil. ONE transmet seulement son identifiant et une observation positive au service partagé, sans compte, jeton de session ni cookie.
- Le serveur horodate cette observation. Pendant sept jours, elle protège la vidéo sur tous les appareils et remet sa série d'erreurs à zéro. Aucun signalement négatif provenant d'un navigateur n'est accepté par ce service.
- Le bot poursuit ses essais du catalogue par lots de 40, toutes les six heures. Les vidéos non testées passent avant les reprises. Une lecture confirmée par le bot remet également les erreurs à zéro.
- Trois réponses explicites `1001 / invalid_video`, sur trois exécutions distinctes et espacées d'au moins six heures (douze heures au total), peuvent masquer temporairement une vidéo. Chaque exécution qui ajoute une erreur doit aussi avoir réussi à lire une vidéo témoin.
- Ce masquage exige une collecte ONE disponible et récente, aucune lecture ONE réussie dans les sept derniers jours et des erreurs toutes postérieures à l'ouverture de la collecte. Les anciennes erreurs ne déclenchent donc pas un retrait immédiat à l'activation.
- Le masquage expire au plus tard 24 heures après la dernière erreur explicite. Les reprises automatiques peuvent le renouveler uniquement avec une nouvelle erreur explicite. Une nouvelle lecture réussie l'annule. La base, les liens personnels et les favoris sont conservés.
- Une erreur réseau, un délai dépassé, une erreur serveur `2001`, un refus d'autoplay `3002` ou une limitation TikTok ne suffit jamais à masquer. Le bot s'arrête temporairement après huit résultats incertains consécutifs, respecte `Retry-After` et reprend son historique.
- Si la collecte partagée est absente, périmée ou inaccessible, le bot n'autorise aucun masquage. Le navigateur affiche les vidéos plutôt que d'appliquer un ancien retrait hors ligne.

L'absence de lecture récente n'est pas une preuve de suppression. Cette politique choisit un masquage temporaire et réversible, pas une suppression définitive. Une observation client n'est pas infalsifiable : elle ne peut que restaurer ou protéger une vidéo, jamais en faire retirer une.

## Installation du service partagé

Le fichier **SERVEUR/tiktok-health-worker.mjs** est un Worker autonome, à publier sous **one-tiktok-health** dans le compte Cloudflare utilisant le sous-domaine `moulinanthony60.workers.dev`. Il ne remplace surtout pas `one-comments-api`, qui assure le catalogue, les commentaires et les salons.

1. Créer une base D1 dédiée, par exemple `one-tiktok-health`.
2. Créer le Worker `one-tiktok-health` avec le contenu exact de `SERVEUR/tiktok-health-worker.mjs`.
3. Lui ajouter une liaison D1 nommée **HEALTH** vers cette base et déployer. Les trois tables dédiées sont créées automatiquement.
4. Vérifier `https://one-tiktok-health.moulinanthony60.workers.dev/health` : la réponse doit contenir `ok: true`, `policy: "temporary-v1"`, `startedAt`, `generatedAt` et `entries`.
5. Ouvrir ONE, laisser une vidéo TikTok progresser deux secondes et vérifier que son identifiant apparaît dans `entries`. Une tentative bloquée ou une vidéo simplement préchargée ne doit pas apparaître.
6. Le prochain contrôle planifié sur main récupère ces observations. Tant que ce service n'est pas effectivement disponible, les masquages restent automatiquement désactivés.

Le Worker ne lit, ne vérifie et ne transmet aucun jeton de session. Aucun accès au service de profil et aucun secret ne sont requis. Ne pas insérer un jeton GitHub ou Cloudflare dans le frontend.

## Données et limites

`GET /health` fournit uniquement des identifiants vidéo et leur dernière lecture réussie, pour sept jours au maximum. `POST /playback` exige une origine autorisée, un corps borné et un identifiant valide. Il refuse tout en-tête Authorization et tout champ autre que l'identifiant vidéo et deux secondes de progression. Il n'accède à aucune session ONE.

La collecte ne stocke ni nom, ni jeton, ni IP, ni historique de visionnage par personne. Une limite globale de 120 rapports par minute borne les écritures ; ses compteurs ne contiennent aucun identifiant personnel et sont purgés après deux heures. La table des observations est bornée à 5 000 identifiants vidéo. Les lectures agrégées expirent après sept jours. Le navigateur déduplique les rapports et conserve une preuve locale bornée pendant sept jours. Les invités bénéficient du même signalement positif sans transmettre de session.

Le fichier `hidden.json` utilise le format 2 et `withdrawalPolicy: "temporary-v1"`, avec une échéance par vidéo. Les listes anciennes ne peuvent pas activer cette politique. Les observations partagées sont actualisées chaque minute quand ONE est visible, sans reconstruire le lecteur actif ni modifier le son. Une restauration partagée peut donc prendre environ une minute, plus les délais réseau.

## Rapports et vérification

La branche `one-tiktok-health-data` conserve `state.json` et `hidden.json`. `state.json.lastRun` désigne l'exécution ayant publié l'avancement. Le rapport distingue vidéos parcourues, démarrages serveur, signalements indisponibles, résultats incertains, vidéos non testées, lectures ONE et masquages temporaires. Un lot terminé ou une exécution GitHub rouge ne signifie pas que tout le catalogue a été parcouru.

Les tests vérifient les messages inter-origines, deux secondes de progression réelle, les préchargements et onglets cachés, l’absence de transmission de credentials, les requêtes SQL sur SQLite, la limitation de débit, la protection de sept jours, l'expiration de 24 heures, la restauration locale/partagée et le comportement sans collecte. Les tests du lecteur et du son existants sont conservés.
