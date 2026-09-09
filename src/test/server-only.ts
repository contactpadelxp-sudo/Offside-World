/**
 * Doublure de `server-only` pour les tests.
 *
 * Le vrai paquet lève dès qu'il est chargé ailleurs que dans un composant
 * serveur : c'est précisément son rôle, et c'est ce qui garantit qu'un module
 * touchant la clé de service ne parte jamais dans le bundle du navigateur.
 *
 * Un test tourne dans Node, donc ni sur le serveur Next ni dans un navigateur.
 * On le remplace par un module vide plutôt que d'affaiblir la protection —
 * elle continue de s'appliquer partout ailleurs, y compris à la compilation.
 */
export {};
