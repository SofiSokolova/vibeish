import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/button';
import { CostField } from '@/components/listing-form/cost-field';
import { HobbyField } from '@/components/listing-form/hobby-field';
import { LanguagesField } from '@/components/listing-form/languages-field';
import { LevelField } from '@/components/listing-form/level-field';
import { PeopleField } from '@/components/listing-form/people-field';
import { PlaceField } from '@/components/listing-form/place-field';
import { PreviewDialog, type PublishState } from '@/components/listing-form/preview-dialog';
import { WhenField } from '@/components/listing-form/when-field';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { hasSkillLevels, type CategorySlug } from '@/constants/categories';
import { isNetworkFailure } from '@/lib/auth-errors';
import type { FeedItem } from '@/lib/feed';
import {
  createListingArgs,
  DESCRIPTION_MAX_LENGTH,
  draftProblems,
  draftStartsAt,
  loadListingDefaults,
  newDraft,
  parseEuros,
  rememberListingDefault,
  settleDraft,
  suggestedGroupMax,
  TITLE_MAX_LENGTH,
  type DraftProblem,
  type ListingDraft,
} from '@/lib/listing-form';
import { useMyProfile } from '@/lib/my-profile';
import { supabase } from '@/lib/supabase';

/**
 * A new meetup, in the order of the design: the hobby and who it is for, the title and
 * details, when and where, how many people, the cost and the languages. «Publish» stays at
 * the bottom; it first shows the card as the feed will, and «Confirm» publishes it.
 */
export default function CreateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile } = useMyProfile();
  const [defaults, setDefaults] = useState(loadListingDefaults);
  const [draft, setDraft] = useState<ListingDraft>(() => newDraft(defaults));
  // Once someone sets the group size, a new hobby no longer suggests its own.
  const [peopleTouched, setPeopleTouched] = useState(false);
  // Problems show only after the first try to publish.
  const [checked, setChecked] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishState, setPublishState] = useState<PublishState>('idle');
  const [publishError, setPublishError] = useState<string | null>(null);

  // Until someone picks the languages, the profile's own stand in, even if it loads later.
  const form = settleDraft(draft, profile?.languages ?? []);
  const problems = draftProblems(form, new Date());
  const errorFor = (...kinds: DraftProblem[]) => {
    const problem = checked ? kinds.find((kind) => problems.has(kind)) : undefined;
    return problem ? t(`create.errors.${problem}`) : null;
  };
  const update = (patch: Partial<ListingDraft>) => setDraft((current) => ({ ...current, ...patch }));

  function chooseCategory(category: CategorySlug, remember: boolean) {
    rememberListingDefault('category', remember ? category : undefined);
    setDefaults((current) => ({ ...current, category: remember ? category : undefined }));
    setDraft((current) => {
      const groupMax = peopleTouched ? current.groupMax : suggestedGroupMax(category);
      return {
        ...current,
        category,
        skillLevel: hasSkillLevels(category) ? current.skillLevel : null,
        groupMax,
        alreadyGoing: Math.min(current.alreadyGoing, groupMax - 1),
      };
    });
  }

  function chooseLanguages(languages: string[], remember: boolean) {
    rememberListingDefault('languages', remember ? languages : undefined);
    setDefaults((current) => ({ ...current, languages: remember ? languages : undefined }));
    update({ languages });
  }

  function publish() {
    setChecked(true);
    if (problems.size > 0) return;
    setPublishError(null);
    setPreviewOpen(true);
  }

  async function confirm() {
    setPublishState('publishing');
    setPublishError(null);
    const { error } = await supabase.rpc('create_listing', createListingArgs(form));
    if (error) {
      setPublishState('idle');
      setPublishError(t(isNetworkFailure(error) ? 'common.errors.network' : 'common.errors.generic'));
      return;
    }
    setPublishState('published');
  }

  function closePreview() {
    if (publishState === 'published') {
      router.replace('/meetups');
      return;
    }
    setPreviewOpen(false);
  }

  function previewItem(): FeedItem | null {
    const startsAt = draftStartsAt(draft);
    if (!draft.category || !startsAt || !draft.place) return null;
    return {
      id: 'preview',
      category: draft.category,
      forLevel: draft.skillLevel,
      title: draft.title.trim(),
      description: draft.description.trim(),
      startsAt,
      timeTbd: draft.time === null,
      city: draft.place.city,
      placeName: draft.place.name,
      groupMax: draft.groupMax,
      spotsLeft: draft.groupMax - draft.alreadyGoing,
      costType: draft.costType,
      costEur: draft.costType === 'free' ? null : parseEuros(draft.costText),
      author: {
        name: profile?.displayName ?? '',
        avatarPath: profile?.avatarPath ?? null,
        level: profile?.hobbies[draft.category] ?? null,
      },
    };
  }

  return (
    <Screen back title={t('create.title')} footer={<Button variant="accent" title={t('create.publish')} onPress={publish} />}>
      <HobbyField
        value={draft.category}
        remembered={defaults.category !== undefined}
        onChange={chooseCategory}
        error={errorFor('hobby')}
      />
      {draft.category && hasSkillLevels(draft.category) ? (
        <LevelField value={draft.skillLevel} onChange={(skillLevel) => update({ skillLevel })} />
      ) : null}
      <TextField
        label={t('create.name')}
        value={draft.title}
        onChangeText={(title) => update({ title })}
        maxLength={TITLE_MAX_LENGTH}
        counter={`${draft.title.length}/${TITLE_MAX_LENGTH}`}
        error={errorFor('title')}
      />
      <TextField
        label={t('create.details')}
        value={draft.description}
        onChangeText={(description) => update({ description })}
        maxLength={DESCRIPTION_MAX_LENGTH}
        multiline
        placeholder={t('create.detailsPlaceholder')}
      />
      <WhenField
        day={draft.day}
        time={draft.time}
        onChange={({ day, time }) => update({ day, time })}
        error={errorFor('when', 'past')}
      />
      <PlaceField
        value={draft.place}
        defaultCity={profile?.homeCity ?? 'tallinn'}
        onChange={(place) => update({ place })}
        error={errorFor('place')}
      />
      <PeopleField
        alreadyGoing={draft.alreadyGoing}
        groupMax={draft.groupMax}
        onChange={(people) => {
          setPeopleTouched(true);
          update(people);
        }}
      />
      <CostField costType={draft.costType} costText={draft.costText} onChange={update} error={errorFor('amount')} />
      <LanguagesField
        value={form.languages}
        own={profile?.languages ?? []}
        remembered={defaults.languages !== undefined}
        onChange={chooseLanguages}
        error={errorFor('languages')}
      />
      <PreviewDialog
        visible={previewOpen}
        item={previewOpen ? previewItem() : null}
        state={publishState}
        error={publishError}
        onConfirm={confirm}
        onClose={closePreview}
      />
    </Screen>
  );
}
