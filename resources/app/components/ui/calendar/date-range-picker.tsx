import type { CSSObject } from '@emotion/react';
import { startOfDay } from 'date-fns';
import { useId, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';

import Calendar from '@/components/ui/calendar/calendar';
import {
  clampPresetRange,
  type DateRangePresetKey,
  type DateRangePresetsPosition,
  resolveRangePresets,
} from '@/components/ui/calendar/calendar-presets';
import { pickerContentCss } from '@/components/ui/calendar/calendar-styles';
import { getDateBounds } from '@/components/ui/calendar/calendar-utils';
import PickerTrigger from '@/components/ui/calendar/picker-trigger';
import RangePresets, {
  type RangePresetOption,
} from '@/components/ui/calendar/range-presets';
import Flex from '@/components/ui/flex';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { DATE_FORMATS, formatDateValue, parseDateValue } from '@/libs/date';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

type DateRangeValue = {
  from: string | null;
  to: string | null;
};

type DateRangePickerProps = {
  value?: DateRangeValue | null;
  onChange?: (value: DateRangeValue | null) => void;
  placeholder?: string;
  displayFormat?: string;
  minDate?: string | null;
  maxDate?: string | null;
  numberOfMonths?: number;
  presets?: boolean | DateRangePresetKey[];
  presetsPosition?: DateRangePresetsPosition;
  clearable?: boolean;
  disabled?: boolean;
  error?: boolean;
  id?: string;
  cssOverride?: CSSObject;
};

const RANGE_DELIMITER = ' – ';

const PresetBar = ({ presets, position, value, onSelect, startDate, endDate }: {
  presets: boolean | DateRangePresetKey[];
  position: DateRangePresetsPosition;
  onSelect: (option: RangePresetOption) => void
  value?: DateRangeValue | null;
  startDate: Date | null;
  endDate: Date | null;
}) => {
  const presetOptions: RangePresetOption[] = useMemo(() => {
    return resolveRangePresets(presets).map(
      (preset) => ({
        key: preset.key,
        label: preset.label,
        range: clampPresetRange(
          preset.getRange(startOfDay(new Date())),
          startDate,
          endDate,
        ),
      }),
    );
  }, [presets, startDate, endDate]);

  const activePresetKey = useMemo(() => {
    return presetOptions.find((option) => {
      return (
        option.range &&
        formatDateValue(option.range.from) === value?.from &&
        formatDateValue(option.range.to) === value?.to
      );
    })?.key ?? null
  }, [presetOptions, value]);

  if (!presets) {
    return null;
  }

  if (presetOptions.length < 0) {
    return null;
  }

  return <RangePresets
    options={presetOptions}
    position={position}
    activeKey={activePresetKey}
    onSelect={onSelect}
  />
}

const DateRangePicker = ({
  value,
  onChange = noop,
  placeholder = __('Pick a range', 'kirki-ecommerce'),
  displayFormat = DATE_FORMATS.HUMAN_READABLE,
  minDate,
  maxDate,
  numberOfMonths = 2,
  presets = false,
  presetsPosition = 'left',
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
  const { startDate, endDate, disabledDays } = useMemo(() => {
    return getDateBounds(minDate, maxDate);
  }, [minDate, maxDate]);

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

  const handlePresetSelect = (option: RangePresetOption) => {
    if (!option.range) {
      return;
    }

    handleSelect(option.range);
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
        <Flex
          direction={presetsPosition === 'bottom' ? 'column' : 'row'}
          gap={2}
        >
          {presetsPosition === 'left' && <PresetBar
            presets={presets}
            onSelect={handlePresetSelect}
            position={presetsPosition}
            startDate={startDate}
            endDate={endDate}
            value={value}
          />}
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
          {presetsPosition !== 'left' && <PresetBar
            presets={presets}
            onSelect={handlePresetSelect}
            position={presetsPosition}
            startDate={startDate}
            endDate={endDate}
            value={value}
          />}
        </Flex>
      </PopoverContent>
    </Popover>
  );
};

DateRangePicker.displayName = 'DateRangePicker';

export default DateRangePicker;
export type { DateRangePickerProps, DateRangeValue };
