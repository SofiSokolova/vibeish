import type { CategorySlug } from '@/constants/categories';

/**
 * Pictures of hobbies for the feed cards, by category slug. They are Fluent Emoji 3D
 * (MIT, see assets/images/hobbies/LICENSE) standing in until the app has its own; a hobby
 * without a picture shows an icon instead. A bundled image is a number for the image components.
 */
export const HOBBY_IMAGES: Partial<Record<CategorySlug, number>> = {
  table_tennis: require('@/assets/images/hobbies/table-tennis.png'),
  board_games: require('@/assets/images/hobbies/board-games.png'),
  running: require('@/assets/images/hobbies/running.png'),
};
