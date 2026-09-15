# ONE Mobile Alpha — Changelog

## 0.13.1 — Fresh Following
- Nouveau mélange du Pour toi à chaque ouverture de ONE.
- Priorité forte aux créateurs suivis dans ONE.
- Twitch : nouvelle autorisation `user:read:follows` et import des chaînes réellement suivies après reconnexion.
- YouTube : les créateurs suivis dans ONE sont prioritaires. L’import direct des abonnements YouTube exige OAuth utilisateur (`subscriptions.list?mine=true`) et n’est pas simulé avec la simple clé API.
- TikTok : priorité aux créateurs suivis/appris par ONE ; la Display API ne fournit pas la liste des comptes suivis.
- Historique des contenus vus conservé pour éviter les répétitions.
- Moteur vidéo 0.12.6 conservé.
