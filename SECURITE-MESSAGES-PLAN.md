# ONE — protection et suppression des messages (proposition non déployée)

## Ce qui est implémenté sur cette branche

- Dans les Workers de messagerie entre amis (`SERVEUR/worker.js` et `ONE-SERVEUR-v32.mjs`) : route authentifiée `DELETE /friends/{friendshipId}/messages/{messageId}?scope=me|everyone`.
- `scope=everyone` : seul l'expéditeur peut supprimer pour les deux, avec suppression de la ligne D1 active et des marques de notification.
- `scope=me` : cache un message pour un utilisateur dans les lectures de discussion, aperçus et compteur de messages ; une fois que les deux comptes l'ont supprimé, la ligne est effacée de la base active.
- Les actions de suppression conservent le contrôle d'appartenance à la conversation.
- Dans `serveur/one-messages-api-v3.mjs` : route authentifiée `DELETE /messages/{id}` pour l'expéditeur, révoquant les liens de partage et effaçant la ligne D1 et l'objet R2 ; `DELETE /voice/{id}` pour l'expéditeur, effaçant l'enregistrement vocal et son objet R2.
- Boutons UI dans `ui/friends.js` et `ui/one-private-communications.js`.

## Avertissements critiques : pas encore prêt pour une garantie de sécurité

1. **Chiffrement de bout en bout non implémenté.** Le contenu reste en clair dans D1 : une compromission de la base avant suppression pourrait l'exposer. Il faut intégrer un protocole E2EE audité, authentifier les identités cryptographiques, gérer multi-appareils, rotations et restauration sans fuite de clés. Ne pas inventer de protocole maison.
2. **Aucune garantie de « zéro trace ».** Historique D1/Time Travel, journaux, caches, sauvegardes de fournisseurs et appareils, captures d'écran et copies antérieures restent hors de portée de cette modification.
3. **Déploiement non effectué.** Le frontend principal `index.html` contient aussi des scripts intégrés (et plusieurs Worker historiques existent) ; confirmer les fichiers effectivement construits et déployés, puis synchroniser leur code avant activation.
4. **Médias de la messagerie entre amis.** Les messages de liaison texte vers les médias et les objets R2 peuvent dépendre de services distincts : auditer les associations et l'accès, révoquer tous les jetons et supprimer les objets correspondants pour toute suppression du message parent.
5. **Groupes et salons** : suppression individuelle non implémentée sur cette branche.
6. **Robustesse** : tests d'intégration D1/R2, idempotence, concurrence, erreurs R2 après transaction D1, anciens jetons et historique local restent à réaliser.
7. **Cohérence du statut** : « permanentlyDeleted » ne concerne que l'enregistrement actif connu ; ne pas annoncer une purge des sauvegardes.

## Tests bloquants avant déploiement

- Deux comptes A et B : A envoie, A supprime pour lui-même ; B voit encore le message ; A ne le voit plus dans la conversation, les aperçus ou les notifications.
- Puis B supprime pour lui-même : la ligne n'existe plus dans la base active ; rechargement, redémarrage et autres sessions n'en permettent plus la lecture.
- Auteur seulement : A supprime pour tous ; ni A ni B ne voient le message ; B ne peut pas supprimer globalement le message de A.
- Un compte C ne peut ni lire ni supprimer les messages de A/B.
- Photos, vidéos, vocaux : après suppression, impossible de récupérer les octets via accès authentifié, URL publique, ancien share-token ou lien déjà reçu ; vérifier R2.
- Erreurs partielles de suppression / réponses réseau perdues : retentatives sans réapparition et purge des objets restants.
- Concurrence : suppressions simultanées, envoi simultané, retrait d'ami, notifications et modifications pendant pagination.
- Vérifier les règles de rétention/sauvegardes Cloudflare indépendamment du code.
- Réaliser revue de sécurité et test de pénétration indépendant avant de qualifier ONE de messagerie confidentielle.

## Déploiement

Cette branche constitue une première base de suppression **à revoir**, pas une livraison de chiffrement intégral. Ne pas fusionner ou déployer sans revue et tests sur un environnement isolé. Ne pas supprimer les données de production pour tester.
