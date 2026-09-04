-- ============================================================================
-- Demandes de devis : conserver les consentements recueillis
--
-- Le formulaire team building demande l'acceptation des CGV et propose
-- l'inscription à la newsletter. Sans ces deux colonnes, ces réponses étaient
-- collectées puis jetées — ce qui empêche à la fois de prouver l'acceptation et
-- de respecter un consentement marketing donné (RGPD art. 7.1 : le responsable
-- doit être en mesure de démontrer que la personne a consenti).
-- ============================================================================

alter table demandes_devis
  add column if not exists newsletter       boolean     not null default false,
  add column if not exists cgv_acceptees_le timestamptz;

comment on column demandes_devis.cgv_acceptees_le is
  'Horodatage de l''acceptation des CGV, pour pouvoir la démontrer.';
comment on column demandes_devis.newsletter is
  'Consentement marketing explicite. Ne vaut que pour les envois commerciaux.';
