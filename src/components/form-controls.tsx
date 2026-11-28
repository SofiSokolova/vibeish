import { useRef, useState, type ReactNode, type Ref } from 'react';
import { Pressable, StyleSheet, View, type ViewInstance } from 'react-native';

import { AnchoredPopover, type AnchorRect } from '@/components/anchored-popover';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { ICONS } from '@/constants/icons';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** A round button with a pencil next to what is picked, which opens the choice again. */
export function EditButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      role="button"
      aria-label={label}
      onPress={onPress}
      style={({ pressed }) => [styles.edit, { borderColor: theme.border }, pressed && styles.pressed]}>
      <Icon name={ICONS.edit} color={theme.textSecondary} size={18} />
    </Pressable>
  );
}

/** A picked value shown as a chip, in the picked color unless another is given. */
export function PickedChip({ label, color, children }: { label: string; color?: string; children?: ReactNode }) {
  const theme = useTheme();
  const tint = color ?? theme.picked;
  return (
    <View role="listitem" style={[styles.chip, { borderColor: tint, backgroundColor: `${tint}14` }]}>
      {children}
      <ThemedText style={[styles.chipText, { color: tint }]}>{label}</ThemedText>
    </View>
  );
}

/** The «Choose» button that stands in for the chips while nothing is picked. */
export function ChooseButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      role="button"
      onPress={onPress}
      style={({ pressed }) => [styles.choose, { borderColor: theme.picked }, pressed && styles.pressed]}>
      <ThemedText style={[styles.chipText, { color: theme.picked }]}>{label}</ThemedText>
    </Pressable>
  );
}

type PickedValuesProps = {
  /** What is picked; an empty list shows the «Choose» button instead. */
  labels: string[];
  /** Names the pencil for screen readers, such as "Change languages". */
  editLabel: string;
  chooseLabel: string;
  onEdit: () => void;
};

/** Picked values as chips with a pencil that changes them. */
export function PickedValues({ labels, editLabel, chooseLabel, onEdit }: PickedValuesProps) {
  if (labels.length === 0) return <ChooseButton label={chooseLabel} onPress={onEdit} />;
  return (
    <View style={styles.pickedRow}>
      <View role="list" style={styles.pickedChips}>
        {labels.map((label) => (
          <PickedChip key={label} label={label} />
        ))}
      </View>
      <EditButton label={editLabel} onPress={onEdit} />
    </View>
  );
}

/** What is wrong with a field, read out as soon as it appears. */
export function FieldError({ error }: { error?: string | null }) {
  if (!error) return null;
  return (
    <ThemedText type="small" themeColor="danger" accessibilityLiveRegion="polite">
      {error}
    </ThemedText>
  );
}

/** A checkbox with its label, such as "Remember for next meetups". */
export function CheckRow({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={({ pressed }) => [styles.checkRow, pressed && styles.pressed, disabled && styles.disabled]}>
      <View
        style={[
          styles.box,
          { borderColor: checked ? theme.accent : theme.textSecondary, backgroundColor: checked ? theme.accent : 'transparent' },
        ]}>
        {checked ? <Icon name={ICONS.check} color={theme.onAccent} size={16} /> : null}
      </View>
      <ThemedText style={styles.checkLabel}>{label}</ThemedText>
    </Pressable>
  );
}

/** A «?» next to a title that opens a short explanation next to it. */
export function HintButton({ label, hint }: { label: string; hint: string }) {
  const theme = useTheme();
  const button = useRef<ViewInstance>(null);
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);

  return (
    <>
      <Pressable
        ref={button as Ref<ViewInstance>}
        role="button"
        aria-label={label}
        aria-expanded={anchor !== null}
        onPress={() =>
          button.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }))
        }
        style={({ pressed }) => [styles.hintButton, pressed && styles.pressed]}>
        <View style={[styles.hintMark, { borderColor: theme.textSecondary }]}>
          <ThemedText style={[styles.hintText, { color: theme.textSecondary }]}>?</ThemedText>
        </View>
      </Pressable>
      <AnchoredPopover visible={anchor !== null} anchor={anchor} onClose={() => setAnchor(null)}>
        <ThemedText type="small">{hint}</ThemedText>
      </AnchoredPopover>
    </>
  );
}

const styles = StyleSheet.create({
  edit: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
  },
  choose: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  pickedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pickedChips: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 44,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLabel: {
    flexShrink: 1,
  },
  hintButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintMark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 800,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});
