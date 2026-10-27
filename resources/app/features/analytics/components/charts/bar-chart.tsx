import {
  buildScale,
  type ChartProps,
  defaultFormatValue,
  useActivePoint,
} from '@/features/analytics/components/charts/chart-geometry';
import { ChartFrame } from '@/features/analytics/components/charts/chart-shared';
import { formatCompactNumber } from '@/features/analytics/lib/format';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';

type BarChartProps = ChartProps & {
  segmentNames?: string[];
  segmentColors?: string[];
  showPreviousBars?: boolean;
};

const BAR_WIDTH_RATIO = 0.56;
const MAX_BAR_WIDTH = 40;
const PAIR_BAR_WIDTH_RATIO = 0.3;
const MAX_PAIR_BAR_WIDTH = 20;
const PAIR_GAP_RATIO = 0.25;
const SEGMENT_GAP = 2;

const topRoundedBarPath = (x: number, y: number, width: number, height: number) => {
  const rx = width / 2;
  const ry = Math.min(rx, height);
  const bottom = y + height;

  return `M ${x} ${bottom} V ${y + ry} A ${rx} ${ry} 0 0 1 ${x + width} ${y + ry} V ${bottom} Z`;
};

const BarChart = (props: BarChartProps) => {
  const {
    label,
    points,
    formatValue = defaultFormatValue,
    formatAxisValue = formatCompactNumber,
    legend,
    segmentNames,
    segmentColors,
    showPreviousBars = false,
  } = props;
  const { activeIndex, getHandlers } = useActivePoint();
  const totals = points.map(
    (point) => point.segments?.reduce((sum, value) => sum + value, 0) ?? point.value,
  );
  const previousTotals = points.map(
    (point) =>
      point.previous_segments?.reduce((sum, value) => sum + value, 0) ?? point.previous_value,
  );
  const scale = buildScale(showPreviousBars ? [...totals, ...previousTotals] : totals);

  return (
    <ChartFrame
      label={label}
      points={points}
      scale={scale}
      activeIndex={activeIndex}
      getHandlers={getHandlers}
      formatValue={formatValue}
      formatAxisValue={formatAxisValue}
      legend={legend}
      legendSample={showPreviousBars ? 'pairedBar' : 'bar'}
      segmentNames={segmentNames}
    >
      {(layout) =>
        points.map((point, index) => {
          const opacity = activeIndex === null || activeIndex === index ? 1 : 0.55;

          if (showPreviousBars) {
            const pairWidth = Math.min(layout.slotWidth * PAIR_BAR_WIDTH_RATIO, MAX_PAIR_BAR_WIDTH);
            const gap = pairWidth * PAIR_GAP_RATIO;
            const center = layout.getX(index);
            const bars = [
              { key: 'previous', value: previousTotals[index], x: center - gap / 2 - pairWidth },
              { key: 'current', value: totals[index], x: center + gap / 2 },
            ];

            return (
              <g key={point.date} aria-hidden="true">
                {bars.map((bar) => {
                  if (typeof bar.value !== 'number') {
                    return null;
                  }

                  const top = scale.toY(bar.value);
                  const bottom = scale.toY(0);

                  return (
                    <rect
                      key={bar.key}
                      data-testid={`bar-chart-${bar.key}-bar`}
                      x={bar.x}
                      y={Math.min(top, bottom)}
                      width={pairWidth}
                      height={Math.abs(bottom - top)}
                      rx={pairWidth / 2}
                      css={scoped(bar.key === 'previous' ? styles.previousBar : styles.bar)}
                      opacity={opacity}
                    />
                  );
                })}
              </g>
            );
          }

          const barWidth = Math.min(layout.slotWidth * BAR_WIDTH_RATIO, MAX_BAR_WIDTH);
          const x = layout.getX(index) - barWidth / 2;
          const segments = point.segments ?? (typeof point.value === 'number' ? [point.value] : []);
          const lastPosition = segments.reduce(
            (last, segment, position) => (segment > 0 ? position : last),
            -1,
          );
          let running = 0;

          return (
            <g key={point.date} aria-hidden="true">
              {segments.map((segment, position) => {
                const top = scale.toY(running + segment);
                const bottom = scale.toY(running) - (running > 0 ? SEGMENT_GAP : 0);
                running += segment;

                if (segment <= 0 || bottom <= top) {
                  return null;
                }

                return (
                  <path
                    key={segmentNames?.[position] ?? position}
                    data-testid="bar-chart-segment"
                    d={
                      position === lastPosition
                        ? topRoundedBarPath(x, top, barWidth, bottom - top)
                        : `M ${x} ${top} H ${x + barWidth} V ${bottom} H ${x} Z`
                    }
                    css={scoped(styles.bar)}
                    style={
                      segmentColors?.[position] ? { fill: segmentColors[position] } : undefined
                    }
                    opacity={opacity}
                  />
                );
              })}
            </g>
          );
        })
      }
    </ChartFrame>
  );
};

BarChart.displayName = 'BarChart';

export default BarChart;
export type { BarChartProps };

const styles = defineStyles({
  bar: {
    fill: theme.colors.analytics.chart.primary,
  },
  previousBar: {
    fill: theme.colors.analytics.chart.previous,
  },
});
