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

- [x] ~~**Quels prix font foi ?**~~ **TRANCHÉ, ET ON N'Y REVIENT PLUS.** Ce
      sont ceux que Brahim a donnés à Mathis — Kick-Off **180 €**, Bubble
      **290 €**, Bubble Foot **23 €/pers.** Ils sont en base et affichés partout
      sur le site ; côté site, il n'y a rien à faire.
- [ ] *(Brahim a répondu le 17 septembre : « je vais adapter ». À revérifier
      sur leur page publique une fois fait.)* **Corriger les deux prix chez Sport-Finder** — action de Brahim, sur leur
      plateforme. Ils y annoncent encore 140 €/session et 20 €/pers.

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

## Créneaux — les vrais horaires sont en place

**Décision de fond, inchangée :** les terrains restent sur Sport-Finder, les
anniversaires sur le site, et les anniversaires n'occupent que des plages
retirées de la location.

Horaires communiqués par Brahim le **17 septembre 2026**, appliqués le jour
même (migration 0020) :

| | Anniversaires (2 h) |
|---|---|
| Mercredi | 13:30 · 16:00 |
| Vendredi | 16:00 · 18:30 |
| Samedi | 10:00 · 12:30 · 15:00 · 17:30 |
| Dimanche | 10:00 · 12:30 · 15:00 · 17:30 |

943 créneaux générés sur six mois, jusqu'au 19 mars 2027.

**Deux Fun zones seulement sont en vente depuis le 19 septembre 2026.** Brahim
a écrit « il y en **aura** 3 » — au futur, en réponse à une question qui parlait
de deux espaces. La migration 0020 avait pourtant ouvert la troisième, et 314
créneaux y étaient à vendre : le site pouvait accepter trois groupes pour deux
salles. `espaces.actif = false` sur `espace-3` les retire de la vente sans rien
détruire (la vue `creneaux_disponibles` filtre dessus). Un `update` suffit à
les rendre le jour où il confirme. 615 créneaux restent vendables.

> **Piège de lecture, qui m'a eu.** Interroger la table sans préciser le fuseau
> renvoie de l'UTC, et une même plage y apparaît DEUX FOIS — un créneau de
> 10 h belge vaut 08:00 UTC en été et 09:00 UTC en hiver. On croit alors voir
> huit départs par jour, et une « option intermédiaire » qui n'existe pas.
> Toujours lire `debut at time zone 'Europe/Brussels'`.

- [x] ~~Jours et plages réellement réservés aux anniversaires~~ **Reçus le
      17 septembre 2026.**
- [x] ~~**L'ambiguïté du battement de 30 minutes.**~~ **TRANCHÉE PAR LA GRILLE
      ELLE-MÊME.** « 13h30–15h30 · 16h00–18h00 » ne laisse aucun doute : les
      30 minutes séparent la FIN d'un créneau du DÉBUT du suivant, et ne
      décalent pas deux groupes simultanés. C'était déjà ce qui était en place.
- [x] ~~**Nombre d'anniversaires en parallèle.**~~ **DEUX aujourd'hui.**
      Brahim a précisé le 21 septembre 2026 : « Il y aura à terme 4 zones. Mais
      actuellement que deux de prête. Je n'ai pas 3 terrains, j'en ai que
      deux. » Fermer la Fun zone 3 était donc le bon geste.
- [ ] **Ouvrir les Fun zones 3 et 4 quand elles seront prêtes.** Un `update
      espaces set actif = true` pour la 3, un `insert` pour la 4, puis
      régénérer les créneaux sur la période voulue depuis le back-office. Elles
      porteront alors les anniversaires comme les deux autres.
- [x] ~~Délai minimum avant le début.~~ **Une heure**, « même en dernière minute
      vu qu'il n'y a pas de coach » (Brahim). `DELAI_RESERVATION_HEURES = 1`.
- [x] ~~**Horizon de réservation**~~ **SIX MOIS**, répondu le 17 septembre 2026.
      `HORIZON_JOURS` passe de 90 à 183 : six mois calendaires valent entre 181
      et 184 jours, et rogner trois jours ferait disparaître du sélecteur la
      date que le client vient d'entendre au téléphone.

