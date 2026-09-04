-- ============================================================================
-- Référentiel initial — reprend à l'identique les valeurs de src/data/
--
-- Une fois ces lignes en base, src/data/formules.ts et src/data/bubble-team.ts
-- ne doivent plus servir de source de prix : le serveur lit la base. Les garder
-- en dur créerait deux vérités qui divergeraient au premier changement de tarif.
-- ============================================================================

insert into espaces (id, nom, capacite) values
  ('espace-1', 'Espace anniversaire 1', 20),
  ('espace-2', 'Espace anniversaire 2', 20)
on conflict (id) do nothing;

insert into formules
  (id, nom, accroche, description, prix_base_cents, enfants_inclus,
   prix_enfant_sup_cents, enfants_max, duree_minutes, inclus, image, ordre)
values
  ('kick-off', 'Kick-Off', 'Je joue avec mes amis',
   'La formule idéale pour profiter d''un anniversaire 100 % foot en toute liberté.',
   18000, 10, 1000, 20, 120,
   array[
     '2 heures de Football Indoor',
     'Terrain réservé pour le groupe',
     'Ballons et chasubles à disposition',
     'Accès aux vestiaires',
     'Espace réservé pour le gâteau',
     'Vidéo souvenir de l''anniversaire',
     'Décoration de l''espace anniversaire',
     'Assiettes, gobelets et serviettes',
     'Eau, menthe et grenadine à volonté'
   ],
   '/images/anniv.jpg', 1),

  ('bubble', 'Bubble', 'Je veux l''expérience la plus fun',
   'L''anniversaire Offside dans sa version la plus fun ! Une expérience qui mélange Football Indoor et Bubble Foot pour un maximum de rires et de souvenirs.',
   29000, 10, 1500, 20, 120,
   array[
     '1 heure de Bubble Foot',
     'Animateur Bubble dédié',
     '1 heure de Football Indoor',
     'Bulles et matériel compris',
     'Terrain réservé pour le groupe',
     'Vidéo souvenir de l''anniversaire',
     'Décoration de l''espace anniversaire',
     'Assiettes, gobelets et serviettes',
     'Eau, menthe et grenadine à volonté',
     'Espace réservé pour le gâteau'
   ],
   '/images/anniv1.jpg', 2)
on conflict (id) do nothing;

insert into options (id, libelle, description, prix_cents) values
  ('photo',  'Pack photo souvenir', 'Photos de groupe + individuelles imprimées', 2000),
  ('pinata', 'Piñata',              'Piñata remplie de bonbons',                  3000)
on conflict (id) do nothing;

-- Bubble Foot : 23 €/personne, minimum 6, 1 heure.
-- Volontairement pas dans `formules` (tarification à la personne, pas au forfait).
-- À porter en configuration applicative ou dans une table dédiée si les tarifs
-- doivent devenir modifiables sans redéploiement.
