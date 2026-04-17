-- Seed 15 well-known anime series with 3 drawable objects each.

insert into public.custom_anime_hints (mal_id, title, categorie, hint_1, hint_2, hint_3) values
  (20,    'Naruto',                              'Klassieker', 'Oranje jumpsuit',   'Hoofdband met ninja-symbool', 'Kunai-mes'),
  (21,    'One Piece',                           'Klassieker', 'Rode strohoed',     'Skull-and-crossbones vlag',   'Log Pose kompas'),
  (1535,  'Death Note',                          'Klassieker', 'Zwart notitieboek', 'Rood-appel',                  'Doodsengel Ryuk'),
  (813,   'Dragon Ball Z',                       'Klassieker', 'Dragon Ball (4-ster)', 'Saiyan scouter',           'Kamehameha-straal'),
  (5114,  'Fullmetal Alchemist: Brotherhood',    'Klassieker', 'Rode alchemie-cirkel', 'Metalen arm',              'Kleine witte handschoen'),
  (269,   'Bleach',                              'Klassieker', 'Zanpakutou-zwaard', 'Hollow masker',               'Shinigami-robe'),
  (11061, 'Hunter x Hunter',                     'Klassieker', 'Hunter-licentiekaart', 'Gon''s visrod',            'Kurapika''s kettingen'),
  (16498, 'Attack on Titan',                     'Modern',     '3D-manoeuvregear',  'Scout-regiment vleugel-logo', 'Kolossale titan hoofd'),
  (31964, 'My Hero Academia',                    'Modern',     'All Might hoofd',   'Groene haarplukken (Deku)',   'Rode cape'),
  (38000, 'Demon Slayer',                        'Modern',     'Geruit haori-patroon', 'Nichirin katana',          'Bamboe mond-stuk'),
  (40748, 'Jujutsu Kaisen',                      'Modern',     'Blauwe blinddoek',  'Zwarte vinger (Sukuna)',      'Domain expansion-bol'),
  (44511, 'Chainsaw Man',                        'Nieuwe Hype','Kettingzaag-hoofd','Pochita hondje',               'Duivelscontract-papier'),
  (50265, 'Spy x Family',                        'Nieuwe Hype','Anya''s roze haarspeld', 'Peanut',                 'Pistool met stealth silencer'),
  (52991, 'Frieren: Beyond Journey''s End',      'Nieuwe Hype','Elf met spitse oren', 'Witte toverstaf',           'Flikkerend leesboek'),
  (52299, 'Solo Leveling',                       'Nieuwe Hype','Dagger met blauwe gloed', 'Schaduwsoldaat (Igris)', 'Status-venster UI')
on conflict (mal_id) do update set
  title = excluded.title,
  categorie = excluded.categorie,
  hint_1 = excluded.hint_1,
  hint_2 = excluded.hint_2,
  hint_3 = excluded.hint_3,
  updated_at = now();
