import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';

type SparklinePoint = {
  value?: number | null;
  previous_value?: number | null;
};

type SparklineProps = {
  points: SparklinePoint[];
};

const WIDTH = 120;
const HEIGHT = 32;
const PADDING = 2;

const buildPath = (values: (number | null | undefined)[], min: number, max: number) => {
  const span = max - min || 1;
  const step = values.length > 1 ? (WIDTH - PADDING * 2) / (values.length - 1) : 0;
  let path = '';
  let isDrawing = false;

  values.forEach((value, index) => {
    if (typeof value !== 'number') {
      isDrawing = false;
      return;
    }

    const x = PADDING + step * index;
    const y = HEIGHT - PADDING - ((value - min) / span) * (HEIGHT - PADDING * 2);
    path += `${isDrawing ? 'L' : 'M'}${x},${y} `;
    isDrawing = true;
  });

  return path.trim();
};

const Sparkline = (props: SparklineProps) => {
  const { points } = props;
  const current = points.map((point) => point.value);
  const previous = points.map((point) => point.previous_value);
  const numbers = [...current, ...previous].filter((value): value is number => typeof value === 'number');
  const min = Math.min(0, ...numbers);
  const max = Math.max(0, ...numbers);

  return (
    <svg
      data-testid="sparkline"
      aria-hidden="true"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      css={scoped(styles.svg)}
    >
      <path d={buildPath(previous, min, max)} css={scoped(styles.previous)} />
      <path d={buildPath(current, min, max)} css={scoped(styles.current)} />
    </svg>
  );
};

Sparkline.displayName = 'Sparkline';

export default Sparkline;

const styles = defineStyles({
  svg: {
    display: 'block',
    width: '100%',
    height: '32px',
  },
  current: {
    fill: 'none',
    stroke: theme.colors.analytics.chart.primary,
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    vectorEffect: 'non-scaling-stroke',
  },
  previous: {
    fill: 'none',
    stroke: theme.colors.analytics.chart.previous,
    strokeWidth: 1.5,
    strokeDasharray: '3 3',
    vectorEffect: 'non-scaling-stroke',
  },
});
