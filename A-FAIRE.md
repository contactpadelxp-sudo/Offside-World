# À faire — Offside Foot Indoor

Suivi des informations et contenus en attente. Ce fichier fait foi plutôt que la
mémoire d'une conversation.

> Ce dépôt est public. Les points touchant à la sécurité et à la conformité sont
> suivis hors dépôt, dans le document remis à Mathis.

---

## 1. Créneaux des anniversaires

**Décision prise :** la location de terrain est gérée par Sport-Finder, les
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
- [ ] Confirmation que ces plages ont bien été retirées de la location

À modifier ensuite : `timeSlots` dans `src/data/salles.ts` et `DATES` dans
`src/components/reservation/steps/anniversaire-flow.tsx`.

## 2. Cohérence des prix avec Sport-Finder

**Décision prise :** les prix qui font foi sont ceux communiqués par Brahim, et
déjà en place sur le site et dans la base — Kick-Off 180 €, Bubble 290 €,
+10 €/+15 € par enfant supplémentaire, Bubble Foot 23 €/pers. (minimum 6).

Reste l'écart avec ce qui est affiché sur Sport-Finder :

| Prestation | Sport-Finder | Prix retenu |
| --- | --- | --- |
| Anniversaire | dès 140 €/session | **180 €** (Kick-Off) |
| Bubble Foot | dès 20 €/pers. | **23 €/pers.** |
| Location de terrain | dès 70 €/heure | non affiché sur le site |

- [ ] **Brahim doit mettre Sport-Finder à jour**, sinon un client qui compare les
      deux pages verra deux tarifs différents pour la même prestation — et
      pourra légitimement exiger le moins cher.
- [ ] Vérifier au passage si l'entrée « Anniversaire de Football » de
      Sport-Finder fait double emploi avec la réservation du site : deux canaux
      pour la même prestation rouvrent le risque de double réservation que la
      règle d'étanchéité cherche justement à éliminer.

## 3. Informations d'entreprise à fournir

Obligatoires en Belgique (Code de droit économique, art. III.74). Un seul
fichier à compléter : `src/data/entreprise.ts`.

- [ ] Dénomination sociale de l'exploitant
- [ ] Numéro d'entreprise (BCE)
- [ ] Numéro de TVA
- [ ] Siège social, s'il diffère de Gembloux
- [ ] Responsable de la publication
- [ ] Arrondissement judiciaire compétent (pour les CGU)

## 4. Contenus manquants

- [ ] **Photo de la carte « Anniversaire »** sur la page de réservation
- [ ] **Photo de Bubble Foot** pour la formule anniversaire du même nom
- [ ] **Horaires réels des demi-journées** de team building (9h–13h et 14h–18h
      sont des valeurs provisoires)
- [ ] **Noms réels des espaces anniversaire** (« Espace anniversaire 1 et 2 »
      sont provisoires)
- [ ] **Décision sur la vidéo souvenir** : la maintenir dans les formules
      suppose de pouvoir la produire, la livrer, et recueillir l'autorisation
      parentale pour filmer des enfants

Les emplacements photo se remplissent en déposant le fichier dans
`public/images/` : la résolution ignore majuscules, accents, espaces et tirets.
Voir `src/lib/photos.ts`.
