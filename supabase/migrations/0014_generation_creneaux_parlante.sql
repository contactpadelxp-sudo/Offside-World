-- ============================================================================
-- La génération de créneaux dit maintenant ce qu'elle n'a PAS pu créer
--
-- CE QUI N'ALLAIT PAS. Les deux fonctions ne renvoyaient qu'un nombre : les
-- créneaux créés. `on conflict do nothing` avalait tout le reste, en
-- confondant deux situations qui n'ont rien à voir :
--
--   1. « ce créneau existe déjà » — la fonction est idempotente, c'est normal,
--      et c'est même ce qu'on attend en rappelant la génération ;
--   2. « ce créneau en chevauche un autre » — un vrai conflit, que personne
--      ne voulait, et dont l'exploitant devrait être averti.
--
-- Les deux comptaient zéro. Le back-office affichait alors « Aucun nouveau
-- créneau : la période était déjà ouverte », ce qui était FAUX dans le second
-- cas et laissait croire que tout allait bien.
--
-- CE QUE ÇA A COÛTÉ, concrètement. Le Bubble Foot est généré à 18 h, 19 h et
-- 20 h du vendredi au dimanche. Le samedi et le dimanche, les anniversaires
-- occupent 17 h 30 – 19 h 30 dans le même espace : les créneaux de 18 h et
-- 19 h ont donc été refusés en silence. Le week-end — les deux jours qui
-- comptent — n'a qu'UN créneau Bubble au lieu de trois, et personne ne l'a su
-- avant que je compare la base à ce qui était écrit dans le suivi.
--
-- Il n'y a qu'une seule contrainte sur `creneaux` : l'exclusion de
-- chevauchement. Un créneau identique se chevauche lui-même, donc les deux cas
-- lèvent la même erreur. Pour les distinguer, on regarde ce qui occupe déjà la
-- place : même espace, même début, même fin, même type -> déjà présent ;
-- n'importe quoi d'autre -> refusé.
--
-- Les fonctions passent donc d'un entier à trois. L'appelant est mis à jour
-- dans le même commit.
--
-- Les variables locales sont préfixées `v_` : nommées `debut` et `fin`, elles
-- entraient en collision avec les colonnes du même nom, et PostgreSQL refusait
-- la comparaison comme ambiguë. Le préfixe n'est pas cosmétique.
-- ============================================================================

drop function if exists generer_creneaux_anniversaire(date, date);
drop function if exists generer_creneaux_bubble(date, date);

create function generer_creneaux_anniversaire(du date, au date)
returns table(crees integer, deja_presents integer, refuses integer)
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  jour    date;
  heures  time[];
  h       time;
  espace  record;
  v_debut timestamptz;
  v_fin   timestamptz;
  ajoutes integer;
begin
  if au < du then
    raise exception 'Période invalide : % est antérieur à %', au, du;
  end if;

  crees := 0; deja_presents := 0; refuses := 0;

  for jour in select generate_series(du, au, interval '1 day')::date loop
    -- 3 = mercredi, 6 = samedi, 7 = dimanche (ISO)
    continue when extract(isodow from jour) not in (3, 6, 7);

    -- Le mercredi, uniquement l'après-midi : les enfants sont à l'école le matin.
    heures := case when extract(isodow from jour) = 3
                   then array['15:00', '17:30']::time[]
                   else array['10:00', '12:30', '15:00', '17:30']::time[]
              end;

    foreach h in array heures loop
      -- Boucle sur les espaces plutôt qu'un insert ensembliste : c'est le seul
      -- moyen de savoir POURQUOI une ligne n'a pas été créée.
      for espace in select id from espaces where actif loop
        v_debut := (jour + h) at time zone 'Europe/Brussels';
        v_fin   := v_debut + interval '2 hours';

        insert into creneaux (espace_id, type, debut, fin)
        values (espace.id, 'anniversaire', v_debut, v_fin)
        on conflict do nothing;

        get diagnostics ajoutes = row_count;

        if ajoutes = 1 then
          crees := crees + 1;
        elsif exists (
          select 1 from creneaux c
          where c.espace_id = espace.id
            and c.debut = v_debut and c.fin = v_fin
            and c.type = 'anniversaire'
        ) then
          deja_presents := deja_presents + 1;
        else
          refuses := refuses + 1;
        end if;
      end loop;
    end loop;
  end loop;

  return next;
end $$;

comment on function generer_creneaux_anniversaire is
  'Ouvre les créneaux anniversaire d''une période et rend compte de ce qui a été '
  'créé, de ce qui existait déjà et de ce qui a été refusé pour chevauchement. '
  'Plages PROVISOIRES tant que Brahim n''a pas arrêté les jours réservés.';

-- Le Bubble Foot se joue sur un terrain, en soirée, une heure par groupe.
-- Un seul espace : c'est ce que propose déjà le site, qui n'offre pas de
-- choix d'espace pour cette activité.
create function generer_creneaux_bubble(du date, au date)
returns table(crees integer, deja_presents integer, refuses integer)
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  jour    date;
  h       time;
  v_debut timestamptz;
  v_fin   timestamptz;
  ajoutes integer;
begin
  if au < du then
    raise exception 'Période invalide : % est antérieur à %', au, du;
  end if;

  crees := 0; deja_presents := 0; refuses := 0;

  for jour in select generate_series(du, au, interval '1 day')::date loop
    -- du vendredi au dimanche
    continue when extract(isodow from jour) not in (5, 6, 7);

    foreach h in array array['18:00', '19:00', '20:00']::time[] loop
      v_debut := (jour + h) at time zone 'Europe/Brussels';
      v_fin   := v_debut + interval '1 hour';

      insert into creneaux (espace_id, type, debut, fin)
      select 'espace-1', 'bubble', v_debut, v_fin
      where exists (select 1 from espaces where id = 'espace-1' and actif)
      on conflict do nothing;

      get diagnostics ajoutes = row_count;

      if ajoutes = 1 then
        crees := crees + 1;
      elsif exists (
        select 1 from creneaux c
        where c.espace_id = 'espace-1'
          and c.debut = v_debut and c.fin = v_fin
          and c.type = 'bubble'
      ) then
        deja_presents := deja_presents + 1;
      else
        -- C'est ici que les 18 h et 19 h du week-end tombaient, sans un mot.
        refuses := refuses + 1;
      end if;
    end loop;
  end loop;

  return next;
end $$;

comment on function generer_creneaux_bubble is
  'Ouvre les créneaux Bubble Foot d''une période et rend compte des refus pour '
  'chevauchement. Horaires PROVISOIRES.';

-- Ces fonctions ouvrent des créneaux à la vente : réservées au serveur.
revoke all on function generer_creneaux_anniversaire(date, date) from public, anon, authenticated;
revoke all on function generer_creneaux_bubble(date, date) from public, anon, authenticated;
grant execute on function generer_creneaux_anniversaire(date, date) to service_role;
grant execute on function generer_creneaux_bubble(date, date) to service_role;
