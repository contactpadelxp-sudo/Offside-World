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

Sans `ADMIN_USER` ni `ADMIN_PASSWORD`, `/admin` répond 404 : le back-office est
fermé par défaut plutôt qu'ouvert par défaut.

## Pages

| URL | Description |
|-----|-------------|
| `/` | Page d'accueil |
| `/reservation` | Tunnel de réservation (anniversaire, terrain, groupes) |
| `/confirmation` | Écran de confirmation |
| `/admin` | Back-office — réservations à venir (authentifié) |
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

**Dans `src/data/`**, uniquement ce qui n'est pas tarifaire :
- `entreprise.ts` — identité de l'entreprise (source unique des pages légales)
- `reglement.ts` — délai de réservation, barème d'annulation
- `foot.ts` — liens vers Sport-Finder, qui gère la location de terrain
- `bubble-team.ts` — tarif Bubble Foot et textes du team building
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
`generer_creneaux_anniversaire` / `generer_creneaux_bubble` pour prolonger
l'horizon de réservation, et `anonymiser_reservations_anciennes` pour la
minimisation RGPD.

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

```bash
npm run build
```

Vercel, depuis le dépôt GitHub. Penser à renseigner les quatre variables
d'environnement ci-dessus (le mot de passe du back-office et la clé de service
en type « Sensitive »).
