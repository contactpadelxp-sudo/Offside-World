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

- [ ] **Aligner les prix de Sport-Finder sur ceux du site** — et non
      l'inverse. **Décision prise le 12 septembre 2026 :** les tarifs qui font
      foi sont ceux que Brahim a donnés, déjà en base et déjà affichés partout
      sur le site — Kick-Off **180 €**, Bubble **290 €**, Bubble Foot
      **23 €/pers.** Sport-Finder annonce encore 140 €/session et 20 €/pers. :
      ce sont ces deux valeurs-là qu'il faut corriger chez eux.

      L'écart n'est pas seulement gênant commercialement. Un client qui compare
      les deux pages voit deux prix pour la même prestation et peut exiger le
      moins cher : une offre au rabais publiée par le vendeur l'engage.
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
en production le 8 septembre 2026, **en heure belge**, sur les deux espaces :

| | Anniversaires (2 h) | Bubble Foot (1 h) |
|---|---|---|
| Mercredi | 15:00 · 17:30 | — |
| Vendredi | — | 18:00 · 19:00 · 20:00 |
| Samedi | 10:00 · 12:30 · 15:00 · 17:30 | 20:00 |
| Dimanche | idem samedi | 20:00 |

Les départs s'enchaînent toutes les 2 h 30 : deux heures de fête, puis trente
minutes de battement.

> **Piège de lecture, qui m'a eu.** Interroger la table sans préciser le fuseau
> renvoie de l'UTC, et une même plage y apparaît DEUX FOIS — un créneau de
> 10 h belge vaut 08:00 UTC en été et 09:00 UTC en hiver. On croit alors voir
> huit départs par jour, et une « option intermédiaire » qui n'existe pas.
> Toujours lire `debut at time zone 'Europe/Brussels'`.

