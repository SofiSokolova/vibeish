import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { useEffects, useTheme } from '@/hooks/use-theme';

const CELL = 44;
const GRID_HEIGHT = 260;

/**
 * The feed's background: a glow at the top at night, a colour cloud by day, and a neon floor
 * grid that leans away in perspective and fades into the background.
 */
export function FeedBackdrop() {
  const theme = useTheme();
  const fx = useEffects();
  const { width } = useWindowDimensions();
  // An even number of cells, centred, so that one line runs down the middle and the floor is symmetric.
  const half = Math.ceil((width * 0.9) / CELL);
  const gridWidth = half * 2 * CELL + 1;

  return (
    <View aria-hidden style={[StyleSheet.absoluteFill, styles.inert]}>
      {fx.screenGlow ? <View style={[StyleSheet.absoluteFill, { backgroundImage: fx.screenGlow }]} /> : null}
      {fx.orb ? <View style={[styles.orb, { backgroundImage: fx.orb }]} /> : null}
      <View style={[styles.grid, { width: gridWidth, left: (width - gridWidth) / 2 }]}>
        {Array.from({ length: half * 2 + 1 }, (_, index) => (
          <View key={`x${index}`} style={[styles.column, { left: index * CELL, backgroundColor: fx.gridLine }]} />
        ))}
        {Array.from({ length: Math.floor(GRID_HEIGHT / CELL) + 1 }, (_, index) => (
          <View key={`y${index}`} style={[styles.row, { top: index * CELL, backgroundColor: fx.gridLine }]} />
        ))}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundImage: `linear-gradient(to bottom, ${theme.background} 0%, ${theme.background}00 60%)` },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inert: {
    pointerEvents: 'none',
    // The floor reaches far past the screen in perspective; clipping it here keeps the
    // screen itself from growing scrollable on the web.
    overflow: 'hidden',
  },
  // Centred 50 points in from the left and 270 down, as in the design.
  orb: {
    position: 'absolute',
    left: -300,
    top: -80,
    width: 700,
    height: 700,
    opacity: 0.7,
  },
  grid: {
    position: 'absolute',
    bottom: 60,
    height: GRID_HEIGHT,
    transformOrigin: 'center top',
    transform: [{ perspective: 300 }, { rotateX: '64deg' }],
  },
  column: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
});
