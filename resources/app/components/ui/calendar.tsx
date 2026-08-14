import type { CSSObject } from '@emotion/react';
import { isSameMonth, startOfMonth } from 'date-fns';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock, X } from 'lucide-react';
import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import {
  type ChevronProps,
  type DateRange,
  DayPicker,
  type DayPickerProps,
  getDefaultClassNames,
  type Matcher,
} from 'react-day-picker';

import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import Text from '@/components/ui/text';
import {
  DATE_FORMATS,
  formatDateValue,
  parseDateValue,
  START_OF_DAY_TIME,
  WEEK_STARTS_ON,
} from '@/libs/date';
import { theme } from '@/theme';
import { defineStyles, flexCenter, itemCenter, mergeCss, scoped, scopedMerge, uiFocusRing } from '@/theme/mixins';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

type OmitStyleProps<TProps> = TProps extends unknown
  ? Omit<TProps, 'className' | 'classNames' | 'styles' | 'css'>
  : never;

type CalendarProps = OmitStyleProps<DayPickerProps> & {
  cssOverride?: CSSObject;
};

type DatePickerProps = {
  value: string | null;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  displayFormat?: string;
  minDate?: string | null;
  maxDate?: string | null;
  clearable?: boolean;
  disabled?: boolean;
  error?: boolean;
  id?: string;
  cssOverride?: CSSObject;
};

type DateRangeValue = {
  from: string | null;
  to: string | null;
};

type DateRangePickerProps = {
  value: DateRangeValue | null;
  onChange?: (value: DateRangeValue | null) => void;
  placeholder?: string;
  displayFormat?: string;
  minDate?: string | null;
  maxDate?: string | null;
  numberOfMonths?: number;
  clearable?: boolean;
  disabled?: boolean;
  error?: boolean;
  id?: string;
  cssOverride?: CSSObject;
};

type HourCycle = 12 | 24;

type TimePickerProps = {
  value: string | null;
  onChange?: (value: string | null) => void;
  hourCycle?: HourCycle;
  disabled?: boolean;
  error?: boolean;
  id?: string;
  cssOverride?: CSSObject;
};

type DateTimePickerProps = {
  value: string | null;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  displayFormat?: string;
  minDate?: string | null;
  maxDate?: string | null;
  hourCycle?: HourCycle;
  clearable?: boolean;
  disabled?: boolean;
  error?: boolean;
  id?: string;
  cssOverride?: CSSObject;
};

type PickerTriggerProps = {
  id?: string;
  controlsId: string;
  ariaHasPopup: 'grid' | 'dialog';
  open: boolean;
  label: ReactNode;
  placeholder: string;
  clearLabel: string;
  onClear?: () => void;
  disabled?: boolean;
  error?: boolean;
  cssOverride?: CSSObject;
};

const MERIDIEM_AM = 'AM';
const MERIDIEM_PM = 'PM';
const RANGE_DELIMITER = ' – ';

const padTimePart = (part: number) => String(part).padStart(2, '0');

/**
 * Resolve the picker's min/max date strings into the calendar's navigation
 * bounds and the matchers that disable out-of-bounds days.
 *
 * @param minDate Earliest selectable date.
 * @param maxDate Latest selectable date.
 *
 * @returns Parsed bounds and disabled-day matchers.
 */
const getDateBounds = (
  minDate: string | null | undefined,
  maxDate: string | null | undefined,
) => {
  const startDate = parseDateValue(minDate);
  const endDate = parseDateValue(maxDate);
  const disabledDays: Matcher[] = [];

  if (startDate) {
    disabledDays.push({ before: startDate });
  }

  if (endDate) {
    disabledDays.push({ after: endDate });
  }

  return { startDate, endDate, disabledDays };
};

const NavChevron = ({ orientation = 'left', size = 16 }: ChevronProps) => {
  if (orientation === 'up') {
    return <ChevronUp size={size} />;
  }

  if (orientation === 'down') {
    return <ChevronDown size={size} />;
  }

  if (orientation === 'right') {
    return <ChevronRight size={size} />;
  }

  return <ChevronLeft size={size} />;
};

