# Gestionnaire Alcydeo — direction 0.1.18

La demande est une interface épurée dans l’esprit Google/Material, en conservant le martin-pêcheur et la palette validée. Le gestionnaire utilise une navigation latérale stable, un espace de travail arrondi, une recherche visible et une liste de fichiers organisée. Les états, dates et actions proviennent des tâches existantes ; aucun tableau de bord de chiffres fictifs n’est ajouté.

Les réglages sont regroupés en détection, apparence, destination et traitement. La barre Enregistrer reste disponible pendant le défilement. La navigation revient en haut de la vue choisie. Les actions secondaires utilisent des icônes locales avec libellés accessibles et infobulles ; les actions principales gardent leur texte. Les titres longs sont tronqués visuellement avec leur texte complet conservé dans l’accessibilité et l’infobulle.

La navigation devient un rail compact à 900 px, puis une disposition étroite à 390 px. Le logo, Ajouter une vidéo et Aide conservent un nom accessible quand leur texte est masqué. Le lien Aller au contenu est disponible au clavier. Les dix catalogues natifs Chrome, les nombres/dates Intl et les propriétés CSS logiques assurent la continuité des interfaces LTR/RTL. Les polices système et le sous-ensemble arabe/ourdou existant restent locaux.

Les icônes sont un sous-ensemble de **33 Material Symbols Rounded**, taille optique 24, poids 400, extraites du dépôt officiel à la révision `10ecc14790612ca8fd164e3f4ffe9c16fc50d5b7`. Les chemins SVG restent ceux de Google ; le composant Vue les colore avec `currentColor`. Pas de police d’icônes, service Google Fonts, CDN ou bibliothèque d’interface à l’exécution. Sources SVG, URL et empreintes : [provenance](../packages/design-tokens/icons/PROVENANCE.json). Licence conservée : [Apache-2.0](licenses/Material-Symbols-Apache-2.0.txt).

