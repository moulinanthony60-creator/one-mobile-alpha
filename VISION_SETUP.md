# Activer ONE Vision — alpha privée

Le ZIP seul n’active pas le serveur. Ne remplacez aucun Worker existant.

1. Créer un Worker Cloudflare distinct nommé `one-vision-api`.
2. Remplacer son code de démarrage par `ONE_VISION_WORKER.mjs`, puis déployer.
3. Ajouter les secrets Cloudflare `OPENAI_API_KEY` (clé OpenAI) et `VISION_ACCESS_TOKEN` (code privé aléatoire long, distinct de la clé OpenAI).
4. Ajouter la variable `OPENAI_VISION_MODEL` avec un modèle accessible au compte et acceptant les images dans Responses API. Ajouter `ALLOWED_ORIGIN` = `https://moulinanthony60-creator.github.io`.
5. Déployer les fichiers du site. Dans ONE IA → Connexion au service visuel, saisir l’URL HTTPS réelle du Worker et le code privé ONE Vision. Ne jamais saisir la clé OpenAI dans ONE, GitHub ou un message.
6. Joindre une capture et appuyer sur Analyser la capture. La capture et la question sont envoyées au Worker puis à OpenAI. Le Worker ne les enregistre pas ; la requête utilise `store:false`. Les règles de conservation du fournisseur restent applicables.

Cette version est un accès privé de test, protégé par un code partagé. Ne pas diffuser ce code ou ouvrir le service au public. Avant un lancement public : authentification individuelle, quotas serveur et limites de dépense nécessaires. Les appels OpenAI sont facturés au compte API configuré.

Aucun déploiement ni appel OpenAI réel effectué ici. Les tests utilisent une réponse simulée.

Documentation : https://developers.openai.com/api/docs/guides/images-vision

## Interactions plateformes

- Tchat Twitch officiel intégré : connexion Twitch nécessaire pour écrire ; cookies ou restrictions mobiles peuvent demander une fenêtre de connexion.
- YouTube : commentaires/likes externes non activés. Il manque une connexion Google OAuth autorisant ces actions. La clé de lecture seule existante ne les active pas.
- TikTok Display API : pas de publication de commentaire ou like via cette intégration.
- Les boutons J’aime de ONE restent internes à ONE.
