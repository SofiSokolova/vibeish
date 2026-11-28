import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';

import { Chip } from '@/components/chip';
import { Dialog } from '@/components/dialog';
import { CheckRow, ChooseButton, FieldError } from '@/components/form-controls';
import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { ICONS } from '@/constants/icons';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDay } from '@/lib/feed';
import { dayKey, dayStart, draftStartsAt, MINUTE_STEP } from '@/lib/listing-form';

/** How many months ahead the calendar goes, counting the current one. */
const MONTHS_AHEAD = 12;
/** The time a meetup gets when someone switches off «agreed in the chat» without picking one. */
const FALLBACK_TIME = '18:00';
const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 / MINUTE_STEP }, (_, index) => String(index * MINUTE_STEP).padStart(2, '0'));
const TIME_ITEM_HEIGHT = 40;
const TIME_ITEMS_SHOWN = 3;

type WhenValue = { day: string; time: string | null };

type WhenFieldProps = {
  day: string | null;
  /** HH:MM, or null when the time is agreed in the chat. */
  time: string | null;
  onChange: (value: WhenValue) => void;
  error?: string | null;
};

/** When the meetup is: the date itself is the button, and it opens the calendar with the time. */
export function WhenField({ day, time, onChange, error }: WhenFieldProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const startsAt = draftStartsAt({ day, time });
  const text = startsAt
    ? time === null
      ? t('feed.dayTimeTbd', { day: formatDay(startsAt, i18n.language) })
      : formatDayAndTime(startsAt, i18n.language)
    : null;

  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{t('create.when')}</ThemedText>
      {text ? (
        <Pressable
          role="button"
          aria-label={t('create.whenLabel', { when: text })}
          onPress={() => setOpen(true)}
          style={({ pressed }) => [styles.whenButton, pressed && styles.pressed]}>
          <Icon name={ICONS.calendar} color={theme.picked} size={20} />
          <ThemedText style={[styles.whenText, { color: theme.picked }]}>{text}</ThemedText>
        </Pressable>
      ) : (
        <ChooseButton label={t('create.chooseDay')} onPress={() => setOpen(true)} />
      )}
      <FieldError error={error} />
      {/* Mounted only while open, so it starts from the current value each time. */}
      {open ? (
        <WhenDialog
          day={day}
          time={time}
          onClose={(value) => {
            setOpen(false);
            if (value) onChange(value);
          }}
        />
      ) : null}
    </View>
  );
}

function WhenDialog({
  day,
  time,
  onClose,
}: {
  day: string | null;
  time: string | null;
  /** Gets the picked day and time, or null when no day was picked. */
  onClose: (value: WhenValue | null) => void;
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const [today] = useState(() => new Date());
  const todayKey = dayKey(today);
  const tomorrowKey = dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));
  const [picked, setPicked] = useState(day);
  const [clock, setClock] = useState(time ?? FALLBACK_TIME);
  const [inChat, setInChat] = useState(day !== null && time === null);
  const [month, setMonth] = useState(() => monthStart(picked ? dayStart(picked) : today));

  function pickQuick(key: string) {
    setPicked(key);
    setMonth(monthStart(dayStart(key)));
  }

  return (
    <Dialog
      visible
      title={t('create.when')}
      closeLabel={t('common.done')}
      onClose={() => onClose(picked ? { day: picked, time: inChat ? null : clock } : null)}>
      <View style={styles.quick}>
        <Chip label={t('create.today')} selected={picked === todayKey} onPress={() => pickQuick(todayKey)} />
        <Chip label={t('create.tomorrow')} selected={picked === tomorrowKey} onPress={() => pickQuick(tomorrowKey)} />
      </View>
      <Calendar month={month} onMonthChange={setMonth} today={today} picked={picked} onPick={setPicked} locale={locale} />
      <TimePicker value={clock} onChange={setClock} disabled={inChat} />
      <CheckRow label={t('create.timeInChat')} checked={inChat} onChange={setInChat} />
    </Dialog>
  );
}

type CalendarProps = {
  /** The first day of the month on screen. */
  month: Date;
  onMonthChange: (month: Date) => void;
  today: Date;
  picked: string | null;
  onPick: (day: string) => void;
  locale: string;
};