- [x] ~~**LES PLAGES DU BUBBLE FOOT.**~~ **SANS OBJET DEPUIS LE 21 SEPTEMBRE
      2026 : le Bubble Foot ne se réserve plus sur le site.** Brahim a confirmé
      qu'il se joue aux mêmes heures que la location de terrain, sur les mêmes
      espaces — donc sur Sport-Finder, qui pilote aussi l'ouverture automatique.

      Deux systèmes qui vendent le même terrain à la même heure sans se voir le
      vendent deux fois. Et la place qui restait au Bubble dans les heures
      habitées a été mesurée : mercredi 18h–20h, vendredi 15h–16h, une
      demi-heure le samedi et le dimanche. Rien le week-end après 20h, quand il
      se vend justement — et quand plus personne n'est sur place.

      Le partage retenu ne demande aucune surveillance : le SITE vend ce qui se
      passe quand quelqu'un est là (anniversaires, Bounce Park à venir),
      SPORT-FINDER vend ce qui se passe quand personne n'y est (foot, Bubble).
      `BUBBLE_EN_LIGNE` à `true` inverse la décision sans rien réécrire, le jour
      où l'ouverture automatique sera pilotable depuis le site.

      **La génération n'invente plus rien depuis la migration 0023.** Ses
      horaires étaient écrits en dur dans `generer_creneaux_bubble` — vendredi,
      samedi et dimanche à 18h, 19h et 20h — et le bouton « Ouvrir une période »
      appelle cette fonction en même temps que celle des anniversaires. Un clic
      mettait donc en vente, à 23 €/personne, des créneaux que personne n'avait
      confirmés.

      Les horaires vivent maintenant dans la table `horaires_bubble`, qui est
      **vide** : sans ligne, la fonction ne crée rien et renvoie
      `sans_horaire = true`, que le back-office affiche en toutes lettres. Trois
      `insert` suffiront le jour où Brahim répond, sans toucher au code.
      L'espace n'est plus figé sur `espace-1` non plus — la question « une zone
      réservée au Bubble ou toutes » lui est posée en même temps que les heures.

      Il y a donc **zéro créneau Bubble Foot en base**, et la bannière rouge du
      back-office le dit depuis qu'elle compte par activité.

- [x] ~~**LES HEURES DES DEMI-JOURNÉES DE TEAM BUILDING.**~~ **SANS OBJET.**
      Les JOURS sont connus — lundi, mardi et jeudi matin et après-midi,
      vendredi matin seulement — et c'est appliqué. Les HEURES ne sont pas
      connues, et n'ont pas à l'être : `TEAM_BUILDING_MATIN` et
      `TEAM_BUILDING_APRES_MIDI` valent `null`, le devis affiche donc « Matin »
      et « Après-midi », qui sont vrais. Mathis a confirmé le 21 septembre 2026
      que cela suffit.

      Cette ligne a traîné après coup : « 9h–13h et 14h–18h partent sur chaque
      devis » était vrai AVANT que ces constantes passent à `null`, et j'ai
      continué à le répéter dans plusieurs messages. Les heures avaient déjà
      disparu de l'affichage.

## Jours de fermeture — jamais posés à Brahim

Relevé le 19 septembre 2026 en interrogeant la base : **le 25 décembre 2026 et
le 1er janvier 2027 comptent chacun six créneaux ouverts, le 26 décembre douze.**
Un client peut réserver un anniversaire le jour de Noël.

Ces journées n'ont PAS été fermées d'office. Savoir si le complexe ouvre le
25 décembre est une décision d'exploitation, pas une déduction : il n'y a aucun
élément, seulement une habitude belge. C'est la même règle qui a fait refuser
d'inventer des horaires de Bubble Foot. La Fun zone 3, elle, a été fermée parce
qu'il y avait une preuve — « il y en AURA 3 ».

Le geste existe désormais : un bouton « Fermer les N créneaux du jour » sur la
page Créneaux, qui épargne les créneaux réservés et nomme la réservation qui
bloque. Avant lui, fermer un vendredi férié demandait six clics.

- [ ] **Quels jours le complexe est-il fermé ?** Jours fériés, congés annuels,
      fermeture technique. Au minimum : 25 décembre, 1er janvier, 26 décembre.

## Informations d'entreprise

Obligatoires en Belgique (Code de droit économique, art. III.74). Elles
s'affichent aujourd'hui « [à compléter] » sur le site public.

- [x] ~~Dénomination sociale, forme juridique, BCE, TVA, siège, responsable de
      publication, tribunal du RPM~~ **TOUT EST RENSEIGNÉ — 17 septembre 2026.**

      **DBT Partners SRL**, BCE et TVA **BE 0788.645.632**, siège social
      Rue des Orchidées 6, 5030 Gembloux — la même adresse que le complexe.
      Responsable de la publication : **Brahim Bel Abbes**.

      Le numéro a été validé par sa clé de contrôle avant d'être inscrit :
      97 − (7886456 mod 97) = 32, et il finit bien par 32.

      Le tribunal du RPM en découle sans ambiguïté : le siège est en province
      de Namur, donc **RPM Liège, division Namur**.

      Au passage, la dénomination et la forme juridique étaient jointes à un
      seul endroit — le PDF de devis. Les mentions légales, les CGV, la
      politique de confidentialité et les e-mails affichaient « DBT Partners »
      tout court, ce que l'article 2:20 du CSA interdit. Une constante unique,
      `RAISON_SOCIALE`, les joint désormais partout.

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
- [x] ~~**Le taux de TVA du team building.**~~ **6 %**, communiqué le
      21 septembre 2026 — le taux réduit belge pour l'accès aux installations
      sportives. C'est désormais la valeur proposée d'office sur un devis
      (`TVA_TAUX_DEFAUT`), et elle reste modifiable au cas par cas : une
      prestation qui sortirait du simple accès peut relever d'un autre taux.
