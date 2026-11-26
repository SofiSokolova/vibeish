import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { usePhotoUrl } from '@/lib/avatar';

type AvatarProps = {
  /** The photo's path in Storage, or null for someone without a photo. */
  path: string | null;
  /** The first letter stands in for the photo until it loads, or when there is none. */
  name: string;
  size: number;
  /** A local photo shown instead, such as a new one that is not saved yet. */
  previewUri?: string | null;
};

/** A round profile photo. It sits next to the person's name, so screen readers skip it. */
export function Avatar({ path, name, size, previewUri }: AvatarProps) {
  const theme = useTheme();
  const signedUrl = usePhotoUrl(previewUri ? null : path);
  const letter = Array.from(name.trim())[0]?.toUpperCase() ?? '';

  return (
    <View
      aria-hidden
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: theme.backgroundElement },
      ]}>
      {previewUri ? (
        <Image source={{ uri: previewUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : signedUrl && path ? (
        // The link changes every time, the path does not, so the path is the cache key.
        <Image
          source={{ uri: signedUrl, cacheKey: path }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <ThemedText
          themeColor="textSecondary"
          style={{ fontSize: size * 0.4, lineHeight: size * 0.5, fontWeight: 600 }}>
          {letter}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
