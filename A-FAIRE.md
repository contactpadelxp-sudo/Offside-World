# À faire — Offside Foot Indoor

Suivi des points en attente. Mis à jour au fil des échanges ; ce fichier fait
foi plutôt que la mémoire d'une conversation.

---

## 1. Bloquants avant d'accueillir de vrais clients

Le site est aujourd'hui une **maquette fonctionnelle** : aucune réservation
n'est enregistrée, aucun paiement n'est encaissé.

- [ ] **Back-office `/admin` sans authentification.** La page est publique et
      affiche des données de réservation (nom, téléphone, allergie d'un
      enfant). Il faut une authentification avant toute mise en production.
- [ ] **Aucun back-end de réservation.** Les créneaux et les réservations sont
      écrits en dur dans `src/data/`. Une réservation validée sur le site n'est
      enregistrée nulle part.
- [ ] **Paiement réel** — Stripe + Bancontact. Le bouton actuel est une
      démonstration.
- [ ] **Dépôt GitHub public → privé.**

## 2. Informations légales manquantes

Obligatoires en Belgique (Code de droit économique, art. III.74). Elles
s'affichent aujourd'hui « [à compléter] » sur le site. Un seul fichier à
modifier : `src/data/entreprise.ts`.

- [ ] Dénomination sociale (la société qui exploite le complexe)
- [ ] Numéro d'entreprise (BCE)
- [ ] Numéro de TVA
- [ ] Siège social, s'il diffère de Gembloux
- [ ] Responsable de la publication
- [ ] Arrondissement judiciaire compétent (dans les CGU)

## 3. Créneaux des anniversaires

**Décision prise :** la location de terrain reste gérée par Sport-Finder, les
anniversaires par ce site. Pour qu'aucune réservation ne se chevauche, les
anniversaires n'occupent que des plages **retirées de la location côté
Sport-Finder** (par exemple le mercredi après-midi).

⚠️ L'étanchéité repose sur **deux** actions, pas une : configurer ces créneaux
ici **et** les bloquer sur Sport-Finder. Sans le second, le chevauchement reste
possible.

Informations à obtenir :

- [ ] Jours et plages horaires réservés aux anniversaires
- [ ] Nombre d'anniversaires en parallèle par plage (le site en annonce 2
      aujourd'hui, avec 30 min de battement)
- [ ] Profondeur de réservation (jusqu'à combien de temps à l'avance)
- [ ] Confirmation que Brahim a bien retiré ces plages de la location

À modifier ensuite : `timeSlots` dans `src/data/salles.ts` et `DATES` dans
`src/components/reservation/steps/anniversaire-flow.tsx`.

## 4. Cohérence des prix avec Sport-Finder

Les deux plateformes annoncent des tarifs différents. Un client qui compare
verra la contradiction.

| Prestation | Sport-Finder | Ce site |
| --- | --- | --- |
| Bubble Foot | dès 20 €/pers. | 23 €/pers. |
| Anniversaire | dès 140 €/session | 180 € (Kick-Off) |
| Location de terrain | dès 70 €/heure | prix non affiché |

- [ ] Décider quels prix font foi, puis aligner le site ou Sport-Finder

## 5. Contenus manquants

- [ ] **Photo de la carte « Anniversaire »** sur la page de réservation
      (affiche « Photo à venir »)
- [ ] **Photo de Bubble Foot** pour la formule anniversaire du même nom, qui
      montre aujourd'hui une piñata faute de mieux
- [ ] **Horaires réels des demi-journées** de team building (9h–13h et 14h–18h
      sont des valeurs provisoires)
- [ ] **Noms réels des espaces anniversaire** (« Espace anniversaire 1 et 2 »
      sont des noms provisoires)

Les emplacements photo se remplissent en déposant le fichier dans
`public/images/` : la résolution ignore majuscules, accents, espaces et tirets.
Voir `src/lib/photos.ts`.

## 6. Chiffres à valider ou retirer

Inventés à l'époque de la maquette, toujours affichés :

- [ ] « 2000+ fêtes organisées » (page d'accueil)
- [ ] « 4.8/5 sur Google — 200+ avis » (section « Pourquoi Offside Foot Indoor ? »)

Le complexe vient d'ouvrir : soit les vrais chiffres, soit on retire.

## 7. Audit sécurité et RGPD — en pause

Un audit a analysé le site sous 14 angles et produit **249 constats**, dont 55
critiques ou élevés, ramenés à **39 après fusion des doublons**. Sur ces 39,
**16 ont été vérifiés de façon contradictoire**, les 23 autres restent à faire,
ainsi que le rapport final.

Mis en pause à la demande. Les résultats intermédiaires vivent dans le dossier
de travail de la session, qui est **éphémère** : si le conteneur est recyclé
avant la reprise, l'analyse est à relancer depuis le début.

Deux points pour la reprise :

- Ne pas relancer par « resume » : le cache rejoue les échecs tels quels sans
  rien recalculer. Il faut un run neuf ciblé sur les constats manquants.
- Ne pas committer les résultats dans ce dépôt tant qu'il est public : ce sont
  des descriptions de failles exploitables.
