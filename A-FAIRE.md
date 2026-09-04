# À faire — Offside Foot Indoor

Suivi des décisions et informations en attente. Ce fichier fait foi plutôt que
la mémoire d'une conversation.

> Ce dépôt est public. Les points touchant à la sécurité sont suivis hors dépôt,
> dans le document remis à Mathis.

---

# À demander à Brahim

## Sport-Finder — 5 points

Sa page publique est le seul canal de réservation des terrains ; plusieurs
réglages y sont incohérents avec le site.

- [ ] **Aligner les prix.** Sport-Finder annonce 140 €/session pour
      l'anniversaire et 20 €/pers. pour le Bubble Foot ; les prix retenus sont
      **180 €** et **23 €/pers.** Un client qui compare les deux pages verra deux
      tarifs pour la même prestation et pourra exiger le moins cher.
- [ ] **Désactiver ou clarifier les entrées « Anniversaire de Football » et
      « Activité de groupe de Bubble Foot ».** Ces prestations se réservent sur
      le site : les laisser sur Sport-Finder crée deux canaux pour la même
      chose, donc un risque de double réservation. Elles sont aujourd'hui en
      « Faire une demande » et non en réservation instantanée, ce qui limite le
      risque sans le supprimer.
- [ ] **Retirer de la location de terrain les plages réservées aux
      anniversaires.** C'est la moitié de la règle d'étanchéité — sans elle,
      configurer les créneaux côté site ne sert à rien.
- [ ] **Confirmer que la page publique est bien en ligne.** Mathis ne trouvait
      pas le complexe dans la recherche : vérifier dans « Page publique →
      Général » que la page est publiée et que les activités sont renseignées.
- [ ] **Vérifier les factures Sport-Finder.** Un bandeau du back-office mentionne
      2 factures ; un impayé peut suspendre la page publique.

## Créneaux des anniversaires — le site tourne aujourd'hui sur des plages provisoires

**Décision prise :** les terrains restent sur Sport-Finder, les anniversaires sur
le site, et les anniversaires n'occupent que des plages retirées de la location.

En attendant les vraies plages, la base a été remplie avec l'hypothèse déjà
affichée sur le site : **mercredi après-midi, samedi et dimanche**, créneaux de
2 heures à 10 h, 12 h 30, 15 h et 17 h 30, sur les deux espaces. Le Bubble Foot
occupe les vendredis, samedis et dimanches à 18 h, 19 h et 20 h.

Ces plages sont désormais **des données, plus du code** : les corriger ne
demande aucun redéploiement.

- [ ] Jours et plages horaires réellement réservés aux anniversaires
- [ ] Nombre d'anniversaires en parallèle par plage (deux espaces sont ouverts)
- [ ] Jusqu'à combien de temps à l'avance on peut réserver (six mois sont
      ouverts en base, trois mois sont affichés)

## Informations d'entreprise

Obligatoires en Belgique (Code de droit économique, art. III.74). Elles
s'affichent aujourd'hui « [à compléter] » sur le site public.

- [ ] Dénomination sociale de l'exploitant
- [ ] Numéro d'entreprise (BCE)
- [ ] Numéro de TVA
- [ ] Siège social, s'il diffère de Gembloux
- [ ] Responsable de la publication
- [ ] Arrondissement judiciaire compétent (pour les CGU)

## Décisions à trancher

- [ ] **Vidéo souvenir.** Elle est vendue dans les deux formules. La maintenir
      suppose de pouvoir la produire, la livrer, et recueillir l'autorisation
      parentale pour filmer des enfants. Sinon, la retirer des formules.
- [ ] **Réservations sans paiement.** Une réservation validée sur le site est
      enregistrée en « à confirmer » : elle bloque le créneau, et le site
      annonce au client qu'on le recontacte. Sans confirmation, elle est
      libérée au bout de 48 heures. À valider : est-ce le fonctionnement voulu
      en attendant Stripe, et 48 heures est-il le bon délai ?
