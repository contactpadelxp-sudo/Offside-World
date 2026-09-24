# Mise en ligne — `offsidefootindoor.be`

Deux opérations distinctes, à ne pas confondre :

- **faire pointer le domaine sur le nouveau site** (enregistrements A et CNAME) ;
- **autoriser l'envoi d'e-mails** depuis ce domaine (DKIM, DMARC).

Elles se font au même endroit mais ne touchent pas aux mêmes enregistrements.
On peut faire l'une sans l'autre.

> **État relevé le 12 septembre 2026**, après la mise en place de l'envoi
> d'e-mails. À revérifier avant d'agir.
>
> | | |
> |---|---|
> | Zone DNS | **Wix** — `ns10.wixdns.net`, `ns11.wixdns.net` |
> | Site actuel | **encore Wix** — A vers `185.230.63.107/171/186`, `www` vers `cdn1.wixdns.net` |
> | Messagerie | **Google Workspace** — les 5 MX `aspmx.l.google.com` et suivants, **intacts** |
> | SPF racine | un seul — `v=spf1 include:_spf.google.com ~all`, **inchangé** |
> | DKIM Resend | ✅ `resend._domainkey` — clé RSA vérifiée complète (216 caractères, base64 et ASN.1 valides) |
> | DKIM Google | **toujours absent** — demande la console d'admin Google, donc Brahim |
> | DMARC | ✅ `v=DMARC1; p=none; rua=mailto:info@offsidefootindoor.be; fo=1` |
> | Envoi Resend | ✅ CNAME `rsend` et `send` vers `forge.rmta.net`, domaine vérifié |

---

## ✅ Ce qui est fait — 12 septembre 2026

**L'envoi d'e-mails est en place sur le domaine nu**, donc l'expéditeur est
`reservations@offsidefootindoor.be` et non un sous-domaine.

Ce choix avait d'abord été écarté par prudence, à tort : Resend ne demande
**aucun TXT SPF sur le domaine racine**. Sa section « SPF » passe par deux
CNAME (`rsend`, `send`) vers `forge.rmta.net`, qui portent le chemin de retour.
L'enregistrement SPF de Google n'est donc jamais touché, et l'objection qui
justifiait le sous-domaine tombe. Vérifié après coup : il n'y a toujours qu'UN
seul SPF à la racine, et c'est celui de Google.

**Le piège de cette page, lui, reste entier** : le bouton « Enable Receiving »
de Resend ajoute des enregistrements **MX** sur le domaine — exactement là où
sont ceux de Google Workspace. Il doit rester désactivé. On n'a besoin que
d'envoyer.

**Ce qui a été contrôlé après coup**, et qu'il faut refaire à chaque
changement DNS :

1. les 4 enregistrements vus depuis trois résolveurs différents, dont les
   serveurs faisant autorité de Wix — un enregistrement visible chez Google
   mais pas chez l'autorité signale une saisie qui n'a pas été enregistrée ;
2. la **clé DKIM décodée**, pas seulement constatée présente. Une clé tronquée
   reste un TXT parfaitement valide : elle s'affiche, elle a l'air correcte, et
   elle échoue à chaque signature. On vérifie que le base64 se décode et que la
   structure ASN.1 est celle d'une clé RSA ;
3. les **5 MX de Google** et l'**unicité du SPF racine**. C'est le seul vrai
   danger de l'opération, et c'est la seule vérification qui protège la
   messagerie de Brahim.

Reste à faire côté e-mails : **le DKIM de Google Workspace**, qui ne concerne
pas le site mais le courrier que Brahim envoie à la main — aujourd'hui signé
par rien. Cinq minutes dans sa console d'administration.

---

## 🎯 LES VALEURS DU BASCULEMENT — relevées dans Vercel le 24 septembre 2026

Le domaine a été ajouté au projet dans la team de Brahim. Vercel affiche
« Invalid Configuration » pour les deux : **c'est normal et attendu** tant que
la zone de Wix pointe encore sur l'ancien site.

**CE QU'IL FAUT SAISIR CHEZ WIX** (Domaines → `offsidefootindoor.be` →
Gérer les enregistrements DNS) :

