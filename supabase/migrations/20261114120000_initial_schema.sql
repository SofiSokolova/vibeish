-- =============================================================================
-- Vibeish: initial schema
-- =============================================================================
-- Rules this schema follows:
--   * Every table has row level security (RLS) enabled.
--   * Clients (the anon and authenticated roles) get only the privileges granted
--     at the end of this file. Columns the server owns (moderation, counters,
--     bans) are never granted to them.
--   * Multi-step actions (onboarding, accepting an applicant, ...) are security
--     definer functions that check the caller themselves.
--   * Every function sets search_path = '' and schema-qualifies all names.
--   * Coordinates are plain latitude/longitude in degrees and distances use the
--     haversine formula; PostGIS can be added later if we need shapes.
-- Tests: npm run db:test
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Utilities
-- -----------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Great-circle distance between two points, in kilometres.
create function public.distance_km(
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision
)
returns double precision
language sql
immutable
parallel safe
set search_path = ''
as $$
  select 6371.0088 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;


-- -----------------------------------------------------------------------------
-- Reference data
-- -----------------------------------------------------------------------------

create table public.categories (
  slug text primary key check (slug ~ '^[a-z][a-z_]*$'),
  min_group smallint not null check (min_group between 2 and 50),
  max_group smallint not null,
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  check (max_group between min_group and 50)
);
comment on table public.categories is
  'Hobby categories. Slugs match src/constants/categories.ts; names are translated in the app (category.<slug>).';

create table public.cities (
  slug text primary key check (slug ~ '^[a-z][a-z_]*$'),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  timezone text not null,
  sort_order smallint not null default 0,
  is_active boolean not null default true
);
comment on table public.cities is
  'Cities people can choose. Names are translated in the app (city.<slug>).';


-- -----------------------------------------------------------------------------
-- People
-- -----------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 50),
  bio text not null default '' check (char_length(bio) <= 500),
  avatar_path text check (char_length(avatar_path) <= 300),
  languages text[] not null default '{}'
    check (array_to_string(languages, ',') ~ '^([a-z]{2}(,[a-z]{2}){0,9})?$'),
  home_city text references public.cities (slug),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is
  'Public part of a profile, visible to other signed-in users. Created by complete_onboarding().';
comment on column public.profiles.languages is 'Languages the person speaks, as ISO 639-1 codes.';

create table public.profile_private (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  birth_date date not null,
  ui_language text not null default 'en' check (ui_language in ('en', 'et', 'ru', 'uk', 'fi', 'lv')),
  created_at timestamptz not null default now()
);
comment on table public.profile_private is
  'Private part of a profile, visible only to its owner. The birth date cannot be changed after onboarding.';
comment on column public.profile_private.ui_language is
  'App language, used by the server for push notifications and emails.';

create table public.admins (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
comment on table public.admins is 'Moderators. Added by hand (dashboard or service role), never by clients.';

create table public.user_bans (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 500),
  banned_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
comment on table public.user_bans is
  'Banned users. They can still read, but cannot post, apply or send messages. The user sees the reason.';

create table public.user_interests (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  category text not null references public.categories (slug),
  skill_level smallint check (skill_level between 1 and 3),
  created_at timestamptz not null default now(),
  primary key (user_id, category)
);
comment on column public.user_interests.skill_level is
  '1 = beginner, 2 = intermediate, 3 = advanced, null = not specified.';

create table public.blocks (
  blocker_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index blocks_blocked_id_idx on public.blocks (blocked_id);


-- -----------------------------------------------------------------------------
-- Listings, applications, swipes
-- -----------------------------------------------------------------------------

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  category text not null references public.categories (slug),
  title text not null check (char_length(title) between 3 and 80),
  description text not null default '' check (char_length(description) <= 1000),
  starts_at timestamptz not null,
  duration_minutes smallint check (duration_minutes between 15 and 1440),
  city text not null references public.cities (slug),
  place_name text not null check (char_length(place_name) between 1 and 120),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  group_min smallint not null check (group_min between 2 and 50),
  group_max smallint not null check (group_max between 2 and 50),
  cost_type text not null default 'free' check (cost_type in ('free', 'split', 'paid')),
  cost_eur numeric(8, 2) check (cost_eur > 0),
  languages text[] not null default '{}'
    check (array_to_string(languages, ',') ~ '^([a-z]{2}(,[a-z]{2}){0,9})?$'),
  status text not null default 'open' check (status in ('open', 'cancelled')),
  moderation_status text not null default 'pending'
    check (moderation_status in ('pending', 'approved', 'rejected')),
  moderation_reason text,
  accepted_count smallint not null default 0 check (accepted_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (group_max >= group_min),
  check ((cost_type = 'free') = (cost_eur is null)),
  check (accepted_count + 1 <= group_max)
);
comment on column public.listings.group_min is 'Group size, counting the author.';
comment on column public.listings.cost_eur is 'Cost per person in euros; null when the listing is free.';
comment on column public.listings.moderation_reason is 'Shown to the author when moderation rejects the listing.';
comment on column public.listings.accepted_count is
  'Accepted applicants, not counting the author. Kept up to date by accept/withdraw functions.';
create index listings_feed_idx on public.listings (starts_at)
  where status = 'open' and moderation_status = 'approved';
create index listings_position_idx on public.listings (lat, lng);
create index listings_author_idx on public.listings (author_id);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  applicant_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  note text not null default '' check (char_length(note) <= 300),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'withdrawn')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (listing_id, applicant_id)
);
create index applications_applicant_idx on public.applications (applicant_id);

