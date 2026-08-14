import type { CSSObject } from '@emotion/react';
import { isSameMonth, startOfMonth } from 'date-fns';
import { useId, useState } from 'react';

import Calendar from '@/components/ui/calendar/calendar';
import { pickerContentCss } from '@/components/ui/calendar/calendar-styles';
import { getDateBounds } from '@/components/ui/calendar/calendar-utils';
import PickerTrigger from '@/components/ui/calendar/picker-trigger';
import TimePicker, { type HourCycle } from '@/components/ui/calendar/time-picker';
import Flex from '@/components/ui/flex';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
  DATE_FORMATS,
  formatDateValue,
  parseDateValue,
  START_OF_DAY_TIME,
} from '@/libs/date';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

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
      <PopoverContent id={calendarId} align="start" cssOverride={pickerContentCss}>
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

export default DateTimePicker;
export type { DateTimePickerProps };

const styles = defineStyles({
  footer: {
    padding: `0 ${theme.spacing[1]}`,
  },
});
