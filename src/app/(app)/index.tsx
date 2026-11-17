import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/screen';

export default function FeedScreen() {
  const { t } = useTranslation();
  return <Screen title={t('feed.title')} description={t('feed.body')} />;
}
