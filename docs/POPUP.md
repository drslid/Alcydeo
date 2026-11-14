# Popup Alcydeo — 0.1.40

Révision du 5 novembre 2026 : réorganiser la fenêtre de la barre Chrome pour rendre les actions faciles à trouver, sans modifier les moteurs de téléchargement.

L’en-tête conserve l’oiseau, Alcydeo, le sélecteur de langue à drapeaux, l’aide et les réglages. La bibliothèque et la capture d’onglet ont une seule entrée globale dans le pied de fenêtre, toujours accessible lorsque les sources défilent. Le nom de domaine est tronqué si nécessaire ; le compteur est discret. La largeur reste de 525 px, avec une hauteur maximale de 600 px.

Chaque fiche réserve la première ligne au titre. Le titre complet reste disponible au survol et pour les lecteurs d’écran. Seules les miniatures déjà disponibles sont affichées. Aperçu ou recherche de qualités sont en haut ; la ligne d’action présente le choix de qualité, Cast et Télécharger. Les autres commandes (découpe, capture/enregistrement, autorisations complémentaires) sont regroupées sous « … ». Les sources de direct et de capture gardent leur action principale dédiée.

Le menu utilise un popover natif de Chrome : affichage au-dessus de la liste défilante, position bornée à la fenêtre, tabulation, fermeture par Échap/clic extérieur et retour du focus. Le positionnement natif garde le menu ancré à sa fiche lors du défilement et du redimensionnement ; Chrome peut le déplacer au-dessus si nécessaire. Un placement borné de repli est conservé pour les versions sans zones d’ancrage CSS, non revalidées ici. Le sélecteur de langue se ferme par Échap ou clic extérieur et reste utilisable sans recharger les traitements. Les libellés « Autres actions » et « Activité » existent dans les dix langues. L’onglet Activité présente les tâches de la page ; le bouton Bibliothèque ouvre la collection complète.

La progression reste dans la popup. Les fichiers enregistrés proposent des contrôles compacts pour retrouver le fichier, caster, découper et accéder aux outils du gestionnaire. Les actions de pause/reprise, annulation, enregistrement du résultat prêt, capture et Cast conservent leurs moteurs et leurs limites documentées. Cette refonte ne constitue pas un nouveau test de réception sur une TV physique.

## Vérification

`tests/e2e/popup-design.spec.ts` charge la vraie extension dans Chrome et contrôle les dix langues, les thèmes clair/sombre, les titres longs, six sources et le défilement, les menus en bas de liste, le clavier, les restrictions de sites et les états de bibliothèque. La prévisualisation décode réellement la qualité 180p choisie. Les fiches d’erreur/succès de cette matrice sont des données synthétiques de présentation ; les transferts réels de fixtures sont couverts séparément par popup-flow, popup-locales, saving et grouping.

Les tests existants de popup native exercent ouverture réelle de l’action Chrome, progression, pause/reprise, fermeture/réouverture, gestionnaire caché pour les segments et fichier enregistré identique à l’original local. Les tests TV distinguent le passage du clic depuis la popup et les simulations de récepteur. Les captures à 525×600 sont des captures d’extension installée, pas une maquette HTML du produit.

Les preuves actuelles sont dans TEST-RESULTS.md et benchmarks/popup-design-0.1.40.json. L’environnement de laboratoire reste Chrome Linux/WSL2 ; le profil Chrome Windows et un récepteur physique n’ont pas été pilotés dans cette révision. Aucun téléversement de média ni publication externe.
