# Contrôle TikTok indépendant du téléphone

Le workflow GitHub **Contrôle TikTok en arrière-plan** exécute Chromium sur un
serveur GitHub. Le téléphone peut quitter ONE ou éteindre son écran pendant ce
contrôle. Le contrôle local de ONE conserve son fonctionnement actuel.

Dans GitHub, ouvrir **Actions → Contrôle TikTok en arrière-plan → Run workflow**,
choisir **main**, puis lancer. Le contrôle des vidéos est précédé de tests du
code et de l’interface avec des réponses simulées. Consulter ensuite l’exécution
et son résumé, ou télécharger l’archive **controle-tiktok-…** contenant le rapport
JSON complet et une version lisible en Markdown. Les rapports restent sept jours.

La branche de développement exécute seulement un essai sur une vidéo, après
chargement de toutes les pages du catalogue. Les tests des pull requests ne
contactent pas TikTok. Sur main, un changement des fichiers du contrôle lance une
vérification complète ; on peut aussi le lancer manuellement. Aucune récurrence
quotidienne n’est configurée.

Le bot utilise le même module de confirmation de lecture que ONE : origine et
fenêtre du message vérifiées, état « playing » et une seconde de progression.
Le lecteur est chargé dans une page locale du serveur, avec un navigateur sans
compte ni cookies TikTok. Ce résultat décrit donc ce serveur et sa région, pas
nécessairement tous les téléphones ou le lecteur au sein de ONE.

Toutes les pages du catalogue commun doivent être chargées avant le contrôle.
Un accès refusé, un JSON invalide ou une pagination interrompue donne un contrôle
impossible, jamais « zéro vidéo » ni un résultat de lecture. Les contrôles sont
séquentiels, avec trois secondes entre les vidéos. Un refus d’accès ou une limite
de requêtes du lecteur arrête la série ; huit résultats incertains consécutifs
l’arrêtent aussi. Les lignes restantes sont conservées comme non testées. Le bot
ne change ni l’identité du navigateur ni son réseau pour contourner un refus.

Le budget de lecture est de cent minutes par exécution. Un contrôle interrompu
signale explicitement les vidéos non testées. Une relance commence un nouvel
instantané ; cette version n’a pas de reprise entre les exécutions serveur.
Le démarrage seulement est testé, pas la vidéo entière. Aucun résultat ne supprime,
ne masque ou ne republie une vidéo. Seuls les identifiants publics du catalogue
commun et les résultats sont conservés dans les rapports GitHub. Le workflow a
uniquement accès en lecture au dépôt et n’utilise aucun secret Cloudflare/TikTok.

Un résultat GitHub rouge peut indiquer un contrôle impossible, des vidéos
indisponibles ou des résultats incertains : lire le résumé pour les distinguer.
Ne pas assimiler le succès des tests avec données simulées à celui d’un contrôle
réel. L’activation doit être précédée d’un essai réel depuis GitHub.

Tests locaux : `python tests/tiktok-health-server-test.py`.
Contrôle manuel depuis un serveur disposant de Python et Chromium Playwright :
`python scripts/tiktok-health-server.py` (dépendances figées dans
`scripts/tiktok-health-requirements.txt`).
