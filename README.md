# ONE 0.14.116 — frontend à tester

Cette livraison part du vrai dépôt `moulinanthony60-creator/one-mobile-alpha`, version 0.14.115, commit `c0e28b77d7ce8dc19cf73188fafdeabcbc5754d5`. Les changements sont intégrés dans le site existant. Aucun Worker, moteur serveur, SQL ou portefeuille n’a été modifié.

## 1. Réalisé

- Identité ONE / Together / Party conservée. Tous les jeux existants sont de nouveau visibles dans Party, y compris les jeux d’ambiance précédemment filtrés.
- Fiche de proposition commune avec illustration, règles/description, capacité réelle, catégorie, salon et confirmation de mise existante.
- Lobby compact : avatars/emplacements caméra, hôte, prêts/attente, minimum, annulation et lancement manuel. Trois membres / deux prêts fonctionne dans les tests locaux du Worker fourni.
- Transition 3 / 2 / 1 après confirmation serveur ; fullscreen facultatif, mode immersif interne en secours.
- Bluff : commandes réparées, main en éventail, siège local centré, annonce et manche lisibles, chat compact. Cinématique existante conservée au-dessus de la table avec résultat serveur ; capture mémoire du portrait uniquement en cas d’élimination, y compris pour le joueur local.
- Poker : dealer et SB/BB calculés selon le moteur actuel, distribution/révélation et déplacement de jetons, actions et mises existantes conservées.
- Douze : douze cartes, mini-grilles adverses publiques conservées, zone d’instruction déplacée hors des cartes tactiles. Grilles de **3 lignes × 4 colonnes**, conformément au moteur.
- Menu commun, réduction, retour Salon, règles, préférences, micro/caméra et distinction quitter partie / quitter salon conservés et ajustés.

## 2. Cause des pertes TikTok

Défaut reproduit dans le code réellement publié en 0.14.115 : `tiktokMergeExternalEntries` tronquait toute fusion à **120 vidéos**. Avec 450 vidéos et une réponse distante vide : **450 → 120, donc 330 supprimées** lors de l’application du profil cloud. La limite destructive a été supprimée.

Cela prouve un scénario réel de perte de plus de 300 vidéos. Sans journaux ni sauvegardes des deux incidents passés, leur cause historique exacte ne peut pas être certifiée. Cette livraison ne recrée pas les liens déjà perdus.

Autres risques traités : import de profil écrasant le catalogue, export de profil sans catalogue, sauvegarde unique, erreurs cloud masquées et encodage de gros profils. Le changement `github.io` → `one-officiel.fr` utilise toujours des stockages navigateur distincts : les données de l’ancien domaine ne migrent pas automatiquement.

## 3. Fichiers

La liste exacte est dans `fichiers-modifies.json`. Changements fonctionnels principaux : `index.html`, `ui/catalog-store.js`, `ui/catalog-manager.js`, `ui/catalog-manager.css`, `ui/mission116.css`, `ui/social-core.js`, `ui/party.js`, `ui/game-shell.js`, `ui/game-tables.js`, `ui/party-bluff.js`, `ui/party-game.js`. Les autres différences concernent surtout les versions des ressources et les manifestes/cache PWA.

## 4. Architecture

Les composants existants continuent d’appeler les APIs existantes. Le lobby utilise la proposition/acceptation/lancement serveur ; les tables affichent uniquement les instantanés publics et la main autorisée. Un seul système WebRTC Salon est conservé. Le compte à rebours est une transition visuelle : il ne remplace aucun délai serveur. Bluff et Douze n’exposent pas de délai de tour dans ce contrat ; aucun faux timer n’a été ajouté.

`ONECatalogue` devient le point d’écriture du catalogue : base IndexedDB par compte, miroir localStorage pour l’ancien feed, transactions, fusion sans réduction implicite et historique. Le gestionnaire fournit recherche, lecture officielle, export/import et restauration. Aucun serveur de catalogue partagé n’a été inventé.

## 5. Validation

**111 contrôles locaux réussis**, détaillés dans les cinq fichiers `*116-results.json` : salon/participants, Poker/Bluff, Douze, catalogue et portraits. Les jeux utilisent le Worker fourni inchangé, SQLite locale et des comptes de test. Certaines manches sont préparées en base de test pour vérifier rapidement des transitions précises ; le moteur réalise ensuite les actions.

- Trois membres, deux prêts : deux participants, troisième libre dans ONE.
- Annulation, réponse 409, pas de proposition/lancement optimiste, réduction et reprise.
- Poker : secrets adverses, blindes heads-up, relance, suivi, flop, cinq cartes et résultat serveur.
- Bluff : annonce, accusation, révélation autorisée, séquence vidéo et retour table.
- Douze : révélation, pioche privée, remplacement visible chez l’adversaire, défausse, colonne, scores et manches.
- Largeurs 360 / 390 / 430 px et desktop 1280 px sur les contrôles concernés ; instruction Douze hors des cartes.
- Portraits : flux **synthétique canvas**, aucune caméra physique ; pas de capture d’un joueur vivant, frame conservée en mémoire seulement, effacement au changement de compte.
- Build statique : **115 scripts analysés**, 40 ressources de cache et 37 scripts d’entrée présents. Aucun bundler n’existe dans ce dépôt.
- Comparaison avec la sauvegarde initiale : **11 fichiers backend/SQL inchangés**, détail dans `backend-inchange.json`.

Ces résultats ne constituent pas des essais sur deux téléphones physiques. Pas de mesure de 60 fps certifiée, ni de validation Android/iOS réelle.

## 6. Captures

