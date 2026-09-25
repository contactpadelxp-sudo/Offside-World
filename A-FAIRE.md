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
- [ ] **Désactiver ou clarifier l'entrée « Anniversaire de Football ».** Les
      anniversaires se réservent sur le site : la laisser sur Sport-Finder crée
      deux canaux pour la même chose, donc un risque de double réservation.
      Elle est aujourd'hui en « Faire une demande » et non en réservation
      instantanée, ce qui limite le risque sans le supprimer.

      ⚠ **NE PAS toucher à « Activité de groupe de Bubble Foot ».** Cette puce
      demandait de la retirer elle aussi, au motif que « ces prestations se
      réservent sur le site ». C'était vrai le 4 septembre ; c'est faux depuis
      le 21, où le Bubble a quitté le site (`BUBBLE_EN_LIGNE = false`) pour
      Sport-Finder, qui en est devenu le seul canal de vente. L'exécuter
      aujourd'hui retirerait la seule façon de réserver un Bubble Foot.
- [x] ~~**Retirer de la location de terrain les plages réservées aux
      anniversaires.**~~ **FAIT par Brahim le 24 septembre 2026**, pendant
      l'appel de mise en ligne, avant la bascule du domaine. C'est la moitié de la règle d'étanchéité — sans elle,
      configurer les créneaux côté site ne sert à rien.

      **Brahim s'en charge, et il le fera EN DIRECT avec Mathis** (23 septembre
      2026 : « Sportfinder ça me prend 5' en live », « on peut caler quand tu
      veux »). C'est la bonne façon de le faire, et pas seulement par confort :
      `MISE-EN-LIGNE.md` exige que ce geste précède le basculement du domaine
      ou l'accompagne, **jamais qu'il le suive**. Le faire ensemble le jour J
      supprime la fenêtre pendant laquelle les deux canaux vendraient le même
      terrain.

      À caler au moment où le domaine sera prêt, pas avant : les deux gestes
      n'ont de sens qu'ensemble.
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
| Vendredi | **16:00** *(un seul — 16:30 jusqu'au 24 septembre)* |
| Samedi | 10:00 · 12:30 · 15:00 *(le 17:30 retiré le 24 septembre)* |
| Dimanche | 10:00 · 12:30 · 15:00 *(le 17:30 retiré le 24 septembre)* |

**Le 24 septembre 2026, jour de la mise en ligne** (migration 0034) : le
vendredi passe à 16h00–18h00, et le dernier créneau du samedi et du dimanche
disparaît. Décision de Brahim et Mathis.

Les créneaux retirés sont **supprimés**, pas fermés comme en 0028 : un samedi
17h30 fermé ne chevauche rien et ne mord pas sur Sport-Finder, donc « Rouvrir
la journée » l'aurait remis en vente au premier clic. Un seul a été fermé au
lieu d'être supprimé — le vendredi 2 octobre 16h30, qui porte le test annulé
`OW-GXTCUD8X` et ne peut pas perdre sa trace de paiement.

⚠️ **Défaut trouvé et corrigé au passage :** la génération des créneaux
recréait, en doublon et OUVERTS, ceux que Brahim ferme à la main pour ses
anniversaires pris par téléphone. Voir la migration 0034 — vérifié ensuite :
ses 11 fermetures sont intactes, zéro doublon.

**Le vendredi a changé le 21 septembre 2026.** Il portait 16:00 et 18:30 ;
Brahim a alors donné l'heure manquante — foot et Bubble de 20h à 1h le vendredi
aussi — et le second créneau finissait à 20h30, trente minutes après. Deux
créneaux de 2 h séparés de 30 min demandent 4 h 30, et il n'y en a que 3 h 30
entre 16h (après l'école) et 19h30. Le vendredi est donc passé à un seul,
16h30–18h30. Les anciens sont fermés en base, pas supprimés.

Générés sur six mois d'avance. **Le nombre exact de créneaux n'est plus écrit
ici** : il a été faux trois fois — après l'ouverture de la troisième Fun zone,
après sa fermeture, après le changement du vendredi — et chaque fois quelqu'un
l'a cru. `/admin/creneaux` le donne, à jour, pour le jour affiché.

**Deux Fun zones seulement sont en vente depuis le 19 septembre 2026.** Brahim
a écrit « il y en **aura** 3 » — au futur, en réponse à une question qui parlait
de deux espaces. La migration 0020 avait pourtant ouvert la troisième, et 314
créneaux y étaient à vendre : le site pouvait accepter trois groupes pour deux
salles. `espaces.actif = false` sur `espace-3` les retire de la vente sans rien
détruire (la vue `creneaux_disponibles` filtre dessus). Un `update` suffit à
les rendre le jour où il confirme.

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

- [x] ~~**Les congés annuels.**~~ **AUCUN** — Brahim, le 23 septembre 2026 :
      « pas de congés ». Il n'y a donc pas de période à fermer dans l'année.
- [x] ~~**LES JOURS FÉRIÉS.**~~ **LE COMPLEXE EST OUVERT** — Brahim, le
      23 septembre 2026, interrogé sur le 25 et le 26 décembre et le
      1er janvier : « Oui ouvert ».

      **Donc rien à fermer, et surtout rien à fermer d'office.** La question a
      été posée précisément — avec les dates et le nombre de créneaux concernés,
      6, 12 et 6 — plutôt qu'en parlant des « jours fériés » en général. C'est
      ce qui permet de tenir la réponse pour ferme.

      Le relevé du 19 septembre reste donc l'état voulu : ces journées se
      vendent. Le bouton « Fermer les N créneaux du jour » reste disponible au
      back-office le jour où Brahim changerait d'avis.

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

- [ ] **Proposer à Brahim une vraie lettre d'information — ou renoncer.**
      Demandé par Mathis le 22 septembre 2026 : « garde en mémoire pour
      proposer à Brahim ».

      Ce qui a été fait ce jour-là : la case « Recevoir les offres par email »
      a été **retirée des deux tunnels** (anniversaire et groupes). Elle
      récoltait un consentement pour un service qui n'existe pas. Vérifié dans
      les sources : aucun code ne lit jamais la colonne `newsletter`, il n'y a
      ni liste d'abonnés au back-office, ni moyen d'écrire un message, ni
      envoi. Personne n'a donc jamais rien reçu, et l'art. 5.1.b interdit de
      collecter une donnée sans finalité déterminée.

      **Ce qui reste en place, exprès :** la colonne `newsletter`, son
      horodatage `newsletter_le`, et le champ correspondant des actions
      serveur. Le jour où la fonctionnalité existe, il n'y a que la case à
      remettre — les trois fichiers portent le commentaire qui le dit.

      **Ce qu'il faudrait construire avant de la remettre**, et c'est ce qu'il
      faut chiffrer avec Brahim : une liste d'abonnés consultable au
      back-office, un composeur de message, un envoi groupé par Resend, et
      surtout un **lien de désabonnement dans chaque envoi** — l'art. 7.3 du
      RGPD exige qu'il soit aussi simple de retirer son consentement que de le
      donner, et l'**art. XII.13 du Code de droit économique** impose à tout
      envoi publicitaire par courrier électronique d'indiquer le droit de
      s'opposer ET de mettre à disposition un moyen électronique de l'exercer.
      Sans ce lien, l'envoi est illégal, pas seulement impoli.

      À trancher : Brahim en veut-il vraiment une ? Les lignes déjà
      enregistrées avec `newsletter = true` **ne peuvent pas** servir de base
      de départ sans le lui dire : elles ont été recueillies pour un service
      qui n'existait pas, à une époque où la politique de confidentialité
      n'annonçait pas d'envoi. On repart d'une collecte propre.
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

- [x] ~~**« Organisation et arbitrage du tournoi ».**~~ **CONFIRMÉ LE
      21 SEPTEMBRE 2026 : c'est bien fourni.** Mathis l'a vérifié auprès de
      Brahim — « oui toujours le cas ». La ligne de `TEAM_BUILDING_INCLUS`
      reste, et le site ne promet rien qu'il ne livre.

      Le doute venait de sa phrase « on met juste à disposition les terrains »,
      écrite le même jour. Elle portait sur la TVA, pas sur l'offre : c'était un
      raccourci pour dire que la restauration se facture au bar et non sur le
      devis. Noté ici pour que personne ne rouvre la question en relisant cette
      phrase hors contexte.

      Reste un point qui appartient à son comptable, pas au site : si la
      privatisation comprend une prestation d'organisation et d'arbitrage, elle
      n'est pas une pure mise à disposition d'installation — ce qui était la
      prémisse du raisonnement à 6 %. Le devis porte un taux modifiable, donc
      rien ne bloque de notre côté.

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
- [x] ~~**« Parking gratuit » — à confirmer.**~~ **CONFIRMÉ PAR BRAHIM le
      22 septembre 2026** (« oui parking gratuit c'est bon »). L'affirmation
      est désormais sourcée et peut rester sur le site — et être reprise dans
      les articles du blog, ce qui est fait.

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

- [x] **TESTER LE SITE SUR UN VRAI IPHONE.** ✅ Fait le 21 septembre 2026 :
      le tunnel de réservation a été parcouru en entier sur téléphone et se
      comporte correctement. Ce qui suit reste écrit pour la prochaine fois —
      aucune mesure sous Chromium ne remplace un appareil réel.

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
- [x] ~~**OUVRIR LE COMPTE STRIPE.**~~ **FAIT ET ÉPROUVÉ — EN MODE TEST.**
      Le compte existe, les deux clés sont en place, le webhook reçoit et
      signe : le statut `reussi` n'est posé que par lui, jamais par la page de
      retour. Le tunnel complet a été parcouru le 21 septembre 2026, paiement
      ET remboursement intégral compris.

      **Aucun argent réel n'a jamais transité.** Les clés sont des `sk_test_`,
      ce que `/admin/réglages` affiche en rouge sous « Encaissement réel ». Ce
      n'est pas un défaut : c'est le bon réglage tant que le site n'est pas
      public. Le passage en `sk_live_` se fait au basculement du domaine — et
      il demande de **recréer le webhook sur le compte de production**, dont le
      secret de signature est différent. Voir `MISE-EN-LIGNE.md` § 4f.

      ⚠ **Le moyen de paiement affiché n'a pas été éprouvé.** Ce paragraphe
      concluait « Bancontact éprouvé de bout en bout » à partir d'une ligne
      portant `methode = "bancontact"`. Or le webhook écrivait alors
      `session.payment_method_types[0]`, toujours « bancontact » puisque la
      session est créée avec `["bancontact", "card"]` : la valeur ne disait pas
      ce qui avait été employé, seulement ce qui avait été proposé. Le correctif
      (`moyenDePaiementUtilise`) est arrivé APRÈS ce paiement-là. Ce que
      Bancontact emprunte et que la carte ne teste pas — le dénouement
      asynchrone, `checkout.session.async_payment_succeeded` — n'a donc jamais
      été vérifié.

      Cette ligne est restée « à faire » six jours après coup, et c'est elle
      qui m'a fait annoncer à Mathis que le paiement bloquait la mise en ligne
      — alors qu'il avait déjà encaissé. Puis, corrigée trop vite, elle a fait
      croire l'inverse : que tout était éprouvé en production. Le fichier de
      suivi doit se relire contre le système, jamais l'inverse — et dire ce
      qu'il n'a PAS vérifié.
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

- [x] ~~**Écrire deux articles pour le référencement.**~~ **ÉCRITS le
      22 septembre 2026** — migration `0033_deux_articles_referencement.sql`,
      à appliquer.

      Les deux : `anniversaire-enfant-gembloux` (le sujet principal) et
      `bubble-foot-anniversaire-gembloux`. Le second n'est **pas** un article
      sur le Bubble seul : `BUBBLE_EN_LIGNE` est à `false` depuis le
      21 septembre et la fiche Sport-Finder n'accepte que des demandes sans
      être activée — un article qui enverrait y réserver mènerait à une
      impasse. Il est donc centré sur la formule anniversaire Bubble, qui est
      bien vendue ici, et renvoie les groupes d'adultes vers l'adresse e-mail.

      **Aucun prix ni horaire dans les corps**, délibérément : ils vivent en
      base et Brahim les change du back-office. Un chiffre recopié dans un
      article deviendrait faux en silence — exactement ce qu'on a passé des
      semaines à retirer du site. Les articles renvoient vers la page de
      réservation, qui dit toujours la vérité du jour.

      Ils mettent aussi au travail deux des images orphelines
      (`anniv2.webp`, et `anniv1.jpg` qui ne servait qu'à la formule).
- [x] ~~**Écrire deux articles pour le référencement.**~~ *(consigne d'origine,
      conservée pour le contexte.)* Demandé par Mathis le
      22 septembre 2026. Le blog compte **zéro article** alors que la page
      `/blog` existe et figure dans la navigation : un visiteur qui clique le
      jour de l'ouverture tombe sur une page vide.

      **Ce que le référencement gagne vraiment ici.** Le titre et la
      description de chaque article alimentent les métadonnées de sa page
      (`generateMetadata` dans `blog/[slug]/page.tsx` : `title` prend le titre,
      `description` prend le chapô) et le `sitemap.xml`. Deux pages de plus
      qui parlent de Gembloux, c'est deux entrées supplémentaires sur des
      recherches locales — et le site n'en a aujourd'hui que sur l'accueil et
      la page de réservation.

      **Les sujets à privilégier**, dans l'ordre de ce que les gens tapent :
      une page qui répond à « anniversaire enfant Gembloux » — comment ça se
      passe, ce qui est compris, combien de temps, à partir de quel âge — et
      une autre sur le Bubble Foot, qui est l'activité la moins connue et donc
      la plus cherchée par curiosité. Éviter les listes creuses du type
      « 10 idées d'anniversaire » : elles ne se classent pas et ne ressemblent
      pas au reste du site.

      ⚠ **La règle du projet s'applique mot pour mot : rien d'inventé.** Pas de
      nombre de fêtes organisées, pas d'avis, pas de superlatif invérifiable —
      c'est exactement ce qui a fait retirer « 2000+ fêtes organisées », le
      faux « 4.8/5 » et le témoignage signé « Sophie D. ». Tout ce qu'un
      article affirme doit être vérifiable : les formules et leurs prix sont en
      base, les horaires aussi, l'adresse et la capacité sont connues. Le
      reste se demande à Brahim avant d'être écrit.

      Champs à remplir pour chaque article : `titre`, `slug`, `chapo` (c'est
      lui qui devient la description dans les moteurs, donc il compte autant
      que le titre), `corps`, `image`, et la date de publication.

# À faire côté Mathis

## 📅 DEMAIN — transfert des comptes, dans cet ordre

Brahim a donné ses accès le 22 septembre au soir. Décidé avec Mathis : le
**nom de domaine reste chez Wix** (l'écart de prix avec OVH est marginal et ça
supprime une étape à risque), mais la **zone DNS part chez Vercel** — Wix ne
garde alors que le nom loué, sans abonnement site.

- [x] ~~**0. Retrouver le compte Vercel qui détient le projet.**~~ **TROUVÉ :
      `contactpadelxp-sudo's projects`**, le 23 septembre 2026 — le compte lié
      au dépôt GitHub. Le projet en est sorti par transfert le jour même.
      Ancienne consigne conservée ci-dessous pour mémoire.
- [x] ~~**0 (consigne d'origine).** Vérifié le
      22 septembre : il n'est PAS sur `mathishannebique111-hash`, qui ne porte
      que `padel-xp`. Le site répond pourtant sur `offside-world.vercel.app`.
      Piste la plus probable : se connecter à Vercel **via GitHub** avec le
      compte `contactpadelxp-sudo`, propriétaire du dépôt. Bloque tout le
      reste.
- [x] ~~**0 bis. Vérifier que Wix autorise des serveurs de noms EXTERNES.**~~
      **VÉRIFIÉ le 23 septembre 2026 : NON.** Le menu du domaine ne propose
      que « Gérer les enregistrements DNS », « Transférer en dehors de Wix »,
      « Transférer vers un autre compte Wix » et la gestion des MX. **Aucune
      entrée « Serveurs de noms ».** Wix laisse éditer les enregistrements
      DANS sa zone, pas déléguer la zone ailleurs.

      **Conséquence : LA ZONE DNS RESTE CHEZ WIX**, et c'est une simplification.
      Les étapes 3 et 4 ci-dessous tombent : rien à reconstruire. Au jour J, on
      change seulement les 3 `A` et le `CNAME www`, par « Gérer les
      enregistrements DNS » — c'est le plan d'origine de `MISE-EN-LIGNE.md`,
      et le moins risqué. La messagerie de Brahim n'est jamais dans le
      périmètre.

      Wix garde donc deux rôles, pas un : le nom loué **et** la zone DNS.
      L'abonnement *site* reste résiliable après la mise en ligne ; avant de
      l'annuler, demander à l'assistance Wix par écrit ce qu'il advient de la
      zone DNS — c'est la seule panne vraiment grave de l'opération.
- [x] ~~**1. Créer la Team Vercel de Brahim**, plan Pro.~~ **FAIT** — compte
      `admin-83482198`, plan Pro confirmé.
- [x] ~~**2. Transférer le projet** vers cette Team.~~ **FAIT le 23 septembre
      2026, et vérifié :**
      - les 9 variables d'environnement ont suivi. `ADMIN_SESSION_SECRET` et
        `SITE_URL` n'y figurent pas, et **c'est sans conséquence** : la
        première se dérive de `ADMIN_PASSWORD` (`admin/jeton.ts`), la seconde
        se replie sur `offside-world.vercel.app` (`lib/site.ts`) ;
      - la connexion Git tient : `contactpadelxp-sudo/Offside-World` ;
      - aucune protection de déploiement, le site reste public ;
      - **l'adresse de production n'a pas changé** (`offside-world.vercel.app`),
        donc `SITE_URL` et l'URL du webhook Stripe restent valables jusqu'au
        basculement du domaine.

      ⚠️ **Le champ « Transfer Project To » ne liste que les équipes dont on est
      membre**, et l'API Vercel exposée ici ne permet pas d'initier un
      transfert vers une équipe externe. Il a donc fallu inviter Mathis
      (+$20/mois au prorata), transférer, puis le retirer. À savoir si
      l'opération se refait un jour.
- [ ] **3. Ajouter le domaine au projet, DANS LA TEAM DE BRAHIM.** Vercel
      affichera « Invalid Configuration » : c'est normal et attendu tant que
      le DNS de Wix pointe encore sur l'ancien site. Ce qu'on veut de cette
      étape, ce sont les **valeurs exactes** que Vercel demande — l'adresse IP
      de l'apex et la cible du `CNAME www` — à recopier chez Wix le jour J.

      ⚠️ Vercel proposera de **transférer les serveurs de noms**. On refuse :
      voir le point 0 bis, et le piège documenté dans `MISE-EN-LIGNE.md`.
- [x] ~~**4. Construire les 12 lignes chez Vercel.**~~ **SANS OBJET** — la
      zone reste chez Wix (point 0 bis). Il n'y a jamais que deux
      enregistrements à changer, et le jour J.
- [x] ~~**5. Transférer le projet Supabase.**~~ **FAIT le 23 septembre 2026.**
      Organisation `kdaoacqbgootkosdsmvo` (« Offside »), plan Pro.
      **Vérifié ligne à ligne, aucune perte** — 1003 créneaux, 5 réservations,
      4 paiements, 2 formules, 5 options, 2 devis, 2 articles, 24 lignes de
      journal, identiques avant et après. Même identifiant de projet, même
      URL, mêmes clés, même région : **aucune variable Vercel à retoucher.**
- [x] ~~**6. Recréer le compte Resend sous Brahim.**~~ **SANS OBJET : il est
      déjà à son nom.** Confirmé par Mathis le 23 septembre 2026. Rien à
      refaire, et surtout aucun DKIM à republier.

      ⚠️ La ligne « Ouvrir un compte Resend » plus bas, classée sous « À faire
      côté Mathis », laissait croire le contraire. Elle est corrigée.
- [x] ~~**7. Brahim crée Stripe.**~~ **SANS OBJET : le compte existe déjà et
      il est à lui.** Confirmé par Mathis le 23 septembre 2026 — c'est celui
      qui a encaissé le Bancontact du 15 septembre.

      ⚠️ **Ce qui reste, en revanche, c'est le passage en LIVE** : voir la
      section dédiée. Un compte Stripe qui fonctionne en test n'encaisse pas
      un centime réel.

**La bascule des serveurs de noms n'est PAS de demain.** Elle reste l'étape
finale, avec le préalable Sport-Finder. Voir `MISE-EN-LIGNE.md`.

## ✅ Le paiement fonctionne EN LIVE — vérifié le 23 septembre 2026

Clés `sk_live_` et `whsec_` posées sur le compte Stripe de Brahim, webhook
`captivating-brilliance` vers `offside-world.vercel.app/api/stripe/webhook`,
**les sept événements** écoutés, endpoint actif.

**Le test a été fait avec de l'argent réel**, à 1 € : le prix de Kick-Off a été
abaissé le temps de la manœuvre depuis `/admin/tarifs`, plutôt que de créer une
formule de test qui aurait traîné en base, ou une migration qui aurait traîné
dans l'historique du projet. Le journal d'administration porte la trace des
deux modifications, dans les deux sens.

Relevé en base, dans l'ordre où ça s'est produit :

| Heure (UTC) | Ce qui s'est passé |
|---|---|
| 20:12:27 | prix de Kick-Off abaissé à 1 € |
| 20:13:36 | réservation `OW-VSGU5LSX` créée |
| 20:13:38 | paiement enregistré — 1 €, **carte**, intention Stripe présente |
| 20:15:44 | annulation, remboursement intégral |
| 20:15:45 | **100 centimes rendus sur 100** |
| 20:16:29 | prix de Kick-Off **remis à 180 €** |

**Les deux e-mails sont arrivés** — confirmation et annulation — donc
`EMAIL_EXPEDITEUR` n'est pas resté sur l'adresse de démonstration
`onboarding@resend.dev`. C'était le seul maillon qui échoue en silence, et il
est levé.

**`methode` vaut `card`, et c'est une preuve en soi** : le code lit le moyen
RÉELLEMENT utilisé sur l'imputation, et non le premier de la liste proposée —
qui est toujours `bancontact` ici. Le paiement du 15 septembre, antérieur au
correctif, porte encore `methode = null`.

**Ce que le test ne prouve pas**, et il faut le dire : Mathis paie depuis la
France, donc le dénouement ASYNCHRONE de Bancontact n'a pas été rejoué en live.
Ce n'est pas inquiétant — la signature est propre à l'ENDPOINT et non à
l'événement, donc si `checkout.session.completed` passe, les `async_payment_*`
passent aussi — et cette branche a été éprouvée en test le 21 septembre. Mais
ça reste une inférence, pas une observation.

⚠️ **À vérifier chez Brahim** : que **Bancontact soit activé en mode LIVE**
(Settings → Payment methods). C'est un réglage distinct du mode test. S'il ne
l'est pas, les clients belges ne verront que la carte — c'est-à-dire le moyen
de paiement qu'ils n'utilisent pas.

## ✅ Les deux migrations en attente sont appliquées — 23 septembre 2026

- [x] ~~`0032_purge_du_journal_admin.sql`~~ **APPLIQUÉE et vérifiée.**
      `purger-journal-admin` est planifiée et `active`.

      ⚠️ **L'heure diffère du fichier** : `30 4 * * 0` et non `15 4 * * 0`.
      Le commentaire de la migration justifiait le décalage par la purge des
      sessions (4h00) — mais 4h15 était déjà occupé par `purger-audience`.
      Corrigé en base à 4h30. Le raisonnement tenait, le créneau choisi non.
- [x] ~~`0033_deux_articles_referencement.sql`~~ **APPLIQUÉE et vérifiée.**
      Les deux articles sont publiés, `/blog` n'est plus vide.

      Tâches planifiées en base au 23 septembre, dans l'ordre où elles
      tournent : `anonymiser-reservations` 3h30 · `anonymiser-devis` 3h31 ·
      `purger-sessions-admin` dim. 4h00 · `purger-audience` dim. 4h15 ·
      `purger-journal-admin` dim. 4h30 · `purger-quotas` 4h45. Toutes en UTC,
      toutes actives.

- [x] **Définir `ADMIN_USER` et `ADMIN_PASSWORD`** dans Vercel (type
      « Sensitive » pour le mot de passe). Sans ces deux variables, `/admin`
      répond 404 : c'est voulu, mais le back-office reste alors inaccessible à
      Brahim.
- [x] ~~Passer le dépôt GitHub en privé.~~ **Décidé le 13 septembre 2026 : on
      le laisse public.** Voir la note en « Décisions en attente de Mathis ».
- [x] ~~**Ouvrir un compte Resend**, y vérifier le domaine, renseigner les
      variables.~~ **Fait le 12 septembre 2026.** ⚠️ **Le compte est celui de
      BRAHIM**, confirmé le 23 septembre 2026 — cette ligne, classée sous « À
      faire côté Mathis », laissait croire l'inverse. Rien à transférer.** Domaine `offsidefootindoor.be`
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
- [x] ~~**EN TOUT DERNIER — basculer le domaine et activer les e-mails.**~~
      **FAIT le 24 septembre 2026** — sans toucher aux serveurs de noms : deux
      lignes changées dans la zone Wix, la messagerie intacte. Relevé complet
      en tête de `MISE-EN-LIGNE.md`. Historique :
      Ordre fixé par Mathis le 13 septembre 2026 : c'est la toute dernière
      étape, après le paiement. Tant que le domaine sert le site Wix de Brahim,
      rien ne presse, et déplacer les serveurs de noms trop tôt couperait sa
      messagerie. Le domaine appartient à
      Brahim ; il sert encore le site Wix, et rien n'autorise encore l'envoi
      d'e-mails automatiques. La marche à suivre complète, avec l'état DNS
      relevé et le piège à éviter (déplacer les serveurs de noms couperait la
      messagerie de Brahim), est dans **`MISE-EN-LIGNE.md`**.
- [x] ~~**Renseigner `SITE_URL`**~~ **FAIT le 24 septembre 2026**
      (`https://offsidefootindoor.be`, redéployé) — les liens des e-mails et
      le sitemap en dépendent.
- [x] ~~**À LA FIN — passer Supabase au plan Pro (25 $/mois).**~~ **FAIT le
      23 septembre 2026** : le projet a été transféré dans l'organisation Pro
      de Brahim, et la taille de calcul est passée de Nano à Micro (gratuite
      sur ce plan). Le projet ne peut donc plus être mis en pause pour
      inactivité, et les sauvegardes sont téléchargeables. Raisonnement
      d'origine conservé : Ordre fixé par
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

## Ouverture automatique de la porte — demandé par Brahim le 23 septembre 2026

« Et si on pouvait se pencher sur l'automatisation ça serait aussi top. »

**CE QU'ON SAIT** : il a envoyé une photo d'un écran intitulé « Configuration
QRCode », avec une clé, des catégories, des filtres et une règle d'expression.
C'est tout. Une photo d'écran prise de travers ne dit ni de quel système il
s'agit, ni qui l'administre, ni ce qu'il sait faire.

**CE QU'ON NE SAIT PAS, ET QU'IL NE FAUT PAS DEVINER.** Une première version de
cette entrée affirmait que le contrôle d'accès était piloté depuis le
back-office partenaire de Sport-Finder, et en tirait que l'automatisation
permettrait de remettre le Bubble Foot en vente sur le site. Les deux étaient
des LECTURES d'une image, pas des constats. Retiré.

**LES QUESTIONS À POSER À BRAHIM**, avant toute estimation :

- [ ] **De quel système s'agit-il, et qui l'administre ?** Un fournisseur, un
      contrat, un interlocuteur.
- [ ] **Qu'est-ce qui déclenche l'ouverture aujourd'hui ?** Un QR envoyé au
      client, un code, autre chose — et par quel canal.
- [ ] **Qu'attend-il exactement d'« automatiser » ?** Que le site émette
      lui-même l'accès, ou simplement qu'il n'ait plus à le faire à la main.
      Les deux n'ont ni le même coût ni les mêmes prérequis.
- [ ] **Ce système expose-t-il une interface programmable ?** C'est ce qui
      décide si le sujet est faisable, pas une préférence.

**À NE PAS ENTREPRENDRE AVANT LA MISE EN LIGNE.** Le site est prêt, les
paiements fonctionnent, il ne reste que le domaine. Ce chantier demande des
réponses qui ne dépendent ni de Mathis ni de Brahim.

## Team building : de vrais créneaux, tenus par la demande — FAIT le 24 septembre 2026

Mathis : « quand quelqu'un fait une demande de devis il choisit son créneau et
ça le bloque, mais Brahim doit aussi pouvoir bloquer lui-même dans le
back-office ; les créneaux de team building doivent avoir le même
fonctionnement que les créneaux anniversaires. » Et la journée entière.

**Heures données le même jour : 09h00–13h00 et 14h00–18h00.** Jours inchangés :
lundi, mardi, jeudi matin et après-midi ; vendredi matin seulement.

**Ce qui a été construit** (migrations 0035 et 0036, appliquées) :

- [x] Le type d'activité `team_building`, et **360 créneaux** générés sur six
      mois — un par Fun zone active, comme les anniversaires. Les 453
      créneaux d'anniversaire n'ont pas bougé.
- [x] Une demande **tient** son créneau dès l'envoi (table `devis_creneaux`).
      La journée entière en tient deux, d'une seule écriture : les deux ou
      aucun. Le serveur attribue la Fun zone ; pour une journée, il garde le
      même terrain matin et après-midi quand il le peut.
- [x] **La base tranche les courses** : index unique partiel — deux
      entreprises qui envoient au même instant ne passent pas toutes les deux.
- [x] **Refuser la demande rend le créneau à la vente**, par déclencheur : ça
      ne dépend d'aucun chemin de code. Rouvrir la demande tente de le
      reprendre, et le DIT s'il a été pris entre-temps.
- [x] Le back-office traite ces créneaux comme les anniversaires : fermer,
      rouvrir, fermer la journée, ajouter à la main (durée 4 h ajoutée).
      Un créneau tenu affiche « Demandé · TB-… » et renvoie à la demande ;
      il ne se ferme pas tant qu'elle vit.
- [x] Le tunnel montre les vrais créneaux, **complets barrés**, par paquets de
      douze jours.
- [x] **Vérifié en base dans une transaction annulée** : tenue, doublon
      refusé, libération au refus, trace conservée, reprise par une autre
      demande, réactivation refusée. Rien n'est resté en base.

**Trois textes disaient l'inverse de ce qui se passe désormais**, corrigés :
l'e-mail à l'entreprise (« Cette demande ne bloque pas encore de créneau »),
le sous-titre de la page Devis (« n'occupe aucun créneau »), et le tunnel
(« la confirmation de la disponibilité »).

✅ **Plus de conflit avec Sport-Finder — relevé le 24 septembre 2026.** Ce
paragraphe disait que Sport-Finder louait les terrains dès 14h00 les jours de
team building, et que Brahim devait fermer la plage à chaque après-midi
demandé. C'était la cible du 21 septembre, jamais configurée : Sport-Finder
ouvre en réalité à **18h00 en semaine et 17h00 le week-end**. L'après-midi
finit à 18h00 — bord à bord, sans chevauchement. `plages-sport-finder.ts`
suit désormais ces heures ; l'avertissement de la fiche et de l'e-mail ne
s'affiche donc plus, et le client lit « réservé » et non plus « retenu ».

**Relecture adversariale le soir même : 13 défauts réels, tous corrigés.**
Les deux qui changent le fonctionnement :

- **Une demande privatise le COMPLEXE, pas une Fun zone.** La première version
  réservait un seul terrain de 18 places, alors que le site annonce une
  « privatisation du complexe » pour des groupes jusqu'à 60. Désormais une
  demande tient tous les terrains actifs de la période, d'une seule écriture ;
  un terrain fermé par Brahim rend la période « complète ». Pour accueillir
  deux entreprises le même matin, il rouvre un terrain à la main.
- **Les tenues expirent** (migration 0037) : une demande restée « nouvelle »
  sept jours relâche ses créneaux — sinon un script pouvait bloquer six mois
  de team building. S'y ajoute un quota de 3 demandes par jour et par
  appelant.

Les autres : demande orpheline sur erreur de la base, renvoi de devis sur
une demande refusée sans reprise des créneaux, reprise d'un créneau que
Brahim avait fermé, course entre « fermer la journée » et une demande qui se
retire, compteur et croix « supprimer » de la page Créneaux, message d'erreur
invisible au client après une course perdue, et « réservé » promis sur des
après-midis que Sport-Finder loue encore (désormais « retenu », et Brahim est
invité à fermer la plage Sport-Finder DÈS RÉCEPTION).

- [x] ~~**`fr.offsidefootindoor.be`** servait l'ancien site Wix (anciens
      prix).~~ **FAIT le 24 septembre 2026** : ligne CNAME changée chez Wix
      (celle qui pointait vers `cdn3.wixdns.net`), redirection 308 vers le
      domaine dans Vercel, « Valid Configuration ». ⚠️ Absent du relevé de
      zone du 23 septembre — à y ajouter avant tout transfert du domaine.
- [ ] **Au premier vrai paiement** : vérifier en base que le webhook, passé
      sur `offsidefootindoor.be`, a bien confirmé la réservation.
- [ ] **Ne rien résilier chez Wix** sans avoir demandé à leur support ce que
      devient la zone DNS : le domaine y est encore enregistré, et la
      messagerie Google de Brahim dépend de cette zone.
- [ ] *(Plus tard, pas urgent.)* **Quitter Wix pour de bon**, si Brahim y
      tient. ⛔ **PAS VERS VERCEL : Vercel n'enregistre plus les `.be`**
      depuis février 2025 (vérifié par son API le 24 septembre 2026). Il
      faudrait un autre bureau d'enregistrement — OVH par exemple, à
      vérifier — et recréer toute la zone là-bas AVANT le transfert, messagerie
      comprise. Marche à suivre et relevé : `MISE-EN-LIGNE.md`.

      **25 septembre 2026 — Wix demande à Brahim de renouveler.** Option la
      plus simple, proposée avant tout transfert : chez Wix, l'abonnement du
      site (Premium) et le domaine sont **deux abonnements séparés** (aide
      Wix, « Canceling Your Site Plan and Domain »). Renouveler le domaine
      seul, arrêter le Premium. **Seul point que Wix n'écrit pas** : que les
      enregistrements DNS (A, CNAME, MX) continuent de fonctionner sans le
      Premium — à faire confirmer par écrit à l'assistance Wix AVANT de
      résilier. En attente : ce que Wix demande exactement de renouveler, et
      pour quelle date.

## Le Bounce Park arrive sur le site

Décidé avec Brahim le 21 septembre 2026 : le site vend les anniversaires ET le
Bounce Park, Sport-Finder garde le foot et le Bubble. Le Bounce Park est un
espace à part — pas un terrain —, il n'entre donc en concurrence avec rien, et
ses horaires tombent dans les heures habitées : mercredi 12h–19h, vendredi
15h–20h, samedi 10h–20h, dimanche 10h–19h.

**Mais il n'existe pas encore sur le site.** Ni activité, ni espace en base, ni
créneaux, ni tarif, ni tunnel. Aujourd'hui c'est une carte « Bientôt » qui ne
mène nulle part, volontairement.

- [x] ~~**La date d'ouverture.**~~ **LE 1ER DÉCEMBRE 2026**, communiquée le
      24 septembre 2026.
- [x] **FAIT le 25 septembre 2026 : la carte mène à `/bounce-park`** —
      présentation, visuel 3D, date d'ouverture, horaires prévus, et « tarifs
      et âge minimum annoncés avant l'ouverture ». Un seul visuel existe à ce
      jour (`bounce park.jpg`) ; d'autres images pourront s'y ajouter. Demande d'origine :
      **Remplacer la carte « Bientôt » par une vraie présentation** — demandé
      par Mathis le 24 septembre 2026, à faire APRÈS la mise en ligne :
      **illustrer** ce qu'est le Bounce Park (des images, pas seulement un
      titre) et annoncer **l'ouverture le 1er décembre 2026**. Aujourd'hui la
      carte ne dit rien et ne mène nulle part.

      ⚠️ Ce que la présentation peut dire, et ce qu'elle ne peut pas encore :
      la date est connue ; le prix et l'âge minimum, eux, ne le sont toujours
      pas. On ne les invente pas — c'est la règle qui a fait retirer « dès 6
      ans » et « encadrement adapté » de l'accueil. Une photo `bounce park.jpg`
      existe déjà dans `public/images/`.
- [ ] **Obtenir le prix et l'âge minimum.** Nécessaires pour vendre, pas pour
      annoncer.
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
- [x] ~~**Aucune région de fonction fixée.**~~ **FAIT le 22 septembre 2026 :**
      `vercel.json` fixe `regions: ["dub1"]`. Dublin, et non Francfort ou
      Paris, parce que c'est la ville où se trouve déjà la base (`eu-west-1`).

      Ce n'était pas qu'une question de vitesse. Les fonctions tournant aux
      États-Unis, **tout ce qu'un client saisissait traversait l'Atlantique**
      avant d'être enregistré en Irlande — un transfert hors Europe de données
      de mineurs et d'allergies, à déclarer et à encadrer, alors qu'il ne
      servait à rien. L'audit RGPD du 22 septembre l'a relevé ; la correction
      le supprime plutôt que de le justifier.

      ⚠ **À vérifier au premier déploiement :** le plan Vercel doit autoriser
      le choix de région. Sur le plan gratuit, une seule région est permise —
      ce qui suffit ici — mais si le déploiement refuse `dub1`, c'est le signe
      qu'il faut passer sur un plan payant, ce qui est de toute façon requis
      pour un site commercial.
- [x] ~~**Le projet Vercel n'est pas visible** depuis le compte joignable~~
      **RÉSOLU le 23 septembre 2026** : il était sur `contactpadelxp-sudo's
      projects`, invisible depuis le compte outillé ici. Transféré depuis vers
      la team de Brahim. Ancien texte :
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

# Audit de la mécanique de réservation — 21 septembre 2026

Lancé sur demande de Mathis : « faut que rien ne bloque, que tout soit fluide et
qu'aucune résa ne tombe en même temps ou ne fonctionne pas, c'est très
important. » Six agents, un par dimension. **Trois ont rendu, deux se sont
arrêtés en cours, et la phase de contradiction n'a jamais tourné** — ce qui suit
n'est donc PAS validé, sauf les deux points marqués vérifiés.

Plusieurs constats ont été trouvés indépendamment par deux ou trois agents ;
c'est le signe qu'ils tiennent, pas une répétition.

## Corrigés le jour même, après vérification jusqu'à l'exécution

- [x] ~~**L'expiration à 45 minutes libérait un créneau DÉJÀ PAYÉ.**~~
      Migration 0026. `expirer_reservations_en_attente` n'avait aucune
      condition sur `paiements` — vérifié sur le corps réel de la fonction.
      `confirmerPaiement` écrit en deux fois : paiement « reussi », PUIS
      réservation « confirmee ». Entre les deux, la réservation est encore
      « en_attente » avec l'argent encaissé. L'expiration passait là, rendait
      le créneau à la vente, un second client l'achetait. Sa jumelle portait
      déjà la garde : les deux se contredisaient, et c'est la plus exposée qui
      avait tort.
- [x] ~~**`expirer_reservations_passees` n'a jamais tourné.**~~ Migration 0026.
      Elle interrogeait `r.debut`, colonne inexistante — l'heure de début vit
      sur `creneaux`. Vérifié en l'appelant : « 42703: column r.debut does not
      exist ». Inopérante du 15 au 21 septembre, et son échec avalé par un
      `console.error` que personne ne lit.

## Restent à traiter, par cause racine

- [x] ~~**`confirmerPaiement` fait deux écritures non transactionnelles.**~~
      **LE DÉFAUT EST RÉPARÉ** — vérifié dans les sources le 23 septembre 2026.

      Les deux écritures ne sont toujours pas transactionnelles, mais ce n'était
      pas là qu'était le mal : c'était le `return` de la branche « déjà
      réussi », qui sortait AVANT de retenter la confirmation et rendait donc le
      rejeu de Stripe inopérant dans le seul cas où il sert. Il a été retiré.
      La suite est idempotente — l'update est filtré sur `statut = 'en_attente'`,
      donc une relivraison sur une réservation déjà confirmée ne touche rien et
      n'envoie pas de second e-mail.
- [x] ~~**La réservation est écrite AVANT l'appel à Stripe.**~~ **CORRIGÉ** —
      vérifié dans les sources le 23 septembre 2026. Elle l'est toujours, et
      c'est voulu : c'est elle qui tient le créneau pendant que le client paie.
      Mais l'appel est désormais entouré d'un `try`/`catch` qui appelle
      `libererReservationAbandonnee` avant de relancer l'erreur, dans les DEUX
      tunnels. Le client retrouve donc son créneau en recommençant.
- [x] ~~**`cancel_url` renvoie sur un tunnel vide.**~~ **CORRIGÉ.**
      `src/app/api/stripe/annule/route.ts` fait expirer la session Stripe puis
      libère la réservation, dans cet ordre. Le créneau n'est plus retenu
      45 minutes contre le client qui vient de renoncer.
- [x] ~~**Le back-office propose « Confirmer » et « Annuler » pendant qu'un
      client paie.**~~ **CORRIGÉ.** `paiementVivantSur` garde les deux actions
      (`admin.ts`), la fiche affiche « paiement en cours » et gèle les
      commandes tant qu'un paiement court.
- [x] ~~**Le perdant d'une course est renvoyé vers une liste périmée.**~~
      **CORRIGÉ** — vérifié le 23 septembre 2026. `router.refresh()` est appelé
      avant le retour à l'étape « Créneau », dans les deux tunnels : la page
      étant en `force-dynamic`, le créneau repris revient barré et désactivé.
- [x] ~~**Le limiteur compte les saisies invalides.**~~ **CORRIGÉ.**
      `quotaDepasse` est désormais appelé APRÈS le bornage de la saisie, dans
      les trois tunnels : une adresse mal tapée ne consomme plus le quota de
      celui qui la corrige.
- [x] ~~**Fermer un créneau ou une journée est un « lire puis écrire » non
      atomique.**~~ **CORRIGÉ.** `basculerCreneau` ferme D'ABORD et regarde
      ensuite : dès la fermeture écrite, plus aucune réservation ne peut
      s'engager, et celle qui venait de s'engager est retrouvée par la lecture
      qui suit — on rouvre alors et on refuse.
- [x] ~~**Un remboursement fait à la main dans Stripe ne libère pas le créneau
      et ne prévient pas le client.**~~ **CORRIGÉ.** Le webhook traite
      `charge.refunded`.
- [x] ~~**Une contestation bancaire ne laisse aucune trace en base.**~~
      **CORRIGÉ.** Le webhook traite `charge.dispute.created` et
      `charge.dispute.closed`. Sept événements Stripe sont désormais couverts.
- [x] ~~**La page de retour annonce « paiement accepté » avant que Bancontact
      ne se dénoue.**~~ **CORRIGÉ le 23 septembre 2026 — mais le constat était
      surévalué, et c'est la vérification qui l'a montré.**

      Vrai : la page affirmait « votre paiement est accepté et votre créneau est
      réservé » sur la seule foi du paramètre `?paiement=ok`, que Stripe pose
      dès la fin du parcours bancaire — donc avant le dénouement, pour
      Bancontact.

      Faux : « un refus asynchrone n'est jamais démenti ». Il l'est. La
      réservation expire et `expirerReservationsAbandonnees` envoie
      `auClientReservationExpiree`, qui annonce qu'aucun paiement n'a été reçu
      et ouvre une porte si la banque a tout de même débité. Le client est donc
      prévenu — tardivement, pas jamais.

      Le correctif se réduit donc au TEXTE, et ne touche aucune logique :
      « Votre créneau est retenu. Vous recevez la confirmation par e-mail dès
      que votre banque a validé le paiement — c'est immédiat dans la plupart des
      cas. » Titre passé de « C'est réservé ! » à « Merci, c'est enregistré ! »,
      vrai dans les deux cas.
- [x] ~~**La clé d'idempotence Stripe ne protège rien.**~~ **LE COMMENTAIRE
      EST CORRIGÉ le 23 septembre 2026** ; la clé, elle, reste — avec la portée
      exacte qui est la sienne.

      Le constat était juste : la clé ne protège PAS du double clic, puisque
      chaque passage crée une réservation neuve donc une clé neuve. Ce qui
      protège du double clic est le bouton désactivé pendant l'envoi.

      Mais elle n'est pas inutile pour autant : elle protège du REJEU du même
      appel pour la MÊME réservation — relance réseau, rejeu de l'action
      serveur. Le commentaire dit désormais cela, et rien de plus. Un
      commentaire qui promet une garantie inexistante fait renoncer à la mettre
      en place : c'était là le vrai défaut.

- [ ] **Relancer l'audit sur les deux dimensions manquantes** — contraintes de
      base et back-office — et faire tourner la contradiction sur l'ensemble.

# Conformité — état au 9 septembre 2026

L'audit juridique du tunnel de paiement est purgé. Ce qui a été corrigé, et
qui est vérifiable page par page :

- [x] ~~**Les allergies étaient collectées sans base juridique.**~~
      **CORRIGÉ le 22 septembre 2026** (migrations 0030 et 0031).

      Une allergie alimentaire est une **donnée concernant la santé**. L'art. 9
      du RGPD en interdit le traitement par principe ; seul le consentement
      **explicite** lève l'interdiction (art. 9.2.a). Le champ était jusqu'ici
      un simple `textarea` du formulaire anniversaire, couvert par la case des
      CGV — c'est-à-dire par rien : « explicite » veut dire séparé.

      Ce qui a été mis en place, la voie A (assumer le champ et l'encadrer),
      choisie par Mathis :
      - une **case distincte**, qui ne sert qu'à ça, à cocher avant que le
        champ n'apparaisse — on demande l'autorisation avant la donnée ;
      - décocher **efface** ce qui a été saisi ;
      - le consentement est **horodaté** (`allergies_consenties_le`), parce que
        l'art. 7.1 demande de pouvoir le démontrer ;
      - une **contrainte de base** refuse une allergie sans son horodatage,
        pour qu'aucun futur chemin d'écriture ne puisse les dissocier ;
      - la purge automatique et l'effacement à la demande remettent les **deux**
        colonnes à `null` ensemble : une fois la donnée partie, la preuve datée
        qu'elle a existé n'a plus de finalité (art. 5.1.c).

      Le contenu de l'allergie ne part **pas** par e-mail : l'avis interne
      signale seulement qu'une allergie a été renseignée et renvoie au
      back-office. La politique de confidentialité décrit maintenant ce champ,
      sa base juridique et le retrait du consentement.
- [x] ~~**Le journal d'administration n'avait aucune durée de conservation.**~~
      **FIXÉE À 12 MOIS par Mathis le 22 septembre 2026** — migration
      `0032_purge_du_journal_admin.sql`, à appliquer.

      Toutes les autres tables avaient leur purge : réservations et devis à
      13 mois, audience à 13 mois, quotas à 1 jour, sessions d'administration
      à 30 jours. Le journal, lui, gardait sans limite l'adresse IP de
      l'exploitant, l'horodatage de chacun de ses gestes et la référence des
      réservations touchées. « Pour toujours » n'est pas une durée au sens de
      l'art. 5.1.e.

      **Douze mois, et pas treize** : le journal reste ainsi INFÉRIEUR aux
      13 mois des réservations, pour qu'il ne survive jamais aux données qu'il
      trace — sinon il deviendrait la dernière copie d'une information qu'on a
      promis d'effacer. **Suppression et non anonymisation** : une trace vidée
      de son acteur ne prouve plus rien, elle ne fait que du volume. Tâche
      `pg_cron` le dimanche à 4h15 UTC, décalée d'un quart d'heure de la purge
      des sessions pour que l'échec de l'une reste lisible.
- [x] ~~**La case newsletter récoltait un consentement sans finalité.**~~
      **RETIRÉE des deux tunnels le 22 septembre 2026.** Rien ne lisait la
      colonne : ni liste d'abonnés, ni composeur, ni envoi. Un consentement
      collecté pour un service inexistant contrevient à l'art. 5.1.b. Voir
      « Décisions à trancher » pour ce qu'il faudrait construire avant de la
      remettre. La politique de confidentialité dit désormais la vérité :
      aucun message publicitaire n'est envoyé.
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
migrations `0001` à `0028` appliquées et vérifiées. Les quatre dernières, du
21 septembre 2026 : âge par formule (0025), l'expiration qui ne libère plus un
créneau payé (0026), l'expiration qui retourne les lignes pour prévenir le
client (0027), et le vendredi ramené à un seul anniversaire avant l'ouverture
du foot (0028). **13 tables**, RLS activé et forcé sur chacune, sans aucune
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
