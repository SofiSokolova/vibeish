import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const MAX_WIDTH = 480;
/** Dims the screen behind the dialog, in both themes. */
const BACKDROP = 'rgba(0, 0, 0, 0.5)';

type DialogProps = {
  visible: boolean;
  title: string;
  /** Text of the button at the bottom, which closes the dialog. */
  closeLabel: string;
  onClose: () => void;
  /** A main action above the close button, such as confirming. */
  action?: { label: string; onPress: () => void; loading?: boolean };
  children: ReactNode;
};

/**
 * A window over the dimmed screen: a title, content that scrolls when it is long, and a
 * button that closes it. A tap outside, the Android back button or Escape on the web
 * closes it too. Used for whole lists to choose from, such as every language.
 */
export function Dialog({ visible, title, closeLabel, onClose, action, children }: DialogProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // Nothing closes the dialog while its action is running.
  const busy = action?.loading ?? false;
  const close = () => {
    if (!busy) onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
      statusBarTranslucent
      navigationBarTranslucent>
      <View
        style={[
          styles.backdrop,
          {
            paddingTop: insets.top + Spacing.four,
            paddingBottom: insets.bottom + Spacing.four,
            paddingLeft: insets.left + Spacing.three,
            paddingRight: insets.right + Spacing.three,
          },
        ]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessible={false} focusable={false} />
        <View
          role="dialog"
          aria-modal
          aria-label={title}
          onAccessibilityEscape={close}
          style={[styles.card, { backgroundColor: theme.popover, borderColor: theme.backgroundSelected }]}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          <View style={styles.actions}>
            {action ? (
              <Button variant="accent" title={action.label} loading={action.loading} onPress={action.onPress} />
            ) : null}
            <Button
              variant={action ? 'secondary' : 'primary'}
              title={closeLabel}
              disabled={busy}
              onPress={close}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BACKDROP,
  },
  card: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    maxHeight: '100%',
    padding: Spacing.three,
    gap: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.16)',
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: 600,
  },
  // Takes only the room it needs and scrolls when the list is longer than the screen.
  body: {
    flexGrow: 0,
    flexShrink: 1,
  },
  bodyContent: {
    gap: Spacing.three,
  },
  actions: {
    gap: Spacing.two,
  },
});
