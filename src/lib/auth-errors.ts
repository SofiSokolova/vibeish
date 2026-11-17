import { isAuthApiError, isAuthRetryableFetchError } from '@supabase/supabase-js';

/** Locale keys for sign-in errors, each telling people what they can do about it. */
export type AuthErrorKey =
  | 'auth.errors.invalidEmail'
  | 'auth.errors.codeInvalid'
  | 'auth.errors.tooManyRequests'
  | 'auth.errors.emailNotAllowed'
  | 'common.errors.network'
  | 'common.errors.generic';

/** Picks the message for an error from supabase.auth. */
export function authErrorKey(error: unknown): AuthErrorKey {
  if (isAuthRetryableFetchError(error)) return 'common.errors.network';
  if (isAuthApiError(error)) {
    switch (error.code) {
      case 'otp_expired':
        return 'auth.errors.codeInvalid';
      case 'email_address_invalid':
        return 'auth.errors.invalidEmail';
      case 'over_email_send_rate_limit':
      case 'over_request_rate_limit':
        return 'auth.errors.tooManyRequests';
      // Supabase's built-in mail service only writes to the project's team.
      case 'email_address_not_authorized':
        return 'auth.errors.emailNotAllowed';
    }
    if (error.status === 429) return 'auth.errors.tooManyRequests';
  }
  return 'common.errors.generic';
}

/** True when a request failed before reaching the server, for example without internet. */
export function isNetworkFailure(error: { code?: string; message: string }) {
  return !error.code && /fetch|network/i.test(error.message);
}
