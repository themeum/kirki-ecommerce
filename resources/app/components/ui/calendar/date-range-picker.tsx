import type { CSSObject } from '@emotion/react';
import { useId, useState } from 'react';
import type { DateRange } from 'react-day-picker';

import Calendar from '@/components/ui/calendar/calendar';
import { pickerContentCss } from '@/components/ui/calendar/calendar-styles';
import { getDateBounds } from '@/components/ui/calendar/calendar-utils';
import PickerTrigger from '@/components/ui/calendar/picker-trigger';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { DATE_FORMATS, formatDateValue, parseDateValue } from '@/libs/date';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

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

const RANGE_DELIMITER = ' – ';

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
      <PopoverContent id={calendarId} align="start" cssOverride={pickerContentCss}>
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

export default DateRangePicker;
export type { DateRangePickerProps, DateRangeValue };
