import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/screen';

export default function ChatsScreen() {
  const { t } = useTranslation();
  return <Screen title={t('chats.title')} description={t('chats.body')} />;
}
