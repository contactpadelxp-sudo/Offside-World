-- ============================================================================
-- Le team building devient une activité à créneaux — 24 septembre 2026
-- ============================================================================
--
-- Cette migration ne fait QU'UNE chose, et c'est voulu : ajouter la valeur
-- `team_building` au type `type_activite`.
--
-- Postgres interdit d'UTILISER une valeur d'énumération dans la transaction
-- qui la crée (« unsafe use of new value »). Or une migration s'applique dans
-- une seule transaction. Tout ce qui s'en sert — les créneaux, la vue, le
-- générateur — vit donc dans la migration suivante, 0036.
--
-- Sans conséquence pour le code déjà déployé : il ne lit que `anniversaire`
-- et `bubble`, et une valeur de plus dans l'énumération ne change rien à ce
-- qu'il écrit ou lit.

alter type type_activite add value if not exists 'team_building';
