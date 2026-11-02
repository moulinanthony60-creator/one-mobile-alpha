# ONE Kart — version de travail 234

Depuis un salon : **Lobby 3D → Choisir un jeu → Karting → Je suis prêt → Lancer la partie**. Un joueur peut essayer seul ; jusqu’à huit membres du même lobby peuvent courir ensemble. Le karting utilise les connexions existantes du salon. La recherche de parties publiques reste réservée aux jeux déjà pris en charge par le serveur.

La caméra est au niveau du pilote, avec volant et carrosserie visibles. Le nouveau circuit mesure environ 594 m, sur 12 m de large, avec trois tours et des points de passage ordonnés. Il remplace la version de test non retrouvée dans ce dépôt : ses dimensions ne peuvent donc pas être comparées à celles du prototype précédent.

## Commandes

| Action | Ordinateur | Téléphone |
| --- | --- | --- |
| Accélérer | Z / W / flèche haut | Maintenir ACCÉLÉRER |
| Freiner puis reculer | S / flèche bas | Maintenir FREIN / RECUL |
| Tourner | Q / A, D ou flèches | Maintenir ← ou → |
| Regarder | Glisser dans la scène | Glisser dans la scène |
| Batte | F ou espace | FRAPPER · BATTE |
| Menu | Échap | Menu |

La batte choisit le côté de l’adversaire le plus proche. L’hôte vérifie une portée de 3,6 m, la direction et un délai d’une seconde entre les coups. Un coup reçu réduit la vitesse et gêne brièvement la direction ; une protection temporaire évite les coups continus. Les contacts entre karts, tours, classements et résultats sont calculés par l’hôte. Le menu ne met pas la course multijoueur en pause.

## Validation

83 tests automatisés passent : tests existants, physique du kart, trois tours parcourus avec un pilote automatique, limites de piste, coups et protections, validation des messages, puis lancement à deux, mouvements transmis, coup transmis, revanche et sortie. Le test de session exécute le véritable module de session et le moteur ; le transport et le rendu y sont simulés.

**Le rendu WebGL et les interactions tactiles n’ont pas été validés visuellement dans cet environnement** : le navigateur local quitte avant de démarrer. Le scénario `tests/karting-browser.cjs` est fourni, mais reste à exécuter dans un environnement avec Chromium. Il faut aussi tester deux appareils reliés par les vraies connexions du salon, notamment la latence, le retour au lobby, les caméras et les micros existants.

## Développement

Avec Node 24+, installer `esbuild` et `playwright` comme outils de développement, puis :

```sh
node tools/build-3d.mjs
node --test tests/*.test.cjs tests/*.test.mjs
python -m http.server 8000
```

Dans un autre terminal, après installation du navigateur Playwright :

```sh
node tests/karting-browser.cjs
```

Le bundle `ui/one-3d-v234.js` est produit depuis `ui/one-3d-entry.js`. Les paramètres de version des imports sont normalisés pendant le build pour conserver une seule session partagée. Le bundle est placé dans `ui/`, afin de préserver les chemins des ressources et des styles relatifs à `import.meta.url`. `index.html` et le cache du service worker pointent vers ce bundle. Tous les participants doivent charger la version 234 pour les parties arcade.

Aucun changement du Worker ni de la base de données. Cette branche n’a pas été fusionnée ni déployée.
