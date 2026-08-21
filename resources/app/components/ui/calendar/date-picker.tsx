import type { CSSObject } from '@emotion/react';
import { useId, useState } from 'react';

import Calendar from '@/components/ui/calendar/calendar';
import { pickerContentCss } from '@/components/ui/calendar/calendar-styles';
import { getDateBounds } from '@/components/ui/calendar/calendar-utils';
import PickerTrigger, {
  type PickerTriggerSize,
} from '@/components/ui/calendar/picker-trigger';
import { Popover, PopoverContent } from '@/components/ui/popover';
import {
  applyTimeToDate,
  DATE_FORMATS,
  END_OF_DAY_TIME,
  formatDateValue,
  START_OF_DAY_TIME,
  toValidDate,
} from '@/libs/date';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

type DatePickerProps = {
  value: Date | null;
  onChange?: (value: Date | null) => void;
  placeholder?: string;
  displayFormat?: string;
  minDate?: Date | null;
  maxDate?: Date | null;
  clearable?: boolean;
  size?: PickerTriggerSize;
  disabled?: boolean;
  error?: boolean;
  id?: string;
  cssOverride?: CSSObject;
};

const DatePicker = ({
  value,
  onChange = noop,
  placeholder = __('Pick a date', 'kirki-ecommerce'),
  displayFormat = DATE_FORMATS.HUMAN_READABLE_SHORT,
  minDate,
  maxDate,
  clearable = false,
  size = 'md',
  disabled = false,
  error = false,
  id,
  cssOverride,
}: DatePickerProps) => {
  const [open, setOpen] = useState(false);
  const calendarId = useId();

  const selectedDate = applyTimeToDate(toValidDate(value), START_OF_DAY_TIME);
  const { startDate, endDate, disabledDays } = getDateBounds(applyTimeToDate(minDate, START_OF_DAY_TIME), applyTimeToDate(maxDate, END_OF_DAY_TIME));
  const displayValue = formatDateValue(selectedDate, displayFormat);
  const showClear = clearable && Boolean(selectedDate) && !disabled;

  const handleSelect = (nextDate: Date | undefined) => {
    onChange(applyTimeToDate(nextDate, START_OF_DAY_TIME));
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
        size={size}
        disabled={disabled}
        error={error}
        cssOverride={cssOverride}
      />
      <PopoverContent id={calendarId} align="start" cssOverride={pickerContentCss}>
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

export default DatePicker;
export type { DatePickerProps };
