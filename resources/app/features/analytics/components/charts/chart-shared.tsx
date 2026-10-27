import type { ReactNode } from 'react';

import {
  type ActivePointHandlers,
  buildLayout,
  CHART_HEIGHT,
  type ChartLayout,
  type ChartLegendRange,
  type ChartPoint,
  type ChartScale,
  DEFAULT_CHART_WIDTH,
  estimateTextWidth,
  formatPointValue,
  getXLabelIndexes,
} from '@/features/analytics/components/charts/chart-geometry';
import useElementWidth from '@/features/analytics/hooks/use-element-width';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';

const X_LABEL_BASELINE = CHART_HEIGHT - 8;
const Y_LABEL_OFFSET = 4;

type HitAreasProps = {
  points: ChartPoint[];
  layout: ChartLayout;
  formatValue: (value: number) => string;
  getHandlers: ActivePointHandlers;
};

const HitAreas = (props: HitAreasProps) => {
  const { points, layout, formatValue, getHandlers } = props;

  return (
    <>
      {points.map((point, index) => (
        <rect
          key={point.date}
          data-testid={`chart-point-${index}`}
          role="img"
          tabIndex={0}
          aria-label={`${point.span_label ?? point.label}: ${formatPointValue(point.value, formatValue)}`}
          x={layout.plotLeft + layout.slotWidth * index}
          y={0}
          width={layout.slotWidth}
          height={layout.height}
          css={scoped(styles.hitArea)}
          {...getHandlers(index)}
        />
      ))}
    </>
  );
};

HitAreas.displayName = 'HitAreas';

type GridProps = {
  scale: ChartScale;
  layout: ChartLayout;
  formatAxisValue: (value: number) => string;
};

const Grid = (props: GridProps) => {
  const { scale, layout, formatAxisValue } = props;

  return (
    <g aria-hidden="true" data-testid="chart-y-axis">
      {scale.ticks.map((tick) => {
        const y = scale.toY(tick);

        return (
          <g key={tick}>
            <line
              x1={layout.plotLeft}
              x2={layout.plotRight}
              y1={y}
              y2={y}
              css={scoped(tick === 0 ? styles.baseLine : styles.gridLine)}
            />
            <text
              x={layout.plotLeft - Y_LABEL_OFFSET * 2}
              y={y + Y_LABEL_OFFSET}
              textAnchor="end"
              css={scoped(styles.axisLabel)}
            >
              {formatAxisValue(tick)}
            </text>
          </g>
        );
      })}
    </g>
  );
};

Grid.displayName = 'Grid';

type AxisLabelsProps = {
  points: ChartPoint[];
  layout: ChartLayout;
};

const AxisLabels = (props: AxisLabelsProps) => {
  const { points, layout } = props;
  const indexes = getXLabelIndexes(points.length, layout.plotRight - layout.plotLeft);

  return (
    <g aria-hidden="true" data-testid="chart-x-axis">
      {indexes.map((index) => {
        const text = points[index].label;
        const halfWidth = estimateTextWidth(text) / 2;
        const x = Math.min(Math.max(layout.getX(index), halfWidth), layout.width - halfWidth);

        return (
          <text
            key={points[index].date}
            x={x}
            y={X_LABEL_BASELINE}
            textAnchor="middle"
            css={scoped(styles.axisLabel)}
          >
            {text}
          </text>
        );
      })}
    </g>
  );
};

AxisLabels.displayName = 'AxisLabels';

type ChartTooltipProps = {
  point: ChartPoint;
  left: number;
  formatValue: (value: number) => string;
  segmentNames?: string[];
};

const ChartTooltip = (props: ChartTooltipProps) => {
  const { point, left, formatValue, segmentNames } = props;
  const hasComparison = point.previous_value !== null && point.previous_value !== undefined;

  return (
    <div role="tooltip" css={scoped(styles.tooltip)} style={{ left: `${left}%` }}>
      <span css={scoped(styles.tooltipLabel)}>{point.span_label ?? point.label}</span>
      <TooltipValues
        value={point.value}
        segments={point.segments}
        segmentNames={segmentNames}
        formatValue={formatValue}
      />
      {hasComparison && (
        <>
          <span css={scoped(styles.tooltipLabel)}>
            {point.previous_span_label ?? point.previous_label}
          </span>
          <TooltipValues
            value={point.previous_value}
            segments={point.previous_segments}
            segmentNames={segmentNames}
            formatValue={formatValue}
          />
        </>
      )}
    </div>
  );
};

ChartTooltip.displayName = 'ChartTooltip';

type TooltipValuesProps = {
  value: number | null | undefined;
  segments?: number[];
  segmentNames?: string[];
  formatValue: (value: number) => string;
};

const TooltipValues = (props: TooltipValuesProps) => {
  const { value, segments, segmentNames, formatValue } = props;

  if (segments && segmentNames) {
    return (
      <>
        {segments.map((segment, position) => (
          <span key={segmentNames[position]} css={scoped(styles.tooltipValue)}>
            {segmentNames[position]}: {formatValue(segment)}
          </span>
        ))}
      </>
    );
  }

  return <span css={scoped(styles.tooltipValue)}>{formatPointValue(value, formatValue)}</span>;
};

TooltipValues.displayName = 'TooltipValues';

type ChartLegendSample = 'line' | 'bar' | 'pairedBar';

type ChartLegendProps = {
  legend: ChartLegendRange;
  sample: ChartLegendSample;
};