- [x] ~~**Un taux unique par devis suffit-il ?**~~ **OUI — confirmé le
      21 septembre 2026.** C'était la seule question TVA qui nous concernait,
      parce qu'elle décidait de la STRUCTURE du devis : `LigneDevis` ne porte
      pas de taux, un seul s'applique au document entier.

      Brahim : « on met juste à disposition les terrains donc 6 %, et ils
      consomment au bar donc la TVA sera correcte pour boissons, food etc. » La
      restauration est donc facturée AU BAR, hors devis. Le devis ne porte que
      la privatisation — `devisPreRempli` ne génère d'ailleurs qu'une seule
      ligne. Rien à changer.
- [ ] **Faire confirmer le détail par son comptable** : régime
      d'assujettissement, exemptions de l'article 44, clients non établis en
      Belgique. C'est du droit fiscal, pas du développement — et c'est son
      sujet, pas celui du site, qui n'émet aucune facture.

## Décisions à trancher

- [ ] **Onglet « Réglages » : retirer ce qui ne sert à rien à Brahim.**
      Décidé le 15 septembre 2026 par Mathis : à faire, mais **plus tard**, une
      fois qu'on saura ce dont Brahim se sert réellement.

      Le problème constaté : la page lui donne des instructions qu'il ne peut
      pas exécuter — des variables d'environnement Vercel, qu'il n'a ni les
      accès ni les raisons de toucher. Ce qui lui est utile, c'est de savoir si
      une chose est configurée ou non, pas comment la configurer.

      À trancher le moment venu : tout retirer, ou n'en garder qu'un état
      « configuré / pas configuré » sans mode d'emploi.
- [x] ~~**Vidéo souvenir.**~~ **RETIRÉE DES DEUX FORMULES** le 17 septembre
      2026, à la demande de Brahim (« retire la video, photo et pinata pour le
      moment »). Migration 0020.

      L'article 15 des CGV, lui, **reste**, et c'est délibéré : il est
      conditionnel (« lorsqu'une telle fonctionnalité fait partie de la
      prestation ») et encadre l'autorisation du représentant légal pour l'image
      des mineurs. Les caméras du complexe n'ont pas disparu avec la prestation.
      Retirer une protection parce qu'on ne vend plus le service qu'elle
      accompagnait, c'est retirer la protection.
- [x] ~~Réservations sans paiement : 48 heures est-il le bon délai ?~~
      **SANS OBJET dès que Stripe encaisse.** Le branchement est en cours
      (14-15 septembre 2026) ; le délai qui tient un créneau passe alors seul de
      48 h à 45 min, et la réservation est confirmée par le paiement, pas par
      Brahim. La question ne se reposera que si on revenait en arrière.
- [x] ~~Chiffres et avis inventés.~~ **LES TROIS SONT RETIRÉS.** « 4.8/5 sur
      Google » et le témoignage signé « Sophie D. » l'avaient été plus tôt ;
      « 2000+ fêtes organisées » l'a été le 13 septembre 2026. Vérifié par
      recherche dans les sources : le site ne porte plus aucune allégation
      chiffrée invérifiable (art. VI.97 du Code de droit économique).

      Reste une OPPORTUNITÉ, pas une obligation : si Brahim a de vrais chiffres
      — nombre d'anniversaires depuis l'ouverture, note Google réelle — ils
      auraient plus de poids que ce qui a été retiré. Sinon on reste comme ça.

## Affirmations du site à faire confirmer

- [ ] **« Organisation et arbitrage du tournoi » — à confirmer d'urgence.**
      C'est l'une des cinq choses que le site annonce comme comprises dans la
      privatisation team building (`TEAM_BUILDING_INCLUS`). Or Brahim vient
      d'écrire, le 21 septembre 2026 : « on met juste à disposition les
      terrains ».

      Les deux ne peuvent pas être vrais en même temps. Et c'est exactement la
      faute déjà corrigée sur « encadrement adapté », retiré de l'accueil le
      17 septembre parce qu'il avait écrit « il n'y a pas de coach » : un
      arbitre EST un encadrement.

      Ce qui est en jeu n'est pas une formulation. Une entreprise qui réserve
      une demi-journée en lisant « organisation et arbitrage du tournoi »
      attend quelqu'un pour mener le jeu ; trouver un terrain vide est le genre
      d'écart qui relève de l'article VI.97 du Code de droit économique, et qui
      se règle en remboursement.

      Sa phrase portait sur la TVA, pas sur l'offre — d'où le doute. Mais tant
      qu'elle n'est pas levée, cette ligne promet peut-être une prestation qui
      n'existe pas. À lui demander en clair : **fournis-tu un arbitre pour un
      team building, oui ou non ?**

