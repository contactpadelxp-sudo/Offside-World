-- ============================================================================
-- Le devis vit sur la demande, et son envoi est un fait, pas une case à cocher
--
-- CE QUI EXISTAIT. Une demande de team building n'était qu'un formulaire reçu.
-- Le back-office proposait cinq boutons d'état — « Prise en charge », « Devis
-- envoyé », « Acceptée », « Refusée » — que l'exploitant cliquait à la main
-- pour se souvenir de ce qu'il avait fait. Le devis lui-même n'existait nulle
-- part : il fallait le rédiger ailleurs, l'envoyer ailleurs, puis revenir
-- cliquer un bouton pour le noter.
--
-- Trois défauts, et ce sont trois sources d'erreur :
--   1. l'état était DÉCLARATIF. Rien ne garantissait qu'un devis marqué
--      « envoyé » l'ait été, ni qu'un devis réellement envoyé soit marqué ;
--   2. le contenu du devis n'était conservé nulle part. Trois mois plus tard,
--      impossible de dire ce qui avait été proposé, ni à quel prix ;
--   3. le client recevait un document qui ne venait pas du système, donc sans
--      les mentions que la loi impose au vendeur.
--
-- CE QUI CHANGE. Le devis est stocké avec la demande — une demande, un devis,
-- donc aucune raison d'une table séparée et de sa jointure. Et `devis_envoye_le`
-- n'est pas un statut qu'on choisit : c'est l'horodatage de l'envoi réel, écrit
-- par le code qui envoie. L'état se LIT, il ne se déclare plus.
--
-- Les lignes sont en JSON plutôt qu'en table dédiée : elles n'ont pas de vie
-- propre, on ne les interroge jamais séparément, et leur nombre varie d'un
-- devis à l'autre. Une table les aurait fait exister pour rien.
--
-- LES MONTANTS SONT EN CENTIMES ENTIERS, comme partout ailleurs dans ce
-- projet. Un prix unitaire en euros flottants finirait par produire un écart
-- d'un centime entre le devis affiché, celui envoyé et celui facturé.
-- ============================================================================

alter table demandes_devis
  add column devis_lignes      jsonb,
  add column devis_message     text,
  add column devis_validite    date,
  add column devis_envoye_le   timestamptz;

-- Garde-fou de forme : `devis_lignes` doit être un TABLEAU, ou rien. Sans
-- cela, un objet ou une chaîne passerait, et le back-office planterait à la
-- lecture d'un devis qu'on ne pourrait plus corriger depuis l'interface.
alter table demandes_devis
  add constraint devis_lignes_est_un_tableau
  check (devis_lignes is null or jsonb_typeof(devis_lignes) = 'array');

comment on column demandes_devis.devis_lignes is
  'Lignes du devis, en JSON : [{designation, quantite, prixUnitaireCents}]. '
  'Montants en centimes entiers. NULL tant qu''aucun devis n''a été rédigé.';

comment on column demandes_devis.devis_message is
  'Mot d''introduction libre, écrit par l''exploitant, repris en tête de '
  'l''e-mail envoyé au client.';

comment on column demandes_devis.devis_validite is
  'Date jusqu''à laquelle l''offre est valable. Un devis sans limite engage '
  'le vendeur indéfiniment sur son prix.';

comment on column demandes_devis.devis_envoye_le is
  'Horodatage de l''envoi RÉEL au client, écrit par le code qui envoie. '
  'Ce n''est pas un statut déclaratif : NULL signifie que rien n''est parti.';
