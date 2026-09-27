-- ============================================================================
-- Les deux demandes de devis d'essai du 12 septembre
--                                                        — 27 septembre 2026
-- ============================================================================
--
-- Suite de 0038, demandée par Mathis le même jour. TB-RGFRXS39 et TB-2XD5YCL7
-- ont été créées le 12 septembre 2026, douze jours avant la mise en ligne,
-- pour éprouver le parcours du devis. Elles n'entraient dans aucune
-- statistique, mais Brahim les voyait dans « Devis » comme des demandes
-- acceptées.
--
-- Aucune ne tient de créneau (`devis_creneaux` vide pour elles : elles datent
-- d'avant la migration 0036). Rien n'est supprimé si l'une d'elles date d'après
-- la mise en ligne.

do $$
declare
  essais constant text[] := array['TB-RGFRXS39', 'TB-2XD5YCL7'];
  n integer;
begin
  select count(*) into n
    from demandes_devis
   where reference = any (essais)
     and created_at < '2026-09-24 20:00:00+02';
  if n <> 2 then
    raise exception '% demande(s) d''essai reconnue(s) sur 2 : rien n''est supprimé', n;
  end if;

  delete from demandes_devis where reference = any (essais);
end $$;
