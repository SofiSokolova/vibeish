import type { Session } from '@supabase/supabase-js';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

import i18n, { isAppLanguage } from '@/i18n';
import { supabase } from '@/lib/supabase';

/** Whether the signed-in person has finished onboarding, which is when their profile is created. */
export type ProfileStatus = 'loading' | 'missing' | 'complete' | 'error';

type AuthContextValue = {
  /** False until the saved session and, for a signed-in person, their profile have been checked once. */
  isReady: boolean;
  session: Session | null;
  profileStatus: ProfileStatus;
  /** True while the profile is being checked again after an error. */
  isRetrying: boolean;
  reloadProfile: () => void;
  /** Called by onboarding once the profile exists. */
  markProfileComplete: () => void;
  /** Signs out on this device only. Resolves to false if that failed, e.g. without internet. */
  signOut: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = use(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return value;
}

/** The answer to one profile check, so a late answer for another user or attempt is ignored. */
type ProfileCheck = {
  userId: string;
  attempt: number;
  status: Exclude<ProfileStatus, 'loading'>;
};

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [profileCheck, setProfileCheck] = useState<ProfileCheck | null>(null);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    // Fires once with the session saved on this device (INITIAL_SESSION), then on every change.
    // Only state is set here: Supabase advises against calling it back from inside this callback.
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) setIsReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    let current = true;
    supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!current) return;
        setProfileCheck({ userId, attempt, status: error ? 'error' : data ? 'complete' : 'missing' });
        setIsReady(true);
      });
    return () => {
      current = false;
    };
  }, [userId, attempt]);

  const latest = profileCheck?.userId === userId ? profileCheck : null;
  const isChecking = userId !== null && latest?.attempt !== attempt;
  // While a failed check is retried, keep reporting the error so the error screen stays up.
  const profileStatus: ProfileStatus =
    userId === null ? 'missing' : !isChecking && latest ? latest.status : latest?.status === 'error' ? 'error' : 'loading';

  // Keep the language in the profile in step with the app: the server writes emails and
  // notifications in it.
  useEffect(() => {
    if (!userId || profileStatus !== 'complete') return;
    const save = (language: string) => {
      if (!isAppLanguage(language)) return;
      void supabase
        .from('profile_private')
        .update({ ui_language: language })
        .eq('user_id', userId)
        .then(({ error }) => {
          if (error) console.warn('Could not save the app language to the profile:', error.message);
        });
    };
    i18n.on('languageChanged', save);
    return () => {
      i18n.off('languageChanged', save);
    };
  }, [userId, profileStatus]);

  const value: AuthContextValue = {
    isReady,
    session,
    profileStatus,
    isRetrying: isChecking && profileStatus === 'error',
    reloadProfile: () => setAttempt((count) => count + 1),
    markProfileComplete: () => {
      if (userId) setProfileCheck({ userId, attempt, status: 'complete' });
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      return !error;
    },
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}