Références primaires : [Material layout](https://m3.material.io/foundations/layout/canonical-examples/overview), [navigation rail](https://m3.material.io/components/navigation-rail/overview), [lists](https://m3.material.io/components/lists/overview), [Material Symbols](https://developers.google.com/fonts/docs/material_symbols). Le code de mise en page est original ; la mention Google identifie la référence et l’origine des icônes, pas une affiliation du produit.

Les essais dédiés vérifient dix langues, trois largeurs, les filtres, les libellés longs, le clavier et les contrastes réels. Les captures d’organisation utilisent des fiches de test synthétiques ; les parcours médias produisant de vrais fichiers sont vérifiés séparément. [Rapport de validation](TEST-RESULTS.md).

## Identité 0.1.19

Le visage est désormais de profil avec un seul œil visible et la flèche est retirée. Les petits en-têtes utilisent la tête simplifiée ; les vues vides et le grand visuel du site conservent l’oiseau complet. Les signatures de publication ont des lettres vectorisées pour garder un rendu fixe sans police à installer. Voir [le guide des déclinaisons](BRAND.md). La palette et la disposition 0.1.18 sont conservées.

## Téléchargement et conversion 0.1.22

Le téléchargement reste dans la popup : Sources et Téléchargements partagent la même fenêtre. La progression, les octets reçus, le pourcentage et les commandes de pause/reprise/annulation utilisent les tâches persistées. La réouverture retrouve les transferts actifs de la page. Le pied de page et la barre latérale affichent Alcydeo et sa version. Les outils avancés ouvrent explicitement le gestionnaire, avec le fichier assemblé présélectionné lorsqu’il est disponible. Un fichier direct enregistré par Chrome doit être choisi par l’utilisateur pour être traité.

Un téléchargement direct natif n’ouvre aucun onglet. HLS, DASH et multipart utilisent le gestionnaire dans un onglet inactif, réutilisé et réveillé par le service worker sans changer l’onglet actif. Fermer la popup ne ferme pas ce gestionnaire ; le fermer interrompt les traitements gérés, récupérables ensuite selon leurs checkpoints. Un Web Lock propre à chaque tâche protège les Workers encore vivants contre la récupération d’une ancienne lease, notamment quand un onglet inactif voit ses timers ralentis.

Les réglages de conversion MP4 proposent une qualité automatique/élevée/équilibrée/légère, une résolution originale/1080p/720p/480p sans agrandissement, et un débit audio automatique/128/192/256 kb/s. Les dimensions respectent l’orientation. Automatique conserve les pistes H.264/AAC compatibles si la résolution ne demande pas de redimensionnement. Les choix sont conservés avec chaque tâche et modifiables dans les outils avant lancement ; ils ne modifient pas les modes compression/découpe/fusion. Aucun débit vidéo exact ni taille de sortie garantie n’est annoncé.

Le lancement d’un Worker relit la tâche persistée après acquisition de la lease, puis après la préparation du plan. Un snapshot de file périmé ne peut ainsi relancer une tâche déjà enregistrée ou passée au téléchargement natif. Le passage au téléchargement Chrome attend aussi la libération du verrou de traitement précédent.

## Outils vidéo 0.1.23

L’onglet permanent Outils vidéo ouvre un espace de travail dans le gestionnaire : Découper par début/fin en secondes, Assembler des vidéos avec réorganisation des fichiers, Convertir en MP4 et Compresser. Le formulaire est partagé avec les dialogues contextuels existants. Les actions utilisent la file locale persistée et conservent les originaux ; ce changement de navigation ne modifie pas les limites du moteur. La route directe #tools est distincte du raccourci contextuel #tools/identifiant.

## Cloud destinations, 0.1.25

Locally drawn SVG provider identifiers replace the destination dropdown. Provider names remain visible; pressed state and keyboard focus do not rely on color alone. Gofile sharing and pCloud/Drive/OneDrive storage are grouped separately. These original small identification drawings are part of the MIT application code; provider names and recognizable marks belong to their respective owners and do not imply affiliation. No remote logo, font or script is fetched.


## 0.1.30 — bibliothèque et montage visuel

Bibliothèque unifiée avec sélection par page/fiche et barre d’actions groupées. Les miniatures sont des images extraites à un instant aléatoire des fichiers accessibles ; absence de fichier/codec : icône neutre. Le sélecteur de langue utilise dix drapeaux SVG locaux et les noms natifs, avec RTL sans rechargement.

Découpe dans un espace de travail large : lecteur, six images réelles, poignées de début/fin, lecture de sélection et temps précis repliés. Assemblage : clips illustrés, durée et ordre visibles, glisser/déposer et boutons accessibles. Les paramètres globaux de conversion/compression se trouvent dans Réglages. Les raccourcis source de la popup restent sur la ligne d’icônes pour conserver sa densité.

Cloud garde deux destinations à icônes, Gofile et pCloud. L’annotation est un overlay local sur l’onglet capturé, avec couleurs, épaisseur, annulation et effacement. Le contrôleur Cast persistant reçoit le geste du clic popup ; les préparations de fichiers affichent explicitement toute copie requise.

Le sous-ensemble Devanagari officiel Noto Sans est embarqué sous SIL OFL pour que l’hindi et son nom dans le sélecteur restent lisibles sans police système correspondante. Les sources et empreintes sont conservées dans docs/licenses ; aucune requête de police distante à l’utilisation.

MegaUp 0.1.33 uses an original local M monogram SVG, matching the destination-icon system. It is an Alcydeo UI mark, not a downloaded official MegaUp logo.

0.1.34: original local 1fichier identifier, a white 1 in a red rounded square, alongside the named provider icon. No provider logo asset or remote icon font is downloaded. Three sharing cards and one storage card on desktop; stacked sharing destinations in narrow layouts.

0.1.35: locally drawn Turbobit identifier, white T in an orange rounded square. Four sharing destinations fit available desktop width and stack in narrow views; pCloud remains a distinct storage destination. No provider logo assets or fonts are fetched by the extension.