NavChevron.displayName = 'NavChevron';

/**
 * Month grid built on DayPicker, styled entirely through theme tokens.
 *
 * @param props Component props, forwarded to DayPicker.
 *
 * @returns Calendar element.
 */
const Calendar = ({ cssOverride, ...props }: CalendarProps) => {
  const {
    showOutsideDays = true,
    weekStartsOn = WEEK_STARTS_ON,
    components,
    ...rest
  } = props;

  return (
    <div css={scopedMerge(styles.calendar, cssOverride)}>
      <DayPicker
        showOutsideDays={showOutsideDays}
        weekStartsOn={weekStartsOn}
        components={{ Chevron: NavChevron, ...components }}
        {...rest}
      />
    </div>
  );
};

Calendar.displayName = 'Calendar';

/**
 * Shared popover trigger for the date, range, and date-time pickers.
 *
 * @param props Component props.
 *
 * @returns PickerTrigger element.
 */
const PickerTrigger = ({
  id,
  controlsId,
  ariaHasPopup,
  open,
  label,
  placeholder,
  clearLabel,
  onClear,
  disabled = false,
  error = false,
  cssOverride,
}: PickerTriggerProps) => {
  return (
    <PopoverAnchor asChild>
      <Flex
        align="center"
        gap={2}
        data-error={error ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined}
        cssOverride={mergeCss(styles.trigger, error ? styles.triggerError : {}, cssOverride ?? {})}
      >
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            id={id}
            role="combobox"
            aria-haspopup={ariaHasPopup}
            aria-controls={controlsId}
            aria-expanded={open}
            aria-invalid={error || undefined}
            disabled={disabled}
            cssOverride={styles.triggerControl}
          >
            <span css={scoped(styles.value)}>
              {label ?? <span css={scoped(styles.placeholder)}>{placeholder}</span>}
            </span>
            {!onClear && <CalendarDays css={scoped(styles.icon)} />}
          </Button>
        </PopoverTrigger>
        {onClear && (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={clearLabel}
            cssOverride={styles.clear}
            onClick={onClear}
          >
            <X />
          </Button>
        )}
      </Flex>
    </PopoverAnchor>
  );
};

PickerTrigger.displayName = 'PickerTrigger';

/**
 * Single date selection presented in a popover-anchored calendar.
 *
 * @param props Component props.
 *
 * @returns DatePicker element.
 */
const DatePicker = ({
  value,
  onChange = noop,
  placeholder = __('Pick a date', 'kirki-ecommerce'),
  displayFormat = DATE_FORMATS.HUMAN_READABLE,
  minDate,
  maxDate,
  clearable = false,
  disabled = false,
  error = false,
  id,
  cssOverride,
}: DatePickerProps) => {
  const [open, setOpen] = useState(false);
  const calendarId = useId();

  const selectedDate = parseDateValue(value);
  const { startDate, endDate, disabledDays } = getDateBounds(minDate, maxDate);
  const displayValue = formatDateValue(selectedDate, displayFormat);
  const showClear = clearable && Boolean(selectedDate) && !disabled;

  const handleSelect = (nextDate: Date | undefined) => {
    onChange(formatDateValue(nextDate ?? null));
    setOpen(false);
  };

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PickerTrigger
        id={id}
        controlsId={calendarId}
        ariaHasPopup="grid"
        open={open}
        label={displayValue}
        placeholder={placeholder}
        clearLabel={__('Clear date', 'kirki-ecommerce')}
        onClear={showClear ? () => onChange(null) : undefined}
        disabled={disabled}
        error={error}
        cssOverride={cssOverride}
      />
      <PopoverContent id={calendarId} align="start" cssOverride={styles.content}>
        <Calendar
          mode="single"
          selected={selectedDate ?? undefined}
          onSelect={handleSelect}
          defaultMonth={selectedDate ?? undefined}
          startMonth={startDate ?? undefined}
          endMonth={endDate ?? undefined}
          disabled={disabledDays}
        />
      </PopoverContent>
    </Popover>
  );
};

