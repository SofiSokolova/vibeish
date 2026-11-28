import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Dialog } from '@/components/dialog';
import { FeedCard } from '@/components/feed-card';
import { FieldError } from '@/components/form-controls';
import { ThemedText } from '@/components/themed-text';
import type { FeedItem } from '@/lib/feed';

/** About as tall as a card in the feed on a phone. */
const CARD_HEIGHT = 440;

export type PublishState = 'idle' | 'publishing' | 'published';

type PreviewDialogProps = {
  visible: boolean;
  /** The meetup as the feed will show it. */
  item: FeedItem | null;
  state: PublishState;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

/**
 * The step after «Publish»: the meetup's card as others will see it in the feed, with
 * «Confirm» to publish it and «Back» to keep editing. Once published, it says the meetup
 * waits for review.
 */
export function PreviewDialog({ visible, item, state, error, onConfirm, onClose }: PreviewDialogProps) {
  const { t } = useTranslation();

  if (state === 'published') {
    return (
      <Dialog visible={visible} title={t('create.sentTitle')} closeLabel={t('create.ok')} onClose={onClose}>
        <ThemedText>{t('create.sentBody')}</ThemedText>
      </Dialog>
    );
  }

  return (
    <Dialog
      visible={visible}
      title={t('create.preview')}
      closeLabel={t('common.back')}
      onClose={onClose}
      action={{ label: t('create.confirm'), onPress: onConfirm, loading: state === 'publishing' }}>
      {item ? (
        <View style={styles.card}>
          <FeedCard item={item} now={new Date()} />
        </View>
      ) : null}
      <FieldError error={error} />
    </Dialog>
  );
}

const styles = StyleSheet.create({
  card: {
    height: CARD_HEIGHT,
  },
});
