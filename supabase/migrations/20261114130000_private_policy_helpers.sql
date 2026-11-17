-- =============================================================================
-- Move the helper functions used by row level security policies out of `public`.
-- =============================================================================
-- Every function in `public` can be called by any signed-in user through the Data
-- API (/rest/v1/rpc/...). The helpers are meant only for the policies, and some of
-- them would leak information when called directly: is_banned() tells whether any
-- user is banned, is_blocked_with() whether someone blocked you, can_apply()
-- whether a hidden listing exists. The `private` schema is not exposed by the API.
--
-- Policies refer to functions by id, so they keep working after the move. The
-- functions that call a helper by name are recreated below with the new name.
-- =============================================================================

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

alter function public.is_admin() set schema private;
alter function public.is_banned(uuid) set schema private;
alter function public.is_active_user() set schema private;
alter function public.is_blocked_with(uuid) set schema private;
alter function public.is_chat_member(uuid) set schema private;
alter function public.is_listing_author(uuid) set schema private;
alter function public.has_applied(uuid) set schema private;
alter function public.can_apply(uuid) set schema private;


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
       and l.accepted_count + 1 < l.group_max
       and l.author_id <> (select auth.uid())
       and not private.is_banned(l.author_id)
       and not private.is_blocked_with(l.author_id)
  );
$$;

create or replace function public.decline_application(p_application_id uuid)
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
  if not private.is_listing_author(v_application.listing_id) then
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

create or replace function public.admin_moderate_listing(
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
  if not private.is_admin() then
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

create or replace function public.admin_hide_message(p_message_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  update public.messages
     set hidden_at = now(), hidden_reason = p_reason, moderated_at = now()
   where id = p_message_id;
end;
$$;

create or replace function public.admin_ban_user(p_user_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  insert into public.user_bans (user_id, reason, banned_by)
  values (p_user_id, p_reason, auth.uid())
  on conflict (user_id) do update
    set reason = excluded.reason, banned_by = excluded.banned_by, created_at = now();
end;
$$;

create or replace function public.admin_unban_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  delete from public.user_bans where user_id = p_user_id;
end;
$$;
