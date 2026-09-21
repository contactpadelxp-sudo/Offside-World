-- ============================================================================
-- Le vendredi n'a plus qu'un anniversaire, et il finit avant le foot
--                                                        — 21 septembre 2026
-- ============================================================================
--
-- CE QUI A CHANGÉ DEHORS. Brahim a enfin donné l'heure du vendredi, la seule
-- qui manquait : le FOOT et le BUBBLE se louent de 20h00 à 01h00, sur
-- Sport-Finder. C'était le dernier trou de la mécanique de réservation — son
-- mail du 21 septembre listait « lundi mardi jeudi » et « mercredi samedi
-- dimanche », le vendredi n'était dans aucun des deux groupes.
--
-- POURQUOI C'ÉTAIT LE SEUL JOUR À POSER PROBLÈME. Ses deux groupes horaires
-- tombent exactement sur la séparation : 14h-01h les jours SANS anniversaire,
-- 20h-01h les jours AVEC. Par symétrie le vendredi appartient au second. Mais
-- son dernier anniversaire finissait à 20h30, une heure plus tard que le
-- samedi — le seul jour où sa propre règle ne tombait pas juste.
--
-- LE SITE ET SPORT-FINDER NE SE VOIENT PAS. Aucune intégration, et ce sont les
-- MÊMES deux Fun zones qui servent aux anniversaires, au Bubble et au foot. Le
-- seul garde-fou est que leurs plages ne se touchent jamais. Un anniversaire
-- courant jusqu'à 20h30 pendant qu'un joueur a loué le terrain à 20h00, c'est
-- deux clients sur le même sol, tous deux dans leur droit.
--
-- DEUX CRÉNEAUX NE RENTRENT PAS, ET CE N'EST PAS UN ARBITRAGE.
--
-- Un créneau dure 2 h (`formules.duree_minutes` = 120, et l'intervalle
-- ci-dessous), et 30 minutes séparent la fin d'un groupe du début du suivant.
-- Deux créneaux demandent donc 4 h 30. Entre 16h00 — après l'école — et 19h30
-- — trente minutes avant le premier joueur —, il y a 3 h 30. Il manque une
-- heure.
--
-- La seule façon de garder deux créneaux serait de démarrer à 15h00, comme le
-- samedi et le dimanche. Le vendredi est un jour d'école : à 15h00 les enfants
-- sont en classe. Le vendredi passe donc à UN créneau, 16h30-18h30, ce qui
-- laisse une heure et demie avant le foot.
--
-- ── Ce que cette migration doit faire, et dans cet ordre ────────────────────
--
-- CHANGER LA FONCTION NE SUFFIT PAS. Elle ne décide que des créneaux À VENIR.
-- Ceux déjà écrits restent en base et restent vendables : la génération a été
-- lancée sur six mois, soit 26 vendredis portant chacun deux créneaux sur
-- trois espaces. Les fermer est l'essentiel du travail ; réécrire la fonction
-- n'en est que la moitié visible.
--
-- ON FERME AVANT DE GÉNÉRER, parce que la contrainte d'exclusion l'exige. Le
-- nouveau 16h30-18h30 chevauche l'ancien 16h00-18h00 dans le même espace, et
-- `creneaux_sans_chevauchement` ne porte que sur les créneaux OUVERTS
-- (`where (ouvert)`). Fermer l'ancien le sort de l'index, et le nouveau passe.
-- Dans l'ordre inverse, l'insertion serait refusée et comptée comme « refusé ».
--
-- ON FERME, ON NE SUPPRIME PAS. `reservations.creneau_id` référence `creneaux`
-- en `on delete restrict` : une suppression échouerait sur un créneau réservé,
-- et réussirait sur les autres — donc à moitié. Fermer marche dans les deux
-- cas, sort le créneau de la vente, et garde la trace.
--
-- ON NE TOUCHE PAS AU PASSÉ. Un créneau déjà écoulé raconte ce qui a été
-- proposé ce jour-là. Le refermer après coup réécrirait l'histoire sans rien
-- protéger.
--
-- VÉRIFIÉ AVANT D'ÉCRIRE : aucun des 156 créneaux du vendredi (26 vendredis ×
-- 2 horaires × 3 espaces, du 18/09/2026 au 19/03/2027) ne porte de réservation
-- active. Aucun client n'est déplacé par cette migration. Si ce n'avait pas
-- été le cas, la clause `not exists` ci-dessous aurait laissé le créneau
-- réservé ouvert plutôt que de retirer de la vente une place déjà vendue.
--
-- Les créneaux d'`espace-3` sont fermés eux aussi, bien qu'invisibles : la vue
-- `creneaux_disponibles` filtre sur `e.actif` et la Fun zone 3 est inactive.
-- Le jour où elle ouvrira, ses vendredis 18h30 ressusciteraient sinon en même
-- temps qu'elle, sans que personne ne fasse le lien.

-- ── 1. La fonction : un seul horaire le vendredi ────────────────────────────

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
                -- Vendredi : UN SEUL créneau, qui finit à 18h30. Le foot et le
                -- Bubble démarrent à 20h00 sur Sport-Finder, et deux créneaux
                -- de 2 h séparés de 30 min ne rentrent pas avant cette heure.
                when 5 then array['16:30']::time[]
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
  'groupe et le début du suivant. Horaires réels du complexe : mercredi 13h30 '
  'et 16h00 ; VENDREDI 16h30, un seul, parce que le foot et le Bubble démarrent '
  'à 20h00 sur Sport-Finder et que deux créneaux ne rentrent pas avant ; samedi '
  'et dimanche 10h00, 12h30, 15h00 et 17h30.';

-- ── 2. Fermer les vendredis à venir qui ne correspondent plus ───────────────

update creneaux c
   set ouvert = false
 where c.type = 'anniversaire'
   and c.ouvert
   and c.debut > now()
   and extract(isodow from (c.debut at time zone 'Europe/Brussels')) = 5
   and (c.debut at time zone 'Europe/Brussels')::time in ('16:00', '18:30')
   -- Une place vendue ne se retire pas de la vente. Vérifié nul au moment
   -- d'écrire cette migration ; la clause reste, parce qu'elle sera relue le
   -- jour où quelqu'un rejouera ce fichier sur une base qui, elle, aura vendu.
   and not exists (
     select 1 from reservations r
      where r.creneau_id = c.id
        and r.statut in ('en_attente', 'confirmee')
   );

-- ── 3. Ouvrir les nouveaux, sur le même horizon que ce qui existe ───────────
--
-- Six mois : c'est la réponse de Brahim à « jusqu'à quand à l'avance on peut
-- réserver », et c'est déjà l'horizon des créneaux en base.

select generer_creneaux_anniversaire(current_date, current_date + 180);