Une allégation invérifiable engage le vendeur (art. VI.97 du Code de droit
économique). Trois ont été relevées le 17 septembre 2026 en relisant le site ;
deux étaient fausses et sont corrigées, la troisième est à confirmer.

- [x] ~~« Dès 6 ans » sur la page d'accueil~~ **CORRIGÉ en « Dès 4 ans »**, ce
      que Brahim a répondu. Un parent d'enfant de 5 ans se croyait exclu depuis
      l'accueil, alors que le tunnel acceptait sa réservation.
- [x] ~~« Encadrement adapté » sur la page d'accueil~~ **RETIRÉ.** Brahim a
      écrit « même en dernière minute vu qu'il n'y a pas de coach » : il n'y a
      donc pas d'encadrement général, seulement un animateur pour la formule
      Bubble — ce que les CGV disent déjà correctement. Remplacé par « Terrain
      et matériel adaptés », vérifiable.

      C'est le pire endroit où se tromper : un parent peut laisser ses enfants
      en croyant qu'on les surveille.
- [ ] **« Parking gratuit » — à confirmer.** Affirmation factuelle sur le
      complexe, jamais vérifiée avec Brahim. Laissée en place faute de raison
      d'en douter, mais elle n'est pas sourcée. Si le parking est payant ou
      partagé, la phrase doit partir.

## Images déjà fournies mais jamais affichées

Relevé le 18 septembre 2026. `public/images/` pèse 7,2 Mo, dont **2,7 Mo ne
sont jamais servis** — ni au visiteur, ni au build. Ces fichiers sont pourtant
déployés à chaque mise en ligne.

> **Piège de méthode.** Un premier balayage en annonçait 19 : faux. Les photos
> sont résolues par `src/lib/photos.ts`, qui les cherche par un NOM LOGIQUE
> (« bubble-portrait ») et non par leur nom de fichier. Chercher le nom de
> fichier dans le code ne les trouve donc jamais. Toujours passer par le
> registre.

**Douze fichiers jamais affichés**, recomptés le 19 septembre 2026. Le relevé
précédent en annonçait onze : il manquait `Logo Offside Foot Indoor.png`, mort
pour la même raison que `terrain vide.JPG` — une collision, pas une absence
d'emplacement. Les emplacements, eux, sont tous pourvus.

| Fichier | Poids | Piste |
|---|---|---|
| `entrée.JPG` | 641 Ko | façade — utilisable en page d'accueil |
| `entrée contre-plongée.JPG` | 666 Ko | idem |
| `terrain vide portrait.JPG` | 548 Ko | format portrait, utile sur téléphone |
| `terrain vide.JPG` | 501 Ko | **perdu par collision**, voir plus bas |
| `Logo Offside Foot Indoor.png` | 70 Ko | **perdu par collision**, voir plus bas |
| `boissons.webp` | 97 Ko | illustre « boissons comprises » |
| `anniv2.webp` | 86 Ko | seconde photo d'anniversaire |
| `deco.jpeg` | 67 Ko | illustre « décoration comprise » |
| `foot2.avif` | 47 Ko | |
| `gateau.jpeg` | 29 Ko | illustre « espace gâteau » |
| `accueil.jpeg` | 26 Ko | |
| `foot3.jpeg` | 10 Ko | |

- [ ] **Décider de leur sort.** Soit on les branche sur des emplacements —
      plusieurs répondent à des besoins listés plus bas dans « Contenus
      manquants » —, soit on les retire du dépôt. Les laisser sans emploi est
      le seul choix qui ne serve à rien.
- [ ] **Deux fichiers sont perdus par collision**, et aucun geste ne les
      rendra visibles tant qu'ils portent ce nom.

      `terrain vide.JPG` (501 Ko) et `terrains vide.JPG` visent le même
      emplacement `terrain-vide` ; le registre départage par ordre alphabétique,
      donc le premier ne sera JAMAIS affiché.

      `Logo Offside Foot Indoor.png` (70 Ko) perd de la même façon contre
      `logo.png` : `resolveLogoSrc()` donne la priorité au nom exact « logo »
      avant l'ordre alphabétique (`lib/logo.ts`).

      Les renommer ou les supprimer — mais pas les laisser croire disponibles.
      2 787 Ko au total dorment dans le dépôt et partent à chaque déploiement.

