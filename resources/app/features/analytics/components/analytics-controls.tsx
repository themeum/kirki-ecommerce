import { format, parseISO, startOfDay, startOfMonth, subMonths } from 'date-fns';
import { ArrowLeftRight, Calendar as CalendarIcon, ChevronDown, Settings2 } from 'lucide-react';
import { type ComponentProps, type ReactNode, useState } from 'react';
import type { DateRange } from 'react-day-picker';

import Button from '@/components/ui/button';
import {
  Calendar,
  DateRangePicker,
  type DateRangePreset,
  type DateRangeValue,
} from '@/components/ui/calendar';
import { pickerPanelCss } from '@/components/ui/calendar/calendar-styles';
import RangeFields from '@/components/ui/calendar/range-fields';
import RangeFooter from '@/components/ui/calendar/range-footer';
import Flex from '@/components/ui/flex';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Text from '@/components/ui/text';
import CustomizeSheet from '@/features/analytics/components/customize-sheet';
import type { AnalyticsLayoutControls } from '@/features/analytics/hooks/use-analytics-layout';
import {
  type CompareKey,
  COMPARISONS,
  type DayRange,
  findRangePreset,
  formatRangeDates,
  getCompareLabel,
  getRangePresetLabel,
  RANGE_PRESETS,
  resolveComparisonRange,
  resolvePresetRange,
} from '@/features/analytics/lib/date-range';
import type { AnalyticsParams } from '@/features/analytics/lib/url-state';
import type { MoneyObject } from '@/features/analytics/schemas/catalog/analytics';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

const ISO_DAY = 'yyyy-MM-dd';
const DISPLAY_FORMAT = 'MMM d, yyyy';

type ControlProps = {
  params: AnalyticsParams;
  onChange: (params: AnalyticsParams) => void;
};

type AnalyticsControlsProps = ControlProps & {
  layoutControls: AnalyticsLayoutControls;
  amountExample?: MoneyObject | null;
};

type PendingCompare = {
  compare: CompareKey;
  from: string | null;
  to: string | null;
};

const toDayRange = (range: DateRange | undefined): DayRange | null => {
  if (!range?.from || !range.to) {
    return null;
  }

  return { from: format(range.from, ISO_DAY), to: format(range.to, ISO_DAY) };
};

const getAppliedRange = (params: AnalyticsParams, today: Date): DayRange => {
  if (params.range === 'custom' && params.from && params.to) {
    return { from: params.from, to: params.to };
  }

  return resolvePresetRange(params.range === 'custom' ? 'last_30' : params.range, today);
};

const getCompareRange = (pending: PendingCompare, range: DayRange): DayRange | null => {
  if (pending.compare !== 'custom') {
    return resolveComparisonRange(pending.compare, range);
  }

  if (!pending.from || !pending.to) {
    return null;
  }

  return { from: pending.from, to: pending.to };
};

const ANALYTICS_PRESETS: DateRangePreset[] = RANGE_PRESETS.map((preset) => ({
  key: preset,
  label: getRangePresetLabel(preset),
  getRange: (today) => {
    const range = resolvePresetRange(preset, today);

    return { from: parseISO(range.from), to: parseISO(range.to) };
  },
}));

type ControlTriggerProps = ComponentProps<typeof Button> & {
  icon: ReactNode;
};

const ControlTrigger = (props: ControlTriggerProps) => {
  const { icon, children, ...rest } = props;

  return (
    <Button variant="outline" cssOverride={styles.trigger} {...rest}>
      {icon}
      {children}
      <ChevronDown size={14} aria-hidden="true" />
    </Button>
  );
};

ControlTrigger.displayName = 'ControlTrigger';

const DateRangeControl = (props: ControlProps) => {
  const { params, onChange } = props;
  const today = startOfDay(new Date());
  const range = getAppliedRange(params, today);
  const label = getRangePresetLabel(params.range);

  const handleChange = (value: DateRangeValue | null) => {
    const next = toDayRange(
      value ? { from: value.from ?? undefined, to: value.to ?? undefined } : undefined,
    );

    if (!next) {
      return;
    }

    const preset = findRangePreset(next, today);

    if (preset) {
      onChange({ ...params, range: preset, from: null, to: null });
      return;
    }

    onChange({ ...params, range: 'custom', from: next.from, to: next.to });
  };

  return (
    <DateRangePicker
      value={{ from: parseISO(range.from), to: parseISO(range.to) }}
      onChange={handleChange}
      presets={ANALYTICS_PRESETS}
      customPresetLabel={getRangePresetLabel('custom')}
      confirm
      maxDate={today}
      displayFormat={DISPLAY_FORMAT}
      trigger={
        <ControlTrigger
          data-testid="analytics-date-range"
          icon={<CalendarIcon size={14} aria-hidden="true" />}
        >
          <span css={scoped(styles.strong)}>{label}</span>
          <Text variant="small" color="subdued">
            {formatRangeDates(range.from, range.to)}
          </Text>
        </ControlTrigger>
      }
    />
  );
};

DateRangeControl.displayName = 'DateRangeControl';

type CompareOptionProps = {
  label: string;
  detail: string | null;
  isSelected: boolean;
  onSelect: () => void;
};

const CompareOption = (props: CompareOptionProps) => {
  const { label, detail, isSelected, onSelect } = props;

  return (
    <Button
      variant={isSelected ? 'secondary' : 'ghost'}
      aria-pressed={isSelected}
      cssOverride={styles.option}
      onClick={onSelect}
    >
      <span>{label}</span>
      {detail && (
        <Text variant="small" color="subdued">
          {detail}
        </Text>
      )}
    </Button>
  );
};

