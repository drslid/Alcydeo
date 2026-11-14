# Détection sur six pages publiques — bilan 0.1.49

Essais du 6 novembre 2026 dans Chrome for Testing 156.0.8078.4 sur Linux, avec des profils isolés. Les essais graphiques et sans interface sont distingués. Le profil Chrome Windows de l’utilisateur n’a pas été piloté. Aucun téléchargement de film complet, export de fichier public ou décodage intégral public n’a été lancé pendant ce lot. Les lecteurs ont chargé leurs métadonnées, leurs premiers fragments et les échantillons bornés des contrôles existants.

| Page testée | Build et conditions | Résultat et limite |
| --- | --- | --- |
| [Apocalypse Z — Coflix](https://coflix.esq/film/apocalypse-z-nouveau-monde/) | 49, sans interface | Une carte 360p contrôlée, badge 1, deux pistes natives réellement observées. Le dernier essai charge 1 456 624 octets média. Le clic de lecture d’un autre essai est intercepté par un calque publicitaire : lecture non validée. |
| [L’impératrice remariée 1×3 — Coflix](https://coflix.esq/episode/limperatrice-remariee-1x3/) | 49, sans interface | Une carte 432p contrôlée, piste combinée. Lecteur chargé ; le calque publicitaire intercepte le clic normal. Lecture non validée. |
| [Horror Collector 1×01 — Coflix](https://coflix.tips/episode/horror-collector-1x01-6acb4382201ce/) | 48, sans interface | Le vrai bouton Play Voe démarre la lecture : 9,41 s observées, vidéo 1280×720, une carte HLS 720p contrôlée, badge 1. Un onglet publicitaire fermé. Aucun défaut de détection reproduit après démarrage. |
| [Un homme en colère — Voir-series](https://www.voir-series.lol/5290639-un-homme-en-colere.html) | 48, choix explicite des lecteurs | Uqload expose une carte HLS 360p contrôlée. Le choix Fembed rencontre HTTP 500. Uptobox n’expose aucun nouveau flux ; la source Uqload précédente reste en cache. Aucun transfert complet validé. |
| [Amener un objet — Dailymotion](https://www.dailymotion.com/video/xbtzj8e) | 48, Chrome graphique, agent utilisateur natif | Le lecteur réel expose une fiche HLS avec quatre hauteurs portrait annoncées : 1920p, 1280p, 848p et 640p, toutes contrôlées. Une publicité nommée « Advertisement » reste séparée : badge 2. Sans interface, le site sert une page SSR sans lecteur ni média ; le contrôle sans extension donne le même résultat. Aucun export ni décodage intégral validé. |
| [French-stream](https://french-stream.net/index.php?newsid=15138750) | 49, Chrome graphique, deux conditions de blocage publicitaire | Sans bloqueur, les trois clics sont interceptés et seule la bande-annonce est exposée. Avec uBlock Origin Lite en mode Complete, **Vidzy joue le film en 864×360** (horloge 0:07 puis 0:31) : trois propositions HLS deviennent une carte 360p contrôlée, deux pistes, badge 1. **Voe joue en 1728×720**, de 5,760 s à 38,993 s : une carte HLS 720p contrôlée, piste combinée, badge 1. Dood reste non validé après une redirection non sollicitée vers about:blank et un échec DNS lié à Cloudflare. Aucun export complet du film. |

Le rapport [public-pages-0.1.49.json](benchmarks/public-pages-0.1.49.json) sépare ces observations des tests interceptés. Les HTML, captures des pages tierces, manifestes, échantillons et URL signées bruts restent sous `.local/detection49`, ignoré par Git et exclu des livrables.

## Reprise French-stream avec bloqueur

Les trois essais supplémentaires Vidzy, Dood et Voe utilisent **le même Alcydeo 0.1.49**, Chrome graphique 156.0.8078.4 avec agent utilisateur natif et un profil isolé équipé d’uBlock Origin Lite **2026.1103.1743**, mode **Complete** choisi dans son interface. L’archive provient de la [release officielle uBlockOrigin/uBOL-home](https://github.com/uBlockOrigin/uBOL-home/releases/tag/2026.1103.1743). Son SHA-256, vérifié contre l’empreinte de l’asset GitHub, est `79236476535b63706749e088e0ce99bb31d3d2ff15fabb4d7e990be23d6e4613`.

Vidzy et Voe atteignent `readyState=4` et lisent le vrai film ; Voe indique une durée de 6 299,833 s. Leurs contrôles Alcydeo sont prêts, sans nouvelle tâche ni téléchargement ou export demandé. Dood charge un cadre Playmogo avec une vidéo sans dimensions puis quitte le lecteur ; cet essai ne valide pas sa lecture. Les deux sessions Chrome réutilisent séquentiellement le même profil isolé avec bloqueur et sont fermées à la fin. L’essai initial sans bloqueur reste une observation distincte et ne permettait pas de conclure sur la détection du film une fois le lecteur démarré.

Le bloqueur reste un outil externe d’essai, hors des livrables Alcydeo ; aucune modification ou nouvelle version du produit n’est nécessaire pour ces lectures. Ces trois essais publics supplémentaires ne sont pas ajoutés aux compteurs de régression ci-dessous.

## Correction vérifiée

Sur Apocalypse, le master associe vidéo et audio français, tandis que le lecteur expose aussi leurs deux playlists natives séparées. En 48, trois propositions subsistent après contrôle. En 49, les identités contrôlées de chaque piste relient ces feuilles à la variante complète : une carte conserve qualité, sélection, vidéo et audio natifs. La comparaison reste bornée, dans la même page et le même cadre. Elle ne modifie aucune adresse ni signature et ne confond pas deux langues. [Détails HLS](COFLIX.md).

Le transfert complet de régression utilise exclusivement les médias originaux locaux : neuf fragments vidéo/audio, MP4 de 1 837 166 octets, AVC/AAC, 6,021 s, copie Chrome complète existante. Les lectures natives tardives et les recherches de qualités conservent une carte. Un 403 sur un alias audio inutilisé ne détruit pas la paire ; le transport audio choisi refusé disparaît, tandis qu’une alternative déclarée accessible peut revenir après un nouveau contrôle de ses deux pistes. Aucun second export ne part sans clic.

Le lot compte 485 tests unitaires, 35 tests Chrome locaux et 22 tests Chrome Store réussis, avec typecheck et lint réussis. Ces régressions ne constituent pas 57 essais de sites publics. [Périmètre des vérifications](TEST-RESULTS.md).

## Améliorations restantes, par priorité

1. Distinguer « lecteur non démarré / aucun flux observé » d’une source échantillonnée puis refusée. Les deux conditions French-stream expliquent pourquoi un même site expose ou non son film ; le contrôle Dailymotion sans interface ne prouve pas non plus une défaillance du téléchargement d’un média accessible.
2. Évaluer un filtrage prudent des publicités identifiées explicitement par le lecteur, comme « Advertisement » sur Dailymotion. Une courte durée ou une petite taille ne suffit pas : les clips légitimes doivent rester proposés.
3. Préparer un diagnostic local copiable pour les cas non reproduits : versions, page publique, lecteur actif, états des cadres et contrôles HTTP/MIME. Exclure cookies, en-têtes personnels et signatures ; aucun envoi automatique.

Ces améliorations ne sont pas implémentées dans ce lot. Aucune compatibilité universelle n’est annoncée. Aucun CAPTCHA, accès, paiement ou DRM n’est contourné ; aucun clic forcé ni suppression manuelle de calque n’est utilisé. Aucune origine ou signature n’est fabriquée. La disponibilité d’un lecteur aujourd’hui ne garantit pas son fonctionnement futur.
