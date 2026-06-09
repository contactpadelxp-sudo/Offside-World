# Offside World

Maquette cliquable du site **Offside World** — complexe de foot indoor (anniversaires, entrées libres, location de terrain, team building).

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4** + **shadcn/ui**
- Données mockées (pas de back-end)
- Conformité RGPD front-end (bandeau cookies, cases CGV, pages légales)

## Lancer le projet

```bash
npm install
npm run dev
```

Le site est accessible sur [http://localhost:3000](http://localhost:3000).

## Pages

| URL | Description |
|-----|-------------|
| `/` | Landing page (conversion) |
| `/reservation` | Tunnel de réservation (4 parcours) |
| `/confirmation` | Écran de confirmation |
| `/admin` | Mini back-office (résumé du jour) |
| `/mentions-legales` | Mentions légales |
| `/confidentialite` | Politique de confidentialité (RGPD) |
| `/politique-cookies` | Politique cookies |
| `/cgv` | Conditions Générales de Vente |
| `/cgu` | Conditions Générales d'Utilisation |

## Données mockées

Les fichiers de mock sont dans `src/data/` :
- `formules.ts` — Formules anniversaire + options
- `salles.ts` — Salles, créneaux, disponibilités
- `foot.ts` — Créneaux foot + liens externes
- `libre.ts` — Créneaux entrée libre
- `team-building.ts` — Packages team building
- `backoffice.ts` — Réservations fictives (back-office)

## RGPD

- Bandeau cookies granulaire (nécessaires / audience / marketing)
- Cases CGV non pré-cochées + opt-in newsletter séparé
- Pages légales en gabarit (placeholders `[À COMPLÉTER]` pour validation juridique)
- Contact RGPD : rgpd@offsideworld.be

## Déploiement

```bash
npm run build
```

Prêt pour Vercel (import du repo GitHub).
