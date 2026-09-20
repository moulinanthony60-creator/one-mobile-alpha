# ONE 0.14.102

ONE 0.14.102 — VISUELS 3D ET POKER CONTINU

Nouveaux visuels ONE pour les dix jeux Party disponibles.
Intérieurs revisités : cartes en relief, plateaux, jetons, chrono,
cadres des portraits et présentation des rôles.
Les jeux retirés ne sont pas réintroduits.
Poker : table et commandes réunies dans une vue compacte, adaptée au téléphone.
Après chaque main : chacun confirme Main suivante, sans revenir au salon.
Les réserves sont conservées et le donneur change à chaque main.
À zéro : recharge de 100 jetons en mode gratuit ; en mode Points ONE,
recharge de la mise initiale depuis le solde, après confirmation.
Les points sont rendus au compte à la fin de chaque main puis remis à la table
à la confirmation de la suivante. Un solde insuffisant bloque la reprise.

1. CLOUDFLARE — Worker one-comments-api
Ouvrir Modifier le code, remplacer le code par ONE-SERVEUR-v37.mjs et cliquer Deploy.
Garder les liaisons actuelles. Aucun SQL manuel nécessaire.
Vérifier que l'adresse du Worker indique version 37.

2. GITHUB — dépôt one-mobile-alpha, branche main, racine
Décompresser PARTIE-1 et envoyer son contenu, puis Commit changes.
Faire la même chose avec PARTIE-2. Ne pas envoyer les ZIP eux-mêmes.
Conserver les dossiers ui et assets. Remplacer les anciens fichiers.
Attendre le déploiement GitHub Pages puis vérifier la version 0.14.102.

Validation locale : mains successives, réserves et solde, recharge gratuite,
solde insuffisant, requêtes répétées, 500 mains simulées et affichage mobile.
Cette livraison n'est pas encore publiée sur ton site.