| Type | Nom | Valeur à mettre | Ce que ça remplace |
|---|---|---|---|
| `A` | `@` | **`216.150.1.1`** | les **3** A de Wix : `185.230.63.107`, `.171`, `.186` |
| `CNAME` | `www` | **`4d67d799f1307be8.vercel-dns-017.com`** | `cdn1.wixdns.net` |

⚠️ **Les trois A de Wix partent, un seul A arrive.** Ne pas en laisser un
derrière : le domaine répondrait alternativement sur l'ancien et le nouveau
site, au hasard du tirage.

⚠️ **Le point final** de la valeur CNAME telle que Vercel l'affiche
(`…-017.com.`) est la notation DNS absolue. Si Wix refuse la saisie, l'entrer
**sans** le point final.

⚠️ **ON NE TOUCHE À RIEN D'AUTRE.** Les 5 MX, le SPF, le DKIM Resend, le DMARC
et les deux CNAME `rsend`/`send` restent exactement en place — ce sont eux qui
portent la messagerie de Brahim et les e-mails de réservation.

**LE RETOUR EN ARRIÈRE**, si quoi que ce soit tourne mal : remettre les trois
`A` sur `185.230.63.107`, `185.230.63.171`, `185.230.63.186` et le `CNAME www`
sur `cdn1.wixdns.net`. Cinq minutes, et le site Wix revient.

**LA CONFIGURATION CHOISIE**, et pourquoi :

- l'adresse **sans `www` est la principale**, connectée à Production. C'est
  celle de l'e-mail de Brahim, celle écrite partout dans le projet, et celle
  qui ira dans `SITE_URL` et dans l'URL du webhook Stripe — les trois
  concordent ;
- `www` **redirige en 308** vers elle. Permanent et non temporaire (307) :
  un 307 laisserait les deux adresses vivre dans l'index des moteurs, et le
  référencement se diviserait entre elles.

---

## 🔴 Le domaine part chez Vercel — relevé complet de la zone, 23 septembre 2026

**Brahim a lancé le transfert du nom de domaine de Wix vers Vercel**, le
23 septembre au soir : « j'ai pas envie de gérer Wix en plus juste pour le nom
de domaine ». La décision lui appartient, et elle se défend — un fournisseur
de moins. Mais elle déplace **aussi la zone DNS**, donc la messagerie.

**Vérifié dans la minute, rien n'est cassé :** les serveurs de noms répondent
toujours `ns10.wixdns.net` / `ns11.wixdns.net`, et les cinq MX de Google sont
intacts. Un transfert de registrar demande un code d'autorisation obtenu chez
Wix et prend plusieurs jours : il ne se produit rien ce soir.

**LE JOUR OÙ IL ABOUTIT, LES SERVEURS DE NOMS PASSENT À VERCEL.** Tout ce qui
n'aura pas été recréé côté Vercel d'ici là cesse d'exister — à commencer par
les huit enregistrements de la messagerie. D'où ce relevé, pris sur la zone
vivante, qui est la seule copie de référence.

### La zone au complet, telle qu'elle répond le 23 septembre 2026

