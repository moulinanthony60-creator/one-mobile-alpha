# Validation 0.13.23

- 16 scripts intégrés et JS de la distribution vérifiés syntaxiquement.
- Démarrage et tests de régression DOM/API simulés réussis : contexte et recherche web, fermeture panneau, déplacement bulle, priorités suivies et dédoublonnage, rotation TikTok, salon ONE et studio.
- Absence des champs de capture, de configuration visuelle et de l’appel OpenAI vérifiée.
- Worker de profil inchangé ; Worker vision exclu du ZIP.
- Aucun test visuel sur téléphone ou appel aux services authentifiés effectué. Les services Cloudflare déployés ne sont pas modifiés.

0.13.23 : 17 scripts validés. Tests simulés : iframe créée une seule fois, autoplay muet, chat agrandi/réduit même si Fullscreen API refuse. Pas de test réel mobile ou session Twitch.

0.13.23 : 18 scripts validés ; tests simulés ouverture par bulle, bonne chaîne, disposition partagée et restauration sans recréer le lecteur. Régression réussie. Plein écran physique, zones système et rendu mobile à valider sur appareil.

0.13.23 : suppression ciblée du paragraphe vérifiée, scripts validés. Aucun changement aux interactions Twitch.

0.13.23 : 18 scripts validés ; basculement fermer/rouvrir et état accessible de la flèche testés avec DOM simulé. Rendu téléphone non vérifié.

0.13.23 : 18 scripts validés ; test SDK simulé vérifiant autoplay false, muted false et volume 0.5 à READY. Vérification audio réelle sur téléphone restante.

0.13.23 : 18 scripts valides. Tests visibilité bulle en plein écran page ONE, mode normal, lecteur natif et panneau IA ouvert réussis en DOM simulé. Rendu mobile à vérifier.
