import { type CSSProperties, useState } from 'react';

import { formatNumber } from '@/features/analytics/lib/format';
import { dotScale, formatHourSpan, type HourCounts } from '@/features/analytics/lib/time-of-day';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __, _n, sprintf } from '@/wpi18n';

const MIN_RADIUS = 1.5;
const MAX_RADIUS = 11;
const HOVER_RING_SIZE = 26;
const HOUR_LABELS = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p'];

type DotGridMode = 'current' | 'change';

type DotGridProps = {
  label: string;
  counts: HourCounts;
  previous?: HourCounts | null;
  mode: DotGridMode;
  dayLabels: string[];
  dayTotals: number[];
};

type Cell = {
  key: string;
  direction?: 'up' | 'down' | 'flat';
  radius: number;
  color: string;
  text: string;
};

const ordersText = (count: number) =>
  sprintf(_n('%s order', '%s orders', count, 'kirki-ecommerce'), formatNumber(count));

const signed = (value: number) => (value > 0 ? `+${formatNumber(value)}` : formatNumber(value));

const buildCells = (props: DotGridProps): Cell[][] => {
  const { counts, previous, mode, dayLabels } = props;
  const isChange = mode === 'change' && !!previous;
  const differences = counts.map((row, day) =>
    row.map((count, hour) => count - (previous?.[day][hour] ?? 0)),
  );
  const max = isChange
    ? Math.max(...differences.flat().map(Math.abs))
    : Math.max(...counts.flat());

  return counts.map((row, day) =>
    row.map((count, hour) => {
      const span = `${dayLabels[day]} ${formatHourSpan(hour)}`;
      const difference = differences[day][hour];
      const ratio = dotScale(isChange ? difference : count, max);
      const radius = MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * ratio;

      if (!isChange) {
        return {
          key: `${day}-${hour}`,
          radius,
          color: `color-mix(in srgb, ${theme.colors.analytics.chart.primary} ${Math.round(ratio * 100)}%, ${theme.colors.analytics.chart.mid})`,
          text: `${span} · ${ordersText(count)}`,
        };
      }

      return {
        key: `${day}-${hour}`,
        direction: difference > 0 ? 'up' : difference < 0 ? 'down' : 'flat',
        radius,
        color:
          difference > 0
            ? theme.colors.analytics.heatmap.increase
            : theme.colors.analytics.heatmap.decrease,
        text: `${span} · ${sprintf(
          __('%1$s, %2$s before (%3$s)', 'kirki-ecommerce'),
          ordersText(count),
          formatNumber(previous?.[day][hour] ?? 0),
          signed(difference),
        )}`,
      };
    }),
  );
};

const tooltipPlacement = (day: number, hour: number): CSSProperties => ({
  ...(day < 3 ? { top: '100%' } : { bottom: '100%' }),
  ...(hour < 4 && { left: 0, transform: 'none' }),
  ...(hour > 19 && { left: 'auto', right: 0, transform: 'none' }),
});

const DotGrid = (props: DotGridProps) => {
  const { label, dayLabels, dayTotals } = props;
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const cells = buildCells(props);

  return (
    <div css={scoped(styles.scroller)}>
      <div role="group" aria-label={label} css={scoped(styles.grid)}>
        {cells.map((row, day) => (
          <div key={dayLabels[day]} css={scoped(styles.row)} data-testid={`dot-grid-row-${day}`}>
            <span css={scoped(styles.dayLabel)}>{dayLabels[day]}</span>
            {row.map((cell, hour) => (
              <button
                key={cell.key}
                type="button"
                aria-label={cell.text}
                data-testid={`dot-${cell.key}`}
                css={scoped(styles.cell)}
                onMouseEnter={() => setActiveKey(cell.key)}
                onMouseLeave={() => setActiveKey(null)}
                onFocus={() => setActiveKey(cell.key)}
                onBlur={() => setActiveKey(null)}
              >
                <span
                  aria-hidden="true"
                  data-dot=""
                  data-direction={cell.direction}
                  css={scoped(styles.dot)}
                  style={{
                    width: `${cell.radius * 2}px`,
                    height: `${cell.radius * 2}px`,
                    backgroundColor: cell.color,
                  }}
                />
                {activeKey === cell.key && (
                  <span role="tooltip" css={scoped(styles.tooltip)} style={tooltipPlacement(day, hour)}>
                    {cell.text}
                  </span>
                )}
              </button>
            ))}
            <span css={scoped(styles.total)}>{formatNumber(dayTotals[day])}</span>
          </div>
        ))}
        <div aria-hidden="true" css={scoped(styles.row)}>
          <span />
          {Array.from({ length: 24 }, (_, hour) => (
            <span key={hour} css={scoped(styles.hourLabel)}>
              {hour % 3 === 0 ? HOUR_LABELS[hour / 3] : ''}
            </span>
          ))}
          <span />
        </div>
      </div>
    </div>
  );
};

DotGrid.displayName = 'DotGrid';

export default DotGrid;
export type { DotGridMode };

const styles = defineStyles({
  scroller: {
    overflowX: 'auto',
    overflowY: 'visible',
  },
  grid: {
    minWidth: '640px',
    display: 'flex',
    flexDirection: 'column',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '40px repeat(24, minmax(0, 1fr)) 40px',
    alignItems: 'center',
    minHeight: '32px',
  },
  dayLabel: {
    ...theme.typography.small(),
    color: theme.colors.text.subdued,
  },
  cell: {
    position: 'relative',
    height: '32px',
    padding: 0,
    border: 'none',
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: 'none',
    cursor: 'default',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: `${HOVER_RING_SIZE}px`,
      height: `${HOVER_RING_SIZE}px`,
      boxSizing: 'border-box',
      border: `1.5px solid ${theme.colors.analytics.chart.crosshair}`,
      borderRadius: '50%',
      transform: 'translate(-50%, -50%)',
      opacity: 0,
      pointerEvents: 'none',
      zIndex: 1,
    },
    '&:hover::before, &:focus-visible::before': {
      opacity: 1,
    },
  },
  dot: {
    display: 'block',
    flexShrink: 0,
    borderRadius: '50%',
  },
  total: {
    ...theme.typography.small(),
    color: theme.colors.text.subdued,
    textAlign: 'right',
  },
  hourLabel: {
    ...theme.typography.small(),
    color: theme.colors.text.subdued,
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
  tooltip: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.analytics.chart.tooltip,
    color: theme.colors.text.light,
    pointerEvents: 'none',
    zIndex: theme.zIndex.sticky,
    whiteSpace: 'nowrap',
    ...theme.typography.tiny('semibold'),
  },
});
