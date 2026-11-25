-- =============================================================================
-- Save the hobbies chosen during onboarding together with the profile.
-- =============================================================================
-- complete_onboarding() takes the hobbies from the onboarding step, each with an
-- optional skill level, and stores them in user_interests. The profile and its
-- hobbies are created together or not at all.
-- =============================================================================

-- A new argument changes the signature, so the old function is dropped instead of
-- replaced; otherwise both versions would exist side by side.
drop function public.complete_onboarding(text, date, text[], text, text, text);

-- Creates the caller's profile with their hobbies. Only adults can finish onboarding.
-- p_interests is a JSON array such as [{"category": "tennis", "skill_level": 2}],
-- where skill_level is 1 (beginner), 2 (experienced), 3 (pro) or missing.
create function public.complete_onboarding(
  p_display_name text,
  p_birth_date date,
  p_languages text[] default '{}',
  p_home_city text default null,
  p_ui_language text default 'en',
  p_requested_city text default null,
  p_interests jsonb default '[]'
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_interests jsonb := coalesce(p_interests, '[]');
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

  if jsonb_typeof(v_interests) <> 'array' then
    raise exception 'invalid_interests' using errcode = '22023';
  end if;
  if exists (
    select 1
      from jsonb_array_elements(v_interests) as interest
      left join public.categories c on c.slug = interest ->> 'category'
     where c.slug is null or not c.is_active
  ) then
    raise exception 'unknown_category' using errcode = '22023';
  end if;
  -- A repeated hobby would break the primary key with 23505, which the app reads as
  -- "this profile already exists", so it gets its own error.
  if (select count(*) from jsonb_array_elements(v_interests))
     <> (select count(distinct interest ->> 'category') from jsonb_array_elements(v_interests) as interest) then
    raise exception 'duplicate_interest' using errcode = '22023';
  end if;

  insert into public.profiles (id, display_name, languages, home_city)
  values (v_user_id, btrim(p_display_name), coalesce(p_languages, '{}'), p_home_city)
  returning * into v_profile;

  insert into public.profile_private (user_id, birth_date, ui_language, requested_city)
  values (
    v_user_id,
    p_birth_date,
    coalesce(p_ui_language, 'en'),
    -- A city from the list makes a typed one pointless.
    case when p_home_city is null then nullif(btrim(p_requested_city), '') end
  );

  -- A level outside 1–3 breaks the table's check, and the whole onboarding with it.
  insert into public.user_interests (user_id, category, skill_level)
  select v_user_id, interest ->> 'category', (interest ->> 'skill_level')::smallint
    from jsonb_array_elements(v_interests) as interest;

  return v_profile;
end;
$$;

-- New functions are executable by everyone by default; only signed-in users and the
-- server may call this one.
revoke execute on function public.complete_onboarding(text, date, text[], text, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.complete_onboarding(text, date, text[], text, text, text, jsonb)
  to authenticated, service_role;