## Contenus manquants

- [x] ~~Photo pour la carte « Anniversaire »~~ et ~~photo de Bubble Foot~~ :
      **les huit emplacements du registre trouvent tous un fichier**, plan du
      Bounce Park compris. Vérifié le 19 septembre 2026 en passant par
      `resolvePhotos()`, et non par un grep des noms de fichiers — c'est le
      piège décrit plus haut. Il n'en manque aucune.
- [x] ~~Horaires réels des demi-journées de team building~~ **SANS OBJET** :
      les constantes valent `null`, le devis affiche « Matin » et
      « Après-midi », qui sont vrais et suffisent (confirmé le 21 septembre
      2026). Cette ligne était la seconde occurrence de la même note périmée.
- [x] ~~Noms réels des espaces~~ **« Fun zone 1, 2 et 3 »**, communiqués le
      17 septembre 2026 (migration 0020). La 3 est fermée en attendant
      confirmation de son existence.

Il suffit de déposer les photos dans `public/images/` : la résolution ignore
majuscules, accents, espaces et tirets. Voir `src/lib/photos.ts`.

---

# Décisions en attente de Mathis

Questions posées, sans réponse à ce jour. Elles bloquent du travail déjà prêt
à démarrer.

- [ ] **TESTER LE SITE SUR UN VRAI IPHONE.** Mathis s'y est engagé le
      13 septembre 2026 ; ce point est à lui rappeler tant qu'il n'est pas coché.

      Tout l'audit mobile a été mené sous **Chromium**, piloté au pixel. Trois
      choses ne s'y voient pas, et aucune mesure ne les remplacera :

      1. **Safari iOS a son propre moteur.** Sur iPhone, tous les navigateurs —
         Chrome et Firefox compris — utilisent WebKit. Un défaut propre à WebKit
         est donc invisible ici et universel là-bas.
      2. **La zone sûre du bas.** `viewportFit: "cover"` et
         `env(safe-area-inset-bottom)` viennent d'être posés pour que le bandeau
         cookies ne pose plus ses boutons sur l'indicateur d'accueil. Sous
         Chromium cette variable vaut 0 : le correctif est **écrit mais jamais
         constaté**. Il faut un iPhone X ou plus récent pour le voir.
      3. **La barre d'URL qui se rétracte.** Elle change la hauteur visible en
         cours de défilement, ce qu'un navigateur de bureau ne simule pas.

      À regarder en priorité, dans cet ordre :
      - **le bandeau cookies** à la première visite : ses boutons sont-ils bien
        au-dessus de la barre du bas, atteignables sans gêne ?
      - **le téléphone à l'horizontale** sur la page d'accueil, section
        « Nos activités » : les trois cartes doivent défiler normalement. C'est
        la correction du 13 septembre — avant, la section s'y résumait à son
        titre et le reste était inatteignable.
      - **le tunnel de réservation en entier**, jusqu'au récapitulatif : le
        clavier ne doit masquer aucun champ ni aucun bouton.
      - **Réglages > Accessibilité > Mouvement > Réduire les animations** : le
        bandeau défilant, les halos du bas de page et le fond animé du hero
        doivent s'arrêter.
      - **Réglages > Affichage > Taille du texte**, poussé au maximum : rien ne
        doit sortir de son cadre.

- [x] ~~Paiement : acompte ou montant intégral ?~~ **MONTANT INTÉGRAL**,
      décidé par Mathis le 13 septembre 2026. C'est ce que le code fait déjà :
      la session Stripe est créée pour le total, et le barème d'annulation
      (100 % au-delà de 7 jours, 50 % entre 7 jours et 48 h, rien en deçà)
      rembourse depuis ce total. Aucune modification n'a été nécessaire, et les
      CGV n'ont pas à être retouchées.
- [x] ~~**OUVRIR LE COMPTE STRIPE.**~~ **FAIT, ET ÉPROUVÉ.** Constaté le
      21 septembre 2026 en interrogeant la base : un paiement **Bancontact de
      200 €** au statut `reussi`, avec un vrai `payment_intent`, daté du
      15 septembre. Le statut `reussi` n'est posé que par le WEBHOOK — jamais
      par la page de retour. Les clés sont donc en place, le webhook reçoit et
      signe, et Bancontact a été éprouvé de bout en bout.

      Cette ligne est restée « à faire » six jours après coup, et c'est elle
      qui m'a fait annoncer à Mathis que le paiement bloquait la mise en ligne
      — alors qu'il avait déjà encaissé. Le fichier de suivi doit se relire
      contre le système, jamais l'inverse.
