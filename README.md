# ONE Mobile Alpha 0.13.7 — Diversité TikTok

## Déploiement
Extraire le ZIP et copier son contenu à la racine du site existant. index.html, sw.js et les manifests se trouvent directement à la racine ; conserver le dossier icons. Aucune compilation nécessaire. Le worker de profil fourni est inchangé et son service existant reste nécessaire pour les fonctions cloud.

## Changements
- Pool TikTok construit avant le classement : vidéos enregistrées du compte + catalogue externe, sans limite supplémentaire de candidats.
- Validation des identifiants, rejet des entrées invalides et des publications explicitement marquées photo/non lisibles ; une durée absente ne suffit plus à exclure une vidéo.
- Dédoublonnage par identifiant TikTok après validation : un doublon compte invalide ne masque plus un import valide.
- Suppression du biais de position dans le catalogue. Statistiques de vues/J’aime, préférences, abonnements et historique participent au score.
- Chaque TikTok éligible passe en tête avant qu’un précédent recommence, à pool inchangé. Le score départage les candidats ayant le même historique de passage. Ordre TikTok stable pendant la session, y compris après un rechargement des données locales.
- Pour toi conserve le mélange YouTube/TikTok/Twitch après classement des candidats.
- Suppression du bouton plein écran ONE des fiches chaînes ; contrôles et permissions fullscreen natifs YouTube/Twitch conservés.
- Version, manifests et cache du service worker mis à jour. Les anciennes clés de préférences et historiques restent compatibles.

## Vérification sur téléphone
1. Charger au moins trois vidéos TikTok dans le compte et/ou le catalogue externe.
2. Vérifier leur présence dans TikTok et Pour toi ; les contenus « Pas pour moi » restent exclus.
3. Relancer complètement ONE plusieurs fois : le premier TikTok doit tourner sur tout le pool éligible. Changer d’onglet dans la même session ne consomme pas un nouveau tour.
4. Tester le swipe vertical et les contrôles fullscreen intégrés des fiches YouTube/Twitch.

La version exploite les vidéos réellement enregistrées dans ONE. Elle ne crée pas de vidéos et ne peut pas élargir un compte/catalogue qui ne contient réellement que deux vidéos. Les données privées de ton appareil et la lecture des plateformes n’ont pas été testées ici. La disponibilité d’une vidéo publique dépend encore de TikTok.

## Diagnostic technique
La console expose window.oneTikTokPoolAudit : nombres reçus du compte et du catalogue, entrées invalides, doublons, vidéos exploitables et éligibles. Aucun identifiant ni jeton n’est affiché dans ce diagnostic.

Base : 0.13.6 publiée sur GitHub, commit 0062b7f310f8e825d88551a9f9bb0a8ba58f3f75. index.html récupéré du dépôt est identique octet par octet à celui du site publié au moment de la récupération. Voir VALIDATION.md.
