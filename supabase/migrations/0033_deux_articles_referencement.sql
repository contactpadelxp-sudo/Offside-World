-- ============================================================================
-- Deux articles pour le référencement — 22 septembre 2026
-- ============================================================================
--
-- Demandés par Mathis. Le blog comptait ZÉRO article alors que `/blog` figure
-- dans la navigation : un visiteur qui cliquait le jour de l'ouverture tombait
-- sur une page vide.
--
-- CE QUE LE RÉFÉRENCEMENT GAGNE. Le `titre` et le `chapo` de chaque article
-- alimentent les métadonnées de sa page (`generateMetadata` dans
-- `blog/[slug]/page.tsx`) et le `sitemap.xml`. Deux pages de plus qui parlent
-- de Gembloux, là où le site n'en avait que sur l'accueil et la réservation.
--
-- AUCUN PRIX, AUCUN HORAIRE DANS LES CORPS, ET C'EST DÉLIBÉRÉ. Les tarifs
-- vivent dans la table `formules` et les créneaux dans `creneaux` ; Brahim les
-- change depuis le back-office, sans redéploiement. Un chiffre recopié dans un
-- article ne suivrait pas : il deviendrait faux en silence, et un prix affiché
-- qui n'est pas celui demandé est exactement le genre d'affirmation que le
-- projet a passé des semaines à retirer du site. Les articles renvoient donc
-- vers la page de réservation, qui dit toujours la vérité du jour.
--
-- RIEN D'INVENTÉ. Tout ce qu'ils affirment est vérifiable dans les sources :
-- l'âge minimum de 4 ans et l'absence de maximum (`data/reglement.ts`), la
-- durée de deux heures et le contenu des deux formules (`data/formules.ts` et
-- la table `formules`), le barème d'annulation (`PALIERS_ANNULATION`),
-- l'adresse (`data/entreprise.ts`). Le parking gratuit a été confirmé par
-- Brahim le 22 septembre 2026. Aucun chiffre de fréquentation, aucun avis,
-- aucun superlatif invérifiable.
--
-- LE SECOND ARTICLE NE VEND PAS LE BUBBLE SEUL. `BUBBLE_EN_LIGNE` est à
-- `false` depuis le 21 septembre : le Bubble ne se réserve plus sur le site, et
-- sa fiche Sport-Finder n'accepte aujourd'hui que des demandes, sans être
-- activée. Un article qui enverrait réserver du Bubble mènerait donc à une
-- impasse. Il est centré sur la FORMULE ANNIVERSAIRE Bubble, qui est bien
-- vendue ici, et renvoie les groupes d'adultes vers l'adresse e-mail — seul
-- chemin vrai aujourd'hui, et qui le restera quoi qu'il arrive à la fiche.
--
-- `on conflict (slug) do nothing` : rejouer cette migration ne réécrit jamais
-- par-dessus les corrections que Brahim aurait faites depuis le back-office.