const ChartLegend = (props: ChartLegendProps) => {
  const { legend, sample } = props;
  const items = [
    { key: 'current', text: legend.current, isPrevious: false },
    ...(legend.previous ? [{ key: 'previous', text: legend.previous, isPrevious: true }] : []),
  ];

  return (
    <ul data-testid="chart-legend" css={scoped(styles.legend)}>
      {items.map((item) => (
        <li key={item.key} data-series={item.key} css={scoped(styles.legendItem)}>
          <span
            aria-hidden="true"
            css={scoped(
              item.isPrevious ? styles.previousSamples[sample] : styles.currentSamples[sample],
            )}
          />
          {item.text}
        </li>
      ))}
    </ul>
  );
};

ChartLegend.displayName = 'ChartLegend';

type ChartFrameProps = {
  label: string;
  points: ChartPoint[];
  scale: ChartScale;
  activeIndex: number | null;
  getHandlers: ActivePointHandlers;
  formatValue: (value: number) => string;
  formatAxisValue: (value: number) => string;
  segmentNames?: string[];
  legend?: ChartLegendRange | null;
  legendSample?: ChartLegendSample;
  children: (layout: ChartLayout) => ReactNode;
};

const ChartFrame = (props: ChartFrameProps) => {
  const {
    label,
    points,
    scale,
    activeIndex,
    getHandlers,
    formatValue,
    formatAxisValue,
    segmentNames,
    legend,
    legendSample = 'line',
    children,
  } = props;
  const { ref, width } = useElementWidth(DEFAULT_CHART_WIDTH);
  const layout = buildLayout(width, points.length, scale.ticks.map(formatAxisValue));
  const activePoint = activeIndex === null ? null : points[activeIndex];

  return (
    <div ref={ref} css={scoped(styles.frame)}>
      <svg
        role="img"
        aria-label={label}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        css={scoped(styles.svg)}
      >
        <Grid scale={scale} layout={layout} formatAxisValue={formatAxisValue} />
        {children(layout)}
        <AxisLabels points={points} layout={layout} />
        <HitAreas
          points={points}
          layout={layout}
          formatValue={formatValue}
          getHandlers={getHandlers}
        />
      </svg>
      {activePoint && activeIndex !== null && (
        <ChartTooltip
          point={activePoint}
          left={(layout.getX(activeIndex) / layout.width) * 100}
          formatValue={formatValue}
          segmentNames={segmentNames}
        />
      )}
      {legend && <ChartLegend legend={legend} sample={legendSample} />}
    </div>
  );
};

ChartFrame.displayName = 'ChartFrame';

export { ChartFrame };

const sampleBase = {
  display: 'inline-block',
  flexShrink: 0,
};

const styles = defineStyles({
  frame: {
    position: 'relative',
    width: '100%',
  },
  legend: {
    listStyle: 'none',
    margin: `${theme.spacing[2]} 0 0`,
    padding: 0,
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing[4],
  },
  legendItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing[2],
    margin: 0,
    color: theme.colors.text.subdued,
    ...theme.typography.small(),
  },
  currentSamples: {
    line: {
      ...sampleBase,
      width: '16px',
      height: '2px',
      backgroundColor: theme.colors.analytics.chart.primary,
    },
    bar: {
      ...sampleBase,
      width: '10px',
      height: '10px',
      borderRadius: '2px',
      backgroundColor: theme.colors.analytics.chart.primary,
    },
    pairedBar: {
      ...sampleBase,
      width: '8px',
      height: '14px',
      borderRadius: '4px',
      backgroundColor: theme.colors.analytics.chart.primary,
    },
  },
  previousSamples: {
    line: {
      ...sampleBase,
      width: '16px',
      borderTop: `2px dashed ${theme.colors.analytics.chart.comparisonLine}`,
    },
    bar: {
      ...sampleBase,
      width: '10px',
      height: '2px',
      backgroundColor: theme.colors.analytics.chart.comparisonLine,
    },
    pairedBar: {
      ...sampleBase,
      width: '8px',
      height: '14px',
      borderRadius: '4px',
      backgroundColor: theme.colors.analytics.chart.previous,
    },
  },
  svg: {
    display: 'block',
    width: '100%',
    height: '220px',
    overflow: 'visible',
  },
  hitArea: {
    fill: 'transparent',
    outline: 'none',
    cursor: 'crosshair',
    '&:focus-visible': {
      fill: theme.colors.analytics.chart.grid,
    },
  },
  gridLine: {
    stroke: theme.colors.analytics.chart.grid,
    strokeWidth: 1,
    vectorEffect: 'non-scaling-stroke',
  },
  baseLine: {
    stroke: theme.colors.analytics.chart.gridBase,
    strokeWidth: 1,
    vectorEffect: 'non-scaling-stroke',
  },
  axisLabel: {
    fill: theme.colors.text.subdued,
    fontSize: '11px',
  },
  tooltip: {
    position: 'absolute',
    top: 0,
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[1],
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.analytics.chart.tooltip,
    color: theme.colors.text.light,
    pointerEvents: 'none',
    zIndex: theme.zIndex.sticky,
    whiteSpace: 'nowrap',
    ...theme.typography.tiny(),
  },
  tooltipLabel: {
    ...theme.typography.tiny('semibold'),
    opacity: 0.72,
  },
  tooltipValue: {
    ...theme.typography.tiny('semibold'),
  },
});
