-- ============================================================================
-- Vendredi à 16h00, plus de 17h30 le week-end — 24 septembre 2026
-- ============================================================================
--
-- DÉCIDÉ PAR BRAHIM ET MATHIS, le jour de la mise en ligne :
--   - le vendredi, l'anniversaire passe de 16h30-18h30 à 16h00-18h00 ;
--   - le samedi et le dimanche, le dernier créneau (17h30-19h30) disparaît.
--
-- Vérifié avant d'écrire, sur la base de production :
--   - vendredi 16h00-18h00 ne mord pas sur les heures de Sport-Finder
--     (`conflitSurHeureLocale`, `data/plages-sport-finder.ts`) ;
--   - AUCUNE réservation active sur les créneaux retirés. Un seul porte une
--     réservation tout court : `OW-GXTCUD8X`, le test annulé et remboursé du
--     21 septembre, sur le vendredi 2 octobre 16h30. Celui-là est fermé, pas
--     supprimé — voir plus bas.
--
-- ── Pourquoi SUPPRIMER, alors que la migration 0028 FERMAIT ─────────────────
--
-- 0028 fermait, pour garder une trace. Mais un créneau fermé peut revenir :
-- « Rouvrir la journée », au back-office, rouvre tout ce qui est fermé ce
-- jour-là, sous deux seules gardes — le chevauchement et Sport-Finder. Or un
-- samedi 17h30-19h30 ne chevauche rien (le 15h00 finit à 17h00) et ne mord pas
-- sur Sport-Finder. Fermé, il ressusciterait au premier clic, sans que personne
-- fasse le lien avec une décision prise six mois plus tôt.
--
-- Un créneau à venir, jamais vendu, qui ne fait plus partie de l'offre, n'a
-- aucune trace à garder. On le supprime. Ceux qui portent une réservation —
-- même annulée — ne peuvent pas l'être (`on delete restrict`) et ne doivent
-- pas l'être : ils sont la seule trace d'un paiement. Ceux-là sont fermés.
--
-- Les vendredis 18h30, fermés par 0028, restent fermés et en place : la garde
-- Sport-Finder les empêche de revenir (18h30-20h30 mord sur le foot de 20h00).
--
-- ── Le défaut trouvé en chemin, et corrigé ici ──────────────────────────────
--
-- LES FONCTIONS DE GÉNÉRATION RECRÉAIENT LES CRÉNEAUX FERMÉS À LA MAIN.
--
-- `creneaux` n'a aucune contrainte d'unicité sur (espace, début, fin) — seule
-- l'exclusion `creneaux_sans_chevauchement`, qui ne porte que sur les créneaux
-- OUVERTS (`where (ouvert)`). Quand la génération tombait sur un créneau FERMÉ
-- au même horaire, l'`insert ... on conflict do nothing` ne voyait donc aucun
-- conflit, et créait un second créneau, OUVERT, à côté.
--
-- Conséquence concrète, le jour même de la mise en ligne : Brahim ferme au
-- back-office les créneaux de ses anniversaires déjà pris par téléphone. Le
-- premier clic sur « Générer les créneaux » les remettait tous en vente, en
-- doublon — et le code affirmait l'inverse (« les fonctions de génération sont
-- idempotentes : rappeler sur une période déjà ouverte n'ajoute rien »).
--
-- Vérifié : aucun doublon n'existe encore. Le défaut n'avait simplement jamais
-- rencontré de créneau fermé à la main.
--
-- Le correctif : un créneau existant au même horaire, OUVERT OU FERMÉ, compte
-- comme déjà présent, et rien n'est inséré. Fermer un créneau devient ce que
-- tout le monde croyait déjà que c'était : définitif jusqu'à ce qu'on le rouvre.

-- ── 1. Anniversaires : les nouveaux horaires, et la génération qui respecte
--       les fermetures ────────────────────────────────────────────────────────

create or replace function generer_creneaux_anniversaire(du date, au date)
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
    -- 3 = mercredi, 5 = vendredi, 6 = samedi, 7 = dimanche (ISO).
    continue when extract(isodow from jour) not in (3, 5, 6, 7);

    heures := case extract(isodow from jour)
                when 3 then array['13:30', '16:00']::time[]
                -- Vendredi : un seul créneau, 16h00-18h00, décidé le
                -- 24 septembre 2026. Il finit deux heures avant le foot de
                -- 20h00 sur Sport-Finder.
                when 5 then array['16:00']::time[]
                -- Samedi et dimanche : trois créneaux. Le 17h30 a été retiré
                -- le 24 septembre 2026.
                else        array['10:00', '12:30', '15:00']::time[]
              end;

    foreach h in array heures loop
      for espace in select id from espaces where actif loop
        v_debut := (jour + h) at time zone 'Europe/Brussels';
        v_fin   := v_debut + interval '2 hours';

        -- Un créneau déjà là, OUVERT OU FERMÉ, n'est pas recréé : un créneau
        -- fermé à la main l'a été pour une raison. Voir l'en-tête.
        if exists (
          select 1 from creneaux c
          where c.espace_id = espace.id
            and c.debut = v_debut and c.fin = v_fin
            and c.type = 'anniversaire'
        ) then
          deja_presents := deja_presents + 1;
          continue;
        end if;

        insert into creneaux (espace_id, type, debut, fin)
        values (espace.id, 'anniversaire', v_debut, v_fin)
        on conflict do nothing;

        get diagnostics ajoutes = row_count;
        if ajoutes = 1 then
          crees := crees + 1;
        else
          -- Refusé par la contrainte d'exclusion : un autre créneau ouvert
          -- chevauche celui-ci dans le même espace.
          refuses := refuses + 1;
        end if;
      end loop;
    end loop;
  end loop;

  return next;