DatePicker.displayName = 'DatePicker';

/**
 * Start/end date selection presented in a popover-anchored calendar.
 *
 * @param props Component props.
 *
 * @returns DateRangePicker element.
 */
const DateRangePicker = ({
  value,
  onChange = noop,
  placeholder = __('Pick a date range', 'kirki-ecommerce'),
  displayFormat = DATE_FORMATS.HUMAN_READABLE,
  minDate,
  maxDate,
  numberOfMonths = 2,
  clearable = false,
  disabled = false,
  error = false,
  id,
  cssOverride,
}: DateRangePickerProps) => {
  const [open, setOpen] = useState(false);
  const calendarId = useId();

  const fromDate = parseDateValue(value?.from);
  const toDate = parseDateValue(value?.to);
  const { startDate, endDate, disabledDays } = getDateBounds(minDate, maxDate);

  const fromLabel = formatDateValue(fromDate, displayFormat);
  const toLabel = formatDateValue(toDate, displayFormat);
  const showClear = clearable && Boolean(fromLabel) && !disabled;

  const selectedRange: DateRange | undefined = fromDate
    ? { from: fromDate, to: toDate ?? undefined }
    : undefined;

  const handleSelect = (nextRange: DateRange | undefined) => {
    const nextFrom = formatDateValue(nextRange?.from ?? null);
    const nextTo = formatDateValue(nextRange?.to ?? null);

    if (!nextFrom) {
      onChange(null);
      return;
    }

    onChange({ from: nextFrom, to: nextTo });

    if (nextTo) {
      setOpen(false);
    }
  };

  const triggerLabel = () => {
    if (!fromLabel) {
      return null;
    }

    if (!toLabel) {
      return fromLabel;
    }

    return `${fromLabel}${RANGE_DELIMITER}${toLabel}`;
  };

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PickerTrigger
        id={id}
        controlsId={calendarId}
        ariaHasPopup="grid"
        open={open}
        label={triggerLabel()}
        placeholder={placeholder}
        clearLabel={__('Clear date range', 'kirki-ecommerce')}
        onClear={showClear ? () => onChange(null) : undefined}
        disabled={disabled}
        error={error}
        cssOverride={cssOverride}
      />
      <PopoverContent id={calendarId} align="start" cssOverride={styles.content}>
        <Calendar
          mode="range"
          min={1}
          numberOfMonths={numberOfMonths}
          selected={selectedRange}
          onSelect={handleSelect}
          defaultMonth={fromDate ?? undefined}
          startMonth={startDate ?? undefined}
          endMonth={endDate ?? undefined}
          disabled={disabledDays}
        />
      </PopoverContent>
    </Popover>
  );
};

DateRangePicker.displayName = 'DateRangePicker';

type TimeColumnOption = {
  value: string;
  label: string;
};

