# Contrôle TikTok et retrait automatique du fil ONE

Le workflow **Contrôle TikTok en arrière-plan** démarre toutes les six heures
(minute 17, UTC ; GitHub peut retarder un lancement) et manuellement dans Actions.
Le téléphone peut être éteint. Un lot contient au plus 40 contrôles séquentiels,
avec dix secondes entre les lecteurs et trente secondes au plus par vidéo.

L’historique est conservé sur la branche `one-tiktok-health-data`, dans
`state.json`. Un nouveau lancement récupère cet historique, charge toutes les
pages du catalogue commun, puis commence par les vidéos jamais contrôlées.
Les autres sont revérifiées de la plus ancienne à la plus récente : au moins
six heures après un résultat incertain/indisponible, sept jours après un succès.
Un contrôle de référence sur une vidéo précédemment lisible peut ouvrir le lot.
Une reprise ne recommence donc plus systématiquement avec les mêmes vidéos.

## Ce qui confirme la lecture

Le lecteur officiel doit émettre un état « playing » et des horodatages montrant
au moins deux secondes de progression. L’origine TikTok et la fenêtre source
sont vérifiées. Un chargement HTTP réussi ou « player ready » ne suffit pas.
Le contrôle porte sur le démarrage, pas sur la totalité de la vidéo, son son,
ni sa disponibilité sur tous les appareils ou dans toutes les régions.

Les motifs et codes du lecteur figurent dans le rapport. Une erreur 2005 /
`TOO_MANY_REQUESTS`, un HTTP 429 ou un refus HTTP 403 arrête le lot. La pause
est conservée pour les prochains lancements : au moins 24 heures pour ces
refus et limites, plus si `Retry-After` le demande. Huit résultats incertains
consécutifs arrêtent le lot pour six heures. Aucun changement d’identité,
de réseau ou d’origine n’est utilisé pour contourner un refus. Les publications
photo restent « à vérifier » et ne déclenchent pas de retrait automatique.

## Retrait automatique et retour dans le fil

Une vidéo est retirée du fil ONE seulement après **trois réponses explicites
`INVALID_VIDEO` (1001)**, sur trois exécutions distinctes, espacées chacune
d’au moins six heures. Cela fait au minimum douze heures entre la première et
la troisième confirmation. Le même lancement relancé ne compte pas deux fois.
Chaque exécution qui ajoute une confirmation doit avoir réussi à lire au moins
une autre vidéo, afin qu’une panne générale ne vide pas le catalogue.

Un délai dépassé, une erreur réseau, un blocage de lecture automatique, une
limite TikTok ou une erreur serveur ne compte jamais comme confirmation.
Une lecture réussie remet les confirmations à zéro et rétablit la vidéo au
prochain rafraîchissement du catalogue.

`hidden.json`, publié atomiquement avec l’historique sur la branche de données,
contient uniquement les identifiants publics retirés et leurs confirmations.
ONE valide ce fichier et l’applique au catalogue et à la construction du fil,
y compris aux copies locales d’un même lien. Les favoris et liens enregistrés
ne sont pas effacés. Les liens restent dans la base ONE pour les revérifications.
Aucun contenu n’est supprimé chez TikTok et aucun Worker Cloudflare n’est modifié.
Un lecteur déjà ouvert peut terminer sa lecture ; la liste s’applique aux
prochaines constructions du fil. Le rafraîchissement distant est mis en cache
cinq minutes. En cas de panne, la dernière liste valide est conservée au plus
sept jours. Une nouvelle installation sans liste reste utilisable.

## Exploitation et validation

Les rapports JSON/Markdown détaillent les résultats cumulés, leurs dates,
le nombre testé pendant cette exécution et le nombre retiré du fil. Ils restent
30 jours dans les artefacts GitHub. Les données publiques restent dans la branche
de données pour les reprises. Un lancement rouge peut signaler des résultats
incertains ; il ne signifie pas que les vidéos sont toutes illisibles.

Les tests et les pull requests ont seulement accès au dépôt en lecture. Le job
sur `main` dispose de `contents: write` pour écrire les deux fichiers de données
avec le jeton éphémère GitHub Actions, transmis uniquement aux étapes de stockage.
Le navigateur de contrôle ne reçoit pas ce jeton. Le script n’écrit jamais dans
`main`, et refuse une mise à jour concurrente plutôt que de forcer la branche.
Un historique corrompu ou inaccessible arrête la reprise sans le remplacer.
L’essai d’une vidéo sur la branche de développement ne publie aucun retrait.

Pour revenir temporairement à un fil sans retraits, arrêter le workflow et
remplacer `hidden.json` par une liste vide, avec `version: 1` et une date
`generatedAt` actuelle. Corriger aussi l’historique avant de réactiver le bot.

Tests :

- `node --test tests/tiktok-health.test.cjs tests/tiktok-availability.test.cjs tests/tiktok-playback.test.cjs`
- `python tests/tiktok-health-server-test.py`
- `python tests/tiktok-health-state-test.py`
- `python tests/tiktok-health-browser.py`
- `python tests/tiktok-availability-browser.py`

Référence du lecteur et des codes : https://developers.tiktok.com/docs/en/embed-player
