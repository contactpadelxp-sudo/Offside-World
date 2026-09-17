-- ============================================================================
-- Les vraies données du complexe — réponses de Brahim Bel Abbes, 17 sept. 2026
--
-- Jusqu'ici, trois choses tournaient sur des hypothèses posées faute de mieux :
-- les horaires d'anniversaire, le nombre d'espaces, et la composition des
-- formules. Elles sont remplacées par ce que l'exploitant a réellement répondu.
-- ============================================================================

-- ── Les espaces : trois, et non deux ────────────────────────────────────────
--
-- Ils s'appelaient « Espace anniversaire 1 » et « 2 », ce qui était doublement
-- faux : ils servent aussi au Bubble Foot, et il y en aura trois. Capacité
-- ramenée de 20 à 18.

update espaces set nom = 'Fun zone 1', capacite = 18 where id = 'espace-1';
update espaces set nom = 'Fun zone 2', capacite = 18 where id = 'espace-2';
insert into espaces (id, nom, capacite, actif) values ('espace-3', 'Fun zone 3', 18, true)
  on conflict (id) do update
    set nom = excluded.nom, capacite = excluded.capacite, actif = true;

-- ── Les formules : 18 enfants, et plus de vidéo souvenir ────────────────────
--
-- La vidéo souvenir était promise dans les deux formules. Brahim demande de la
-- retirer : promettre une prestation qu'on ne peut pas livrer engage le
-- vendeur, et filmer des enfants demanderait en plus une autorisation parentale
-- écrite qui n'existe pas.

update formules
   set enfants_max = 18,
       inclus = array_remove(inclus, 'Vidéo souvenir de l''anniversaire');

-- ── Les extras : deux retirés, trois ajoutés ────────────────────────────────
--
-- DÉSACTIVÉS ET NON SUPPRIMÉS. Une réservation existante porte encore l'option
-- « photo » : effacer la ligne ferait afficher l'identifiant brut à la place du
-- libellé sur sa fiche. Le back-office lit donc les options INACTIVES comprises
-- (voir `lireOptions(false)`), le tunnel public seulement les actives.

update options set actif = false where id in ('photo', 'pinata');

insert into options (id, libelle, description, prix_cents, actif) values
  ('ballon', 'Ballon souvenir à dédicacer',
   'Un ballon que tous les invités signent, à emporter', 2900, true),
  ('hotdog', 'Hot dog party', 'Hot dogs pour tout le groupe', 2900, true),
  ('crepes', 'Crêpes party',  'Crêpes pour tout le groupe',  2900, true)
  on conflict (id) do update
    set libelle = excluded.libelle, description = excluded.description,
        prix_cents = excluded.prix_cents, actif = true;

-- ── Les créneaux d'anniversaire : les horaires réels ────────────────────────
--
--   Mercredi          13h30 · 16h00
--   Vendredi          16h00 · 18h30
--   Samedi, dimanche  10h00 · 12h30 · 15h00 · 17h30
--
-- Ils répondent au passage à une question restée ouverte depuis le début : les
-- « 30 minutes entre deux groupes » séparent bien la FIN d'un créneau du DÉBUT
-- du suivant (13h30–15h30 puis 16h00), et non deux groupes simultanés décalés.
--
-- L'ancienne règle ignorait le vendredi et plaçait le mercredi à 15h00 et
-- 17h30.

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
                when 5 then array['16:00', '18:30']::time[]
                else        array['10:00', '12:30', '15:00', '17:30']::time[]
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
  'Créneaux d''anniversaire de 2 h, avec 30 min de battement entre la fin d''un '
  'groupe et le début du suivant. Horaires réels du complexe, communiqués le '
  '17 septembre 2026 : mercredi 13h30 et 16h00 ; vendredi 16h00 et 18h30 ; '
  'samedi et dimanche 10h00, 12h30, 15h00 et 17h30.';

-- ── CE QUI RESTE INCONNU, ET QUI N'EST DONC PAS TOUCHÉ ICI ──────────────────
--
-- Les créneaux de BUBBLE FOOT. À la question « et le Bubble Foot ? », Brahim a
-- répondu par les horaires du FOOT — 14h-01h les lundi, mardi et jeudi ;
-- 20h-01h les mercredi, samedi et dimanche. Ce sont les heures de la location
-- de terrain, qui se réserve sur Sport-Finder et non ici. Les plages du Bubble
-- Foot en Fun zone restent donc à confirmer, et `generer_creneaux_bubble`
-- garde ses horaires provisoires : vendredi, samedi et dimanche à 18h, 19h et
-- 20h. Inventer une plage reviendrait à vendre un créneau qui n'existe pas.