type TimeColumnProps = {
  label: string;
  options: TimeColumnOption[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
};

const scrollOptionIntoView = (node: HTMLButtonElement | null) => {
  node?.scrollIntoView({ block: 'nearest' });
};

/**
 * Scrollable list of hour, minute, or meridiem options.
 *
 * @param props Component props.
 *
 * @returns TimeColumn element.
 */
const TimeColumn = ({ label, options, selectedValue, onSelect }: TimeColumnProps) => {
  return (
    <Flex
      direction="column"
      gap="2px"
      role="listbox"
      aria-label={label}
      cssOverride={styles.timeColumn}
    >
      {options.map((option) => {
        const isSelected = option.value === selectedValue;

        return (
          <Button
            key={option.value}
            ref={isSelected ? scrollOptionIntoView : undefined}
            variant="ghost"
            role="option"
            aria-selected={isSelected}
            tabIndex={-1}
            cssOverride={mergeCss(styles.timeOption, isSelected ? styles.timeOptionSelected : {})}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </Button>
        );
      })}
    </Flex>
  );
};

TimeColumn.displayName = 'TimeColumn';

/**
 * Editable time field with one overlay holding the hour and minute lists.
 *
 * @param props Component props.
 *
 * @returns TimePicker element.
 */
const TimePicker = ({
  value,
  onChange = noop,
  hourCycle = 24,
  disabled = false,
  error = false,
  id,
  cssOverride,
}: TimePickerProps) => {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const fieldRef = useRef<HTMLDivElement>(null);

  const isTwelveHour = hourCycle === 12;
  const parsedTime = parseDateValue(value, DATE_FORMATS.TIME_INPUT);

  const [fieldValue, setFieldValue] = useState(value ?? '');

  useEffect(() => {
    setFieldValue(value ?? '');
  }, [value]);

  const selectedHour = parsedTime ? parsedTime.getHours() : null;
  const selectedMinute = parsedTime ? parsedTime.getMinutes() : null;
  const meridiem =
    selectedHour === null
      ? null
      : selectedHour >= 12
        ? MERIDIEM_PM
        : MERIDIEM_AM;

  const hourOptions = (
    isTwelveHour
      ? Array.from({ length: 12 }, (_, index) => index + 1)
      : Array.from({ length: 24 }, (_, index) => index)
  ).map((hour) => ({
    value: String(hour),
    label: isTwelveHour ? String(hour) : padTimePart(hour),
  }));

  const minuteOptions = Array.from({ length: 60 }, (_, index) => ({
    value: String(index),
    label: padTimePart(index),
  }));

  const selectedHourValue =
    selectedHour === null
      ? null
      : String(isTwelveHour ? selectedHour % 12 || 12 : selectedHour);

  const emitTime = (hour: number, minute: number) => {
    onChange(
      formatDateValue(
        new Date(2000, 0, 1, hour, minute),
        DATE_FORMATS.TIME_INPUT,
      ),
    );
  };

  const handleHourSelect = (nextHour: string) => {
    const hour = Number(nextHour);
    const hour24 = isTwelveHour
      ? (hour % 12) + (meridiem === MERIDIEM_PM ? 12 : 0)
      : hour;

    emitTime(hour24, selectedMinute ?? 0);
  };

  const handleMinuteSelect = (nextMinute: string) => {
    emitTime(selectedHour ?? 0, Number(nextMinute));
  };

  const handleMeridiemSelect = (nextMeridiem: string) => {
    const hour12 = (selectedHour ?? 0) % 12;

    emitTime(hour12 + (nextMeridiem === MERIDIEM_PM ? 12 : 0), selectedMinute ?? 0);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <InputGroup ref={fieldRef} error={error} disabled={disabled} cssOverride={cssOverride}>
          <InputGroupInput
            id={id}
            type="time"
            value={fieldValue}
            disabled={disabled}
            aria-invalid={error || undefined}
            cssOverride={styles.timeInput}
            onChange={(event) => {
              setFieldValue(event.target.value);

              if (event.target.value) {
                onChange(event.target.value);
              }
            }}
            onClick={() => setOpen((prev) => !prev)}
            onBlur={(event) => {
              if (!event.target.value) {
                onChange(null);
              }
            }}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-sm"
              variant="ghost"
              disabled={disabled}
              aria-haspopup="dialog"
              aria-controls={panelId}
              aria-expanded={open}
              aria-label={__('Choose time', 'kirki-ecommerce')}
              onClick={() => setOpen((isOpen) => !isOpen)}
            >
              <Text color="disabled"><Clock size={14} /></Text>
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </PopoverAnchor>
      <PopoverContent
        id={panelId}
        align="start"
        cssOverride={styles.timeContent}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          const target = event.detail.originalEvent.target;

          if (target instanceof Node && fieldRef.current?.contains(target)) {
            event.preventDefault();
          }
        }}
      >
        <Flex gap={1}>
          <TimeColumn
            label={__('Hour', 'kirki-ecommerce')}
            options={hourOptions}
            selectedValue={selectedHourValue}
            onSelect={handleHourSelect}
          />
          <TimeColumn
            label={__('Minute', 'kirki-ecommerce')}
            options={minuteOptions}
            selectedValue={selectedMinute === null ? null : String(selectedMinute)}
            onSelect={handleMinuteSelect}
          />
          {isTwelveHour && (
            <TimeColumn
              label={__('Meridiem', 'kirki-ecommerce')}
              options={[
                { value: MERIDIEM_AM, label: __('AM', 'kirki-ecommerce') },
                { value: MERIDIEM_PM, label: __('PM', 'kirki-ecommerce') },
              ]}
              selectedValue={meridiem}
              onSelect={handleMeridiemSelect}
            />
          )}
        </Flex>
      </PopoverContent>
    </Popover>
  );
};

