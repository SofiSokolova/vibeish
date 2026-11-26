-- =============================================================================
-- Profile photos.
-- =============================================================================
-- Photos live in a private Storage bucket with one folder per person:
-- avatars/<user id>/<file>.jpg. Like profiles, a photo is visible to every
-- signed-in person except when one of the two blocked the other, and people add
-- and remove files only in their own folder. The app shows a photo through a
-- short-lived signed link, so a link that leaks stops working soon.
-- =============================================================================

-- The app sends a square JPEG of a few hundred kilobytes at most.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2 * 1024 * 1024, array['image/jpeg'])
on conflict (id) do nothing;

-- Whether the caller may see the photo at this path: their own, or one of someone
-- who has not blocked them and whom they have not blocked. A path that does not
-- start with a user id is nobody's photo.
create function private.can_see_avatar(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
begin
  begin
    v_owner := (storage.foldername(p_name))[1]::uuid;
  exception when invalid_text_representation then
    return false;
  end;
  return v_owner = (select auth.uid()) or not private.is_blocked_with(v_owner);
end;
$$;

create policy "Profile photos are visible unless one person blocked the other"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and private.can_see_avatar(name));

create policy "People add photos only to their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and private.is_active_user()
  );

create policy "People remove photos only from their own folder"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- A profile can only point at a photo in its own folder, so nobody can show
-- someone else's photo as their own.
alter table public.profiles
  add constraint profiles_avatar_in_own_folder
  check (avatar_path is null or starts_with(avatar_path, id::text || '/'));
