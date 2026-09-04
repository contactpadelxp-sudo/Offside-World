# Mise en ligne — `offsidefootindoor.be`

Deux opérations distinctes, à ne pas confondre :

- **faire pointer le domaine sur le nouveau site** (enregistrements A et CNAME) ;
- **autoriser l'envoi d'e-mails** depuis ce domaine (DKIM, DMARC).

Elles se font au même endroit mais ne touchent pas aux mêmes enregistrements.
On peut faire l'une sans l'autre.

> **État relevé le 4 septembre 2026.** À revérifier avant d'agir : ces valeurs
> auront peut-être changé.
>
> | | |
> |---|---|
> | Zone DNS | **Wix** — `ns10.wixdns.net`, `ns11.wixdns.net` |
> | Site actuel | Wix — A vers `185.230.63.107/171/186`, `www` vers `cdn1.wixdns.net` |
> | Messagerie | **Google Workspace** — MX `aspmx.l.google.com` et suivants |
> | SPF | présent — `v=spf1 include:_spf.google.com ~all` |
> | DKIM | **absent**, y compris pour Google |
> | DMARC | **absent** |

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

### b. Ajouter le domaine chez Resend

[resend.com](https://resend.com) → Domains → Add Domain. Resend recommande un
**sous-domaine** d'envoi, par exemple `send.offsidefootindoor.be` : les envois
automatiques ont alors leur propre réputation, séparée de celle de la boîte de
Brahim. Un incident sur l'un n'affecte pas l'autre.

Resend affiche 2 à 3 enregistrements (un DKIM, un SPF sur le sous-domaine, et
parfois un MX pour les retours). Les recopier dans Wix, puis cliquer sur
« Verify ».

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
| `EMAIL_EXPEDITEUR` | `Offside Foot Indoor <reservations@send.offsidefootindoor.be>` | Config |
| `EMAIL_COMPLEXE` | l'adresse où Brahim veut recevoir les avis | Config |

Redéployer. **L'adresse d'expédition doit être sur le domaine vérifié chez
Resend**, sinon les envois sont refusés.

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