TimePicker.displayName = 'TimePicker';

/**
 * Combined date and time selection emitting a single `yyyy-MM-dd HH:mm` string.
 *
 * @param props Component props.
 *
 * @returns DateTimePicker element.
 */
const DateTimePicker = ({
  value,
  onChange = noop,
  placeholder = __('Pick a date and time', 'kirki-ecommerce'),
  displayFormat = DATE_FORMATS.HUMAN_READABLE_WITH_TIME,
  minDate,
  maxDate,
  hourCycle = 24,
  clearable = false,
  disabled = false,
  error = false,
  id,
  cssOverride,
}: DateTimePickerProps) => {
  const [open, setOpen] = useState(false);
  const [displayedMonth, setDisplayedMonth] = useState<Date | undefined>();
  const calendarId = useId();

  const selectedDateTime = parseDateValue(value, DATE_FORMATS.DATE_TIME_INPUT);
  const { startDate, endDate, disabledDays } = getDateBounds(minDate, maxDate);

  const datePart = formatDateValue(selectedDateTime);
  const timePart = formatDateValue(selectedDateTime, DATE_FORMATS.TIME_INPUT);
  const displayValue = formatDateValue(selectedDateTime, displayFormat);
  const showClear = clearable && Boolean(selectedDateTime) && !disabled;

  const getAnchorDate = () => {
    const today = new Date();

    if (!displayedMonth || isSameMonth(displayedMonth, today)) {
      return today;
    }

    return startOfMonth(displayedMonth);
  };

  const handleDateSelect = (nextDate: Date | undefined) => {
    const nextDatePart = formatDateValue(nextDate ?? null);

    if (!nextDatePart) {
      onChange(null);
      return;
    }

    onChange(`${nextDatePart} ${timePart ?? START_OF_DAY_TIME}`);
  };

  const handleTimeChange = (nextTime: string | null) => {
    if (!nextTime) {
      return;
    }

    const anchorDatePart = datePart ?? formatDateValue(getAnchorDate());

    onChange(`${anchorDatePart} ${nextTime}`);
  };

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PickerTrigger
        id={id}
        controlsId={calendarId}
        ariaHasPopup="dialog"
        open={open}
        label={displayValue}
        placeholder={placeholder}
        clearLabel={__('Clear date and time', 'kirki-ecommerce')}
        onClear={showClear ? () => onChange(null) : undefined}
        disabled={disabled}
        error={error}
        cssOverride={cssOverride}
      />
      <PopoverContent id={calendarId} align="start" cssOverride={styles.content}>
        <Calendar
          mode="single"
          selected={selectedDateTime ?? undefined}
          onSelect={handleDateSelect}
          defaultMonth={selectedDateTime ?? undefined}
          month={displayedMonth}
          onMonthChange={setDisplayedMonth}
          startMonth={startDate ?? undefined}
          endMonth={endDate ?? undefined}
          disabled={disabledDays}
        />
        <Separator marginTop={theme.spacing[2]} marginBottom={theme.spacing[2]} />
        <Flex align="center" justify="center" cssOverride={styles.footer}>
          <TimePicker
            value={timePart}
            onChange={handleTimeChange}
            hourCycle={hourCycle}
            disabled={disabled}
          />
        </Flex>
      </PopoverContent>
    </Popover>
  );
};

DateTimePicker.displayName = 'DateTimePicker';

export { Calendar, DatePicker, DateRangePicker, DateTimePicker, TimePicker };
export type {
  CalendarProps,
  DatePickerProps,
  DateRangePickerProps,
  DateRangeValue,
  DateTimePickerProps,
  HourCycle,
  TimePickerProps,
};