| Type | Nom | Valeur | Rôle |
|---|---|---|---|
| `A` | `@` | `185.230.63.107` | site Wix |
| `A` | `@` | `185.230.63.171` | site Wix |
| `A` | `@` | `185.230.63.186` | site Wix |
| `CNAME` | `www` | `cdn1.wixdns.net` | site Wix |
| `MX` 10 | `@` | `aspmx.l.google.com` | **messagerie** |
| `MX` 20 | `@` | `alt1.aspmx.l.google.com` | **messagerie** |
| `MX` 30 | `@` | `alt2.aspmx.l.google.com` | **messagerie** |
| `MX` 40 | `@` | `alt3.aspmx.l.google.com` | **messagerie** |
| `MX` 50 | `@` | `alt4.aspmx.l.google.com` | **messagerie** |
| `TXT` | `@` | `v=spf1 include:_spf.google.com ~all` | **messagerie** |
| `TXT` | `@` | `google-site-verification=j-GN41iJzYxntYR4pCo_yQifikI8Iyy8ipVzyhrCR30` | propriété Google |
| `TXT` | `_dmarc` | `v=DMARC1; p=none; rua=mailto:info@offsidefootindoor.be; fo=1` | **messagerie** |
| `TXT` | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDb57lOY0KyCMN+FaE4KQ790uN0wi8ybjCNAB+Qmh7/JO8vMz4gWpV/qjvtJRs0286l4kVKIMT86Vc+DzZgAscRtlpbpv4+bcPqtieUznrEbM6tFgY15xX0q0beozWhEAW4j7gp1q/5w2azKOJ8Sg8ed02jSOtuKBUAoy8MPgK+zwIDAQAB` | **DKIM Resend** |
| `CNAME` | `rsend` | `rsend-euw1.forge.rmta.net` | **envoi Resend** |
| `CNAME` | `send` | `send.forge.rmta.net` | **envoi Resend** |

**Quatre lignes servent le site. Onze servent le courrier.** C'est tout le
sujet : le transfert est motivé par le site, et ce qu'il met en danger est le
courrier.

> Le `www` n'a **pas** d'enregistrement `A` propre : `34.149.87.45` est
> simplement ce que résout `cdn1.wixdns.net`. Ne pas le recopier tel quel.
>
> Le DKIM Resend est à **recopier caractère pour caractère**. Une clé tronquée
> reste un TXT valide : elle s'affiche, elle a l'air correcte, et elle échoue à
> chaque signature. C'est le piège déjà décrit plus haut.

### La marche à suivre, dans cet ordre

1. **Ne pas attendre.** Dès que le domaine apparaît dans Vercel, créer les
   **15 enregistrements ci-dessus** dans sa zone DNS — y compris, et surtout,
   les cinq MX. `vercel dns import <domaine> <fichier de zone>` accepte un
   fichier de zone si l'on préfère éviter la saisie à la main.
2. **Ne remplacer les quatre lignes du site qu'au moment du basculement** —
   l'IP d'apex et la cible `www` données par Vercel pour le projet. Avant ça,
   on recopie **les valeurs de Wix**, pour que la zone Vercel soit une copie
   fidèle et non un mélange.
3. **Vérifier avant que les serveurs de noms ne changent**, en interrogeant
   directement les serveurs de Vercel :
   `dig MX offsidefootindoor.be @ns1.vercel-dns.com`
   Les cinq MX doivent répondre. **Tant qu'ils ne répondent pas depuis Vercel,
   le transfert ne doit pas aboutir.**
4. Une fois les serveurs de noms passés, refaire les trois contrôles de la
   section précédente : les enregistrements vus depuis trois résolveurs, la
   clé DKIM **décodée** et non seulement constatée présente, les cinq MX et
   l'unicité du SPF racine.

> **Le relevé ci-dessus a été pris avec `node:dns` depuis l'environnement de
> développement.** `dig` n'y est pas installé et `dns.google` est bloqué par le
> proxy réseau ; la commande qui a servi est conservée dans l'historique de la
> séance du 23 septembre. Pour la rejouer :
> `node -e "require('dns').promises.resolveMx('offsidefootindoor.be').then(console.log)"`

---

## ⚠ Le piège : ne pas déplacer les serveurs de noms

Vercel proposera de **transférer les serveurs de noms** vers lui. C'est la voie
la plus simple *pour le site*, et la plus dangereuse ici.

Les serveurs de noms de Wix hébergent aussi les enregistrements **MX** de Google
Workspace. Les déplacer sans les recréer d'abord chez Vercel **coupe la
messagerie de Brahim** : plus aucun e-mail reçu sur `@offsidefootindoor.be`,
sans message d'erreur visible, jusqu'à ce que quelqu'un s'en aperçoive.

**Recommandation : garder la zone chez Wix** et n'y modifier que les
enregistrements A et CNAME. La messagerie n'est alors jamais touchée.

Si le transfert vers Vercel est malgré tout souhaité, recréer **d'abord** chez
Vercel, et vérifier, les cinq MX de Google, l'enregistrement SPF et le TXT de
vérification Google — puis seulement changer les serveurs de noms.

---

## ⚠ Préalable bloquant : fermer la porte de Sport-Finder

**À faire AVANT le basculement du domaine, ou au même moment. Jamais après.**

Tant que `offsidefootindoor.be` pointe sur Wix, personne n'atteint le tunnel de
réservation : aucun anniversaire ne peut être vendu, et ce qui suit n'a aucun
effet. Le jour du basculement, les créneaux deviennent achetables par de vrais
clients — il y en a six mois d'avance en base — et le problème s'ouvre dans la
même minute.

**Le complexe n'a que DEUX espaces physiques**, les Fun zones 1 et 2. Les mêmes
servent aux anniversaires, au Bubble Foot et à la location de terrain. Le site
vend les premiers, Sport-Finder les deux autres, et **les deux systèmes ne se
voient pas**. Aucune intégration n'existe ni n'est prévue : le seul garde-fou
est que leurs plages horaires ne se touchent jamais.

**État relevé le 21 septembre 2026** — Sport-Finder ouvre le centre
18h00–00h00 du lundi au vendredi et 16h00–00h00 le week-end. Croisé avec les
créneaux d'anniversaire, cela donne trois chevauchements :

| Jour | Anniversaires (site) | Sport-Finder ouvre | Chevauchement |
|---|---|---|---|
| Vendredi | 16h30 → 18h30 | 18h00 | **30 min** |
| Samedi | 10h00 → 19h30 | 16h00 | **3 h 30** |
| Dimanche | 10h00 → 19h30 | 16h00 | **3 h 30** |

Un terrain loué samedi à 17h et un anniversaire vendu sur le site à la même
heure, c'est le même sol. Les deux clients sont dans leur droit, aucun des deux
systèmes ne signale quoi que ce soit, et personne ne l'apprend avant que les
deux groupes se présentent à la porte.

**CE N'EST PAS UNE HYPOTHÈSE — LE CONFLIT EXISTE DÉJÀ.** Relevé sur la page
publique de Sport-Finder le 21 septembre 2026 : le **samedi 3 octobre**, les
créneaux de 16h00 et 16h30 affichent « **1 libre** » quand tous les suivants
affichent « 2 libres ». Sur deux terrains, un seul reste disponible : une
location court donc de 16h à 17h ce jour-là.

Or le site vend ce même samedi un anniversaire de **15h00 à 17h00, sur les deux
Fun zones**. Ce sont les deux mêmes terrains. Le jour du basculement, vendre ce
créneau sur les deux zones revient à vendre celui qui est déjà loué.

Vérifié au passage, et c'est ce qui rend le correctif possible : **les heures
d'ouverture pilotent bien les disponibilités**. Le premier créneau proposé
tombe exactement à l'heure d'ouverture. Si le blocage s'était fait ailleurs,
régler cet écran n'aurait rien changé.

**Ce qu'il faut régler** — Sport-Finder → Horaires → Horaire d'ouverture →
*Détailler par jour* :

| Jour | Ouverture |
|---|---|
| Lundi, mardi, jeudi | 14h00 → 01h00 |
| Mercredi, vendredi, samedi, dimanche | 20h00 → 01h00 |

Ce sont les horaires de Brahim lui-même, donnés par mail le 21 septembre 2026
— il n'y a rien à arbitrer. Ses deux groupes tombent exactement sur la
séparation : 14h–01h les jours **sans** anniversaire, 20h–01h les jours
**avec**. Le vendredi appartient au second groupe depuis qu'il a répondu ce
jour-là, et c'est ce qui a fait passer son créneau d'anniversaire de deux à un
(migration 0028).

Le dernier anniversaire finit à 19h30 le week-end, 18h00 le mercredi et 18h30
le vendredi : l'ouverture à 20h00 laisse au minimum trente minutes pour vider
la salle, soit le même battement que celui qui sépare déjà deux groupes.

Si le champ de fin refuse `01:00` parce qu'il franchit minuit, mettre `00:00`
et le signaler à Brahim : c'est le seul point où sa demande pourrait ne pas
entrer dans l'outil.

**Reste hors de portée du code.** Rien côté site ne connaît les horaires de
Sport-Finder, donc rien ne peut vérifier que ce réglage a bien été fait. Ce
paragraphe est le seul garde-fou ; il vaut ce que vaut la personne qui le lit.

### Au passage : le lien du Bubble Foot

La fiche Sport-Finder du Bubble est `.../activity/228`. Elle accepte
aujourd'hui des **demandes**, pas des paiements : Brahim ouvrira la réservation
directe au même moment que la mise en ligne.

Le site pointe pour l'instant sur la page du centre, qui reste juste dans les
deux cas et coûte un clic de plus. **Le jour où la fiche accepte les
paiements**, remplacer dans `src/data/bubble-team.ts` :

```ts
export const SPORTFINDER_BUBBLE_URL = SPORTFINDER_BUBBLE_FICHE;
```

L'adresse exacte est déjà écrite dans ce fichier, sous ce nom, précisément pour
qu'il n'y ait qu'une ligne à changer. **Ouvrir la fiche avant de la brancher** :
un lien vers une page qui n'accepte rien est pire que le détour par le centre.

---

## 1. Faire pointer le domaine sur le site

Dans Vercel : projet → Settings → Domains → ajouter `offsidefootindoor.be` et
`www.offsidefootindoor.be`. Vercel affiche alors les valeurs exactes à
utiliser — les recopier, ne pas se fier à des valeurs trouvées ailleurs, elles
changent.

Dans Wix (Gérer le domaine → Enregistrements DNS) :

- remplacer les enregistrements **A** de l'apex par celui donné par Vercel ;
- remplacer le **CNAME** de `www` par celui donné par Vercel ;
- **ne toucher à rien d'autre** : ni MX, ni TXT, ni les autres sous-domaines.

La propagation prend de quelques minutes à quelques heures. Vercel émet le
certificat HTTPS tout seul une fois les enregistrements vus.

Puis, dans Vercel → Settings → Environment Variables, renseigner
`SITE_URL = https://offsidefootindoor.be` et redéployer : les métadonnées, le
sitemap, `robots.txt` et les liens des e-mails suivent automatiquement.