end $$;

comment on function generer_creneaux_anniversaire is
  'Créneaux d''anniversaire de 2 h, avec 30 min de battement. Horaires au '
  '24 septembre 2026 : mercredi 13h30 et 16h00 ; vendredi 16h00, un seul ; '
  'samedi et dimanche 10h00, 12h30 et 15h00. Un créneau existant au même '
  'horaire, OUVERT OU FERMÉ, n''est jamais recréé : fermer un créneau à la main '
  'est définitif jusqu''à ce qu''on le rouvre.';

-- ── 2. Bubble : le même correctif, avant que le défaut ne serve ─────────────
--
-- `horaires_bubble` est vide aujourd'hui et la fonction ne produit rien. Mais
-- elle est appelée par le même bouton du back-office, et elle avait le même
-- défaut : le jour où des horaires y seront ajoutés, elle aurait recréé elle
-- aussi les créneaux fermés à la main.

create or replace function generer_creneaux_bubble(du date, au date)
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

      if exists (
        select 1 from creneaux c
        where c.espace_id = plage.espace_id
          and c.debut = v_debut and c.fin = v_fin
          and c.type = 'bubble'
      ) then
        deja_presents := deja_presents + 1;
        continue;
      end if;

      insert into creneaux (espace_id, type, debut, fin)
      values (plage.espace_id, 'bubble', v_debut, v_fin)
      on conflict do nothing;

      get diagnostics ajoutes = row_count;
      if ajoutes = 1 then
        crees := crees + 1;
      else
        refuses := refuses + 1;
      end if;
    end loop;
  end loop;

  return next;
end $$;

-- ── 3. Retirer les créneaux qui ne font plus partie de l'offre ──────────────
--
-- À venir seulement : le passé raconte ce qui a été proposé, on n'y touche pas.
-- Tous les espaces, y compris la Fun zone 3 inactive — sans quoi ses 17h30
-- ressusciteraient le jour où elle ouvrira.

-- 3a. Supprimés : ceux qu'aucune réservation n'a jamais visés.
delete from creneaux c
 where c.type = 'anniversaire'
   and c.debut > now()
   and (
     (extract(isodow from c.debut at time zone 'Europe/Brussels') = 5
        and (c.debut at time zone 'Europe/Brussels')::time = '16:30')
     or
     (extract(isodow from c.debut at time zone 'Europe/Brussels') in (6, 7)
        and (c.debut at time zone 'Europe/Brussels')::time = '17:30')
   )
   and not exists (select 1 from reservations r where r.creneau_id = c.id);

-- 3b. Fermés : ceux qui portent une réservation annulée ou expirée. Une
-- réservation ACTIVE garde son créneau ouvert — on ne retire pas de la vente
-- une place déjà vendue. Il n'y en avait aucune au moment d'écrire ; la clause
-- reste pour qui rejouerait ce fichier sur une base qui, elle, aurait vendu.
update creneaux c
   set ouvert = false
 where c.type = 'anniversaire'
   and c.ouvert
   and c.debut > now()
   and (
     (extract(isodow from c.debut at time zone 'Europe/Brussels') = 5
        and (c.debut at time zone 'Europe/Brussels')::time = '16:30')
     or
     (extract(isodow from c.debut at time zone 'Europe/Brussels') in (6, 7)
        and (c.debut at time zone 'Europe/Brussels')::time = '17:30')
   )
   and not exists (
     select 1 from reservations r
      where r.creneau_id = c.id
        and r.statut in ('en_attente', 'confirmee')
   );

-- ── 4. Rouvrir les vendredis 16h00 ──────────────────────────────────────────
--
-- Ils existent déjà : 0028 les avait fermés, TOUS, en passant au 16h30. Aucun
-- n'a été fermé à la main depuis — vérifié, les 26 vendredis sont fermés dans
-- chaque espace, ce qui est la signature de la migration et non d'un geste.
--
-- APRÈS l'étape 3, et c'est obligatoire : un 16h00-18h00 ouvert chevaucherait
-- un 16h30-18h30 encore ouvert dans le même espace, et la contrainte
-- d'exclusion ferait échouer la migration entière.
--
-- Espaces ACTIFS seulement : la Fun zone 3 garde ses créneaux fermés.
update creneaux c
   set ouvert = true
 where c.type = 'anniversaire'
   and not c.ouvert
   and c.debut > now()
   and extract(isodow from c.debut at time zone 'Europe/Brussels') = 5
   and (c.debut at time zone 'Europe/Brussels')::time = '16:00'
   and exists (select 1 from espaces e where e.id = c.espace_id and e.actif);

-- ── 5. Compléter l'horizon de six mois ──────────────────────────────────────
--
-- Avec le correctif de l'étape 1, cet appel respecte les créneaux fermés à la
-- main : il ne crée que ce qui manque réellement.

select generer_creneaux_anniversaire(current_date, current_date + 180);
