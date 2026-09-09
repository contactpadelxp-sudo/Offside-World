-- ============================================================================
-- Les remboursements laissent une trace
--
-- CE QUI MANQUAIT. La table `paiements` savait dire qu'un paiement avait été
-- « rembourse » ou « partiellement_rembourse » — les deux valeurs existent dans
-- l'énumération depuis le premier jour — mais elle n'avait aucun endroit où
-- écrire COMBIEN. Un remboursement partiel se serait donc résumé à un statut,
-- sans montant : impossible de dire, trois mois plus tard, si les 50 % promis
-- par le barème d'annulation avaient été rendus, ni de rembourser le solde sans
-- risquer de rembourser deux fois.
--
-- Le montant remboursé est une écriture comptable. Il ne se déduit pas d'un
-- statut, et il ne se retrouve pas « dans Stripe » : Stripe est un prestataire,
-- pas notre livre de comptes, et l'exploitant doit pouvoir répondre à un client
-- sans ouvrir un tableau de bord tiers.
--
-- LA CONTRAINTE EST DÉLIBÉRÉMENT SÉVÈRE. On ne peut pas rendre plus qu'on n'a
-- reçu. C'est la seule erreur de ce module qui coûterait de l'argent réel, et
-- la base la refuse plutôt que de faire confiance au code appelant.
-- ============================================================================

alter table paiements
  add column montant_rembourse_cents integer not null default 0;

alter table paiements
  add constraint paiements_remboursement_plausible
  check (montant_rembourse_cents >= 0 and montant_rembourse_cents <= montant_cents);

comment on column paiements.montant_rembourse_cents is
  'Cumul remboursé au client, en centimes. Reste à 0 pour un paiement intact. '
  'Le statut « partiellement_rembourse » signifie 0 < montant_rembourse_cents < '
  'montant_cents ; « rembourse » signifie l''égalité.';