**Le site Wix restera en ligne** tant que son abonnement court, simplement plus
personne n'y arrivera par le domaine. Ne pas le résilier avant d'avoir vérifié
que le nouveau site répond.

---

## 2. Autoriser l'envoi d'e-mails

Rien ne part tant que ces étapes ne sont pas faites. Le site fonctionne, mais
ni le client ni Brahim ne sont prévenus de quoi que ce soit.

### a. Activer DKIM sur Google Workspace — 5 minutes, à faire dans tous les cas

Console d'administration Google → Applications → Google Workspace → Gmail →
**Authentifier les e-mails**. Générer la clé, copier l'enregistrement TXT
proposé, l'ajouter dans Wix, puis revenir cliquer sur « Démarrer
l'authentification ».

Cela ne concerne pas le site : c'est le courrier que Brahim envoie déjà à la
main, aujourd'hui signé par rien du tout.

### b. Ajouter le domaine chez Resend — ✅ fait le 12 septembre 2026

[resend.com](https://resend.com) → Domains → Add Domain.

**Essayer d'abord le domaine nu**, `offsidefootindoor.be` : l'adresse
d'expédition sera alors `reservations@offsidefootindoor.be`, courte et
rassurante pour un client. Puis regarder ce que Resend demande :

- **Que des enregistrements à AJOUTER** (un DKIM, et le plus souvent un MX et
  un TXT sur un sous-domaine technique) → parfait, on garde le domaine nu.
  Rien d'existant n'est touché, la messagerie de Brahim ne risque rien.
- **Une MODIFICATION de la ligne SPF existante**
  (`v=spf1 include:_spf.google.com ~all`, qui n'autorise aujourd'hui que
  Google) → là il faut être prudent : une erreur sur cette ligne casse le
  courrier sortant de Brahim. Deux options alors : fusionner soigneusement les
  deux autorisations sur une seule ligne, ou basculer sur un sous-domaine
  d'envoi (`send.offsidefootindoor.be`), dont les enregistrements sont tous
  nouveaux et ne peuvent rien casser — au prix d'une adresse d'expédition plus
  longue.

Un sous-domaine a un second avantage : la réputation des envois automatiques
reste séparée de celle de la boîte de Brahim. Pour une vingtaine d'e-mails par
semaine, ce n'est pas déterminant ; l'apparence de l'adresse, si.

Recopier les enregistrements dans Wix, puis cliquer sur « Verify ».

### c. Publier DMARC

Dans Wix, un enregistrement **TXT**, nom `_dmarc` :

```
v=DMARC1; p=none; rua=mailto:info@offsidefootindoor.be; fo=1
```

`p=none` **ne bloque rien** : il demande seulement aux serveurs destinataires
d'envoyer des rapports. C'est volontaire — on observe deux ou trois semaines,
on vérifie que tout le courrier légitime passe, puis on durcit :

1. `p=none` — observation
2. `p=quarantine; pct=25` — mise en indésirable progressive
3. `p=reject` — rejet

Commencer directement par `p=reject` ferait disparaître, sans trace visible,
tout courrier légitime qu'on aurait oublié d'autoriser.

### d. Renseigner les variables dans Vercel

| Variable | Valeur | Type |
|----------|--------|------|
| `RESEND_API_KEY` | la clé donnée par Resend | **Sensitive** |
| `EMAIL_EXPEDITEUR` | `Offside Foot Indoor <reservations@offsidefootindoor.be>` — ou l'adresse du sous-domaine si c'est lui qui a été vérifié | Config |
| `EMAIL_COMPLEXE` | l'adresse où Brahim veut recevoir les avis | Config |

Redéployer. **L'adresse d'expédition doit être sur le domaine vérifié chez
Resend**, sinon les envois sont refusés.

### e. Vérifier depuis le back-office

`/admin/reglages` affiche l'état réel de la configuration et permet
d'**envoyer un e-mail de test** sans créer de réservation. Le message emprunte
exactement le même chemin qu'un vrai — même expéditeur, même gabarit, même
fournisseur — et l'erreur du fournisseur est affichée telle quelle en cas de
refus. C'est l'endroit où revenir après chaque changement DNS.

Tant que rien n'est configuré, un bandeau le rappelle sur toutes les pages du
back-office. Il disparaît de lui-même une fois les variables renseignées.

**Avant qu'un domaine soit vérifié chez Resend**, on peut déjà tout tester :
mettre `EMAIL_EXPEDITEUR` à `Offside <onboarding@resend.dev>` et envoyer le
test vers l'adresse du titulaire du compte Resend — la seule autorisée dans ce
mode.

⚠ **Dans cet état, les clients ne reçoivent rien.** Brahim reçoit bien ses avis
de nouvelle réservation, parce qu'ils partent vers l'adresse du titulaire du
compte ; les confirmations envoyées aux clients, elles, sont refusées par le
fournisseur — et l'échec est avalé, par conception, pour qu'un problème d'e-mail
ne fasse jamais échouer une réservation. `/admin/reglages` affiche cet état en
rouge tant qu'il dure.

Le test qui prouve vraiment que les clients peuvent recevoir est donc celui
qu'on envoie, une fois le domaine vérifié, vers une adresse qui **n'est pas**
celle du compte Resend.

---

## 3. Vérifier

- Faire une réservation d'anniversaire sur le site, avec une vraie adresse.
- Le client reçoit « Nous avons bien reçu votre demande », **pas dans les
  indésirables**.
- Brahim reçoit « Nouvelle réservation à confirmer ».
- Ouvrir `/admin` : la réservation est dans « À confirmer ».
- La confirmer : le client reçoit « Votre réservation est confirmée ».
- Ouvrir l'onglet Journal : l'action y figure.

Si un e-mail arrive en indésirable, ouvrir son en-tête complet et chercher
`spf=`, `dkim=` et `dmarc=` : les trois doivent afficher `pass`.

---

## 4. Brancher le paiement en ligne

**Le code est écrit et testé ; il ne manque que les deux clés.** Tant que
`STRIPE_SECRET_KEY` est absente, le site se comporte comme aujourd'hui : la
réservation part « à confirmer » et Brahim la valide à la main. Dès que la clé
existe, le tunnel bascule tout seul — le bouton final devient « Payer 290 € »,
et c'est le paiement qui confirme.

### a. Le compte doit être celui de Brahim

C'est le titulaire du compte Stripe qui est **le vendeur au sens légal** : c'est
lui qui déclare la TVA et qui reçoit les virements. Le compte doit donc être au
nom de l'exploitant, jamais à celui du développeur.

Brahim invite ensuite Mathis dans **Settings → Team and security**, avec le
rôle **Developer** : aucun mot de passe n'est échangé, et ce rôle ne permet ni
de changer le compte bancaire ni de déclencher un virement.

**Activer Bancontact** dans Settings → Payment methods. C'est le moyen de
paiement dominant en Belgique, et le tunnel le propose en premier.

### b. Les deux variables dans Vercel

⚠ **Les deux, ou rien.** `STRIPE_SECRET_KEY` seule suffit à faire apparaître le
bouton « Payer » et à encaisser — mais sans `STRIPE_WEBHOOK_SECRET`, le site
REFUSE de traiter la notification de Stripe, et la réservation n'est jamais
confirmée. Argent pris, créneau non réservé, client sans e-mail. Renseigner les
deux avant le premier essai.

| Variable | Où la trouver | Type |
|----------|---------------|------|
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys → *Secret key* (`sk_test_…` en test, `sk_live_…` en production) | **Sensitive** |
| `STRIPE_WEBHOOK_SECRET` | donnée à la création du webhook, voir ci-dessous (`whsec_…`) | **Sensitive** |

La clé **publiable** (`pk_…`) n'est pas utilisée : le client est redirigé vers
la page de paiement hébergée par Stripe, aucun formulaire de carte ne vit sur
le site. C'est aussi ce qui fait qu'aucune donnée de carte ne transite ici.

### c. Créer le webhook

Stripe → Developers → Webhooks → **Add endpoint**.

- **URL** : `<adresse actuelle du site>/api/stripe/webhook`

  ⚠ **L'ADRESSE DU JOUR, PAS LE DOMAINE FINAL.** Tant que le domaine n'est pas
  basculé — et il l'est en tout dernier, par décision de Mathis —, le site est
  servi par son adresse Vercel. Un webhook pointé sur `offsidefootindoor.be`
  n'arriverait nulle part : Stripe encaisserait, et aucune réservation ne serait
  jamais confirmée. C'est la panne la plus coûteuse possible, et la plus
  silencieuse.

  **Le jour du basculement du domaine, il faudra revenir ici** changer l'URL du
  webhook, en même temps que `SITE_URL`. Les deux vont ensemble : `SITE_URL`
  décide où le client est renvoyé après avoir payé.

  ✅ **On MODIFIE l'endpoint existant, on n'en crée pas un second.** « Update
  details » change l'URL en gardant le même secret de signature : il n'y a donc
  rien à retoucher dans Vercel. Supprimer puis recréer l'endpoint produirait au
  contraire un `whsec_` neuf, et le site refuserait toutes les notifications
  jusqu'à ce que quelqu'un s'en aperçoive — c'est-à-dire, ici encore, au
  premier client débité sans réservation.

- **Événements à écouter** — **les SEPT**, pas moins :

  > Ce tableau a d'abord annoncé quatre événements pour six lignes, puis six
  > pour sept : `charge.dispute.closed` a été ajouté au code avec le
  > traitement des litiges sans être reporté ici. Le compte est vérifié dans
  > les sources le 23 septembre 2026 — `src/app/api/stripe/webhook/route.ts`
  > traite bien SEPT `case`. Qui s'arrête en chemin perd toujours les
  > derniers, c'est-à-dire l'argent rendu ou repris qui ne revient jamais dans
  > la base.

  | Événement | Pourquoi il est indispensable |
  |---|---|
  | `checkout.session.completed` | le paiement a réussi : c'est lui qui confirme la réservation |
  | `checkout.session.expired` | le client n'a pas payé dans les 30 minutes |
  | `checkout.session.async_payment_succeeded` | **Bancontact se dénoue dans l'application bancaire**, souvent après la fermeture de la page. Sans cet événement, l'argent part sans que la réservation soit confirmée — sur le moyen de paiement le plus utilisé en Belgique |
  | `checkout.session.async_payment_failed` | le paiement différé a été refusé |
  | `charge.refunded` | **un remboursement fait à la main dans Stripe.** Sans lui, le montant déjà rendu n'est jamais rapatrié : le solde restant à rembourser reste surévalué, et le chiffre d'affaires du back-office trop haut. Le cas se produit forcément — le site envoie lui-même l'exploitant rembourser dans Stripe quand l'appel automatique échoue |
  | `charge.dispute.created` | **une contestation bancaire.** Stripe retire aussitôt la somme du solde, ajoute des frais, et laisse quelques jours pour fournir des preuves ; passé ce délai, la contestation est perdue par défaut. C'est le seul événement du système qui ait une date limite, et sans lui personne n'est prévenu |
  | `charge.dispute.closed` | **le verdict de cette contestation.** S'il est « perdu », l'argent est définitivement repris : `synchroniserRemboursement` le rapatrie en base, sans quoi le chiffre d'affaires du back-office compterait indéfiniment une somme qui n'est plus là. Ajouté avec le traitement des litiges, et oublié dans ce tableau jusqu'au 23 septembre 2026 |

> **L'endpoint et le code ne parlent pas la même version d'API, et c'est sans
> conséquence — vérifié le 23 septembre 2026.** L'endpoint créé sur le compte
> de Brahim est en `2023-10-16` (la version par défaut du compte), le code
> pointe `2026-08-26.dahlia` (`lib/paiement/stripe.ts`). Stripe livre les
> événements dans la version de L'ENDPOINT.
>
> Tous les champs lus dans les payloads sont stables depuis des années :
> `payment_status`, `payment_intent`, `id`, `amount_total`, les métadonnées,
> et côté litiges `payment_intent`, `amount`, `status`. Le moyen de paiement
> réellement utilisé, lui, n'est PAS lu dans l'événement — `moyenDePaiementUtilise`
> rappelle l'API, donc dans la version du code.
>
> ⚠️ **Ne pas « aligner » la version de l'endpoint par souci de propreté.** Rien
> ne l'exige, et changer la version de livraison d'un webhook qui fonctionne
> est un moyen connu de casser le parsing d'un champ. En revanche, si un jour
> on lit un champ RÉCENT dans un payload, c'est ici qu'il faudra revenir.

Copier le **Signing secret** affiché après création : c'est
`STRIPE_WEBHOOK_SECRET`. Sans lui, le site **refuse** de traiter les
notifications — l'adresse est publique, et la signature est la seule chose qui
distingue Stripe d'un inconnu qui enverrait un faux « paiement réussi ».

> **Ce refus répond 500, et c'est volontaire.** Il a répondu 200 jusqu'au
> 22 septembre 2026, ce qui était le contraire d'un refus : un 200 dit à Stripe
> « livré, ne renvoie rien ». Une clé posée sans son secret de signature aurait
> donc produit, sur chaque paiement, un client débité et une réservation jamais
> confirmée — sans une trace nulle part, et avec un tableau de bord Stripe tout
> vert. Avec un 500, Stripe relivre pendant trois jours : poser la variable
> manquante rattrape rétroactivement tous les paiements de l'intervalle.
>
> Conséquence pratique : si tu testes le webhook avant d'avoir posé les deux
> variables, l'endpoint passera en rouge chez Stripe et l'événement sera
> réessayé. C'est le comportement voulu, pas une panne.

### d. Ce qui change dans le fonctionnement

- **La réservation n'est plus confirmée par Brahim, mais par le paiement.** Il
  garde l'annulation, et le remboursement lui est proposé au moment où il
  annule.
- **Le créneau n'est plus tenu 48 heures mais 45 minutes.** Tant que le
  paiement n'existait pas, une réservation était une demande et Brahim avait
  besoin de temps pour répondre ; avec le paiement, c'est une fenêtre de
  paiement. Le site fait ce changement tout seul en voyant la clé Stripe — il
  n'y a rien à régler.
- **La réservation est confirmée par le webhook, jamais par la page de retour.**
  Un client qui paie puis ferme l'onglet, perd le réseau ou tombe en panne de
  batterie n'atteindra jamais la page de retour ; il a pourtant payé.

### e. Tester AVANT de passer en production

Les clés `sk_test_…` permettent de tout essayer sans qu'un centime bouge.

1. Mettre la clé de test dans Vercel, créer un webhook de test vers la même URL.
2. Réserver un anniversaire sur le site jusqu'au paiement.
3. Payer avec la carte de test **4242 4242 4242 4242**, n'importe quelle date
   future, n'importe quel CVC.
4. Vérifier, dans l'ordre :
   - le client reçoit « Votre réservation est confirmée » ;
   - Brahim reçoit son avis de nouvelle réservation ;
   - `/admin` montre la réservation en **Confirmée**, pas en « À confirmer » ;
   - la fiche affiche le montant payé.
5. Annuler la réservation depuis le back-office en choisissant
   **« Remboursement intégral »**, puis vérifier dans Stripe → Payments que le
   remboursement y figure.

**Le test qui compte vraiment est celui de Bancontact**, pas celui de la carte :
c'est lui qui emprunte le chemin asynchrone. Stripe fournit un Bancontact de
test qui permet de simuler la réussite comme l'échec.

### f. Passer en production

Remplacer les deux variables par les valeurs `live`, recréer le webhook sur le
compte de production — **le secret de signature est différent** —, redéployer,
et faire une vraie réservation à petit montant qu'on rembourse ensuite.
