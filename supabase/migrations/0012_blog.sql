-- ============================================================================
-- Blog
--
-- Les articles sont écrits par Brahim depuis le back-office, pas par un
-- développeur dans le dépôt : ils vivent donc en base, comme les tarifs et les
-- créneaux. Publier ne doit jamais demander un redéploiement.
--
-- Le corps est du HTML produit par l'éditeur visuel. Il est NETTOYÉ CÔTÉ
-- SERVEUR avant d'arriver ici — voir `src/lib/blog/nettoyage.ts`. Ce point
-- n'est pas une précaution de principe : le corps est ensuite réinjecté tel
-- quel dans la page publique, donc une balise `<script>` qui atteindrait cette
-- colonne s'exécuterait chez tous les visiteurs. La base ne fait pas
-- confiance à l'éditeur, et l'affichage ne fait pas confiance à la base.
-- ============================================================================

create table if not exists articles (
  id            uuid primary key default gen_random_uuid(),

  -- Identifiant dans l'URL : /blog/mon-article. Dérivé du titre, modifiable,
  -- et unique — deux articles ne peuvent pas se disputer la même adresse.
  slug          text not null unique,

  titre         text not null,

  -- Résumé affiché dans la liste et dans les métadonnées de partage.
  -- Facultatif : s'il est vide, on prendra le début du corps.
  chapo         text,

  -- HTML nettoyé. Jamais du Markdown : l'éditeur est visuel.
  corps         text not null default '',

  -- Image de couverture. Un chemin dans /public/images ou une URL absolue.
  image         text,

  -- Un brouillon n'est visible que dans le back-office. C'est ce qui permet
  -- d'écrire en plusieurs fois sans rien montrer.
  publie        boolean not null default false,

  -- Date d'affichage, choisie par l'auteur — elle peut différer de la date
  -- réelle de publication (article antidaté, publication programmée à la main).
  publie_le     timestamptz,

  cree_le       timestamptz not null default now(),
  modifie_le    timestamptz not null default now(),

  constraint slug_forme check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint slug_court check (length(slug) between 3 and 120),
  constraint titre_court check (length(titre) between 3 and 160),
  constraint chapo_court check (chapo is null or length(chapo) <= 400),
  constraint corps_borne check (length(corps) <= 100000),
  constraint image_courte check (image is null or length(image) <= 400),
  -- Un article publié a forcément une date : sans elle, il ne peut pas être
  -- classé, et la liste publique est triée par date.
  constraint publie_date check (not publie or publie_le is not null)
);

-- La liste publique : les articles publiés, du plus récent au plus ancien.
create index if not exists articles_publies_idx
  on articles (publie, publie_le desc);

alter table articles enable row level security;
alter table articles force row level security;

-- `modifie_le` doit refléter la réalité, pas la bonne volonté de celui qui
-- écrit la requête : un trigger ne s'oublie pas.
create or replace function articles_touche()
returns trigger
language plpgsql
as $$
begin
  new.modifie_le = now();
  return new;
end;
$$;

drop trigger if exists articles_modifie_le on articles;
create trigger articles_modifie_le
  before update on articles
  for each row execute function articles_touche();
