-- =============================================================================
-- Let people edit their profile, hobbies included, in one step.
-- =============================================================================
-- update_profile() saves the profile form: name, about text, languages, city (or
-- a city that is not supported yet) and hobbies with their levels. It runs with
-- the caller's own rights (security invoker), so the access rules of every table
-- still apply; it only makes the changes happen together or not at all.
-- =============================================================================

-- Someone who moves to a city that is not supported yet keeps its name in the
-- private part of the profile, as during onboarding.
grant update (requested_city) on public.profile_private to authenticated;

create function public.update_profile(
  p_display_name text,
  p_bio text default '',
  p_languages text[] default '{}',
  p_home_city text default null,
  p_requested_city text default null,
  p_interests jsonb default '[]'
)
returns public.profiles
language plpgsql
security invoker
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

  -- The same checks as in complete_onboarding().
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
  if (select count(*) from jsonb_array_elements(v_interests))
     <> (select count(distinct interest ->> 'category') from jsonb_array_elements(v_interests) as interest) then
    raise exception 'duplicate_interest' using errcode = '22023';
  end if;

  update public.profiles
     set display_name = btrim(p_display_name),
         bio = coalesce(btrim(p_bio), ''),
         languages = coalesce(p_languages, '{}'),
         home_city = p_home_city
   where id = v_user_id
  returning * into v_profile;
  if not found then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;

  update public.profile_private
     -- A city from the list makes a typed one pointless.
     set requested_city = case when p_home_city is null then nullif(btrim(p_requested_city), '') end
   where user_id = v_user_id;

  -- The hobbies become exactly the given list: the others are removed, new ones
  -- added, and the levels of the rest updated.
  delete from public.user_interests
   where user_id = v_user_id
     and category not in (select interest ->> 'category' from jsonb_array_elements(v_interests) as interest);

  insert into public.user_interests (category, skill_level)
  select interest ->> 'category', (interest ->> 'skill_level')::smallint
    from jsonb_array_elements(v_interests) as interest
  on conflict (user_id, category) do update set skill_level = excluded.skill_level;

  return v_profile;
end;
$$;

-- New functions are executable by everyone by default; only signed-in users and the
-- server may call this one.
revoke execute on function public.update_profile(text, text, text[], text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.update_profile(text, text, text[], text, text, jsonb)
  to authenticated, service_role;
