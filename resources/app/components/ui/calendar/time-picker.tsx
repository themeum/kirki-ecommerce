import type { CSSObject } from '@emotion/react';
import { Clock } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import Text from '@/components/ui/text';
import { DATE_FORMATS, formatDateValue, parseDateValue } from '@/libs/date';
import { theme } from '@/theme';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { noop } from '@/utils/function';
import { __ } from '@/wpi18n';

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

const MERIDIEM_AM = 'AM';
const MERIDIEM_PM = 'PM';

const padTimePart = (part: number) => String(part).padStart(2, '0');

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
          <InputGroupAddon align="inline-end" cssOverride={styles.timeAddon}>
            <InputGroupButton
              size="icon-sm"
              variant="ghost"
              disabled={disabled}
              cssOverride={styles.timeTrigger}
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

export default TimePicker;
export type { HourCycle, TimePickerProps };

const styles = defineStyles({
  timeInput: {
    '&::-webkit-calendar-picker-indicator': {
      display: 'none',
    },
  },
  timeAddon: {
    borderLeft: 'none',
  },
  timeTrigger: {
    backgroundColor: 'transparent',
    transition: 'none',
    '&:hover': {
      backgroundColor: 'transparent',
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
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
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
