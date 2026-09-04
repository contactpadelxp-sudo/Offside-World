# Offside Foot Indoor

Site du complexe de foot indoor **Offside Foot Indoor** — Rue des Orchidées 6,
5030 Gembloux. Anniversaires, Bubble Foot, team building et location de terrain.

## Stack

- **Next.js 16** (App Router, Turbopack) + TypeScript
- **Tailwind CSS v4** + **shadcn/ui** (12 composants dans `src/components/ui/` ;
  le CSS de base est figé dans `src/app/shadcn-base.css`, copie conforme de
  `shadcn@4.13.0/dist/tailwind.css`, sha256 `bc7d8342…82a` — le paquet `shadcn`
  n'est plus une dépendance du projet)
- **Supabase** (PostgreSQL) pour les tarifs, les créneaux et les réservations
- Conformité RGPD (bandeau cookies, cases CGV, pages légales, anonymisation)

## Lancer le projet

```bash
npm install
npm run dev
```

Le site est accessible sur [http://localhost:3000](http://localhost:3000).

Sans variables d'environnement, le site tourne en mode dégradé : la page
d'accueil affiche les tarifs de repli et la réservation annonce qu'elle est
indisponible.

## Variables d'environnement

| Variable | Rôle |
|----------|------|
| `SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé de service — **jamais préfixée `NEXT_PUBLIC_`** |
| `ADMIN_USER` | Identifiant du back-office |
| `ADMIN_PASSWORD` | Mot de passe du back-office |
| `RESEND_API_KEY` | Clé d'API du fournisseur d'e-mails |
| `EMAIL_EXPEDITEUR` | `Offside Foot Indoor <reservations@offsidefootindoor.be>` |
| `EMAIL_COMPLEXE` | Boîte qui reçoit les avis internes (défaut : contact du site) |

Sans `ADMIN_USER` ni `ADMIN_PASSWORD`, `/admin` répond 404 : le back-office est
fermé par défaut plutôt qu'ouvert par défaut.

Trois variables facultatives :

- `ADMIN_SESSION_SECRET` — sans elle, la clé de signature des sessions est
  dérivée de `ADMIN_PASSWORD`. Conséquence voulue : changer le mot de passe met
  fin à toutes les sessions en cours.
- `SITE_URL` — adresse publique du site, utilisée par les métadonnées, le
  sitemap, robots.txt et les liens dans les e-mails. Sans elle, l'adresse
  Vercel actuelle sert de repli.
- `EMAIL_API_URL` — autre point d'envoi pour les e-mails (relais interne, bac à
  sable de vérification). Sans elle, l'API de Resend.

Sans `RESEND_API_KEY` ni `EMAIL_EXPEDITEUR`, aucun e-mail n'est envoyé : l'envoi
est simplement ignoré avec un avertissement dans les journaux. Rien d'autre ne
change — une réservation reste enregistrée.

## Les e-mails

Transactionnels uniquement : informer quelqu'un d'une opération qu'il vient de
déclencher. Aucune newsletter — le consentement marketing est recueilli et
horodaté en base, mais rien ne s'en sert, et rien ne doit s'en servir avant
qu'un mécanisme de désinscription existe.

| Événement | Client | Complexe |
|-----------|--------|----------|
| Réservation enregistrée | ✓ | ✓ |
| Demande de devis | ✓ | ✓ |
| Réservation confirmée | ✓ | |
| Réservation annulée | ✓ | |

Trois règles tenues par `src/lib/email/` :

- **Un envoi raté ne fait jamais échouer une réservation.** Les erreurs sont
  avalées et journalisées ; la réservation est déjà en base, c'est elle qui fait
  foi.
- **Le client n'attend pas le fournisseur.** L'envoi passe par `after()`, donc
  après la réponse.
- **Le contenu des allergies ne part pas par e-mail.** L'avis interne signale
  qu'une allergie a été renseignée et renvoie au back-office, sans en recopier
  le détail : c'est une donnée de santé concernant un enfant, et la dupliquer
  dans une boîte aux lettres n'apporte rien.

## Le back-office

Une application à part, servie sous `/admin`. Elle ne partage avec le site que
les polices et la feuille de style : son gabarit n'a ni en-tête ni pied de page
publics, et aucun lien ne mène de l'un à l'autre. On n'y arrive donc pas par une
fausse manœuvre, et on n'en sort pas par un retour arrière.

Trois barrières, dans cet ordre :

1. `src/proxy.ts` s'exécute avant le rendu. Sans identifiants configurés, tout
   `/admin` répond 404 ; sans cookie signé, il redirige vers la connexion. Il ne
   consulte pas la base : c'est un aiguillage, pas une autorisation.
2. `(admin)/admin/(protege)/layout.tsx` relit la session en base — expiration et
   révocation comprises. C'est là que l'accès est réellement décidé.
3. Chaque Server Action revérifie la session pour son propre compte. Une Server
   Action reste une URL publique, appelable sans passer par la page.

Toute modification est écrite dans `journal_admin` : qui, quoi, quand, depuis
quelle adresse. Les réservations contiennent des données d'enfants et de santé ;
cette trace fait partie des mesures attendues d'un responsable de traitement.

## Pages

| URL | Description |
|-----|-------------|
| `/` | Page d'accueil |
| `/reservation` | Tunnel de réservation (anniversaire, terrain, groupes) |
| `/confirmation` | Écran de confirmation |
| `/admin/connexion` | Connexion au back-office |
| `/admin` | Back-office — réservations |
| `/admin/devis` | Back-office — demandes de devis |
| `/admin/creneaux` | Back-office — ouverture et fermeture des créneaux |
| `/admin/tarifs` | Back-office — prix des formules et des options |
| `/admin/journal` | Back-office — journal des actions |
| `/mentions-legales` | Mentions légales |
| `/confidentialite` | Politique de confidentialité (RGPD) |
| `/politique-cookies` | Politique cookies |
| `/cgv` | Conditions Générales de Vente |
| `/cgu` | Conditions Générales d'Utilisation |

## Où vivent les données

**En base** (`supabase/migrations/`) : formules et tarifs, options, espaces,
créneaux et disponibilités, réservations, demandes de devis, paiements.
Le prix facturé est recalculé côté serveur à partir de ces tables à chaque
réservation — jamais recopié depuis le navigateur.

Les tarifs se modifient depuis `/admin/tarifs` : ce qui y est écrit est ce que
le serveur facturera, puisque c'est la même table qu'il relit au moment
d'enregistrer une réservation. Les réservations déjà prises gardent le montant
figé à leur enregistrement.

**Dans `src/data/`**, uniquement ce qui n'est pas tarifaire :
- `entreprise.ts` — identité de l'entreprise (source unique des pages légales)
- `reglement.ts` — délai de réservation, barème d'annulation
- `foot.ts` — liens vers Sport-Finder, qui gère la location de terrain
- `bubble-team.ts` — tarif Bubble Foot (facturé à la personne, hors table
  `formules`) et textes du team building
- `formules.ts` — textes fixes et repli d'affichage de la page d'accueil

## Base de données

Les migrations sont dans `supabase/migrations/`, à appliquer dans l'ordre.
RLS est activé et forcé sur toutes les tables **sans aucune politique** : les
clés publiques ne peuvent rien lire ni écrire, tout passe par le serveur.

Régénérer les types après une migration :

```bash
npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts
```

Deux fonctions sont à planifier (Supabase → Cron) :
`anonymiser_reservations_anciennes` pour la minimisation RGPD, et
`purger_sessions_admin` pour les sessions périmées. L'ouverture de nouveaux
créneaux se fait depuis le back-office, onglet « Créneaux ».

## Ajouter un composant shadcn/ui

Le CLI n'est plus installé dans le projet : il apportait 221 paquets et la
majorité des vulnérabilités remontées par `npm audit`, alors qu'il ne sert qu'à
la génération de composants. On l'appelle à la demande :

```bash
npx shadcn@latest add <composant>
```

`src/app/shadcn-base.css` est une copie non modifiée de
`shadcn@4.13.0/dist/tailwind.css`. Elle fournit les variantes `data-open`,
`data-closed`, `data-checked`, `data-disabled`, `data-horizontal` et
`data-vertical` utilisées par `checkbox.tsx`, `dialog.tsx`, `scroll-area.tsx`,
`select.tsx` et `separator.tsx`. Ne pas l'éditer à la main : la rafraîchir en
bloc.

Attention : le CLI peut réécrire `src/app/globals.css` et y remettre
`@import "shadcn/tailwind.css"`. Le build échoue alors sur
« Can't resolve 'shadcn/tailwind.css' » : remettre `@import "./shadcn-base.css";`.

## RGPD

- Bandeau cookies granulaire (nécessaires / audience / marketing)
- Cases CGV non pré-cochées + opt-in newsletter séparé, tous deux horodatés en base
- Données de mineurs (prénom, âge) et de santé (allergies) isolées, commentées
  dans le schéma, et effacées par `anonymiser_reservations_anciennes()`
- Aucune donnée personnelle dans les URL : la page de confirmation ne transporte
  qu'une référence
- Contact : voir `src/data/entreprise.ts`

## Déploiement

La procédure de bascule du domaine et d'activation des e-mails est détaillée
dans [`MISE-EN-LIGNE.md`](./MISE-EN-LIGNE.md), avec l'état DNS relevé et le
piège à éviter.

```bash
npm run build
```

Vercel, depuis le dépôt GitHub. Penser à renseigner les quatre variables
d'environnement ci-dessus (le mot de passe du back-office et la clé de service
en type « Sensitive »).
