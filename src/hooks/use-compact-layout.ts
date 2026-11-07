import { useWindowDimensions } from 'react-native';

/** Below this width the web app switches to the phone layout, with the tab bar at the bottom. */
export const COMPACT_MAX_WIDTH = 640;

export function useCompactLayout() {
  const { width } = useWindowDimensions();
  return width < COMPACT_MAX_WIDTH;
}