- [x] ~~« 2000+ fêtes organisées »~~ **RETIRÉ le 13 septembre 2026**, sur
      décision de Mathis. La rangée du hero est passée de trois à deux colonnes.
      Les deux chiffres restants se vérifient : les terrains existent, et le
      nombre de formules est lu en base. Plus aucune allégation chiffrée
      invérifiable sur le site — le faux avis « 4.8/5 » et le témoignage signé
      « Sophie D. » avaient été retirés plus tôt.
- [x] ~~Passer le dépôt GitHub en privé.~~ **DÉCIDÉ LE 13 SEPTEMBRE 2026 :
      on le laisse public.** Mathis n'en voit pas le besoin. Conséquence à
      connaître, sans y revenir : tout l'historique reste lisible, y compris les
      versions précédentes de ce fichier — donc rien de confidentiel ne doit
      jamais être commité ici. Les identifiants et les clés vivent dans les
      variables d'environnement Vercel, jamais dans le dépôt ; c'est déjà le cas.

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
- [x] ~~Passer le dépôt GitHub en privé.~~ **Décidé le 13 septembre 2026 : on
      le laisse public.** Voir la note en « Décisions en attente de Mathis ».
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
- [ ] **EN TOUT DERNIER — basculer le domaine et activer les e-mails.**
      Ordre fixé par Mathis le 13 septembre 2026 : c'est la toute dernière
      étape, après le paiement. Tant que le domaine sert le site Wix de Brahim,
      rien ne presse, et déplacer les serveurs de noms trop tôt couperait sa
      messagerie. Le domaine appartient à
      Brahim ; il sert encore le site Wix, et rien n'autorise encore l'envoi
      d'e-mails automatiques. La marche à suivre complète, avec l'état DNS
      relevé et le piège à éviter (déplacer les serveurs de noms couperait la
      messagerie de Brahim), est dans **`MISE-EN-LIGNE.md`**.
- [ ] **Renseigner `SITE_URL`** dès que le domaine définitif remplacera
      l'adresse Vercel — les liens des e-mails et le sitemap en dépendent.
- [ ] **À LA FIN — passer Supabase au plan Pro (25 $/mois).** Ordre fixé par
      Mathis le 13 septembre 2026 : à faire au moment de la mise en ligne, pas
      avant — inutile de payer un abonnement tant que le site n'a pas de public.
      Ce
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

- [x] ~~Ouvrir un compte **Stripe** avec Bancontact activé.~~ **FAIT** — voir
      plus haut, un encaissement Bancontact réussi le 15 septembre 2026. La
      règle qui suit reste vraie et mérite d'être relue le jour d'un changement
      de compte : **le compte doit être celui de l'exploitant, pas celui de
      Mathis** : c'est le titulaire du
      compte Stripe qui est le vendeur au sens légal, qui déclare la TVA et qui
      reçoit les virements. Si Brahim en a déjà un, il invite Mathis comme
      membre d'équipe avec le rôle « Developer » (Settings → Team and security)
      — aucun mot de passe n'est échangé, et ce rôle ne permet ni de changer le
      compte bancaire ni de déclencher un virement.
- [x] ~~Planifier les tâches d'entretien en base.~~ Fait : `pg_cron` est
      activé, l'anonymisation RGPD tourne chaque nuit à 3h30 UTC et la purge
      des sessions chaque dimanche. Voir `supabase/migrations/0010`.

---

## Le Bounce Park arrive sur le site

Décidé avec Brahim le 21 septembre 2026 : le site vend les anniversaires ET le
Bounce Park, Sport-Finder garde le foot et le Bubble. Le Bounce Park est un
espace à part — pas un terrain —, il n'entre donc en concurrence avec rien, et
ses horaires tombent dans les heures habitées : mercredi 12h–19h, vendredi
15h–20h, samedi 10h–20h, dimanche 10h–19h.

**Mais il n'existe pas encore sur le site.** Ni activité, ni espace en base, ni
créneaux, ni tarif, ni tunnel. Aujourd'hui c'est une carte « Bientôt » qui ne
mène nulle part, volontairement.

- [ ] **Obtenir le prix, l'âge minimum et la date d'ouverture.** Sans eux on ne
      peut rien annoncer : c'est la règle qui a déjà fait retirer « dès 6 ans »
      et « encadrement adapté » de l'accueil.
- [ ] **Le construire.** Le parcours le plus proche est celui du Bubble Foot,
      qui reste en place et compile : créneaux d'une heure, par espace, bande
      de dates. L'essentiel du travail est de créer l'espace, la valeur
      `type_activite` et le tarif — pas de réécrire un tunnel.

# Chantiers techniques relevés le 19 septembre 2026