const defaultClassNames = getDefaultClassNames();

const styles = defineStyles({
  calendar: {
    width: 'max-content',
    ...theme.typography.small(),
    color: theme.colors.text.primary,
    [`.${defaultClassNames.months}`]: {
      position: 'relative',
      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing[4],
    },
    [`.${defaultClassNames.month}`]: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing[2],
    },
    [`.${defaultClassNames.month_caption}`]: {
      ...flexCenter(),
      height: theme.spacing[8],
      ...theme.typography.small('semibold'),
      color: theme.colors.text.primary,
    },
    [`.${defaultClassNames.nav}`]: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: theme.spacing[8],
      ...itemCenter(),
      justifyContent: 'space-between',
      pointerEvents: 'none',
    },
    [`.${defaultClassNames.button_previous}, .${defaultClassNames.button_next}`]:
    {
      ...flexCenter(),
      width: theme.spacing[7],
      height: theme.spacing[7],
      padding: 0,
      border: `1px solid ${theme.colors.border.default}`,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.background.fill,
      color: theme.colors.icon.secondary,
      cursor: 'pointer',
      pointerEvents: 'auto',
      '&:hover': {
        backgroundColor: theme.colors.background.fillHover,
        color: theme.colors.icon.primary,
      },
      '&:focus-visible': {
        ...uiFocusRing(theme),
      },
      '&:disabled': {
        color: theme.colors.icon.disabled,
        borderColor: theme.colors.border.disabled,
        cursor: 'not-allowed',
      },
    },
    [`.${defaultClassNames.month_grid}`]: {
      borderCollapse: 'collapse',
      margin: 0,
    },
    [`.${defaultClassNames.weekdays}`]: {
      ...theme.typography.tiny('medium'),
    },
    [`.${defaultClassNames.weekday}`]: {
      width: theme.spacing[9],
      height: theme.spacing[8],
      padding: 0,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      textTransform: 'none',
    },
    [`.${defaultClassNames.day}`]: {
      width: theme.spacing[9],
      height: theme.spacing[9],
      padding: 0,
      textAlign: 'center',
    },
    [`.${defaultClassNames.day_button}`]: {
      ...flexCenter(),
      width: '100%',
      height: '100%',
      padding: 0,
      border: 'none',
      borderRadius: theme.radius.md,
      backgroundColor: 'transparent',
      ...theme.typography.small(),
      color: 'inherit',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: theme.colors.background.fillHover,
      },
      '&:focus-visible': {
        ...uiFocusRing(theme),
      },
    },
    [`.${defaultClassNames.today}:not(.${defaultClassNames.selected}) .${defaultClassNames.day_button}`]:
    {
      ...theme.typography.small('semibold'),
      color: theme.colors.text.emphasis,
    },
    [`.${defaultClassNames.outside}`]: {
      color: theme.colors.text.subdued,
    },
    [`.${defaultClassNames.disabled}`]: {
      color: theme.colors.text.disabled,
    },
    [`.${defaultClassNames.disabled} .${defaultClassNames.day_button}`]: {
      cursor: 'not-allowed',
      '&:hover': {
        backgroundColor: 'transparent',
      },
    },
    [`.${defaultClassNames.selected} .${defaultClassNames.day_button}`]: {
      backgroundColor: theme.colors.background.fillBrand,
      color: theme.colors.text.light,
      '&:hover': {
        backgroundColor: theme.colors.background.fillBrandHover,
      },
    },
    [`.${defaultClassNames.range_middle}`]: {
      backgroundColor: theme.colors.background.fillSecondary,
    },
    [`.${defaultClassNames.range_middle} .${defaultClassNames.day_button}`]: {
      backgroundColor: 'transparent',
      color: theme.colors.text.primary,
      borderRadius: theme.radius.none,
      '&:hover': {
        backgroundColor: theme.colors.background.fillSecondaryHover,
      },
    },
    [`.${defaultClassNames.range_start}`]: {
      backgroundColor: theme.colors.background.fillSecondary,
      borderTopLeftRadius: theme.radius.md,
      borderBottomLeftRadius: theme.radius.md,
    },
    [`.${defaultClassNames.range_end}`]: {
      backgroundColor: theme.colors.background.fillSecondary,
      borderTopRightRadius: theme.radius.md,
      borderBottomRightRadius: theme.radius.md,
    },
    [`.${defaultClassNames.range_start}.${defaultClassNames.range_end}`]: {
      backgroundColor: 'transparent',
    },
  },
  trigger: {
    width: '100%',
    minHeight: '36px',
    border: `1px solid ${theme.colors.border.default}`,
    padding: `0 ${theme.spacing[3]}`,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.fill,
    '&:focus-within, &:has([data-state="open"])': {
      borderColor: theme.colors.border.default,
      ...uiFocusRing(theme),
    },
    '&[data-disabled="true"]': {
      backgroundColor: theme.colors.background.surfaceAlt,
      color: theme.colors.text.secondary,
      opacity: 0.8,
      borderColor: 'transparent',
      pointerEvents: 'none',
    },
  },
  triggerError: {
    border: `1px solid ${theme.colors.border.critical}`,
    boxShadow: 'none',
    '&:focus-within, &:has([data-state="open"])': {
      borderColor: theme.colors.border.critical,
      ...uiFocusRing(theme, theme.colors.border.critical),
    },
  },
  triggerControl: {
    flex: 1,
    minWidth: 0,
    width: 'auto',
    height: 'auto',
    padding: `${theme.spacing[2]} 0`,
    justifyContent: 'space-between',
    borderRadius: theme.radius.none,
    backgroundColor: 'transparent',
    color: theme.colors.text.primary,
    textAlign: 'left',
    opacity: 1,
    transition: 'none',
    '&:hover': {
      backgroundColor: 'transparent',
      color: theme.colors.text.primary,
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: 'none',
    },
  },
  value: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    ...theme.typography.small(),
    color: theme.colors.text.primary,
  },
  placeholder: {
    color: theme.colors.text.secondary,
    opacity: 0.8,
  },
  clear: {
    flexShrink: 0,
    width: theme.spacing[5],
    height: theme.spacing[5],
    backgroundColor: 'transparent',
    color: theme.colors.text.secondary,
    transition: 'none',
    '& svg': {
      width: '14px',
      height: '14px',
    },
    '&:hover': {
      backgroundColor: 'transparent',
      color: theme.colors.text.primary,
    },
    '&:active': {
      transform: 'none',
    },
  },
  icon: {
    flexShrink: 0,
    color: theme.colors.text.secondary,
    opacity: 0.5,
  },
  content: {
    width: 'auto',
    minWidth: 'auto',
    maxWidth: 'none',
    padding: theme.spacing[2],
  },
  footer: {
    padding: `0 ${theme.spacing[1]}`,
  },
  timeInput: {
    '&::-webkit-calendar-picker-indicator': {
      display: 'none',
    },
  },
  timeContent: {
    width: 'auto',
    minWidth: 'auto',
    maxWidth: 'none',
    padding: theme.spacing[1],
  },
  timeColumn: {
    minWidth: '56px',
    maxHeight: '200px',
    overflowY: 'auto',
    '&:not(:first-of-type)': {
      paddingLeft: theme.spacing[1],
      borderLeft: `1px solid ${theme.colors.border.default}`,
    },
  },
  timeOption: {
    width: '100%',
    height: 'auto',
    padding: `${theme.spacing[3]}`,
    borderRadius: theme.radius.sm,
    backgroundColor: 'transparent',
    ...theme.typography.small(),
    color: theme.colors.text.primary,
    transition: 'none',
    '&:hover': {
      backgroundColor: theme.colors.background.optionHover,
      color: theme.colors.text.primary,
    },
    '&:active': {
      transform: 'none',
    },
  },
  timeOptionSelected: {
    backgroundColor: theme.colors.background.fillBrand,
    color: theme.colors.text.light,
    '&:hover': {
      backgroundColor: theme.colors.background.fillBrandHover,
      color: theme.colors.text.light,
    },
  },
});
