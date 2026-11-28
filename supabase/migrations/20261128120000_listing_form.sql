-- =============================================================================
-- What the create form asks about a meetup (a listing):
-- - who it is for: a skill level from 1 to 3, or any level;
-- - how many people are already going with the author, besides the total;
-- - a day whose time is agreed in the chat.
-- The minimum group size goes: the form no longer asks for it.
-- =============================================================================

alter table public.listings
  add column skill_level smallint check (skill_level between 1 and 3),
  add column already_going smallint not null default 1 check (already_going between 1 and 49),
  add column time_tbd boolean not null default false;

comment on column public.listings.skill_level is
  'Who the meetup is for: 1 beginners, 2 experienced, 3 pros. Null when any level is welcome.';
comment on column public.listings.already_going is
  'People going before anyone applies, counting the author: the author and the friends they bring.';
comment on column public.listings.time_tbd is
  'The time is agreed in the chat. starts_at then holds 23:59 of that day in the city''s time zone.';
comment on column public.listings.group_max is 'Group size, counting the author.';
comment on column public.listings.accepted_count is
  'Accepted applicants, not counting the people already going. Kept up to date by accept/withdraw functions.';

-- Free spots now leave room for the people the author brings. The old rule had no
-- name of its own, so it is found by what it checks.
do $$
declare
  v_name text;
begin
  select conname into strict v_name
    from pg_constraint
   where conrelid = 'public.listings'::regclass
     and contype = 'c'
     and pg_get_constraintdef(oid) like '%accepted_count + 1%';
  execute format('alter table public.listings drop constraint %I', v_name);
end;
$$;

alter table public.listings
  add constraint listings_capacity_check check (already_going + accepted_count <= group_max);

-- The feed returns different columns, so it is dropped before group_min goes and
-- created again below.
drop function public.feed_listings(double precision, double precision, double precision, text, integer);

alter table public.listings drop column group_min;

grant insert (skill_level, already_going, time_tbd) on public.listings to authenticated;
grant update (skill_level, already_going, time_tbd) on public.listings to authenticated;


-- Listings for the swipe feed: approved, open, upcoming, with free spots, within
-- p_radius_km of the given point, not the caller's own and not swiped before.
-- Runs with the caller's rights, so blocked and banned authors are filtered out
-- by the access rules on listings.
create function public.feed_listings(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision default 25,
  p_category text default null,
  p_limit integer default 30
)
returns table (
  id uuid,
  author_id uuid,
  category text,
  skill_level smallint,
  title text,
  description text,
  starts_at timestamptz,
  time_tbd boolean,
  duration_minutes smallint,
  city text,
  place_name text,
  lat double precision,
  lng double precision,
  distance_km double precision,
  group_max smallint,
  spots_left integer,
  cost_type text,
  cost_eur numeric,
  languages text[]
)
language sql
stable
security invoker
set search_path = ''
as $$
  with area as (
    select r.radius_km,
           r.radius_km / 111.32 as dlat,
           r.radius_km / (111.32 * greatest(cos(radians(p_lat)), 0.01)) as dlng
      from (select least(greatest(p_radius_km, 1), 200) as radius_km) r
  )
  select l.id,
         l.author_id,
         l.category,
         l.skill_level,
         l.title,
         l.description,
         l.starts_at,
         l.time_tbd,
         l.duration_minutes,
         l.city,
         l.place_name,
         l.lat,
         l.lng,
         public.distance_km(p_lat, p_lng, l.lat, l.lng),
         l.group_max,
         (l.group_max - l.already_going - l.accepted_count)::integer,
         l.cost_type,
         l.cost_eur,
         l.languages
    from public.listings l
   cross join area a
   where l.status = 'open'
     and l.moderation_status = 'approved'
     and l.starts_at > now()
     and l.already_going + l.accepted_count < l.group_max
     and l.author_id <> (select auth.uid())
     and (p_category is null or l.category = p_category)
     and l.lat between p_lat - a.dlat and p_lat + a.dlat
     and l.lng between p_lng - a.dlng and p_lng + a.dlng
     and public.distance_km(p_lat, p_lng, l.lat, l.lng) <= a.radius_km
     and not exists (
       select 1 from public.swipes s
        where s.user_id = (select auth.uid()) and s.listing_id = l.id
     )
   order by l.starts_at
   limit least(greatest(p_limit, 1), 100);
