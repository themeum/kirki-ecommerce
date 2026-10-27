import type { CSSObject } from '@emotion/react';
import { differenceInCalendarDays, isSameDay, startOfDay, startOfMonth, subMonths } from 'date-fns';
import { type ReactElement, useId, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';

import Calendar from '@/components/ui/calendar/calendar';
import {
  clampPresetRange,
  type DateRangePresetsInput,
  type DateRangePresetsPosition,
  resolveRangePresets,
} from '@/components/ui/calendar/calendar-presets';
import { pickerContentCss, pickerPanelCss } from '@/components/ui/calendar/calendar-styles';
import { getDateBounds } from '@/components/ui/calendar/calendar-utils';
import PickerTrigger, { type PickerTriggerSize } from '@/components/ui/calendar/picker-trigger';
import RangeFields from '@/components/ui/calendar/range-fields';
import RangeFooter from '@/components/ui/calendar/range-footer';
import RangePresets, { type RangePresetOption } from '@/components/ui/calendar/range-presets';
import Flex from '@/components/ui/flex';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  applyTimeToDate,
  DATE_FORMATS,
  END_OF_DAY_TIME,
  formatDateValue,
  START_OF_DAY_TIME,
  toValidDate,
} from '@/libs/date';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { noop } from '@/utils/function';
import { __, _n, sprintf } from '@/wpi18n';

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
  presets?: DateRangePresetsInput;
  presetsPosition?: DateRangePresetsPosition;
  customPresetLabel?: string;
  confirm?: boolean;
  trigger?: ReactElement;
  clearable?: boolean;
  size?: PickerTriggerSize;
  disabled?: boolean;
  error?: boolean;
  id?: string;
  cssOverride?: CSSObject;
};

const RANGE_DELIMITER = ' – ';

