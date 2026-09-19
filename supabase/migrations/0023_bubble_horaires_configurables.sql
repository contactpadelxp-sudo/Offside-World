-- ============================================================================
-- Le Bubble Foot cesse d'inventer ses horaires, et la Fun zone 3 attend
-- d'exister — 19 septembre 2026
--
-- Deux corrections qui visent la même faute : vendre ce dont on n'est pas sûr.
-- ============================================================================

-- ── 1. La Fun zone 3 est fermée jusqu'à confirmation ────────────────────────
--
-- Brahim a écrit, le 17 septembre 2026 : « Il y en aura 3 ; Fun zone 1 2 3 ».
-- Au FUTUR, et en réponse à une question qui parlait de DEUX espaces. La
-- migration 0020 a pourtant créé la troisième zone active, et 315 créneaux
-- d'anniversaire y ont été ouverts à la vente.
--
-- Les deux erreurs possibles ne coûtent pas la même chose. Fermer une zone qui
-- existe fait perdre un anniversaire simultané — invisible, et rattrapable en
-- une ligne. Laisser ouverte une zone qui n'existe pas fait accepter trois
-- groupes pour deux salles : une famille arrive le jour de la fête et il n'y a
-- pas de place. On ferme.
--
-- `actif = false` suffit et ne détruit rien : la vue `creneaux_disponibles`
-- filtre `where c.ouvert and e.actif`, donc les 315 créneaux disparaissent de
-- la vente et reviennent intacts le jour où l'on repasse `actif` à true.

update espaces set actif = false where id = 'espace-3';

comment on table espaces is
  'Les Fun zones. La 3 est inactive depuis le 19 septembre 2026 : son existence '
  'n''est pas confirmée. La réactiver d''un update dès que Brahim répond.';

-- ── 2. Les horaires du Bubble Foot sortent du code ──────────────────────────
--
-- `generer_creneaux_bubble` portait « vendredi, samedi et dimanche à 18h, 19h
-- et 20h » écrits en dur — des heures que personne n'a jamais confirmées, posées
-- faute de mieux. Elles ne dormaient pas tranquillement : le bouton « Ouvrir une
-- période » du back-office appelle CETTE fonction en même temps que celle des
-- anniversaires (`genererCreneaux`, src/lib/actions/admin.ts). Un clic, et des
-- sessions Bubble Foot partaient à la vente à 23 €/personne sur des créneaux
-- inventés. C'est précisément ce qu'on avait évité en ne les régénérant pas.
--
-- La table ci-dessous est la seule source des horaires Bubble. Elle est VIDE,
-- et c'est le cœur de la correction : sans ligne, la fonction ne crée rien et
-- le dit. Le jour où Brahim donne ses heures, on insère, et le même bouton
-- fonctionne sans qu'une ligne de code change.

create table if not exists horaires_bubble (
  jour_semaine   smallint not null check (jour_semaine between 1 and 7),
  heure          time     not null,
  espace_id      text     not null references espaces(id),
  duree_minutes  smallint not null default 60 check (duree_minutes between 15 and 480),
  primary key (jour_semaine, heure, espace_id)
);

comment on table horaires_bubble is
  'Horaires de vente du Bubble Foot en Fun zone, par jour ISO (1 = lundi). '
  'VIDE tant que l''exploitant ne les a pas communiqués : sans ligne, '
  'generer_creneaux_bubble ne crée aucun créneau, au lieu d''en inventer.';

comment on column horaires_bubble.duree_minutes is
  'Doit rester d''accord avec BUBBLE_DUREE_MINUTES (src/data/bubble-team.ts), '
  'qui est la durée annoncée au client dans le tunnel.';

alter table horaires_bubble enable row level security;
alter table horaires_bubble force row level security;
revoke all on horaires_bubble from anon, authenticated;

-- ── 3. La fonction lit la table, et ne suppose plus rien ────────────────────
--
-- Elle gagne une quatrième colonne, `sans_horaire`. Sans elle, une table vide
-- et une période déjà entièrement ouverte rendraient le même « 0 créé, 0 refusé »
-- : le back-office ne pourrait pas distinguer « rien à faire » de « je ne sais
-- pas quoi faire ». C'est cette confusion qui laissait passer le défaut.
--
-- L'espace n'est plus figé sur 'espace-1' : il vient de la table. Le Bubble
-- Foot pourra se vendre dans une zone ou dans plusieurs, selon ce que
-- l'exploitant décidera — la question lui est posée en même temps que les
-- heures.

drop function if exists generer_creneaux_bubble(date, date);

create function generer_creneaux_bubble(du date, au date)
returns table(crees integer, deja_presents integer, refuses integer, sans_horaire boolean)
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  jour    date;
  plage   record;
  v_debut timestamptz;
  v_fin   timestamptz;
  ajoutes integer;
begin
  if au < du then
    raise exception 'Période invalide : % est antérieur à %', au, du;
  end if;

  crees := 0; deja_presents := 0; refuses := 0;
  sans_horaire := not exists (select 1 from horaires_bubble);

  -- On sort AVANT la boucle plutôt qu'après : sans horaire, il n'y a pas de
  -- période à parcourir, et le message doit être « je n'ai pas d'horaires »,
  -- pas « je n'ai rien trouvé à créer ».
  if sans_horaire then
    return next;
    return;
  end if;

  for jour in select generate_series(du, au, interval '1 day')::date loop
    for plage in
      select hb.heure, hb.espace_id, hb.duree_minutes
        from horaires_bubble hb
        join espaces e on e.id = hb.espace_id and e.actif
       where hb.jour_semaine = extract(isodow from jour)
       order by hb.heure, hb.espace_id
    loop
      v_debut := (jour + plage.heure) at time zone 'Europe/Brussels';
      v_fin   := v_debut + make_interval(mins => plage.duree_minutes);

      insert into creneaux (espace_id, type, debut, fin)
      values (plage.espace_id, 'bubble', v_debut, v_fin)
      on conflict do nothing;

      get diagnostics ajoutes = row_count;

      if ajoutes = 1 then
        crees := crees + 1;
      elsif exists (
        select 1 from creneaux c
        where c.espace_id = plage.espace_id
          and c.debut = v_debut and c.fin = v_fin
          and c.type = 'bubble'
      ) then
        deja_presents := deja_presents + 1;
      else
        -- Un anniversaire occupe déjà la zone sur cette plage : la contrainte
        -- d'exclusion refuse la ligne. On le compte pour que le back-office
        -- puisse le dire, au lieu de laisser croire que tout est passé.
        refuses := refuses + 1;
      end if;
    end loop;
  end loop;

  return next;
end $$;

comment on function generer_creneaux_bubble is
  'Ouvre les créneaux Bubble Foot d''une période à partir de horaires_bubble. '
  'Table vide : ne crée rien et renvoie sans_horaire = true. Aucun horaire '
  'n''est écrit dans cette fonction.';

revoke all on function generer_creneaux_bubble(date, date) from public, anon, authenticated;
grant execute on function generer_creneaux_bubble(date, date) to service_role;
