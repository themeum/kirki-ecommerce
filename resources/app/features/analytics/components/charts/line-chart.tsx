import {
  buildScale,
  type ChartLayout,
  type ChartProps,
  defaultFormatValue,
  useActivePoint,
} from '@/features/analytics/components/charts/chart-geometry';
import { ChartFrame } from '@/features/analytics/components/charts/chart-shared';
import { formatCompactNumber } from '@/features/analytics/lib/format';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';

type LinePoint = {
  x: number;
  y: number;
};

const getSegments = (
  values: (number | null | undefined)[],
  layout: ChartLayout,
  toY: (value: number) => number,
) => {
  const segments: LinePoint[][] = [];
  let current: LinePoint[] = [];

  values.forEach((value, index) => {
    if (typeof value !== 'number') {
      if (current.length > 0) {
        segments.push(current);
      }
      current = [];
      return;
    }

    current.push({ x: layout.getX(index), y: toY(value) });
  });

  if (current.length > 0) {
    segments.push(current);
  }

  return segments;
};

const buildLinePath = (segments: LinePoint[][]) => {
  return segments
    .map((segment) =>
      segment.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' '),
    )
    .join(' ');
};

const buildAreaPath = (segments: LinePoint[][], baseline: number) => {
  return segments
    .map((segment) => {
      const first = segment[0];
      const last = segment[segment.length - 1];

      return `${buildLinePath([segment])} L${last.x},${baseline} L${first.x},${baseline} Z`;
    })
    .join(' ');
};

const findLastIndex = (values: (number | null | undefined)[]) => {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (typeof values[index] === 'number') {
      return index;
    }
  }

  return -1;
};

type LineChartProps = ChartProps & {
  showPoints?: boolean;
  showArea?: boolean;
};

const LineChart = (props: LineChartProps) => {
  const {
    label,
    points,
    formatValue = defaultFormatValue,
    formatAxisValue = formatCompactNumber,
    legend,
    showPoints = false,
    showArea = true,
  } = props;
  const { activeIndex, getHandlers } = useActivePoint();
  const scale = buildScale(points.flatMap((point) => [point.value, point.previous_value]));
  const currentValues = points.map((point) => point.value);
  const previousValues = points.map((point) => point.previous_value);
  const lastIndex = findLastIndex(currentValues);

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
    >
      {(layout) => {
        const currentSegments = getSegments(currentValues, layout, scale.toY);
        const activeValue = activeIndex === null ? null : currentValues[activeIndex];
        const lastValue = currentValues[lastIndex];

        return (
          <g aria-hidden="true">
            {showArea && (
              <path
                data-testid="line-chart-area"
                d={buildAreaPath(currentSegments, scale.toY(0))}
                css={scoped(styles.area)}
              />
            )}
            <path
              d={buildLinePath(getSegments(previousValues, layout, scale.toY))}
              css={scoped(styles.previousLine)}
            />
            <path d={buildLinePath(currentSegments)} css={scoped(styles.line)} />
            {activeIndex !== null && (
              <line
                x1={layout.getX(activeIndex)}
                x2={layout.getX(activeIndex)}
                y1={layout.plotTop}
                y2={layout.plotBottom}
                css={scoped(styles.crosshair)}
              />
            )}
            {showPoints &&
              currentValues.map((value, index) =>
                typeof value === 'number' ? (
                  <circle
                    key={points[index].date}
                    data-testid="line-chart-point"
                    cx={layout.getX(index)}
                    cy={scale.toY(value)}
                    r={3.5}
                    css={scoped(styles.dot)}
                  />
                ) : null,
              )}
            {!showPoints && typeof lastValue === 'number' && (
              <circle
                data-testid="line-chart-last-point"
                cx={layout.getX(lastIndex)}
                cy={scale.toY(lastValue)}
                r={4}
                css={scoped(styles.dot)}
              />
            )}
            {activeIndex !== null && typeof activeValue === 'number' && (
              <circle
                cx={layout.getX(activeIndex)}
                cy={scale.toY(activeValue)}
                r={4}
                css={scoped(styles.activeDot)}
              />
            )}
          </g>
        );
      }}
    </ChartFrame>
  );
};

LineChart.displayName = 'LineChart';

export default LineChart;

const styles = defineStyles({
  area: {
    fill: theme.colors.analytics.chart.soft,
    stroke: 'none',
  },
  line: {
    fill: 'none',
    stroke: theme.colors.analytics.chart.primary,
    strokeWidth: 2,
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
  },
  previousLine: {
    fill: 'none',
    stroke: theme.colors.analytics.chart.comparisonLine,
    strokeWidth: 2,
    strokeDasharray: '4 4',
  },
  crosshair: {
    stroke: theme.colors.analytics.chart.crosshair,
    strokeWidth: 1,
  },
  dot: {
    fill: theme.colors.analytics.chart.primary,
  },
  activeDot: {
    fill: theme.colors.analytics.chart.primary,
    stroke: theme.colors.background.surface,
    strokeWidth: 2,
  },
});
