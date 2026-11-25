import { useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Where an element sits on the screen, as measureInWindow() reports it. */
export type AnchorRect = { x: number; y: number; width: number; height: number };

/** Space between the element and the card. */
const GAP = 10;
const CARET_SIZE = 12;
/** The card keeps at least this far from the edges of the screen. */
const EDGE = Spacing.three;
const MAX_WIDTH = 400;

type AnchoredPopoverProps = {
  visible: boolean;
  /** The element the card points at. */
  anchor: AnchorRect | null;
  onClose: () => void;
  children: ReactNode;
};

/**
 * A card that floats over the screen next to the element it belongs to, like a tooltip with
 * buttons in it. It opens below the element, or above it when there is no room below, and
 * covers the content instead of pushing it aside. A tap outside the card, the Android back
 * button or Escape on the web closes it.
 */
export function AnchoredPopover({ visible, anchor, onClose, children }: AnchoredPopoverProps) {
  const theme = useTheme();
  const screen = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // The card stays invisible until its first layout tells how tall it is.
  const [cardHeight, setCardHeight] = useState(0);

  const width = Math.min(screen.width - insets.left - insets.right - 2 * EDGE, MAX_WIDTH);
  const minTop = insets.top + EDGE;
  const maxBottom = screen.height - insets.bottom - EDGE;

  let left = insets.left + EDGE;
  let top = minTop;
  let below = true;
  let caretLeft: number | null = null;
  if (anchor) {
    const anchorCenter = anchor.x + anchor.width / 2;
    left = clamp(anchorCenter - width / 2, insets.left + EDGE, screen.width - insets.right - EDGE - width);
    const roomBelow = maxBottom - (anchor.y + anchor.height + GAP);
    const roomAbove = anchor.y - GAP - minTop;
    below = cardHeight <= roomBelow || roomBelow >= roomAbove;
    const wantedTop = below ? anchor.y + anchor.height + GAP : anchor.y - GAP - cardHeight;
    // On a very small screen the card may not fit on either side: it stays on screen and
    // drops the caret, which would no longer point at the element.
    top = clamp(wantedTop, minTop, Math.max(minTop, maxBottom - cardHeight));
    if (top === wantedTop) {
      caretLeft = clamp(anchorCenter - left - CARET_SIZE / 2, Spacing.three, width - Spacing.three - CARET_SIZE);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      // Lets the card use the same screen coordinates as measureInWindow() on Android.
      statusBarTranslucent
      navigationBarTranslucent>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessible={false} focusable={false} />
      <View
        accessibilityViewIsModal
        onAccessibilityEscape={onClose}
        onLayout={(event) => setCardHeight(event.nativeEvent.layout.height)}
        style={[
          styles.card,
          { left, top, width, backgroundColor: theme.popover, borderColor: theme.backgroundSelected },
          cardHeight === 0 && styles.measuring,
        ]}>
        {caretLeft !== null ? (
          <View
            style={[
              styles.caret,
              below ? styles.caretOnTop : styles.caretBelow,
              { left: caretLeft, backgroundColor: theme.popover, borderColor: theme.backgroundSelected },
            ]}
          />
        ) : null}
        {children}
      </View>
    </Modal>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.16)',
  },
  measuring: {
    opacity: 0,
  },
  // A square turned by 45° whose outer half sticks out of the card and covers its border.
  caret: {
    position: 'absolute',
    width: CARET_SIZE,
    height: CARET_SIZE,
    transform: [{ rotate: '45deg' }],
  },
  caretOnTop: {
    top: -CARET_SIZE / 2 - 1,
    borderLeftWidth: 1,
    borderTopWidth: 1,
  },
  caretBelow: {
    bottom: -CARET_SIZE / 2 - 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
});
