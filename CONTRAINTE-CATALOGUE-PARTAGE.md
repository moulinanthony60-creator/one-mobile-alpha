# Catalogue partagé — contrat à ajouter dans une mission backend

## Contrat actuel observé

- Le catalogue externe vit dans le navigateur, maintenant protégé par IndexedDB par compte.
- `/account/profile` sauvegarde un profil chiffré du compte propriétaire. Ce service ne permet pas de lire publiquement le catalogue d’un autre compte ; le frontend ne doit pas partager sa clé de chiffrement.
- `/api/tiktok/feed` concerne le compte TikTok OAuth connecté. Ce n’est pas un catalogue collectif ONE.
- Aucun endpoint de lecture d’un catalogue partagé avec autorisations n’a été identifié dans les sources disponibles.

## Adaptation nécessaire (proposition, pas une API existante)

Ajouter une ressource de catalogue identifié, avec propriétaire et membres autorisés. La lecture retourne des IDs TikTok persistants, titres, créateurs, URLs publiques canoniques, dates et métadonnées utiles — jamais de token OAuth ni d’URL média privée. Une révision doit empêcher qu’une ancienne réponse écrase des ajouts plus récents. Les suppressions explicites doivent être identifiées, les écritures idempotentes et les snapshots durables versionnés côté serveur.

Le backend doit vérifier les droits à chaque lecture/écriture et proposer un partage explicite par compte ou salon. Ne pas rendre tous les catalogues privés publics. Le client pourra ensuite afficher le même catalogue à A et B et utiliser le même lecteur TikTok officiel par ID.

Tester conflits, pagination (>300 vidéos), réponse vide, hors-ligne/reconnexion, expiration de session et restauration. Tester ensuite une vidéo publique encore intégrable sur deux téléphones. Les restrictions de lecture imposées par TikTok ne peuvent pas être levées par ONE.

Aucun changement backend n’a été réalisé dans cette livraison. En attendant, le transfert explicite par export/import JSON fonctionne ; ce n’est pas une synchronisation partagée automatique.
