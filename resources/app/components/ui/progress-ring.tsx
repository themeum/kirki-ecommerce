import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';

type ProgressRingProps = {
  percent: number;
  size?: number;
  label?: string;
};

const STROKE_WIDTH = 2;

const ProgressRing = ({ percent, size = 20, label }: ProgressRingProps) => {
  const value = Math.min(100, Math.max(0, percent));
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      css={scoped(styles.root)}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={STROKE_WIDTH}
        css={scoped(styles.track)}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - value / 100)}
        css={scoped(styles.indicator)}
      />
    </svg>
  );
};

ProgressRing.displayName = 'ProgressRing';

export default ProgressRing;

const styles = defineStyles({
  root: {
    display: 'block',
    transform: 'rotate(-90deg)',
  },
  track: {
    stroke: theme.colors.icon.secondary,
    opacity: 0.25,
  },
  indicator: {
    stroke: theme.colors.icon.brand,
    transition: 'stroke-dashoffset 400ms ease',
  },
});
