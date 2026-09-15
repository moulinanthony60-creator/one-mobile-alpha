# Validation ONE 0.13.10

- Syntaxe des 10 scripts vérifiée, y compris scripts HTML, service worker et worker de profil.
- Démarrage des scripts dans un DOM simulé réussi.
- Ordre exact des catégories et navigation vérifié.
- Salon ONE vide malgré la présence de contenus externes ; aucun lanceur externe.
- Ouverture du studio et préparation live sans diffusion vérifiées.
- Pool de 10 TikTok stable après rechargement des données ; Pour toi réservé à TikTok ; tri Twitch par viewers vérifié.
- Moteur vertical TikTok, chargement Twitch comparés à 0.13.7 ; worker de profil identique.
- Fullscreen ONE des fiches absent, contrôles et permissions natifs conservés.
- Manifests et référence de cache actualisés.

Limites : aucun test visuel sur navigateur ou téléphone pour cette version. Sessions privées, API authentifiées, lecteurs embarqués et synchronisation réelle à vérifier sur appareil connecté. Les tests avec DOM simulé ne remplacent pas ces contrôles.

## Contrôle après déploiement
1. Vérifier 0.13.10 et l’ordre des catégories.
2. Ouvrir ONE : état vide sans contenu externe.
3. Préparer vidéo/photo/texte/live dans Créer, sélectionner plusieurs destinations ; publication désactivée.
4. Quitter/revenir : préparation conservée. Recharger : préparation effacée comme annoncé.
5. Vérifier rotation Pour toi, swipe TikTok, classement Twitch, abonnements et fiches.
6. Vérifier connexion/sync et fullscreen natif YouTube/Twitch.

Croix de fermeture : retour à Pour toi et conservation des champs vérifiés dans le DOM simulé. Pas de vérification visuelle sur appareil.

0.13.10 : tests avec contenus TikTok/YouTube/Twitch simultanés : Pour toi ne contient que TikTok dans la liste et le lecteur vertical. Onglet YouTube et tri Twitch conservés. Tests DOM simulé, vérification sur appareil restante.