- [ ] **Chiffres et avis affichés.** Trois contenus ne correspondent à rien de
      réel, et un avis inventé est en outre interdit par le droit de la
      consommation (pratique commerciale trompeuse) :
      - « 2000+ fêtes organisées » (page d'accueil)
      - « 4.8/5 sur Google (200+ avis) » (section « Pourquoi Offside »)
      - le témoignage signé « Sophie D., Google »
      Fournir les vrais chiffres et un vrai avis, ou retirer les trois.

## Contenus manquants

- [ ] Photo pour la carte « Anniversaire » de la page de réservation
- [ ] Photo de Bubble Foot pour la formule du même nom
- [ ] Horaires réels des demi-journées de team building (9h–13h et 14h–18h sont
      provisoires)
- [ ] Noms réels des espaces (« Espace anniversaire 1 et 2 » ; ces mêmes espaces
      accueillent aussi le Bubble Foot, le nom mériterait d'être neutre)

Il suffit de déposer les photos dans `public/images/` : la résolution ignore
majuscules, accents, espaces et tirets. Voir `src/lib/photos.ts`.

---

# À faire côté Mathis

- [ ] **Définir `ADMIN_USER` et `ADMIN_PASSWORD`** dans Vercel (type
      « Sensitive » pour le mot de passe). Sans ces deux variables, `/admin`
      répond 404 : c'est voulu, mais le back-office reste alors inaccessible à
      Brahim.
- [ ] **Passer le dépôt GitHub en privé.** Tant qu'il est public, l'historique
      reste lisible, y compris les versions précédentes de ce fichier.
- [ ] **Configurer DMARC et durcir SPF** sur `offsidefootindoor.be`, chez le
      registrar. Sans cela, les e-mails de confirmation partiront en spam et
      l'adresse pourra être usurpée.
- [ ] Ouvrir un compte **Stripe** avec Bancontact activé.
- [ ] **Planifier deux tâches récurrentes** en base (Supabase → Cron) :
      `generer_creneaux_anniversaire` / `generer_creneaux_bubble` pour prolonger
      l'horizon de réservation, et `anonymiser_reservations_anciennes` pour la
      minimisation RGPD.

---

# État technique

**Base de données** — projet `shybhkzgwxyajysjlrbv` (Offside World, eu-west-1),
migrations `0001` à `0008` appliquées et vérifiées.
RLS activé et forcé sur les 8 tables, sans aucune politique : rien n'est
accessible par les clés publiques, tout passe par le serveur.

**Le site est branché sur la base.** Ce qui en vient désormais :
- les formules et leurs tarifs (page d'accueil et funnel) ;
- les créneaux et leur disponibilité réelle ;
- les réservations et les demandes de devis, écrites par une Server Action ;
- le back-office, qui liste les vraies réservations à venir.

**Le prix est recalculé côté serveur** à partir des tables `formules` et
`options` au moment d'écrire la réservation. Le total affiché dans le navigateur
n'est qu'un aperçu : le modifier ne change pas ce qui est facturé.

**Garde-fous vérifiés en conditions réelles :** une seconde réservation sur un
créneau déjà pris est rejetée par la base, deux créneaux qui se chevauchent dans
le même espace sont rejetés, et le prix d'une formule Bubble à 14 enfants avec
deux options tombe au centime attendu. Le linter de sécurité Supabase ne remonte
aucun avertissement — les 8 avis « RLS activé sans politique » sont le
comportement voulu.

**Ce qui reste à construire :** le paiement en ligne (Stripe + Bancontact), les
e-mails transactionnels, et un vrai système de comptes pour le back-office —
l'authentification actuelle est volontairement sommaire et ne convient qu'à une
page en lecture seule.

**`src/data/formules.ts`** ne contient plus que des textes fixes et un repli
d'affichage pour la page d'accueil. Ce repli ne sert jamais au calcul d'un
montant : en cas de doute, c'est la base qui a raison.