Vérifiés un par un, pas seulement signalés.

- [ ] **Le build trace tout le projet.** `next build` avertit que l'accès
      disque de `lib/logo.ts` force le traçage de l'ensemble du dépôt, donc la
      copie des 7,2 Mo de `public/` dans chaque fonction serverless. Attention
      au correctif : `resolveLogoSrc()` est appelé au RENDU, pas au build.
- [ ] **Aucune région de fonction fixée.** Pas de `vercel.json`, pas de clé
      `regions`. Les fonctions tournent donc dans la région par défaut de
      Vercel, aux États-Unis, pendant que la base est en Irlande (eu-west-1).
      Chaque écran du tunnel et du back-office enchaîne plusieurs requêtes
      Supabase séquentielles, chacune traversant l'Atlantique.
- [ ] **Le projet Vercel n'est pas visible** depuis le compte joignable
      (`resell`, `cockpit-agents`, `padel-xp`, `cie`). Le site répond pourtant
      sur `offside-world.vercel.app`. Il vit donc sur un autre compte — à
      identifier avant de toucher à `SITE_URL`, aux clés Stripe ou à l'URL du
      webhook.
- [x] ~~**`MISE-EN-LIGNE.md` annonce « les quatre » événements Stripe puis en
      liste six.**~~ **CORRIGÉ le 19 septembre.** Le code en traite bien six.
- [x] ~~**Aucune intégration continue.**~~ **AJOUTÉE le 20 septembre**
      (`.github/workflows/verifications.yml`) : types, tests, linter et build à
      chaque push et chaque pull request, les quatre étapes tournant même après
      un échec pour qu'un seul passage donne toute la liste. Aucun secret n'y
      est nécessaire — vérifié, `next build` sort avec le code 0 sans aucune
      variable d'environnement.
- [x] ~~**Les 9 erreurs ESLint.**~~ **TRAITÉES le 20 septembre.** Six étaient
      des défauts réels — cinq `Math.random()` pendant le rendu d'une page
      prérendue, donc une désynchronisation d'hydratation sur 40 éléments, et
      une écriture dans une référence pendant le rendu. Les trois autres sont
      des faux positifs, désormais justifiés par écrit là où ils se trouvent.
      `npx eslint .` ne rend plus rien.

## Deux limites mesurées sur le hero mobile — 20 septembre 2026

- [ ] **Le Galaxy Z Fold fermé (280 px) demande encore 44 px de défilement**
      pour voir la quatrième activité. C'était 159 px avant la grille 2 × 2.
      Mesuré : 26 de ces 44 px viennent du bouton « Réserver maintenant », dont
      le libellé passe à la ligne à cette largeur et qui fait alors 82 px au
      lieu de 56. Le reste vient du titre, qui s'y déplie sur quatre lignes.
      Corriger les deux ne suffirait pas ; il faudrait retoucher le hero
      entier, pour un écran de couverture de téléphone pliable.
- [ ] **À 200 % de taille de texte, « Bubble Foot & Team Building » est
      tronqué** par `line-clamp-2` dans sa vignette. Rien ne déborde et il n'y a
      aucun défilement horizontal — le critère 1.4.4 tient sur ce point —, mais
      la fin du nom n'est plus visible à l'œil. Elle reste lue en entier par un
      lecteur d'écran, le texte étant complet dans le document. C'était déjà le
      cas avec les lignes empilées, sur la même chaîne.

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

- [x] ~~**Les six valeurs d'identité de l'entreprise.**~~ **RENSEIGNÉES le
      17 septembre 2026.** Plus aucun « [à compléter] » sur le site, et
      l'art. III.74 du Code de droit économique est respecté. Ce n'est donc
      **plus** le point qui empêche la mise en ligne — celui qui reste est
      l'ouverture du compte Stripe.
- [x] ~~**Durées de conservation.**~~ **TENUES PAR LA BASE depuis le
      19 septembre 2026** (migration 0024). L'article 7 promettait aux demandes
      de devis « une durée limitée » sans qu'aucune purge existe : elles sont
      désormais anonymisées à 13 mois, comme les réservations, par une tâche
      planifiée. La page annonce la vraie durée et ce qui subsiste.
- [x] ~~**Consentement marketing.**~~ **HORODATÉ depuis le 19 septembre 2026.**
      Les deux tables ne portaient qu'un booléen, alors que l'art. 7.1 du RGPD
      demande de pouvoir DÉMONTRER le consentement. `newsletter_le` est écrite à
      l'enregistrement. Les lignes antérieures gardent une date nulle : on ne
      reconstitue pas après coup la date d'un consentement, et elles resteront
      hors de tout envoi.
