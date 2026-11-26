import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { CodeInput } from '@/components/code-input';
import { LanguagePicker } from '@/components/language-picker';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { authErrorKey, type AuthErrorKey } from '@/lib/auth-errors';
import { supabase } from '@/lib/supabase';

/** Supabase lets people ask for a new code once a minute. */
const RESEND_DELAY_SECONDS = 60;
/**
 * Digits in the emailed code. It must match the Supabase project setting "Email OTP length"
 * (Authentication → Sign In / Providers → Email).
 */
const CODE_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ErrorKey = AuthErrorKey | 'auth.errors.shortCode';

/**
 * Passwordless sign-in: an email address, then the code Supabase sends to it. New and
 * returning people go through the same steps; the root layout takes it from there.
 */
export default function SignInScreen() {
  const { t } = useTranslation();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<ErrorKey | null>(null);
  const [busy, setBusy] = useState<'sending' | 'verifying' | null>(null);
  const secondsLeft = useCountdown();

  async function sendCode(address: string) {
    setBusy('sending');
    setError(null);
    const { error: sendError } = await supabase.auth.signInWithOtp({
      email: address,
      options: { shouldCreateUser: true },
    });
    setBusy(null);
    if (sendError) {
      setError(authErrorKey(sendError));
      return false;
    }
    secondsLeft.restart(RESEND_DELAY_SECONDS);
    return true;
  }

  async function submitEmail() {
    const address = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(address)) {
      setError('auth.errors.invalidEmail');
      return;
    }
    if (await sendCode(address)) {
      setEmail(address);
      setCode('');
      setStep('code');
    }
  }

  /** Checks the code; runs on its own once the last digit is typed or pasted. */
  async function submitCode(token = code) {
    if (busy !== null) return;
    if (token.length < CODE_LENGTH) {
      setError('auth.errors.shortCode');
      return;
    }
    setBusy('verifying');
    setError(null);
    const { error: verifyError } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (verifyError) {
      setBusy(null);
      setError(authErrorKey(verifyError));
    }
    // On success the new session moves the root layout on to onboarding or the app.
  }

  function backToEmail() {
    setStep('email');
    setCode('');
    setError(null);
  }

  return (
    <Screen title={Constants.expoConfig?.name ?? ''} description={t('auth.tagline')}>
      <ThemedText>{t('auth.intro')}</ThemedText>

      {step === 'email' ? (
        <View style={styles.form}>
          <TextField
            label={t('auth.email')}
            hint={t('auth.emailHint')}
            error={error ? t(error) : null}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setError(null);
            }}
            onSubmitEditing={() => void submitEmail()}
            editable={busy === null}
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            inputMode="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="send"
          />
          <Button title={t('auth.getCode')} loading={busy === 'sending'} onPress={() => void submitEmail()} />
        </View>
      ) : (
        <View style={styles.form}>
          <ThemedText themeColor="textSecondary">{t('auth.codeSent', { email })}</ThemedText>
          <CodeInput
            label={t('auth.code')}
            length={CODE_LENGTH}
            error={error ? t(error) : null}
            value={code}
            onChangeText={(value) => {
              setCode(value);
              setError(null);
            }}
            onComplete={(value) => void submitCode(value)}
            editable={busy === null}
            autoFocus
          />
          <Button title={t('auth.signIn')} loading={busy === 'verifying'} onPress={() => void submitCode()} />
          <View>
            <Button
              variant="link"
              title={
                secondsLeft.value > 0 ? t('auth.resendIn', { seconds: secondsLeft.value }) : t('auth.resend')
              }
              disabled={secondsLeft.value > 0 || busy !== null}
              onPress={() => {
                setCode('');
                void sendCode(email);
              }}
            />
            <Button
              variant="link"
              title={t('auth.changeEmail')}
              disabled={busy !== null}
              onPress={backToEmail}
            />
          </View>
        </View>
      )}

      <LanguagePicker label={t('auth.language')} />
    </Screen>
  );
}

/** Seconds until a new code may be requested, counting down once a second. */
function useCountdown() {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (value <= 0) return;
    const timer = setTimeout(() => setValue((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [value]);

  return { value, restart: setValue };
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.three,
  },
});
