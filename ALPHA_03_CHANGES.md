# ONE Mobile Alpha 0.3 — corrections

## Fait dans cette archive
- Nouvelle icône ONE (192 et 512 px) et cache PWA incrémenté.
- TikTok : la `redirect_uri` utilise maintenant exactement l'URL de la page PWA déployée au lieu de forcer `/tiktok-callback` à la racine du domaine.
- Twitch : même URL de redirection canonique, affichée dans les réglages pour pouvoir la déclarer exactement dans la console développeur Twitch.
- TikTok/Twitch : l'URL OAuth exacte à autoriser est visible dans Réglages avancés.
- Compte ONE : ajout d'une sauvegarde/restauration du profil local (préférences, likes, sauvegardes, profil). Les jetons OAuth et clés API ne sont volontairement pas exportés.
- Messages TikTok améliorés en cas de retour OAuth en erreur.

## Configuration externe encore obligatoire
Les erreurs vues sur les captures ne peuvent pas toutes être corrigées uniquement dans le HTML :

### TikTok
Dans l'application TikTok for Developers, ajouter **exactement** l'URL affichée par ONE sous « Redirect URI à déclarer ». TikTok exige une correspondance exacte.

### Twitch
Dans la console développeur Twitch, ajouter la même URL dans **OAuth Redirect URLs**. L'Alpha utilise encore un Client ID local : pour le supprimer de l'interface, il faut déployer un backend/config ONE qui fournisse le Client ID public.

### YouTube
L'erreur `Requests from referer ... are blocked` vient des restrictions de la clé Google Cloud. Dans les restrictions HTTP referrers de la clé YouTube Data API v3, autoriser le domaine GitHub Pages de ONE (par exemple `https://moulinanthony60-creator.github.io/*`). Pour une version publique, la clé ne devrait pas être saisie par chaque utilisateur : il faut déplacer les appels YouTube derrière un backend ONE avec quotas et protection de clé.

## Compte ONE cloud
Cette archive n'invente pas un faux cloud : créer réellement un compte multi-appareils et conserver des connexions OAuth exige un backend d'authentification et une base sécurisée. Le bouton de sauvegarde local prépare la migration sans exporter les secrets.
