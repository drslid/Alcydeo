# Découpe : horaires modifiables — 0.1.51

Dans **Outils vidéo → Découper**, les champs **Début** et **Fin** sont directement visibles sous le lecteur, sur la ligne de sélection. Ils remplacent les anciens champs en secondes cachés dans « Temps précis ». Le lecteur, les poignées et la durée sélectionnée restent associés aux mêmes valeurs.

La saisie accepte :

- des secondes : `12`, `12.5` ou `12,500` ;
- des minutes et secondes : `1:02.125` ;
- des heures, minutes et secondes : `1:02:03.456`.

Les fractions acceptent jusqu’à trois décimales. Les chiffres arabes, persans, devanagari et pleine chasse sont aussi reconnus. Les champs gardent leur sens de lecture numérique en RTL ; les libellés suivent la langue de l’interface.

Un texte en cours, comme `1:`, reste affiché pendant la frappe. Une paire valide met à jour les poignées et la position du lecteur. Entrée ou la sortie du champ normalise l’horaire ; Échap restaure la valeur de sélection précédente du champ. Déplacer une poignée ou utiliser « Début ici » / « Fin ici » reprend la sélection du lecteur dans les champs.

Les valeurs négatives, les secondes supérieures à 59 après deux-points, les fractions trop longues, les horaires hors durée et les bornes inversées ne déclenchent aucun export. Le bouton de traitement reste désactivé et une erreur explique la plage invalide. Cette protection s’applique aussi à la soumission du formulaire au clavier. Choisir un autre fichier réinitialise la sélection.

L’export suit la file locale existante : un MP4 distinct nommé avec le suffixe `-trimmed`, l’original conservé, les pistes audio/vidéo contrôlées et l’enregistrement Chrome selon les réglages. Le gestionnaire doit rester ouvert. Une pause ou sa fermeture reprend le traitement depuis l’entrée conservée.

La saisie permet de positionner les bornes au millième de seconde. La précision effective du fichier produit dépend de la cadence des images, des paquets audio et du moteur ; les contrôles de durée et de pistes du traitement restent appliqués. Le format du texte n’ajoute aucun codec ni capacité de conversion.

Les preuves utilisent uniquement les mires et sons originaux du dépôt. Les résultats de validation, captures et limites exécutées sont décrits dans [TEST-RESULTS.md](TEST-RESULTS.md).

## Validation locale

Le runtime 0.1.51 testé passe **49 tests unitaires** de saisie et **27 cas Chrome** de découpe/outils, dont les dix langues et le RTL. Les champs restent alignés à 390 px. Un export de la fixture WebM originale, demandé de 1,125 à 3,875 secondes, enregistre un seul MP4 de 331 393 octets en H.264/AAC ; le fichier source reste identique. Le résultat mesure 2,752 secondes au contrôle de structure et 2,773333 secondes dans le lecteur Chrome, qui le lit jusqu’au bout. Ces durées observées distinguent la précision de saisie de celle du média produit.

Les captures utilisent uniquement la mire MP4 originale, dans le runtime de livraison dont les fichiers d’interface et de moteur sont identiques au runtime des tests. [Rapport et empreintes](benchmarks/trim-times-0.1.51.json) · [Capture française](screenshots/trim-time-editor-fr.png) · [Sombre](screenshots/trim-time-editor-fr-dark.png) · [RTL](screenshots/trim-time-editor-ur-dark.png). Le profil Windows utilisateur et l’installation CRX ne sont pas pilotés par ces essais.
