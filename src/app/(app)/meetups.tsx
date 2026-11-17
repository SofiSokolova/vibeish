import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/screen';

export default function MeetupsScreen() {
  const { t } = useTranslation();
  return <Screen title={t('meetups.title')} description={t('meetups.body')} />;
}