Le dossier `captures` contient les écrans du vrai frontend avec les comptes locaux Test1/Diwaiis/Libre : Accueil, Salon, Party, Proposition, Lobby, Bluff, Poker, Douze, Menu. Ouvrir `galerie.html`. Les noms, cartes et points visibles proviennent des sessions de test, pas de données ajoutées au produit livré.

## 7. Sauvegardes TikTok

- Snapshot aux 10e, 20e, 30e… nouveaux ajouts réussis ; doublons exclus du compteur.
- Jusqu’à 12 snapshots locaux complets ; métadonnées incluses.
- Snapshot avant suppression, import ou restauration. Si l’écriture échoue, la suppression est annulée.
- Réponse cloud vide ou fortement réduite : vidéos locales conservées, anomalie affichée.
- Restauration par fusion : les vidéos actuelles restent présentes.
- Les six dernières versions sont incluses dans le profil cloud chiffré lorsque sa synchronisation réussit. **L’écriture réelle sur le service cloud de production n’a pas été validée ici**, ni ses limites de taille.
- Export JSON indépendant du navigateur. Une base IndexedDB protège mieux que localStorage seul, mais effacer les données du navigateur peut supprimer les deux : conserver un export et vérifier la sauvegarde cloud.
- Un bouton permet de récupérer explicitement dans son compte le catalogue ajouté en mode invité sur le même appareil.

## 8. TikTok entre utilisateurs

Le lecteur utilise l’ID persistant et le [lecteur officiel TikTok](https://developers.tiktok.com/docs/en/embed-player). Erreurs du lecteur vérifiées par origine/source ; blocage autoplay distingué d’une vidéo indisponible ; lien « Ouvrir sur TikTok » présent.

Le code précédent utilisait déjà un embed officiel : aucune cause liée à une URL média temporaire n’a été démontrée. Le catalogue externe est privé à l’appareil/compte, et le feed OAuth concerne le compte TikTok connecté. Un second compte ne reçoit donc pas automatiquement le catalogue importé par le premier.

**Test réel A/B sur deux appareils : non effectué.** L’import/export et la restauration compressée entre deux comptes ont été testés localement ; cela ne prouve pas que TikTok autorise la lecture d’une vidéo donnée sur un autre téléphone. Le partage automatique nécessite le contrat décrit dans `CONTRAINTE-CATALOGUE-PARTAGE.md`.

## 9. Déploiement détecté

Site statique GitHub Pages du dépôt `moulinanthony60-creator/one-mobile-alpha`, branche `main`, domaine `one-officiel.fr` conservé dans `CNAME`. Les déploiements existants sont « pages build and deployment ». Aucun nouvel hébergeur.

## 10. Mise en ligne : non effectuée

Le navigateur accessible n’est pas connecté à GitHub et aucun accès d’écriture authentifié n’a été établi. Le site public reste la version précédente. Le ZIP contient `site/` : c’est ce contenu qu’il faut intégrer à la racine du dépôt, en conservant les chemins.

### Installation

1. Extraire `ONE-0.14.116-FRONTEND.zip`.
2. Dans une copie authentifiée du dépôt, vérifier que `main` correspond toujours à la base indiquée en haut. Si de nouveaux changements existent, fusionner les fichiers modifiés au lieu de les écraser.
3. Copier le **contenu de `site/`** à la racine du dépôt : `index.html`, `ui/`, `assets/`, manifestes, `sw.js`, etc. Ne pas mettre un dossier `site` supplémentaire dans l’URL.
4. Ne remplacer aucun Worker/API/SQL. Ne pas déposer le ZIP lui-même à la place des fichiers du site.
5. Enregistrer les changements puis les envoyer sur `main`. Avec GitHub Web, utiliser « Add file → Upload files » en respectant les sous-dossiers ; pour beaucoup de fichiers, préférer une copie Git locale authentifiée.
6. Attendre la réussite de **Actions → pages build and deployment**.
7. Ouvrir `https://one-officiel.fr/`, recharger, vérifier **0.14.116**. Le nouveau cache PWA conserve les données du catalogue ; ne pas effacer les données du navigateur.
8. Tester sur tes deux appareils : Salon → proposer → Prêt → lancer, caméra/micro/chat, réduire/reprendre. Ajouter un troisième membre non prêt pour vérifier qu’il reste dans ONE.
9. Exporter un catalogue, ajouter jusqu’au prochain multiple de dix, vérifier l’historique, relancer l’app et vérifier la persistance. Tester une même vidéo publique sur les deux appareils.

### Retour arrière

Revenir au commit précédent pour les fichiers frontend ou utiliser `backups/ONE-main-2026-09-26-avant-mission.zip` conservé dans l’espace de travail. Exporter le catalogue avant tout retour à une ancienne version : l’ancien frontend contient encore le défaut de troncature.

## 11. Reste à valider

- Publication et contrôles après publication.
- Deux appareils/comptes réels, caméra, micro, reconnexion réseau et lecture TikTok.
- Limites et réussite de la sauvegarde cloud chiffrée en production.
- Partage automatique du catalogue : adaptation backend séparée, non simulée.
- Maximum serveur inchangé : Bluff/Douze 4, Poker 6 ; la disposition à six de Douze a uniquement été testée avec des données visuelles locales.
- Les grandes nouvelles maquettes individuelles citées dans le texte ne figuraient pas dans les pièces jointes de cette mission. La planche fournie et les références précédentes ont guidé l’intégration ; aucune conformité pixel par pixel n’est annoncée.

La livraison est **prête pour ces validations**, pas annoncée comme une mission entièrement validée en production.