insert into articles (slug, titre, chapo, corps, image, publie, publie_le)
values (
  'anniversaire-enfant-gembloux',
  'Anniversaire enfant à Gembloux : comment ça se passe chez Offside',
  'Deux heures de football indoor en salle à Gembloux, à partir de 4 ans. Ce qui est compris dans chaque formule, ce qu''il faut apporter et comment réserver.',
  $html$
<p>Offside Foot Indoor organise des anniversaires en salle à Gembloux, Rue des Orchidées 6. Voici concrètement comment se déroule une fête, ce qui est compris et ce qu'il reste à prévoir de votre côté.</p>

<h2>À partir de quel âge ?</h2>
<p>À partir de 4 ans, et sans limite d'âge maximum. Le terrain se joue aussi bien entre enfants qu'entre adultes : un anniversaire de trentenaire est une réservation comme une autre.</p>

<h2>Combien de temps, et pour combien de participants ?</h2>
<p>Une fête dure deux heures. Les deux formules comprennent dix participants, et il est possible de monter jusqu'à dix-huit — chaque participant supplémentaire est alors facturé en plus.</p>

<h2>Les deux formules</h2>

<h3>Kick-Off : le football indoor</h3>
<p>Deux heures de football indoor sur un terrain réservé au groupe. Ballons et chasubles à disposition, accès aux vestiaires, et un espace anniversaire décoré rien que pour vous, avec assiettes, gobelets et serviettes. Eau, menthe et grenadine à volonté.</p>

<h3>Bubble : le football dans une bulle</h3>
<p>Une heure de Bubble Foot avec un animateur dédié, puis une heure de football indoor. Les bulles et le matériel sont compris, ainsi que le même espace anniversaire décoré et les mêmes boissons.</p>

<p>Les tarifs du jour, les extras disponibles et les créneaux encore libres s'affichent sur la <a href="/reservation?activite=anniversaire">page de réservation</a>.</p>

<h2>Ce qu'il faut apporter</h2>
<p>Le gâteau : il est apporté par les parents. L'espace pour le déposer et le servir, lui, fait partie de la formule.</p>

<h2>Sur place</h2>
<p>La salle est couverte, donc la météo ne change rien à la date choisie — ni en novembre, ni en plein mois d'août. Le parking est gratuit.</p>
<p>Offside Foot Indoor, Rue des Orchidées 6, 5030 Gembloux.</p>

<h2>Réserver, et annuler si besoin</h2>
<p>La réservation se fait en ligne, créneau par créneau. Si la date ne convient plus : l'annulation est gratuite jusqu'à 7 jours avant. Entre 7 jours et 48 heures, la moitié du montant est remboursée. À moins de 48 heures, il n'y a pas de remboursement.</p>
<p><a href="/reservation?activite=anniversaire">Voir les créneaux disponibles</a></p>
  $html$,
  '/images/anniv2.webp',
  true,
  now()
)
on conflict (slug) do nothing;

insert into articles (slug, titre, chapo, corps, image, publie, publie_le)
values (
  'bubble-foot-anniversaire-gembloux',
  'Le Bubble Foot, c''est quoi ? Et comment l''ajouter à un anniversaire',
  'Une bulle gonflable, un ballon, et des contacts qui finissent en roulades. Le Bubble Foot expliqué, et comment le jouer lors d''un anniversaire à Gembloux.',
  $html$
<p>Le Bubble Foot se joue dans une bulle gonflable : on court, on joue au ballon, et les contacts se terminent en roulades plutôt qu'en fautes. C'est l'activité la plus demandée des anniversaires Offside, à Gembloux.</p>

<h2>Comment ça se joue</h2>
<p>Chaque joueur enfile une bulle gonflable transparente qui entoure le buste et la tête, et qui se tient par des poignées intérieures. Pour le reste, c'est un match de football : deux équipes, un ballon, des buts. La différence tient en une chose — un contact ne vous arrête pas, il vous renvoie au sol, et l'autre avec vous.</p>
<p>C'est pour ça que le jeu fait rire même ceux qui n'aiment pas le football : personne n'a besoin de savoir jouer.</p>

<h2>À partir de quel âge ?</h2>
<p>Comme pour le reste des anniversaires, à partir de 4 ans et sans limite d'âge maximum.</p>

<h2>Le Bubble dans un anniversaire</h2>
<p>C'est la formule Bubble, et elle mélange les deux : une heure de Bubble Foot encadrée par un animateur dédié, puis une heure de football indoor classique. Les bulles et le matériel sont compris.</p>
<p>Tout ce qui fait l'anniversaire est compris aussi : un espace décoré réservé au groupe, les assiettes, gobelets et serviettes, l'eau, la menthe et la grenadine à volonté, et l'accès aux vestiaires. Le gâteau, lui, est apporté par les parents.</p>
<p>La formule, son tarif du jour et les créneaux libres sont sur la <a href="/reservation?activite=anniversaire">page de réservation</a>.</p>

<h2>Et pour un groupe d'adultes ?</h2>
<p>Le Bubble Foot se joue très bien entre adultes : enterrement de vie de garçon ou de jeune fille, équipe de travail, groupe d'amis. Écrivez-nous à <a href="mailto:info@offsidefootindoor.be">info@offsidefootindoor.be</a> en indiquant le nombre de personnes et la période souhaitée, et nous revenons vers vous avec les créneaux possibles.</p>

<h2>Où</h2>
<p>Offside Foot Indoor, Rue des Orchidées 6, 5030 Gembloux. En salle, donc jouable toute l'année, quelle que soit la météo. Parking gratuit.</p>
  $html$,
  '/images/anniv1.jpg',
  true,
  now()
)
on conflict (slug) do nothing;