/** One month, weeks starting on Monday; days before today cannot be picked. */
function Calendar({ month, onMonthChange, today, picked, onPick, locale }: CalendarProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const todayKey = dayKey(today);
  const firstMonth = monthStart(today);
  const lastMonth = addMonths(firstMonth, MONTHS_AHEAD - 1);
  const title = capitalize(new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month), locale);
  const weekdayFormat = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const dayFormat = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  // 1 January 2024 was a Monday.
  const weekdays = Array.from({ length: 7 }, (_, index) => weekdayFormat.format(new Date(2024, 0, 1 + index)));

  return (
    <View style={styles.calendar}>
      <View style={styles.monthRow}>
        <MonthButton
          icon={ICONS.previous}
          label={t('create.previousMonth')}
          disabled={month <= firstMonth}
          onPress={() => onMonthChange(addMonths(month, -1))}
        />
        <ThemedText style={styles.monthTitle} accessibilityLiveRegion="polite">
          {title}
        </ThemedText>
        <MonthButton
          icon={ICONS.more}
          label={t('create.nextMonth')}
          disabled={month >= lastMonth}
          onPress={() => onMonthChange(addMonths(month, 1))}
        />
      </View>
      <View aria-hidden style={styles.week}>
        {weekdays.map((name, index) => (
          <ThemedText key={index} type="small" themeColor="textSecondary" style={styles.weekday}>
            {name}
          </ThemedText>
        ))}
      </View>
      <View role="radiogroup" aria-label={title} style={styles.days}>
        {monthCells(month).map((date, index) => {
          if (!date) return <View key={`blank-${index}`} style={styles.cell} />;
          const key = dayKey(date);
          const past = key < todayKey;
          const chosen = key === picked;
          return (
            <Pressable
              key={key}
              role="radio"
              aria-checked={chosen}
              aria-disabled={past}
              aria-label={dayFormat.format(date)}
              disabled={past}
              onPress={() => onPick(key)}
              style={styles.cell}>
              <View
                style={[
                  styles.dayMark,
                  chosen && { backgroundColor: theme.accent },
                  !chosen && key === todayKey && { borderColor: theme.picked },
                ]}>
                <ThemedText
                  style={[
                    styles.dayText,
                    { color: chosen ? theme.onAccent : past ? theme.textSecondary : theme.text },
                    past && styles.pastDay,
                  ]}>
                  {date.getDate()}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MonthButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: IconName;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      role="button"
      aria-label={label}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.monthButton,
        { borderColor: theme.border },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <Icon name={icon} color={theme.text} size={20} />
    </Pressable>
  );
}

/** Two columns, hours and minutes, each scrolling on its own. */
function TimePicker({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled: boolean }) {
  const { t } = useTranslation();
  const [hours, minutes] = value.split(':');

  return (
    <View aria-disabled={disabled} style={[styles.time, disabled && styles.disabled]}>
      <ThemedText type="smallBold">{t('create.time')}</ThemedText>
      <View style={styles.columns}>
        <TimeColumn
          label={t('create.hours')}
          options={HOURS}
          value={hours}
          disabled={disabled}
          onChange={(hour) => onChange(`${hour}:${minutes}`)}
        />
        <ThemedText aria-hidden style={styles.colon}>
          :
        </ThemedText>
        <TimeColumn
          label={t('create.minutes')}
          options={MINUTES}
          value={minutes}
          disabled={disabled}
          onChange={(minute) => onChange(`${hours}:${minute}`)}
        />
      </View>
    </View>
  );
}

function TimeColumn({
  label,
  options,
  value,
  disabled,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const theme = useTheme();
  const scroll = useRef<ScrollViewInstance>(null);
  // The chosen value starts in the middle of the column.
  const offset = Math.max(0, (options.indexOf(value) - 1) * TIME_ITEM_HEIGHT);

  return (
    <ScrollView
      ref={scroll}
      role="radiogroup"
      aria-label={label}
      nestedScrollEnabled
      scrollEnabled={!disabled}
      showsVerticalScrollIndicator={false}
      contentOffset={{ x: 0, y: offset }}
      onLayout={() => scroll.current?.scrollTo({ y: offset, animated: false })}
      style={[styles.column, { borderColor: theme.border }]}>
      {options.map((option) => {
        const chosen = option === value;
        return (
          <Pressable
            key={option}
            role="radio"
            aria-checked={chosen}
            disabled={disabled}
            onPress={() => onChange(option)}
            style={[styles.timeItem, chosen && { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText style={[styles.timeText, { color: chosen ? theme.picked : theme.text }]}>{option}</ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(month: Date, count: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + count, 1);
}

/** The month's days with empty cells before the first one, so that weeks start on Monday. */
function monthCells(month: Date): (Date | null)[] {
  const blanks = (month.getDay() + 6) % 7;
  const length = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return [
    ...Array.from({ length: blanks }, () => null),
    ...Array.from({ length }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1)),
  ];
}

function capitalize(text: string, locale: string): string {
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

/** The weekday, date and time, such as «Сб, 28 ноября, 18:00». */
function formatDayAndTime(date: Date, locale: string): string {
  const text = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
  return capitalize(text, locale);
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  whenButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 44,
  },
  whenText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 800,
  },
  quick: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  calendar: {
    gap: Spacing.two,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  monthTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 700,
  },
  monthButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  week: {
    flexDirection: 'row',
  },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
  },
  days: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayMark: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontWeight: 600,
  },
  pastDay: {
    opacity: 0.5,
  },
  time: {
    gap: Spacing.two,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  colon: {
    fontSize: 20,
    fontWeight: 800,
  },
  column: {
    width: 76,
    height: TIME_ITEM_HEIGHT * TIME_ITEMS_SHOWN,
    flexGrow: 0,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  timeItem: {
    height: TIME_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});