> **Anomalie à trancher.** Le Bubble Foot n'a qu'UN créneau le samedi et le
> dimanche (20:00), là où le vendredi en a trois. Les 18:00 et 19:00 du week-end
> chevauchent l'anniversaire de 17:30–19:30 dans le même espace : la contrainte
> d'exclusion les a refusés en silence à la génération. Un client qui cherche un
> Bubble Foot le samedi soir ne voit donc presque rien. À régler avec les vraies
> plages de Brahim.

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
- [x] ~~Numéro d'entreprise (BCE)~~ **1025.713.731** — déduit du numéro de TVA
      (en Belgique c'est le même nombre). **À faire confirmer par Brahim.**
- [x] ~~Numéro de TVA~~ **BE 1025.713.731**, communiqué le 12 septembre 2026 et
      validé par sa clé de contrôle modulo 97 avant d'être inscrit.
- [ ] Siège social, s'il diffère de Gembloux
- [ ] Responsable de la publication
- [ ] Arrondissement judiciaire compétent (pour les CGU)

## Facturation électronique — à vérifier avec son comptable

Depuis le **1er janvier 2026**, la facturation électronique structurée (format
Peppol BIS) est obligatoire en Belgique pour les **factures B2B entre
assujettis TVA belges**.

**Ce qui N'EST PAS concerné :** le devis. C'est une offre précontractuelle,
sans effet TVA, sans format imposé et sans plateforme — l'envoyer par e-mail
depuis le back-office est parfaitement régulier. La question s'était posée, la
réponse est claire.

**Ce qui l'est :** la facture qui suit un devis de team building accepté,
lorsque le client est une société assujettie à la TVA en Belgique. Les
anniversaires et le Bubble Foot, vendus à des particuliers, ne le sont pas.

**Le site n'émet aucune facture, et ne doit pas s'y mettre.** La conformité
Peppol appartient au logiciel comptable de Brahim : c'est là que vivent la
TVA, la numérotation continue et les archives. En faire une plateforme de
facturation serait hors de proportion et mal placé.

- [ ] **Demander à Brahim si son logiciel comptable émet en Peppol.** La
      plupart le font depuis 2025 (Yuki, Exact, Odoo, Billit, WinBooks…),
      souvent en activant une option. S'il facture sous Word ou Excel, c'est
      là qu'est le sujet.
- [ ] **Faire confirmer le détail par son comptable** : régime
      d'assujettissement, exemptions de l'article 44, clients non établis en
      Belgique. C'est du droit fiscal, pas du développement.

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

# Décisions en attente de Mathis

Questions posées, sans réponse à ce jour. Elles bloquent du travail déjà prêt
à démarrer.

- [ ] **Paiement : acompte ou montant intégral ?** Le barème d'annulation
      existant (100 % au-delà de 7 jours, 50 % entre 7 jours et 48 h, rien en
      deçà) se prête plutôt au paiement intégral avec remboursement partiel.
      Un acompte non remboursable serait plus simple, mais change la promesse
      faite au client.
- [ ] **Le compte Stripe est-il ouvert ?** Le tunnel peut être construit sans
      les clés, mais aucun paiement réel ne pourra être testé de bout en bout —
      et c'est précisément là que ça casse d'habitude.
- [ ] **« 2000+ fêtes organisées »** est toujours affiché sur la page d'accueil.
      C'est une statistique inventée. Le faux avis a été retiré ; celle-ci
      attend un vrai chiffre ou son retrait. Si on la retire, la rangée doit
      passer de trois à deux colonnes, sinon elle boite sur téléphone.
- [ ] **Passer le dépôt GitHub en privé.** Il est public : tout l'historique
      est lisible, y compris les versions précédentes de ce fichier.

---

# Chantiers demandés le 7 septembre 2026

## Mesure d'audience maison + section « Analyse » au back-office

Le bandeau cookies demande aujourd'hui un consentement pour « Mesure
d'audience » et « Marketing » alors qu'aucun outil n'existe derrière : le choix
du visiteur est écrit dans son navigateur et lu par personne. La politique
cookies annonce encore « [À COMPLÉTER — ex. : Google Analytics, Plausible] ».

Décision prise : construire l'outil plutôt que retirer la demande.

## Blog

Articles rédigés par Brahim lui-même depuis le back-office. Suppose donc un
éditeur utilisable sans compétence technique, et pas un fichier Markdown dans
le dépôt.

# À faire côté Mathis

- [x] **Définir `ADMIN_USER` et `ADMIN_PASSWORD`** dans Vercel (type
      « Sensitive » pour le mot de passe). Sans ces deux variables, `/admin`
      répond 404 : c'est voulu, mais le back-office reste alors inaccessible à
      Brahim.
- [ ] **Passer le dépôt GitHub en privé.** Tant qu'il est public, l'historique
      reste lisible, y compris les versions précédentes de ce fichier.
- [x] ~~**Ouvrir un compte Resend**, y vérifier le domaine, renseigner les
      variables.~~ **Fait le 12 septembre 2026.** Domaine `offsidefootindoor.be`
      vérifié chez Resend (région Ireland, eu-west-1 — les données restent dans
      l'UE), DKIM et DMARC publiés, les 5 MX de Google et le SPF racine
      vérifiés intacts après l'opération. Expéditeur :
      `reservations@offsidefootindoor.be`.

      ⚠️ **Un seul point reste à confirmer** : que `EMAIL_EXPEDITEUR` ne
      contienne pas encore l'adresse de démonstration `onboarding@resend.dev`.
      Dans cet état, Brahim reçoit bien ses avis — ils partent vers l'adresse du
      titulaire du compte — mais **les clients ne reçoivent rien**, et l'échec
      est avalé par conception pour qu'un problème d'e-mail ne fasse jamais
      échouer une réservation. `/admin/reglages` l'affiche en rouge, et le test
      qui tranche est celui envoyé vers une adresse qui n'est PAS celle du
      compte Resend.
- [ ] **Basculer le domaine et activer les e-mails.** Le domaine appartient à
      Brahim ; il sert encore le site Wix, et rien n'autorise encore l'envoi
      d'e-mails automatiques. La marche à suivre complète, avec l'état DNS
      relevé et le piège à éviter (déplacer les serveurs de noms couperait la
      messagerie de Brahim), est dans **`MISE-EN-LIGNE.md`**.
- [ ] **Renseigner `SITE_URL`** dès que le domaine définitif remplacera
      l'adresse Vercel — les liens des e-mails et le sitemap en dépendent.
- [ ] **Passer Supabase au plan Pro (25 $/mois) avant la mise en ligne.** Ce
      n'est pas une question de volume — le plan gratuit tiendrait des dizaines
      de milliers d'articles — mais de DISPONIBILITÉ. Deux limites du plan
      gratuit, relevées dans la documentation officielle le 8 septembre 2026 :
      - un projet gratuit est **mis en pause après 7 jours de faible activité**
        (« quelques requêtes par jour » suffisent à l'éviter, mais un complexe
        local peut passer sous ce seuil en janvier). Un projet en pause, ce
        n'est pas le blog qui tombe : c'est le site entier — plus de créneaux,
        plus de réservation, plus de back-office ;
      - **les sauvegardes ne sont pas téléchargeables** sur le plan gratuit.
        Les articles de Brahim, les réservations et les tarifs n'ont donc
        aucune sauvegarde que Mathis contrôle.

      Repères mesurés le 8 septembre 2026 : base à 12 Mo sur les 500 Mo
      autorisés, 0 octet de fichiers sur 1 Go. Un article pèse environ 8 ko,
      une photo réduite environ 150 ko. Le volume n'est donc jamais le sujet.

- [ ] Ouvrir un compte **Stripe** avec Bancontact activé. **Le compte doit être
      celui de l'exploitant, pas celui de Mathis** : c'est le titulaire du
      compte Stripe qui est le vendeur au sens légal, qui déclare la TVA et qui
      reçoit les virements. Si Brahim en a déjà un, il invite Mathis comme
      membre d'équipe avec le rôle « Developer » (Settings → Team and security)
      — aucun mot de passe n'est échangé, et ce rôle ne permet ni de changer le
      compte bancaire ni de déclencher un virement.
- [x] ~~Planifier les tâches d'entretien en base.~~ Fait : `pg_cron` est
      activé, l'anonymisation RGPD tourne chaque nuit à 3h30 UTC et la purge
      des sessions chaque dimanche. Voir `supabase/migrations/0010`.

---

# Conformité — état au 9 septembre 2026

L'audit juridique du tunnel de paiement est purgé. Ce qui a été corrigé, et
qui est vérifiable page par page :

- [x] Bouton de commande sans ambiguïté (« Payer 180 € ») et montant TVAC,
      moyens de paiement et absence de rétractation annoncés AVANT le clic —
      art. VI.46 § 2 et VI.45. La sanction de l'ancienne formulation était que
      le consommateur n'était pas lié par sa commande.
- [x] E-mail de confirmation complet : identité du vendeur, montant TVAC,
      moyen de paiement, lien CGV, barème d'annulation, absence de
      rétractation (art. VI.53, 12°). C'est le support durable exigé par
      l'art. VI.46 § 7.
- [x] Remboursements réellement possibles depuis le back-office, avec le choix
      entre barème, intégral et aucun, et le montant écrit en base
      (migration 0015).
- [x] CGV art. 6 étendu au Bubble Foot : le barème s'appliquait à un acheteur
      auquel l'article disait ne pas s'appliquer.
- [x] CGU art. 3 : l'exclusion totale de responsabilité est bornée (art.
      VI.83). Le « [À COMPLÉTER] » de l'art. 7 ne s'affiche plus.
- [x] Pages cookies : les finalités inventées (publicité, réseaux sociaux,
      contenus tiers) sont retirées, la durée du consentement passe de 12 à
      6 mois — la vraie —, et l'« intérêt légitime » devient l'exemption de
      l'art. 129 de la loi du 13 juin 2005.
- [x] Prix affichés TVAC (art. VI.2).
- [x] Service de médiation pour le consommateur nommé dans les CGV. La
      plateforme européenne RLL n'est PAS citée : la Commission l'a fermée le
      20 juillet 2025.

Ce qui reste, et qui ne dépend plus du code :

- [ ] **Les six valeurs d'identité de l'entreprise** (dénomination sociale,
      siège, BCE, TVA, responsable de publication, et le siège s'il diffère).
      Tant qu'elles manquent, les pages légales affichent « [à compléter] » —
      et l'art. III.74 du Code de droit économique n'est pas respecté. C'est
      le dernier point qui empêche formellement la mise en ligne.
- [ ] **« 2000+ fêtes organisées »** sur la page d'accueil : chiffre non
      vérifié. Une allégation chiffrée invérifiable est une pratique
      trompeuse (art. VI.97). À remplacer par le vrai nombre ou à retirer.
- [ ] **Autorisation à l'image** : aucun formulaire ne la recueille
      aujourd'hui, alors que les CGV art. 15 annoncent un système Replay et
      une vidéo souvenir. À brancher le jour où la fonctionnalité existe —
      pour un mineur, c'est le représentant légal qui consent.

---

# État technique

**Base de données** — projet `shybhkzgwxyajysjlrbv` (Offside World, eu-west-1),
migrations `0001` à `0015` appliquées et vérifiées.
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
