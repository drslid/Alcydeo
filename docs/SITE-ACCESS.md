# Accès aux sites — 0.1.42

Le message « Autorisez les domaines sources, puis réessayez » et les commandes de validation de domaines dans Alcydeo ont été retirés. Les hôtes HTTP/HTTPS sont déjà déclarés à l’installation pour la détection standard. La popup ne présente plus de bouton pour autoriser chaque domaine ou lecteur intégré ; aucun appel `chrome.permissions.request` pour HTTP/HTTPS n’est effectué dans ce parcours.

Ouvrir la popup sur une page interne de Chrome ou du gestionnaire ne lance plus d’analyse de cette page : un état neutre invite à ouvrir une page web. Cela évite de présenter l’absence d’URL accessible comme un besoin d’autoriser des domaines. Le bouton Analyser et la capture d’onglet sont désactivés dans cet état.

Les contrôles techniques d’hôte restent appliqués avant les requêtes. Une restriction réelle dans Chrome n’est pas contournée : une tâche gérée sans accès à sa source se met en pause, libère son propriétaire et présente un diagnostic de source inaccessible avec un lien vers les réglages de l’extension dans Chrome. Elle ne reste plus bloquée indéfiniment dans une file demandant des domaines à valider. Après modification du réglage Chrome, la reprise standard relit les autorisations.

Le retrait d’un accès sans rapport avec le téléchargement actif ne l’interrompt plus. Le gestionnaire vérifie uniquement les origines nécessaires au traitement actif, calculées à partir de sa page, de ses pistes et du plan de segments. Si un accès réellement nécessaire est retiré, le Worker est arrêté et la tâche passe en pause. Les permissions facultatives des fichiers locaux restent distinctes pour la bibliothèque et le Cast de fichiers.

Les textes d’erreur et de réglages Chrome sont localisés dans les dix langues. Il n’y a aucune nouvelle permission, DNR, modification d’en-têtes, contournement d’accès ou transmission vers un service externe.

Les sources techniques sont la documentation Chrome des [permissions](https://developer.chrome.com/docs/extensions/reference/api/permissions) et des [déclarations d’accès](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions). Les restrictions effectives de Chrome restent prioritaires sur les droits déclarés dans le manifeste.

Les tests utilisent la vraie extension dans Chrome avec des pages et médias originaux locaux : page interne, CDN réellement restreint via les réglages Chrome, reprise après rétablissement de l’accès, retrait d’un autre domaine pendant un transfert puis retrait de sa vraie origine. Les tests de réseau existants vérifient aussi les refus avant requête et la distinction des réponses HTTP 401/403. Voir TEST-RESULTS.md et benchmarks/site-access-0.1.42.json. Le profil Windows de l’utilisateur n’est pas piloté.
