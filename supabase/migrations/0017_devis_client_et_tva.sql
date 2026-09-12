-- ============================================================================
-- Le devis identifie enfin son destinataire, et sait parler TVA
--
-- CE QUI MANQUAIT. Le formulaire public ne collecte que le NOM de l'entreprise,
-- un contact, un e-mail et un téléphone. C'est suffisant pour rappeler
-- quelqu'un ; c'est insuffisant pour lui adresser un devis. Une société qui
-- reçoit une offre chiffrée la transmet à sa comptabilité, et celle-ci attend
-- deux choses qu'on n'avait pas : l'ADRESSE de facturation et le NUMÉRO DE TVA.
--
-- POURQUOI CES CHAMPS NE SONT PAS AJOUTÉS AU FORMULAIRE PUBLIC. Réclamer un
-- numéro de TVA et une adresse complète à un prospect qui n'a pas encore vu un
-- prix, c'est de la friction sur un formulaire dont le seul but est de faire
-- entrer des demandes. L'exploitant, lui, sera de toute façon en contact avec
-- la société avant d'envoyer son devis : il les saisit à ce moment-là, dans le
-- back-office. Le formulaire reste court, le devis reste complet.
--
-- LE TAUX DE TVA EST FACULTATIF, ET C'EST DÉLIBÉRÉ. Le taux applicable à une
-- privatisation de complexe sportif n'est pas une évidence — l'accès aux
-- installations sportives relève d'un taux réduit, une prestation de services
-- organisée du taux normal, et un forfait mêlant les deux se tranche au cas par
-- cas. Ce n'est pas au code de choisir, et surtout pas par défaut silencieux.
--
-- Tant que la colonne est nulle, le devis s'affiche en TVAC comme aujourd'hui.
-- Renseignée, il détaille base HTVA, TVA et total — ce qu'attend la
-- comptabilité d'un client professionnel. La bascule est un choix conscient,
-- à faire confirmer par le comptable de l'exploitant.
-- ============================================================================

alter table demandes_devis
  add column client_adresse      text,
  add column client_tva          text,
  add column devis_tva_pourcent  smallint;

-- Un taux de TVA belge plausible, ou rien. 0 est autorisé : il existe des
-- opérations exonérées, et les distinguer d'un taux « non renseigné » est
-- précisément ce que la nullité de la colonne permet.
alter table demandes_devis
  add constraint devis_tva_plausible
  check (devis_tva_pourcent is null or devis_tva_pourcent between 0 and 25);

comment on column demandes_devis.client_adresse is
  'Adresse de facturation de la société cliente, saisie au back-office. Le '
  'formulaire public ne la demande pas : trop de friction sur un formulaire de '
  'prise de contact.';

comment on column demandes_devis.client_tva is
  'Numéro de TVA de la société cliente, saisi au back-office. Attendu par sa '
  'comptabilité sur un devis B2B.';

comment on column demandes_devis.devis_tva_pourcent is
  'Taux de TVA appliqué au devis, en pourcent. NULL signifie « non renseigné » '
  'et le devis s''affiche alors en TVAC sans détail — ce n''est pas la même '
  'chose que 0, qui signifie exonéré. Le taux applicable à une privatisation '
  'de complexe sportif doit être confirmé par un comptable.';