$$;

revoke execute on function public.feed_listings(double precision, double precision, double precision, text, integer)
  from public, anon, authenticated;
grant execute on function public.feed_listings(double precision, double precision, double precision, text, integer)
  to authenticated, service_role;


-- Someone may apply while there is a free spot after the people already going.
create or replace function private.can_apply(p_listing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.listings l
     where l.id = p_listing_id
       and l.status = 'open'
       and l.moderation_status = 'approved'
       and l.starts_at > now()
       and l.already_going + l.accepted_count < l.group_max
       and l.author_id <> (select auth.uid())
       and not private.is_banned(l.author_id)
       and not private.is_blocked_with(l.author_id)
  );
$$;

-- The listing's author accepts an applicant: both get into the listing's chat.
create or replace function public.accept_application(p_application_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_application public.applications;
  v_listing public.listings;
  v_chat_id uuid;
begin
  select * into v_application from public.applications where id = p_application_id for update;
  if not found then
    raise exception 'application_not_found' using errcode = 'P0002';
  end if;

  select * into v_listing from public.listings where id = v_application.listing_id for update;
  if v_listing.author_id is distinct from auth.uid() then
    raise exception 'not_listing_author' using errcode = '42501';
  end if;
  if v_application.status <> 'pending' then
    raise exception 'application_not_pending' using errcode = '22023';
  end if;
  if v_listing.status <> 'open' or v_listing.starts_at <= now() then
    raise exception 'listing_closed' using errcode = '22023';
  end if;
  if v_listing.already_going + v_listing.accepted_count >= v_listing.group_max then
    raise exception 'listing_full' using errcode = '22023';
  end if;

  update public.applications
     set status = 'accepted', decided_at = now()
   where id = v_application.id;

  update public.listings
     set accepted_count = accepted_count + 1
   where id = v_listing.id;

  insert into public.chats (listing_id) values (v_listing.id)
  on conflict (listing_id) do nothing;
  select id into v_chat_id from public.chats where listing_id = v_listing.id;

  insert into public.chat_members (chat_id, user_id, role)
  values (v_chat_id, v_listing.author_id, 'author'),
         (v_chat_id, v_application.applicant_id, 'member')
  on conflict (chat_id, user_id) do nothing;
end;
$$;


-- Makes a meetup from the create form. The day and time are local to the meetup's
-- city; without a time the meetup is set for that day and the time is agreed in
-- the chat. Runs with the caller's rights, so the access rules on listings decide
-- who may create one, and the new meetup waits for moderation like any other.
create function public.create_listing(
  p_category text,
  p_skill_level smallint,
  p_title text,
  p_description text,
  p_day date,
  p_time time,
  p_city text,
  p_place_name text,
  p_lat double precision,
  p_lng double precision,
  p_already_going smallint,
  p_group_max smallint,
  p_cost_type text,
  p_cost_eur numeric,
  p_languages text[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_timezone text;
  v_id uuid;
begin
  select c.timezone into v_timezone from public.cities c where c.slug = p_city and c.is_active;
  if v_timezone is null then
    raise exception 'unknown_city' using errcode = '22023';
  end if;
  if p_already_going >= p_group_max then
    raise exception 'no_free_spots' using errcode = '22023';
  end if;

  insert into public.listings (
    category, skill_level, title, description, starts_at, time_tbd, city, place_name, lat, lng,
    already_going, group_max, cost_type, cost_eur, languages
  )
  values (
    p_category, p_skill_level, btrim(p_title), btrim(coalesce(p_description, '')),
    (p_day + coalesce(p_time, time '23:59')) at time zone v_timezone, p_time is null,
    p_city, btrim(p_place_name), p_lat, p_lng,
    p_already_going, p_group_max, p_cost_type, p_cost_eur, coalesce(p_languages, '{}')
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- New functions are executable by everyone by default; only signed-in users and the
-- server may call this one.
revoke execute on function public.create_listing(text, smallint, text, text, date, time, text, text,
  double precision, double precision, smallint, smallint, text, numeric, text[])
  from public, anon, authenticated;
grant execute on function public.create_listing(text, smallint, text, text, date, time, text, text,
  double precision, double precision, smallint, smallint, text, numeric, text[])
  to authenticated, service_role;
