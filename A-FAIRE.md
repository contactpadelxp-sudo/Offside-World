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

En attendant les vraies plages, la base tourne sur une hypothèse. État relevé
en production le 7 septembre 2026, sur les deux espaces :

| | Anniversaires (2 h) | Bubble Foot (1 h) |
|---|---|---|
| Mercredi | 13:00 · 14:00 · 15:30 · 16:30 | — |
| Vendredi | — | 16:00 · 17:00 · 18:00 · 19:00 |
| Samedi | 08:00 · 09:00 · 10:30 · 11:30 · 13:00 · 14:00 · 15:30 · 16:30 | 18:00 · 19:00 |
| Dimanche | idem samedi | 18:00 · 19:00 |

Les départs s'enchaînent toutes les 2 h 30 — 2 h de fête plus 30 minutes de
battement — avec une option intermédiaire une heure après chaque départ.

Ces plages sont désormais **des données, plus du code** : les corriger ne
demande aucun redéploiement.

- [ ] Jours et plages horaires réellement réservés aux anniversaires
- [x] ~~Nombre d'anniversaires en parallèle.~~ **Deux**, soit les deux espaces
      actifs — déjà le comportement en place.
- [x] ~~Délai minimum avant le début.~~ **Une heure**, « même en dernière minute
      vu qu'il n'y a pas de coach » (Brahim). Déjà appliqué :
      `DELAI_RESERVATION_HEURES = 1`, vérifié côté serveur dans
      `src/lib/db/creneaux.ts`.
- [ ] **Horizon de réservation** — question distincte de la précédente, et
      toujours ouverte : jusqu'à quelle échéance accepte-t-on une réservation ?
      Six mois sont ouverts en base (jusqu'au 3 mars 2027), trois mois sont
      annoncés sur le site.
- [ ] **Lever une ambiguïté sur le battement de 30 minutes.** Brahim dit « deux
      en même temps, avec un espacement de 30 min pour le prochain ». Deux
      lectures possibles, qui ne donnent pas la même grille :
      *a)* le groupe suivant démarre 30 min après la fin du précédent — c'est ce
      qui est en place (cadence de 2 h 30) ;
      *b)* les deux groupes simultanés sont décalés de 30 min entre eux, pour
      étaler arrivées et départs — il faudrait alors décaler l'espace 2 de
      30 min (08:30, 11:00, 13:30, 16:00).

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

- [x] **Définir `ADMIN_USER` et `ADMIN_PASSWORD`** dans Vercel (type
      « Sensitive » pour le mot de passe). Sans ces deux variables, `/admin`
      répond 404 : c'est voulu, mais le back-office reste alors inaccessible à
      Brahim.
- [ ] **Passer le dépôt GitHub en privé.** Tant qu'il est public, l'historique
      reste lisible, y compris les versions précédentes de ce fichier.
- [ ] **Ouvrir un compte Resend** (choix acté), y vérifier le domaine, puis
      renseigner `RESEND_API_KEY`, `EMAIL_EXPEDITEUR` et `EMAIL_COMPLEXE` dans
      Vercel. **Tant que ces variables sont absentes, aucun e-mail ne part** —
      le site fonctionne, mais personne n'est prévenu de rien. Détail dans
      `MISE-EN-LIGNE.md`.
- [ ] **Basculer le domaine et activer les e-mails.** Le domaine appartient à
      Brahim ; il sert encore le site Wix, et rien n'autorise encore l'envoi
      d'e-mails automatiques. La marche à suivre complète, avec l'état DNS
      relevé et le piège à éviter (déplacer les serveurs de noms couperait la
      messagerie de Brahim), est dans **`MISE-EN-LIGNE.md`**.
- [ ] **Renseigner `SITE_URL`** dès que le domaine définitif remplacera
      l'adresse Vercel — les liens des e-mails et le sitemap en dépendent.
- [ ] Ouvrir un compte **Stripe** avec Bancontact activé.
- [x] ~~Planifier les tâches d'entretien en base.~~ Fait : `pg_cron` est
      activé, l'anonymisation RGPD tourne chaque nuit à 3h30 UTC et la purge
      des sessions chaque dimanche. Voir `supabase/migrations/0010`.

---

# État technique

**Base de données** — projet `shybhkzgwxyajysjlrbv` (Offside World, eu-west-1),
migrations `0001` à `0010` appliquées et vérifiées.
RLS activé et forcé sur les 8 tables, sans aucune politique : rien n'est
accessible par les clés publiques, tout passe par le serveur.

**Le site est branché sur la base.** Ce qui en vient désormais :
- les formules et leurs tarifs (page d'accueil et funnel) ;
- les créneaux et leur disponibilité réelle ;
- les réservations et les demandes de devis, écrites par une Server Action ;
- le back-office, qui lit et modifie les vraies réservations.

**Le back-office est une application séparée.** Il ne partage avec le site que
les polices et la feuille de style : pas d'en-tête, pas de pied de page, aucun
lien dans un sens ni dans l'autre. On y entre par une page de connexion, et la
session dure 12 heures. Brahim peut confirmer et annuler des réservations,
suivre les demandes de devis, ouvrir et fermer des créneaux, et consulter le
journal des actions — chaque modification y laisse une trace.

**Le prix est recalculé côté serveur** à partir des tables `formules` et
`options` au moment d'écrire la réservation. Le total affiché dans le navigateur
n'est qu'un aperçu : le modifier ne change pas ce qui est facturé.

**Garde-fous vérifiés en conditions réelles :** une seconde réservation sur un
créneau déjà pris est rejetée par la base, deux créneaux qui se chevauchent dans
le même espace sont rejetés, et le prix d'une formule Bubble à 14 enfants avec
deux options tombe au centime attendu. Côté back-office : une réservation ne
peut pas être confirmée deux fois, l'annulation libère bien le créneau, la note
interne ressort dans la vue, et une session révoquée le reste. Le linter de
sécurité Supabase ne remonte aucun avertissement — les 9 avis « RLS activé sans
politique » sont le comportement voulu.

**Ce qui reste à construire, par ordre d'urgence :**

1. **Le paiement en ligne** (Stripe + Bancontact). C'est le dernier morceau
   qui demande du développement.

**Les tarifs sont modifiables** depuis l'onglet « Tarifs » du back-office :
prix des formules, supplément par enfant, nombre d'enfants couverts, durée,
description, ce qui est compris, et les options. Seul le tarif Bubble Foot
reste dans le code — il se facture à la personne et n'entre pas dans la même
structure ; la page le dit explicitement.

**Les e-mails sont écrits et branchés** — demande enregistrée, devis reçu,
réservation confirmée, réservation annulée, plus les deux avis internes. Il
reste deux choses qui ne dépendent pas du code, voir plus bas.

**Limite connue de l'authentification :** un seul identifiant, partagé. Le
journal enregistre donc « qui » au sens du compte, pas de la personne. Le jour
où plusieurs personnes auront besoin d'un accès distinct, seule la fonction
`verifierIdentifiants` est à remplacer — tout le reste passe déjà par une
session nommée.

**`src/data/formules.ts`** ne contient plus que des textes fixes et un repli
d'affichage pour la page d'accueil. Ce repli ne sert jamais au calcul d'un
montant : en cas de doute, c'est la base qui a raison.