create table public.swipes (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  direction text not null check (direction in ('left', 'right')),
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
create index swipes_listing_idx on public.swipes (listing_id);


-- -----------------------------------------------------------------------------
-- Chats
-- -----------------------------------------------------------------------------

create table public.chats (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null unique references public.listings (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.chat_members (
  chat_id uuid not null references public.chats (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('author', 'member')),
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (chat_id, user_id)
);
create index chat_members_user_idx on public.chat_members (user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats (id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  moderated_at timestamptz,
  hidden_at timestamptz,
  hidden_reason text
);
comment on column public.messages.hidden_at is
  'Set by moderation. A hidden message stays visible to its sender only, with hidden_reason.';
create index messages_chat_created_idx on public.messages (chat_id, created_at);
create index messages_sender_idx on public.messages (sender_id);


-- -----------------------------------------------------------------------------
-- Beacons, reports, push tokens, places
-- -----------------------------------------------------------------------------

create table public.beacons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  category text not null references public.categories (slug),
  city text not null references public.cities (slug),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, category, city)
);
comment on table public.beacons is
  'Interest beacons: "I want to do <category> in <city>". Private to their owner; matched on the server.';
create index beacons_match_idx on public.beacons (category, city) where is_active;

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid default auth.uid() references public.profiles (id) on delete set null,
  target_user_id uuid references public.profiles (id) on delete set null,
  target_listing_id uuid references public.listings (id) on delete set null,
  target_message_id uuid references public.messages (id) on delete set null,
  reason text not null check (reason in ('spam', 'harassment', 'inappropriate', 'scam', 'safety', 'other')),
  details text not null default '' check (char_length(details) <= 1000),
  target_snapshot jsonb,
  ai_assessment jsonb,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolution_note text,
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
comment on column public.reports.target_snapshot is
  'Copy of the reported content at report time, so moderators still see it if it is deleted.';
create index reports_open_idx on public.reports (created_at) where status = 'open';
create index reports_reporter_idx on public.reports (reporter_id);

create table public.push_tokens (
  token text primary key check (char_length(token) between 1 and 500),
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null check (platform in ('android', 'ios', 'web')),
  updated_at timestamptz not null default now()
);
create index push_tokens_user_idx on public.push_tokens (user_id);

create table public.osm_places (
  osm_type text not null check (osm_type in ('node', 'way', 'relation')),
  osm_id bigint not null,
  name text,
  category text references public.categories (slug),
  city text references public.cities (slug),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  tags jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (osm_type, osm_id)
);
comment on table public.osm_places is
  'Places imported from OpenStreetMap (ODbL: attribution required), suggested when creating a listing.';
create index osm_places_position_idx on public.osm_places (lat, lng);


-- -----------------------------------------------------------------------------
-- Helper functions used by the access rules
-- -----------------------------------------------------------------------------
-- They are security definer so that a rule on one table can look at another
-- table without that table's own rules getting in the way (and without the
-- rules of two tables calling each other forever).

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

create function public.is_banned(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.user_bans where user_id = p_user_id);
$$;

-- The caller has finished onboarding and is not banned.
create function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()))
     and not exists (select 1 from public.user_bans where user_id = (select auth.uid()));
