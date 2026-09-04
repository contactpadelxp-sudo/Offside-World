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

## Créneaux des anniversaires

**Décision prise :** les terrains restent sur Sport-Finder, les anniversaires sur
le site, et les anniversaires n'occupent que des plages retirées de la location.

- [ ] Jours et plages horaires réservés aux anniversaires
- [ ] Nombre d'anniversaires en parallèle par plage (le site en annonce 2, avec
      30 min de battement)
- [ ] Jusqu'à combien de temps à l'avance on peut réserver

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
- [ ] **Chiffres affichés.** « 2000+ fêtes organisées » et « 4.8/5 sur Google,
      200+ avis » ne correspondent à rien : le complexe vient d'ouvrir. Fournir
      les vrais chiffres, ou les retirer.

## Contenus manquants

- [ ] Photo pour la carte « Anniversaire » de la page de réservation
- [ ] Photo de Bubble Foot pour la formule du même nom
- [ ] Horaires réels des demi-journées de team building (9h–13h et 14h–18h sont
      provisoires)
- [ ] Noms réels des espaces anniversaire (« Espace anniversaire 1 et 2 »)

Il suffit de déposer les photos dans `public/images/` : la résolution ignore
majuscules, accents, espaces et tirets. Voir `src/lib/photos.ts`.

---

# À faire côté Mathis

- [ ] **Passer le dépôt GitHub en privé.** Tant qu'il est public, l'historique
      reste lisible, y compris les versions précédentes de ce fichier.
- [ ] **Configurer DMARC et durcir SPF** sur `offsidefootindoor.be`, chez le
      registrar. Sans cela, les e-mails de confirmation partiront en spam et
      l'adresse pourra être usurpée.
- [ ] **Donner l'accès Supabase** au projet `shybhkzgwxyajysjlrbv` (réglages →
      connecteurs → Supabase, en incluant la bonne organisation).
- [ ] Ouvrir un compte **Stripe** avec Bancontact activé.

---

# État technique

**Base de données** — schéma appliqué sur Supabase (migrations `0001` et `0002`).
Tables prêtes : formules, options, espaces, creneaux, reservations, paiements,
demandes_devis, journal_admin. RLS activé et forcé sans aucune politique : rien
n'est accessible par les clés publiques, tout passe par le serveur.

**Ce qui reste à construire :** la connexion du site à cette base, le calcul du
prix côté serveur, le paiement, les e-mails transactionnels et le back-office
authentifié. Voir la section correspondante avec Mathis.

**Les fichiers `src/data/`** doivent cesser d'être la source des prix une fois la
base branchée, sous peine d'avoir deux vérités qui divergent.
