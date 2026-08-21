import type { CSSObject } from '@emotion/react';
import { isSameDay, startOfDay } from 'date-fns';
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
import PickerTrigger, {
  type PickerTriggerSize,
} from '@/components/ui/calendar/picker-trigger';
import RangePresets, {
  type RangePresetOption,
} from '@/components/ui/calendar/range-presets';
import Flex from '@/components/ui/flex';
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

type DateRangeValue = {
  from: Date | null;
  to: Date | null;
};

type DateRangePickerProps = {
  value?: DateRangeValue | null;
  onChange?: (value: DateRangeValue | null) => void;
  placeholder?: string;
  displayFormat?: string;
  minDate?: Date | null;
  maxDate?: Date | null;
  numberOfMonths?: number;
  presets?: boolean | DateRangePresetKey[];
  presetsPosition?: DateRangePresetsPosition;
  clearable?: boolean;
  size?: PickerTriggerSize;
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
    const from = toValidDate(value?.from);
    const to = toValidDate(value?.to);

    if (!from || !to) {
      return null;
    }

    return presetOptions.find((option) => {
      return (
        option.range &&
        isSameDay(option.range.from, from) &&
        isSameDay(option.range.to, to)
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
  displayFormat = DATE_FORMATS.HUMAN_READABLE_SHORT,
  minDate,
  maxDate,
  numberOfMonths = 2,
  presets = false,
  presetsPosition = 'left',
  clearable = false,
  size = 'md',
  disabled = false,
  error = false,
  id,
  cssOverride,
}: DateRangePickerProps) => {
  const [open, setOpen] = useState(false);
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>(undefined);
  const calendarId = useId();

  const fromDate = applyTimeToDate(toValidDate(value?.from), START_OF_DAY_TIME);
  const toDate = applyTimeToDate(toValidDate(value?.to), END_OF_DAY_TIME);
  const { startDate, endDate, disabledDays } = useMemo(() => {
    return getDateBounds(applyTimeToDate(minDate, START_OF_DAY_TIME), applyTimeToDate(maxDate, END_OF_DAY_TIME));
  }, [minDate, maxDate]);

  const fromLabel = formatDateValue(fromDate, displayFormat);
  const toLabel = formatDateValue(toDate, displayFormat);
  const showClear = clearable && Boolean(fromLabel) && !disabled;

  const selectedRange: DateRange | undefined =
    pendingRange ??
    (fromDate ? { from: fromDate, to: toDate ?? undefined } : undefined);

  const commitRange = (from: Date, to: Date) => {
    setPendingRange(undefined);
    onChange({
      from: applyTimeToDate(from, START_OF_DAY_TIME),
      to: applyTimeToDate(to, END_OF_DAY_TIME),
    });
    setOpen(false);
  };

  const handleSelect = (nextRange: DateRange | undefined) => {
    const nextFrom = nextRange?.from ?? null;
    const nextTo = nextRange?.to ?? null;

    if (!nextFrom) {
      const pendingFrom = pendingRange?.from;

      if (pendingFrom) {
        commitRange(pendingFrom, pendingFrom);
        return;
      }

      setPendingRange(undefined);
      onChange(null);
      return;
    }

    if (!nextTo) {
      setPendingRange({ from: nextFrom, to: undefined });
      return;
    }

    commitRange(nextFrom, nextTo);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setPendingRange(undefined);
      setOpen(true);
      return;
    }

    const pendingFrom = pendingRange?.from;

    if (pendingFrom) {
      commitRange(pendingFrom, pendingFrom);
    }

    setOpen(false);
  };

  const handleClear = () => {
    setPendingRange(undefined);
    onChange(null);
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
    <Popover modal open={open} onOpenChange={handleOpenChange}>
      <PickerTrigger
        id={id}
        controlsId={calendarId}
        ariaHasPopup="grid"
        open={open}
        label={triggerLabel()}
        placeholder={placeholder}
        clearLabel={__('Clear date range', 'kirki-ecommerce')}
        onClear={showClear ? handleClear : undefined}
        size={size}
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
            resetOnSelect
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