- [x] ~~**Mesure d'audience : deux champs non déclarés.**~~ **CORRIGÉ.** Le
      pays et la langue étaient réellement stockés et ne figuraient dans
      l'énumération d'aucune des deux pages. Le pays est déduit de l'adresse IP,
      juste à côté de « aucune adresse IP n'est conservée » : les deux phrases
      sont vraies, ensemble elles trompaient.
- [x] ~~« 2000+ fêtes organisées »~~ **Retiré le 13 septembre 2026.** Plus
      aucune allégation chiffrée invérifiable sur le site (art. VI.97).
- [ ] **Autorisation à l'image** : aucun formulaire ne la recueille
      aujourd'hui, alors que les CGV art. 15 annoncent un système Replay et
      une vidéo souvenir. À brancher le jour où la fonctionnalité existe —
      pour un mineur, c'est le représentant légal qui consent.

---

# État technique

**Base de données** — projet `shybhkzgwxyajysjlrbv` (Offside World, eu-west-1),
migrations `0001` à `0024` appliquées et vérifiées (les trois dernières :
quota de partage, horaires Bubble configurables, purge des devis et horodatage
du consentement). **13 tables**, RLS activé et forcé sur chacune, sans aucune
politique : rien n'est accessible par les clés publiques, tout passe par le
serveur. Cinq tâches planifiées actives.

> **Le registre de Supabase ne liste pas tout le dépôt, et c'est normal.**
> Noté ici le 19 septembre comme un défaut à réconcilier : c'était un faux
> diagnostic, corrigé le lendemain. Il n'y a pas de `supabase/config.toml`, le
> CLI n'est pas en place, et les fichiers portent une numérotation séquentielle
> et non l'horodatage qu'il exige. Le registre n'est donc qu'un sous-produit de
> l'outil employé chaque jour-là ; le dossier `supabase/migrations/` est l'état
> de référence, et il est complet. Vérifié objet par objet le 20 septembre.
> Voir `supabase/migrations/README.md`.

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

**Le paiement en ligne est ÉCRIT, branché et testé — il attend deux clés.**

Audité ligne à ligne le 13 septembre 2026. Ce qui existe :
- création de la session Checkout, Bancontact en premier, expiration à 30 min,
  clé d'idempotence pour que deux clics ne créent pas deux paiements ;
- webhook à signature vérifiée, corps lu brut, e-mails envoyés après la réponse,
  et les six événements traités — dont `async_payment_succeeded`, sans lequel
  un paiement Bancontact partirait sans confirmer la réservation ;
- confirmation idempotente : deux livraisons du même événement ne confirment pas
  deux fois et n'envoient pas deux e-mails ;
- la réservation est confirmée par le WEBHOOK, jamais par la page de retour ;
- remboursement depuis le back-office, avec le choix entre barème, intégral et
  aucun, le montant recalculé côté serveur et le cumul écrit en base ;
- le délai qui tient un créneau passe seul de 48 h à 45 min dès que la clé
  Stripe existe — une fenêtre de paiement, non plus un délai de traitement ;
- repli propre : si Stripe est indisponible au moment de créer la session, la
  réservation n'est pas perdue, on retombe sur le comportement « à confirmer ».

Il ne reste donc aucun développement. Voir `MISE-EN-LIGNE.md` section 4.

**Adaptation aux écrans — état au 13 septembre 2026**

Trois passages successifs, chacun mesuré au navigateur et non jugé à l'œil.

Ce qui est vérifié, et sur quoi :
- **Largeur** : balayage continu de 280 px (écran de couverture d'un Galaxy Z
  Fold) à 2560 px — 56 largeurs, avec un arrêt un pixel avant et un pixel après
  chaque seuil de Tailwind, sur 14 pages. Aucun débordement, aucune troncature,
  aucune cible tactile sous 24 px.
- **Hauteur** : 16 formats de 360 à 900 px, téléphone à l'horizontale compris.
- **Tunnel de réservation** : les trois parcours, étape par étape jusqu'au
  récapitulatif, sur 5 largeurs.
- **Texte agrandi à 200 %**, le réglage « taille du texte » d'Android.
- **Mouvement réduit** : 5 animations en cours → 0, fond WebGL figé.

Ce qui ne l'est PAS, et ne peut pas l'être depuis ici :
- **Safari iOS** — voir le point « tester sur un vrai iPhone » plus haut.
- **Les listes réelles du back-office et du tunnel**, avec les données de
  production. La base n'est pas joignable en local, et la connexion au
  back-office écrit sa session EN BASE : l'écran de connexion répond
  « Back-office indisponible » avant même d'afficher un formulaire. Les
  composants ont donc été mesurés un par un sur des données fabriquées,
  volontairement plus longues que la moyenne ; les pages qui les assemblent
  restent à mesurer une fois le site en ligne.

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
