import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { View } from 'react-native';

export type IconName = SymbolViewProps['name'];

type IconProps = {
  /** SF Symbols name on iOS, Material Symbols name on Android and web (see src/constants/icons.ts). */
  name: IconName;
  color: string;
  size?: number;
};

/** A decorative icon. The control it sits in carries the label for screen readers. */
export function Icon({ name, color, size = 24 }: IconProps) {
  return (
    <View aria-hidden importantForAccessibility="no-hide-descendants">
      <SymbolView name={name} size={size} tintColor={color} />
    </View>
  );
}