const PresetBar = ({
  presets,
  position,
  value,
  onSelect,
  startDate,
  endDate,
  statusLabel,
}: {
  presets: DateRangePresetsInput;
  position: DateRangePresetsPosition;
  onSelect: (option: RangePresetOption) => void;
  value?: DateRangeValue | null;
  statusLabel?: string;
  startDate: Date | null;
  endDate: Date | null;
}) => {
  const presetOptions: RangePresetOption[] = useMemo(() => {
    return resolveRangePresets(presets).map((preset) => ({
      key: preset.key,
      label: preset.label,
      range: clampPresetRange(preset.getRange(startOfDay(new Date())), startDate, endDate),
    }));
  }, [presets, startDate, endDate]);

  const activePresetKey = useMemo(() => {
    const from = toValidDate(value?.from);
    const to = toValidDate(value?.to);

    if (!from || !to) {
      return null;
    }

    return (
      presetOptions.find((option) => {
        return option.range && isSameDay(option.range.from, from) && isSameDay(option.range.to, to);
      })?.key ?? null
    );
  }, [presetOptions, value]);

  if (!presets) {
    return null;
  }

  if (presetOptions.length < 0) {
    return null;
  }

  return (
    <RangePresets
      options={presetOptions}
      position={position}
      activeKey={activePresetKey}
      onSelect={onSelect}
      statusLabel={statusLabel}
    />
  );
};

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
  customPresetLabel,
  confirm = false,
  trigger,
  clearable = false,
  size = 'md',
  disabled = false,
  error = false,
  id,
  cssOverride,
}: DateRangePickerProps) => {
  const [open, setOpen] = useState(false);
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>(undefined);
  const [month, setMonth] = useState<Date | undefined>(undefined);
  const calendarId = useId();

  const fromDate = applyTimeToDate(toValidDate(value?.from), START_OF_DAY_TIME);
  const toDate = applyTimeToDate(toValidDate(value?.to), END_OF_DAY_TIME);
  const { startDate, endDate, disabledDays } = useMemo(() => {
    return getDateBounds(
      applyTimeToDate(minDate, START_OF_DAY_TIME),
      applyTimeToDate(maxDate, END_OF_DAY_TIME),
    );
  }, [minDate, maxDate]);

  const fromLabel = formatDateValue(fromDate, displayFormat);
  const toLabel = formatDateValue(toDate, displayFormat);
  const showClear = clearable && Boolean(fromLabel) && !disabled;

  const selectedRange: DateRange | undefined =
    pendingRange ?? (fromDate ? { from: fromDate, to: toDate ?? undefined } : undefined);

  const commitRange = (from: Date, to: Date) => {
    setPendingRange(undefined);
    onChange({
      from: applyTimeToDate(from, START_OF_DAY_TIME),
      to: applyTimeToDate(to, END_OF_DAY_TIME),
    });
    setOpen(false);
  };

  const showRange = (range: DateRange | undefined) => {
    const lastDay = range?.to ?? range?.from;

    setPendingRange(range);
    setMonth(lastDay ? subMonths(startOfMonth(lastDay), numberOfMonths - 1) : undefined);
  };

  const handleConfirmSelect = (nextRange: DateRange | undefined) => {
    const pendingFrom = pendingRange?.from;

    if (!nextRange?.from && pendingFrom) {
      setPendingRange({ from: pendingFrom, to: pendingFrom });
      return;
    }

    setPendingRange(nextRange);
  };

  const handleApply = () => {
    if (pendingRange?.from && pendingRange.to) {
      commitRange(pendingRange.from, pendingRange.to);
    }
  };

  const handleCancel = () => {
    setPendingRange(undefined);
    setOpen(false);
  };

  const handleSelect = (nextRange: DateRange | undefined) => {
    if (confirm) {
      handleConfirmSelect(nextRange);
      return;
    }

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
    if (nextOpen && confirm) {
      showRange(fromDate ? { from: fromDate, to: toDate ?? undefined } : undefined);
      setOpen(true);
      return;
    }

    if (nextOpen) {
      setPendingRange(undefined);
      setOpen(true);
      return;
    }

    if (confirm) {
      handleCancel();
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

    if (confirm) {
      showRange(option.range);
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

  const pendingFrom = pendingRange?.from ?? null;
  const pendingTo = pendingRange?.to ?? null;
  const pendingValue = { from: pendingFrom, to: pendingTo };
  const pendingDays =
    pendingFrom && pendingTo ? differenceInCalendarDays(pendingTo, pendingFrom) + 1 : 0;

  const renderPresetBar = () => {
    return (
      <PresetBar
        presets={presets}
        onSelect={handlePresetSelect}
        position={presetsPosition}
        startDate={startDate}
        endDate={endDate}
        value={confirm ? pendingValue : value}
        statusLabel={customPresetLabel}
      />
    );
  };

  const renderCalendar = () => {
    return (
      <Calendar
        mode="range"
        min={1}
        numberOfMonths={numberOfMonths}
        selected={selectedRange}
        onSelect={handleSelect}
        defaultMonth={fromDate ?? undefined}
        {...(confirm ? { month, onMonthChange: setMonth } : {})}
        startMonth={startDate ?? undefined}
        endMonth={endDate ?? undefined}
        disabled={disabledDays}
        resetOnSelect
      />
    );
  };

  const renderConfirmContent = () => {
    return (
      <Flex direction="column">
        <Flex cssOverride={styles.panelBody}>
          {presetsPosition === 'left' && renderPresetBar()}
          <Flex direction="column" gap={3} cssOverride={styles.panelMain}>
            <RangeFields from={pendingFrom} to={pendingTo} displayFormat={displayFormat} />
            {renderCalendar()}
          </Flex>
          {presetsPosition !== 'left' && renderPresetBar()}
        </Flex>
        <RangeFooter
          summary={
            pendingDays > 0
              ? sprintf(_n('%d day', '%d days', pendingDays, 'kirki-ecommerce'), pendingDays)
              : null
          }
          applyDisabled={!pendingFrom || !pendingTo}
          onCancel={handleCancel}
          onApply={handleApply}
        />
      </Flex>
    );
  };

  return (
    <Popover modal open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      ) : (
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
      )}
      <PopoverContent
        id={calendarId}
        align="start"
        cssOverride={confirm ? pickerPanelCss : pickerContentCss}
      >
        {confirm ? (
          renderConfirmContent()
        ) : (
          <Flex direction={presetsPosition === 'bottom' ? 'column' : 'row'} gap={2}>
            {presetsPosition === 'left' && renderPresetBar()}
            {renderCalendar()}
            {presetsPosition !== 'left' && renderPresetBar()}
          </Flex>
        )}
      </PopoverContent>
    </Popover>
  );
};

DateRangePicker.displayName = 'DateRangePicker';

export default DateRangePicker;
export type { DateRangePickerProps, DateRangeValue };

const styles = defineStyles({
  panelBody: {
    '& > [data-slot="range-presets"]': {
      padding: theme.spacing[2],
    },
  },
  panelMain: {
    padding: theme.spacing[2],
  },
});
