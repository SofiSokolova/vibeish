-- Reference data: hobby categories and launch cities.
-- Categories must match src/constants/categories.ts (npm run db:test checks this).

insert into public.categories (slug, min_group, max_group, sort_order) values
  ('table_tennis', 2, 4, 10),
  ('badminton', 2, 4, 20),
  ('tennis', 2, 4, 30),
  ('board_games', 3, 6, 40),
  ('chess', 2, 2, 50),
  ('running', 2, 8, 60),
  ('hiking', 2, 10, 70),
  ('climbing', 2, 4, 80),
  ('football', 6, 14, 90),
  ('volleyball', 6, 12, 100),
  ('cycling', 2, 8, 110),
  ('language_exchange', 2, 6, 120)
on conflict (slug) do update
  set min_group = excluded.min_group,
      max_group = excluded.max_group,
      sort_order = excluded.sort_order;

insert into public.cities (slug, country_code, lat, lng, timezone, sort_order) values
  ('tallinn', 'EE', 59.4370, 24.7536, 'Europe/Tallinn', 10),
  ('tartu', 'EE', 58.3780, 26.7290, 'Europe/Tallinn', 20),
  ('helsinki', 'FI', 60.1699, 24.9384, 'Europe/Helsinki', 30),
  ('riga', 'LV', 56.9496, 24.1052, 'Europe/Riga', 40),
  ('vilnius', 'LT', 54.6872, 25.2797, 'Europe/Vilnius', 50)
on conflict (slug) do nothing;
