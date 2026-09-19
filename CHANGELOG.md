# ONE 0.14.00 — premier lot visuel

Basé sur 0.13.81, sauvegardé avant refonte. Navigation ONE / Together / Party, sources TikTok / YouTube / Twitch / Musique / Plus, espace Social. Pour toi et Ciné masqués dans la navigation. Aucun faux contenu.

Cette version est un aperçu de la nouvelle interface, pas la livraison de la phase 1 complète. Together, Social et Party sont des écrans de préparation. Pas de salons, messagerie, synchronisation, caméra/micro ou mini-player persistant dans ce lot. Naviguer vers un nouvel espace arrête encore la lecture, comme auparavant. Le bouton Retour commence à gérer les nouveaux espaces mais reste à unifier avec les lecteurs.

Lecteurs conservés, fonctionnement réel et rendu mobile à vérifier. Non déployé. Rester sur 0.13.81 pour la référence stable.

0.14.01 : icônes vectorielles inspirées de la référence, fichiers SVG fournis. Ce ne sont pas des fichiers officiels extraits de la capture.

0.14.02 : TikTok ouvre directement le feed vertical depuis les sources et la carte de l’accueil.

0.14.03 : sources visibles en haut comme la référence, barre basse Accueil / Créer / ONE IA / Abonnements / Réglages. Social accessible depuis accueil. Ciné reste absent selon roadmap.

0.14.04 : loupe et cloche dans l’en-tête. Recherche masquée au démarrage, ouverte/fermée par la loupe. Panneau notifications vide, sans fausses alertes ; services Social/Together encore non connectés.

Sources : suppression du recentrage automatique et du glissement hérité, tailles fixes, observation des icônes limitée aux nouveaux écrans.

0.14.05 : correction du parent tabsRail resté en grille 28px / contenu / 28px hors accueil. Rangée des sources en pleine largeur dans tous les états.

Icônes ONE, Together et Party redessinées en couleurs violet/bleu avec détails et relief léger.

0.14.06 : ouverture directe TikTok sans construire le catalogue intermédiaire ; feed visible avant activation. Diagnostic clic TikTok ajouté. Twitch filtres et Lives/Clips repliés derrière une loupe. Cartes YouTube harmonisées. Le chargement initial réseau TikTok reste nécessaire.

Demande complémentaire : boutons Lives et Clips masqués même lorsque la loupe est ouverte.

0.14.07 : YouTube deux colonnes ; onglets Pour toi et Abonnements (deux dernières vidéos disponibles par chaîne suivie) ; recommandations mélangées par session sans bloc abonnements en tête ; lanceur feed vertical masqué. Lecture TikTok inchangée.

Flèche IA fixe en bas à gauche dans les sources ; positionnement concurrent supprimé aussi hors feed vertical.

0.14.08 : résolution des vidéos du pool Abonnements par le lecteur ; boutons YouTube centrés ; actualisation conserve les sources et le sous-onglet YouTube sans superposition accueil ; bouton Actualiser dans TikTok ; Quitter TikTok ouvre accueil.

0.14.09 : actualisation TikTok interne, commandes compactes à droite, déduplication linéaire et préconnexion TikTok, ouverture YouTube plein écran au clic.
0.14.10 : vérification groupée des autorisations YouTube avant affichage, cache 30 minutes, vidéos inconnues masquées ; titre du lecteur retiré en plein écran, croix conservée.

## 0.14.62
Mains avec peau continue et doigts plus courts. Cartes proches, sélection progressive, lancer, retournement et distribution animés. Cadrage table puis revolver. Son d'élimination. Résultat en bas à droite. Nécessite Worker v16 pour corriger la rotation des survivants après trois tentatives. Aucun SQL.

## 0.14.62
Zoom sur les cartes révélées et relecture de la preuve. Séquence de 5,8 secondes (Worker v17 requis). Élimination : affaissement persistant, éclair et projections rouges stylisées. Boutons Rejouer (créateur) et Retour au salon (tous).

## 0.14.62
Quatre personnages d'horreur sélectionnables au salon (SQL personnages + Worker v18 nécessaires), portraits, modèles et tenue retravaillés. Revolver détaillé, cartes attachées au mouvement du poignet. Sang sur caméra et table, décor ONE. Plein écran automatique à l'entrée d'une nouvelle partie. Rejouer revient aux choix et à la préparation.
