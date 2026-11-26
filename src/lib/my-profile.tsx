import type { PostgrestError } from '@supabase/supabase-js';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

import { CITIES, type CitySlug } from '@/constants/cities';
import { useAuth } from '@/lib/auth';
import { removePhoto, uploadPhoto } from '@/lib/avatar';
import { fromInterestRows, toInterestRows, type HobbyChoices } from '@/lib/hobbies';
import { supabase } from '@/lib/supabase';

/** The signed-in person's own profile, as the profile tab shows it and its editor changes it. */
export type MyProfile = {
  displayName: string;
  bio: string;
  languages: string[];
  /** Null when the person lives in a city that is not supported yet. */
  homeCity: CitySlug | null;
  /** The city the person typed because it is not in the list. */
  requestedCity: string | null;
  hobbies: HobbyChoices;
  /** The profile photo's path in Storage. */
  avatarPath: string | null;
};

/** What the profile form saves: everything but the photo, which is saved on its own. */
export type ProfileFields = Omit<MyProfile, 'avatarPath'>;

/** Something that went wrong while saving, with a code for database errors. */
export type SaveError = { message: string; code?: string };

type MyProfileContextValue = {
  /** The last loaded or saved profile; null until the first load succeeds. */
  profile: MyProfile | null;
  /** `error` when the last load failed. */
  status: 'loading' | 'ready' | 'error';
  reload: () => void;
  /** Saves the profile form in one step. Resolves to the error, or null when it worked. */
  save: (fields: ProfileFields) => Promise<PostgrestError | null>;
  /**
   * Puts a prepared photo on the profile right away, or takes the photo off with null, and
   * removes the old file. Resolves to the error, or null when it worked.
   */
  setPhoto: (photo: ArrayBuffer | null) => Promise<SaveError | null>;
};

const MyProfileContext = createContext<MyProfileContextValue | null>(null);

export function useMyProfile() {
  const value = use(MyProfileContext);
  if (!value) {
    throw new Error('useMyProfile must be used inside <MyProfileProvider>');
  }
  return value;
}

/** One load's answer, so a late answer for another user or attempt is ignored. */
type Loaded = {
  userId: string;
  attempt: number;
  profile: MyProfile | null;
  failed: boolean;
};

/**
 * Loads the profile of whoever finished onboarding and keeps it for the profile tab and the
 * editor, so a save shows up everywhere at once without loading it again.
 */
export function MyProfileProvider({ children }: PropsWithChildren) {
  const { session, profileStatus } = useAuth();
  const userId = profileStatus === 'complete' ? (session?.user.id ?? null) : null;
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!userId) return;
    let current = true;
    void loadMyProfile(userId).then((profile) => {
      if (!current) return;
      // A failed reload keeps what was loaded before.
      setLoaded((previous) => ({
        userId,
        attempt,
        profile: profile ?? (previous?.userId === userId ? previous.profile : null),
        failed: profile === null,
      }));
    });
    return () => {
      current = false;
    };
  }, [userId, attempt]);

  const latest = loaded?.userId === userId ? loaded : null;

  /** Changes the loaded profile after a save, keeping whatever else changed meanwhile. */
  function updateLoaded(change: Partial<MyProfile>) {
    setLoaded((previous) =>
      previous?.userId === userId && previous.profile
        ? { ...previous, profile: { ...previous.profile, ...change }, failed: false }
        : previous
    );
  }

  const value: MyProfileContextValue = {
    profile: latest?.profile ?? null,
    status: latest?.attempt === attempt ? (latest.failed ? 'error' : 'ready') : 'loading',
    reload: () => setAttempt((count) => count + 1),
    save: async (fields) => {
      const { error } = await supabase.rpc('update_profile', {
        p_display_name: fields.displayName,
        p_bio: fields.bio,
        p_languages: fields.languages,
        p_home_city: fields.homeCity ?? undefined,
        p_requested_city: fields.homeCity ? undefined : (fields.requestedCity ?? undefined),
        p_interests: toInterestRows(fields.hobbies),
      });
      if (!error) updateLoaded(fields);
      return error;
    },
    setPhoto: async (photo) => {
      if (!userId) return { message: 'Not signed in' };
      const oldPath = latest?.profile?.avatarPath ?? null;
      let newPath: string | null = null;
      if (photo) {
        try {
          newPath = await uploadPhoto(userId, photo);
        } catch (error) {
          return error instanceof Error ? error : { message: String(error) };
        }
      }
      const { error } = await supabase.from('profiles').update({ avatar_path: newPath }).eq('id', userId);
      if (error) {
        if (newPath) void removePhoto(newPath);
        return error;
      }
      updateLoaded({ avatarPath: newPath });
      if (oldPath) void removePhoto(oldPath);
      return null;
    },
  };

  return <MyProfileContext value={value}>{children}</MyProfileContext>;
}

/** The profile, its private part and its hobbies, or null when any of them failed to load. */
async function loadMyProfile(userId: string): Promise<MyProfile | null> {
  try {
    const [profile, privateProfile, interests] = await Promise.all([
      supabase
        .from('profiles')
        .select('display_name, bio, languages, home_city, avatar_path')
        .eq('id', userId)
        .single(),
      supabase.from('profile_private').select('requested_city').eq('user_id', userId).single(),
      supabase.from('user_interests').select('category, skill_level').eq('user_id', userId),
    ]);
    if (profile.error || privateProfile.error || interests.error) return null;
    return {
      displayName: profile.data.display_name,
      bio: profile.data.bio,
      languages: profile.data.languages,
      homeCity: CITIES.find((city) => city.slug === profile.data.home_city)?.slug ?? null,
      requestedCity: privateProfile.data.requested_city,
      hobbies: fromInterestRows(interests.data),
      avatarPath: profile.data.avatar_path,
    };
  } catch {
    return null;
  }
}
