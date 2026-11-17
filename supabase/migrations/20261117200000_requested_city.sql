-- =============================================================================
-- Let people from cities that are not supported yet finish onboarding.
-- =============================================================================
-- Someone whose city is not in public.cities leaves home_city empty and types
-- the city's name instead. It goes to the private part of the profile, so only
-- its owner and the server can read it, and it shows where to launch next.
-- =============================================================================

alter table public.profile_private
  add column requested_city text check (char_length(requested_city) between 1 and 100);
comment on column public.profile_private.requested_city is
  'City typed during onboarding because it is not in public.cities yet. Null when home_city is set.';

-- A new argument changes the signature, so the old function is dropped instead of
-- replaced; otherwise both versions would exist side by side.
drop function public.complete_onboarding(text, date, text[], text, text);

-- Creates the caller's profile. Only adults can finish onboarding.
create function public.complete_onboarding(
  p_display_name text,
  p_birth_date date,
  p_languages text[] default '{}',
  p_home_city text default null,
  p_ui_language text default 'en',
  p_requested_city text default null
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

  return v_profile;
end;
$$;

-- New functions are executable by everyone by default; only signed-in users and the
-- server may call this one.
revoke execute on function public.complete_onboarding(text, date, text[], text, text, text)
  from public, anon, authenticated;
grant execute on function public.complete_onboarding(text, date, text[], text, text, text)
  to authenticated, service_role;