$$;

-- The caller and p_other have blocked each other, in either direction.
create function public.is_blocked_with(p_other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.blocks
     where (blocker_id = (select auth.uid()) and blocked_id = p_other)
        or (blocker_id = p_other and blocked_id = (select auth.uid()))
  );
$$;

create function public.is_chat_member(p_chat_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.chat_members where chat_id = p_chat_id and user_id = (select auth.uid())
  );
$$;

create function public.is_listing_author(p_listing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.listings where id = p_listing_id and author_id = (select auth.uid())
  );
$$;

create function public.has_applied(p_listing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.applications where listing_id = p_listing_id and applicant_id = (select auth.uid())
  );
$$;

-- The listing takes applications and the caller may apply to it.
create function public.can_apply(p_listing_id uuid)
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
       and l.accepted_count + 1 < l.group_max
       and l.author_id <> (select auth.uid())
       and not public.is_banned(l.author_id)
       and not public.is_blocked_with(l.author_id)
  );
$$;


-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger listings_set_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

-- Editing the visible text of a listing sends it back to moderation, unless the
-- update is itself a moderation decision.
create function public.listings_require_review()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.title, new.description, new.place_name) is distinct from (old.title, old.description, old.place_name)
     and new.moderation_status is not distinct from old.moderation_status then
    new.moderation_status := 'pending';
    new.moderation_reason := null;
  end if;
  return new;
end;
$$;

create trigger listings_require_review
  before update on public.listings
  for each row execute function public.listings_require_review();

-- Fills in who is being reported and keeps a copy of the reported content.
create function public.reports_fill_target()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.target_message_id is not null then
    select m.sender_id,
           jsonb_build_object('type', 'message', 'body', m.body, 'chat_id', m.chat_id, 'sent_at', m.created_at)
      into new.target_user_id, new.target_snapshot
      from public.messages m
     where m.id = new.target_message_id;
  elsif new.target_listing_id is not null then
    select l.author_id,
           jsonb_build_object('type', 'listing', 'title', l.title, 'description', l.description,
                              'place_name', l.place_name)
      into new.target_user_id, new.target_snapshot
      from public.listings l
     where l.id = new.target_listing_id;
  elsif new.target_user_id is not null then
    select jsonb_build_object('type', 'profile', 'display_name', p.display_name, 'bio', p.bio)
      into new.target_snapshot
      from public.profiles p
     where p.id = new.target_user_id;
  end if;
  return new;
end;
$$;

create trigger reports_fill_target
  before insert on public.reports
  for each row execute function public.reports_fill_target();

-- Records who resolved a report and when.
create function public.reports_track_resolution()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'open' then
      new.resolved_by := null;
      new.resolved_at := null;
    else
      new.resolved_by := auth.uid();
      new.resolved_at := now();
    end if;
  end if;
  return new;
end;
$$;

create trigger reports_track_resolution
  before update on public.reports
  for each row execute function public.reports_track_resolution();


-- -----------------------------------------------------------------------------
-- Functions the app calls (RPC)
-- -----------------------------------------------------------------------------

