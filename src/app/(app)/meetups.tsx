import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/screen';

export default function MeetupsScreen() {
  const { t } = useTranslation();
  return <Screen back title={t('meetups.title')} description={t('meetups.body')} />;
}
