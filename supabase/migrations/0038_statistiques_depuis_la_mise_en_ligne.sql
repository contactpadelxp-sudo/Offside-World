-- ============================================================================
-- Les statistiques repartent de la mise en ligne
--                                                        — 27 septembre 2026
-- ============================================================================
--
-- Demandé par Mathis le 27 septembre 2026, le jour de la première vraie
-- réservation (OW-CQCRX6LT, payée par Bancontact, confirmée par le webhook du
-- domaine) : que Brahim lise dans « Analyse » l'activité du site depuis sa
-- mise en ligne, et non les essais qui l'ont précédée.
--
-- ── Ce qui faussait les chiffres ────────────────────────────────────────────
--
-- « ENCAISSÉ » ADDITIONNAIT 833 € QUI N'ONT JAMAIS EXISTÉ. Trois réservations
-- d'essai payées en mode test Stripe (200 €, 424 € et 209 €) ont été annulées
-- au palier « sans remboursement » pour éprouver ce palier : leur paiement est
-- resté « réussi » en base, et la tuile les comptait sur 30 et 90 jours.
--
-- LES VISITES comptaient les essais de Mathis et de Brahim depuis le
-- 9 septembre, quand le site n'avait encore aucun public.
--
-- ── L'heure de la mise en ligne est lue dans les données ────────────────────
--
-- Le 24 septembre, la dernière visite d'essai s'arrête à 17h42 ; la première
-- arrivée depuis Google a lieu à 20h05, suivie de visites venues d'Instagram.
-- Le domaine a basculé entre les deux. On coupe à 20h00, heure de Bruxelles.
--
-- ── Ce qui est supprimé ─────────────────────────────────────────────────────
--
--   1. Les SIX réservations d'essai, toutes antérieures à la mise en ligne et
--      toutes annulées. Cinq portent l'adresse de Mathis ; la sixième
--      (OW-NM5RKH8E, 21 septembre) a été payée en mode test — les clés live
--      datent du 23 —, donc aucun client n'a pu la passer.
--   2. Leurs cinq paiements. Stripe garde les siens, y compris l'essai à 1 € en
--      argent réel du 23 septembre (OW-VSGU5LSX), remboursé : c'est le relevé
--      Stripe qui fait foi en comptabilité, pas cette table.
--   3. Le créneau fermé du vendredi 2 octobre 16h30. La migration 0034 l'avait
--      fermé au lieu de le supprimer pour une seule raison : il portait
--      OW-GXTCUD8X et sa trace de paiement. Cette raison disparaît avec elle.
--   4. Les événements d'audience antérieurs au 24 septembre, 20h00.
--
-- ── Ce qui reste, et pourquoi ───────────────────────────────────────────────
--
--   - OW-CQCRX6LT, la première vraie réservation.
--   - OW-3D5S2ABP (27 septembre, expirée) : une AUTRE personne, qui n'est pas
--     allée au bout du paiement. C'est de l'activité réelle depuis la mise en
--     ligne. Elle n'entre ni dans « réservations » ni dans « encaissé ».
--   - Les deux demandes de devis d'essai du 12 septembre : elles n'entrent dans
--     aucune statistique.
--   - Le journal d'administration : c'est une trace d'audit, pas une mesure.
--
-- ── Garde-fous ──────────────────────────────────────────────────────────────
--
-- Rien n'est supprimé si OW-CQCRX6LT n'est plus confirmée, ou si l'une des six
-- n'est plus annulée ou date d'après la mise en ligne. Le créneau n'est
-- supprimé que s'il est toujours fermé, toujours un vendredi 16h30, et que plus
-- rien ne le référence.

do $$
declare
  essais constant text[] := array[
    'OW-JRUMAL8Y', 'OW-AZEG8RV6', 'OW-GXTCUD8X',
    'OW-NM5RKH8E', 'OW-PKZCVZLG', 'OW-VSGU5LSX'
  ];
  mise_en_ligne constant timestamptz := '2026-09-24 20:00:00+02';
  creneau_essai uuid;
  n integer;
begin
  if not exists (
    select 1 from reservations where reference = 'OW-CQCRX6LT' and statut = 'confirmee'
  ) then
    raise exception 'OW-CQCRX6LT introuvable ou non confirmée : rien n''est supprimé';
  end if;

  select count(*) into n
    from reservations
   where reference = any (essais)
     and statut = 'annulee'
     and created_at < mise_en_ligne;
  if n <> 6 then
    raise exception '% réservation(s) d''essai reconnue(s) sur 6 : rien n''est supprimé', n;
  end if;

  select creneau_id into creneau_essai from reservations where reference = 'OW-GXTCUD8X';

  delete from paiements
   where reservation_id in (select id from reservations where reference = any (essais));
  delete from reservations where reference = any (essais);

  delete from creneaux c
   where c.id = creneau_essai
     and not c.ouvert
     and to_char(c.debut at time zone 'Europe/Brussels', 'ID HH24:MI') = '5 16:30'
     and not exists (select 1 from reservations r where r.creneau_id = c.id)
     and not exists (select 1 from devis_creneaux d where d.creneau_id = c.id);

  delete from evenements_audience where survenu_le < mise_en_ligne;
end $$;
