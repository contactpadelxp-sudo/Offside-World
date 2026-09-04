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

Les deux plateformes annoncent des tarifs différents. Un client qui compare
verra la contradiction.

| Prestation | Sport-Finder | Ce site |
| --- | --- | --- |
| Bubble Foot | dès 20 €/pers. | 23 €/pers. |
| Anniversaire | dès 140 €/session | 180 € (Kick-Off) |
| Location de terrain | dès 70 €/heure | prix non affiché |

- [ ] **Demander à Brahim quels prix font foi**, puis aligner le site ou Sport-Finder

Ce point bloque désormais la base de données : le référentiel tarifaire
(`supabase/migrations/0002_referentiel.sql`) fige 180 € et 23 €. Si Brahim
confirme d'autres montants, il faut corriger la migration **avant** de
l'appliquer, ou passer par une mise à jour SQL ensuite.

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