CompareOption.displayName = 'CompareOption';

const CompareControl = (props: ControlProps) => {
  const { params, onChange } = props;
  const today = startOfDay(new Date());
  const range = getAppliedRange(params, today);
  const applied: PendingCompare = {
    compare: params.compare,
    from: params.compare_from,
    to: params.compare_to,
  };
  const appliedRange = getCompareRange(applied, range);
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState<PendingCompare>(applied);
  const pendingRange = getCompareRange(pending, range);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setPending(applied);
    }

    setIsOpen(nextOpen);
  };

  const selectOption = (compare: CompareKey) => {
    if (compare !== 'custom') {
      setPending({ compare, from: null, to: null });
      return;
    }

    const start =
      applied.compare === 'custom' && appliedRange
        ? appliedRange
        : resolveComparisonRange('previous_period', range);

    setPending({ compare, from: start?.from ?? null, to: start?.to ?? null });
  };

  const selectDays = (next: DateRange | undefined) => {
    if (!next?.from && pending.from) {
      setPending({ ...pending, to: pending.from });
      return;
    }

    setPending({
      compare: 'custom',
      from: next?.from ? format(next.from, ISO_DAY) : null,
      to: next?.to ? format(next.to, ISO_DAY) : null,
    });
  };

  const apply = () => {
    const isCustom = pending.compare === 'custom';

    onChange({
      ...params,
      compare: pending.compare,
      compare_from: isCustom ? pending.from : null,
      compare_to: isCustom ? pending.to : null,
    });
    setIsOpen(false);
  };

  const renderCustomRange = () => {
    const from = pending.from ? parseISO(pending.from) : null;
    const to = pending.to ? parseISO(pending.to) : null;
    const lastDay = to ?? from ?? today;

    return (
      <Flex direction="column" gap={3}>
        <RangeFields from={from} to={to} displayFormat={DISPLAY_FORMAT} />
        <Calendar
          mode="range"
          min={1}
          numberOfMonths={2}
          selected={from ? { from, to: to ?? undefined } : undefined}
          onSelect={selectDays}
          defaultMonth={subMonths(startOfMonth(lastDay), 1)}
          endMonth={today}
          disabled={{ after: today }}
          resetOnSelect
        />
      </Flex>
    );
  };

  return (
    <Popover modal open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <ControlTrigger
          data-testid="analytics-compare"
          icon={<ArrowLeftRight size={14} aria-hidden="true" />}
        >
          {appliedRange ? (
            <>
              <Text variant="small" color="subdued">
                {__('Compare:', 'kirki-ecommerce')}
              </Text>
              <span css={scoped(styles.strong)}>
                {formatRangeDates(appliedRange.from, appliedRange.to)}
              </span>
            </>
          ) : (
            <span css={scoped(styles.strong)}>{getCompareLabel('none')}</span>
          )}
        </ControlTrigger>
      </PopoverTrigger>
      <PopoverContent align="start" cssOverride={pickerPanelCss}>
        <Flex direction="column">
          <Flex gap={2} cssOverride={styles.panelBody}>
            <Flex direction="column" gap={1} cssOverride={styles.options}>
              {COMPARISONS.map((compare) => {
                const optionRange =
                  compare === 'custom' ? null : resolveComparisonRange(compare, range);

                return (
                  <CompareOption
                    key={compare}
                    label={getCompareLabel(compare)}
                    detail={optionRange ? formatRangeDates(optionRange.from, optionRange.to) : null}
                    isSelected={pending.compare === compare}
                    onSelect={() => selectOption(compare)}
                  />
                );
              })}
            </Flex>
            {pending.compare === 'custom' && renderCustomRange()}
          </Flex>
          <RangeFooter
            summary={
              pendingRange
                ? sprintf(
                    __('Compared with %s', 'kirki-ecommerce'),
                    formatRangeDates(pendingRange.from, pendingRange.to),
                  )
                : null
            }
            applyDisabled={pending.compare === 'custom' && !pendingRange}
            onCancel={() => setIsOpen(false)}
            onApply={apply}
          />
        </Flex>
      </PopoverContent>
    </Popover>
  );
};

CompareControl.displayName = 'CompareControl';

const AnalyticsControls = (props: AnalyticsControlsProps) => {
  const { params, onChange, layoutControls, amountExample } = props;

  return (
    <Flex align="center" justify="space-between" gap={2} wrap="wrap">
      <Flex align="center" gap={2} wrap="wrap">
        <DateRangeControl params={params} onChange={onChange} />
        <CompareControl params={params} onChange={onChange} />
      </Flex>
      <CustomizeSheet layoutControls={layoutControls} amountExample={amountExample}>
        <Button variant="outline" cssOverride={styles.trigger}>
          <Settings2 aria-hidden="true" />
          {__('Customize', 'kirki-ecommerce')}
        </Button>
      </CustomizeSheet>
    </Flex>
  );
};

AnalyticsControls.displayName = 'AnalyticsControls';

export default AnalyticsControls;

const styles = defineStyles({
  trigger: {
    gap: theme.spacing[2],
    backgroundColor: theme.colors.background.fill,
  },
  strong: {
    ...theme.typography.small('semibold'),
  },
  panelBody: {
    padding: theme.spacing[2],
  },
  options: {
    minWidth: '240px',
  },
  option: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 0,
    width: '100%',
    height: 'auto',
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    textAlign: 'left',
  },
});