-- Creates the caller's profile. Only adults can finish onboarding.
create function public.complete_onboarding(
  p_display_name text,
  p_birth_date date,
  p_languages text[] default '{}',
  p_home_city text default null,
  p_ui_language text default 'en'
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_birth_date is null or p_birth_date > (current_date - interval '18 years')::date then
    raise exception 'must_be_adult' using errcode = '22023';
  end if;
  if p_birth_date < (current_date - interval '120 years')::date then
    raise exception 'invalid_birth_date' using errcode = '22023';
  end if;

  insert into public.profiles (id, display_name, languages, home_city)
  values (v_user_id, p_display_name, coalesce(p_languages, '{}'), p_home_city)
  returning * into v_profile;

  insert into public.profile_private (user_id, birth_date, ui_language)
  values (v_user_id, p_birth_date, coalesce(p_ui_language, 'en'));

  return v_profile;
end;
$$;

-- Records a swipe; a right swipe also sends an application with an optional note.
-- Runs with the caller's rights, so the access rules apply as usual.
create function public.swipe_listing(p_listing_id uuid, p_direction text, p_note text default '')
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.swipes (listing_id, direction)
  values (p_listing_id, p_direction)
  on conflict (user_id, listing_id) do nothing;

  if p_direction = 'right' then
    insert into public.applications (listing_id, note)
    values (p_listing_id, coalesce(p_note, ''));
  end if;
end;
$$;

-- The listing's author accepts an applicant: both get into the listing's chat.
create function public.accept_application(p_application_id uuid)
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
  if v_listing.accepted_count + 1 >= v_listing.group_max then
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

create function public.decline_application(p_application_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_application public.applications;
begin
  select * into v_application from public.applications where id = p_application_id for update;
  if not found then
    raise exception 'application_not_found' using errcode = 'P0002';
  end if;
  if not public.is_listing_author(v_application.listing_id) then
    raise exception 'not_listing_author' using errcode = '42501';
  end if;
  if v_application.status <> 'pending' then
    raise exception 'application_not_pending' using errcode = '22023';
  end if;

  update public.applications
     set status = 'declined', decided_at = now()
   where id = v_application.id;
end;
$$;

-- The applicant changes their mind. If they were accepted, their spot is freed
-- and they leave the chat.
create function public.withdraw_application(p_application_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_application public.applications;
begin
  select * into v_application from public.applications where id = p_application_id for update;
  if not found or v_application.applicant_id is distinct from auth.uid() then
    raise exception 'application_not_found' using errcode = 'P0002';
  end if;
  if v_application.status not in ('pending', 'accepted') then
    raise exception 'application_not_active' using errcode = '22023';
  end if;

  update public.applications
     set status = 'withdrawn', decided_at = now()
   where id = v_application.id;

  if v_application.status = 'accepted' then
    update public.listings
       set accepted_count = accepted_count - 1
     where id = v_application.listing_id;

    delete from public.chat_members cm
     using public.chats c
     where c.listing_id = v_application.listing_id
       and cm.chat_id = c.id
       and cm.user_id = v_application.applicant_id;
  end if;
end;
$$;

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
  title text,
  description text,
  starts_at timestamptz,
  duration_minutes smallint,
  city text,
  place_name text,
  lat double precision,
  lng double precision,
  distance_km double precision,
  group_min smallint,
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
         l.title,
         l.description,
         l.starts_at,
         l.duration_minutes,
         l.city,
         l.place_name,
         l.lat,
         l.lng,
         public.distance_km(p_lat, p_lng, l.lat, l.lng),
         l.group_min,
         l.group_max,
         (l.group_max - 1 - l.accepted_count)::integer,
         l.cost_type,
         l.cost_eur,
         l.languages
    from public.listings l
   cross join area a
   where l.status = 'open'
     and l.moderation_status = 'approved'
     and l.starts_at > now()
     and l.accepted_count + 1 < l.group_max
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

-- Saves the device's push token for the caller. A token that belonged to someone
-- else (another account on the same phone) moves to the caller.
create function public.register_push_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  insert into public.push_tokens (token, user_id, platform)
  values (p_token, auth.uid(), p_platform)
  on conflict (token) do update
    set user_id = excluded.user_id,
        platform = excluded.platform,
        updated_at = now();
end;
$$;


-- -----------------------------------------------------------------------------
-- Moderation functions (admins only)
-- -----------------------------------------------------------------------------

create function public.admin_moderate_listing(
  p_listing_id uuid,
  p_decision text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'invalid_decision' using errcode = '22023';
  end if;

  update public.listings
     set moderation_status = p_decision, moderation_reason = p_reason
   where id = p_listing_id;
end;
$$;

create function public.admin_hide_message(p_message_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  update public.messages
     set hidden_at = now(), hidden_reason = p_reason, moderated_at = now()
   where id = p_message_id;
end;
$$;

create function public.admin_ban_user(p_user_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  insert into public.user_bans (user_id, reason, banned_by)
  values (p_user_id, p_reason, auth.uid())
  on conflict (user_id) do update
    set reason = excluded.reason, banned_by = excluded.banned_by, created_at = now();
end;
$$;

create function public.admin_unban_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  delete from public.user_bans where user_id = p_user_id;
end;
$$;


-- -----------------------------------------------------------------------------
-- Privileges
-- -----------------------------------------------------------------------------
-- Supabase grants everything to anon and authenticated by default. Take it all
-- back and grant only what the app needs; RLS policies below then decide which
-- rows each user can touch.

revoke all on all tables in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

grant select on public.categories, public.cities to anon, authenticated;
grant select on public.osm_places to authenticated;

grant select on public.profiles to authenticated;
grant update (display_name, bio, avatar_path, languages, home_city) on public.profiles to authenticated;

grant select on public.profile_private to authenticated;
grant update (ui_language) on public.profile_private to authenticated;

grant select on public.admins, public.user_bans to authenticated;

grant select, delete on public.user_interests to authenticated;
grant insert (category, skill_level) on public.user_interests to authenticated;
grant update (skill_level) on public.user_interests to authenticated;

grant select, delete on public.blocks to authenticated;
grant insert (blocked_id) on public.blocks to authenticated;

grant select on public.listings to authenticated;
grant insert (category, title, description, starts_at, duration_minutes, city, place_name, lat, lng,
              group_min, group_max, cost_type, cost_eur, languages)
  on public.listings to authenticated;
grant update (title, description, starts_at, duration_minutes, place_name, lat, lng,
              group_min, group_max, cost_type, cost_eur, languages, status)
  on public.listings to authenticated;

grant select on public.applications to authenticated;
grant insert (listing_id, note) on public.applications to authenticated;

grant select on public.swipes to authenticated;
grant insert (listing_id, direction) on public.swipes to authenticated;

grant select on public.chats, public.chat_members to authenticated;
grant update (last_read_at) on public.chat_members to authenticated;

grant select on public.messages to authenticated;
-- The app may choose the message id itself, to show the message before the server confirms it.
grant insert (id, chat_id, body) on public.messages to authenticated;

grant select, delete on public.beacons to authenticated;
grant insert (category, city) on public.beacons to authenticated;
grant update (is_active) on public.beacons to authenticated;

grant select on public.reports to authenticated;
grant insert (target_user_id, target_listing_id, target_message_id, reason, details)
  on public.reports to authenticated;
grant update (status, resolution_note) on public.reports to authenticated;

grant select, delete on public.push_tokens to authenticated;

grant execute on function
  public.distance_km(double precision, double precision, double precision, double precision),
  public.is_admin(),
  public.is_banned(uuid),
  public.is_active_user(),
  public.is_blocked_with(uuid),
  public.is_chat_member(uuid),
  public.is_listing_author(uuid),
  public.has_applied(uuid),
  public.can_apply(uuid),
  public.complete_onboarding(text, date, text[], text, text),
  public.swipe_listing(uuid, text, text),
  public.accept_application(uuid),
  public.decline_application(uuid),
  public.withdraw_application(uuid),
  public.feed_listings(double precision, double precision, double precision, text, integer),
  public.register_push_token(text, text),
  public.admin_moderate_listing(uuid, text, text),
  public.admin_hide_message(uuid, text),
  public.admin_ban_user(uuid, text),
  public.admin_unban_user(uuid)
to authenticated;


-- -----------------------------------------------------------------------------
-- Row level security
-- -----------------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.cities enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.admins enable row level security;
alter table public.user_bans enable row level security;
alter table public.user_interests enable row level security;
alter table public.blocks enable row level security;
alter table public.listings enable row level security;
alter table public.applications enable row level security;
alter table public.swipes enable row level security;
alter table public.chats enable row level security;
alter table public.chat_members enable row level security;
alter table public.messages enable row level security;
alter table public.beacons enable row level security;
alter table public.reports enable row level security;
alter table public.push_tokens enable row level security;
alter table public.osm_places enable row level security;

-- Reference data
create policy "Anyone can read categories"
  on public.categories for select to anon, authenticated
  using (true);

create policy "Anyone can read cities"
  on public.cities for select to anon, authenticated
  using (true);

create policy "Signed-in users can read places"
  on public.osm_places for select to authenticated
  using (true);

-- Profiles
create policy "Profiles are visible unless one person blocked the other"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or not public.is_blocked_with(id));

create policy "Users edit their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Users see their own private profile"
  on public.profile_private for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users edit their own private profile"
  on public.profile_private for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can check whether they are an admin"
  on public.admins for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users see their own ban, admins see all bans"
  on public.user_bans for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- Interests
create policy "Interests are visible unless one person blocked the other"
  on public.user_interests for select to authenticated
  using (user_id = (select auth.uid()) or not public.is_blocked_with(user_id));

create policy "Users add their own interests"
  on public.user_interests for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_active_user());

create policy "Users change their own interests"
  on public.user_interests for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users remove their own interests"
  on public.user_interests for delete to authenticated
  using (user_id = (select auth.uid()));

-- Blocks
create policy "Users see whom they blocked"
  on public.blocks for select to authenticated
  using (blocker_id = (select auth.uid()));

create policy "Users block others"
  on public.blocks for insert to authenticated
  with check (blocker_id = (select auth.uid()));

create policy "Users unblock others"
  on public.blocks for delete to authenticated
  using (blocker_id = (select auth.uid()));

-- Listings
create policy "Listings are visible when approved, own or applied to"
  on public.listings for select to authenticated
  using (
    author_id = (select auth.uid())
    or public.is_admin()
    or (
      not public.is_blocked_with(author_id)
      and (
        (moderation_status = 'approved' and not public.is_banned(author_id))
        or public.has_applied(id)
      )
    )
  );

create policy "Active users create listings"
  on public.listings for insert to authenticated
  with check (author_id = (select auth.uid()) and public.is_active_user() and starts_at > now());

create policy "Authors edit their listings"
  on public.listings for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

-- Applications
create policy "Applicants and listing authors see applications"
  on public.applications for select to authenticated
  using (applicant_id = (select auth.uid()) or public.is_listing_author(listing_id));

create policy "Active users apply to open listings"
  on public.applications for insert to authenticated
  with check (
    applicant_id = (select auth.uid())
    and public.is_active_user()
    and public.can_apply(listing_id)
  );

-- Swipes
create policy "Users see their own swipes"
  on public.swipes for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users swipe listings they can see"
  on public.swipes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.listings l where l.id = listing_id)
  );

-- Chats
create policy "Members see their chats"
  on public.chats for select to authenticated
  using (public.is_chat_member(id));

create policy "Members see who is in their chats"
  on public.chat_members for select to authenticated
  using (public.is_chat_member(chat_id));

create policy "Members mark their chats as read"
  on public.chat_members for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Members read messages; hidden ones only their sender"
  on public.messages for select to authenticated
  using (
    (public.is_chat_member(chat_id) and (hidden_at is null or sender_id = (select auth.uid())))
    or public.is_admin()
  );

create policy "Active members send messages"
  on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and public.is_chat_member(chat_id)
    and public.is_active_user()
  );

-- Beacons
create policy "Users see their own beacons"
  on public.beacons for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Active users create beacons"
  on public.beacons for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_active_user());

create policy "Users switch their beacons on and off"
  on public.beacons for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users delete their beacons"
  on public.beacons for delete to authenticated
  using (user_id = (select auth.uid()));

-- Reports: anyone can report what they can see; only admins handle reports.
create policy "Reporters and admins see reports"
  on public.reports for select to authenticated
  using (reporter_id = (select auth.uid()) or public.is_admin());

create policy "Users report what they can see"
  on public.reports for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and num_nonnulls(target_user_id, target_listing_id, target_message_id) >= 1
    and (target_message_id is null
         or exists (select 1 from public.messages m where m.id = target_message_id))
    and (target_listing_id is null
         or exists (select 1 from public.listings l where l.id = target_listing_id))
  );

create policy "Admins handle reports"
  on public.reports for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Push tokens (saved through register_push_token)
create policy "Users see their own push tokens"
  on public.push_tokens for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users remove their own push tokens"
  on public.push_tokens for delete to authenticated
  using (user_id = (select auth.uid()));


-- -----------------------------------------------------------------------------
-- Realtime: new chat messages are pushed to the app as they arrive.
-- -----------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_catalog.pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;
