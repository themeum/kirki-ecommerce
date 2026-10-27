import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';

type Segment = {
  key: string;
  label: string;
  value: number;
  color: string;
};

type SegmentedBarProps = {
  label: string;
  segments: Segment[];
};

const SegmentedBar = (props: SegmentedBarProps) => {
  const { label, segments } = props;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <div role="img" aria-label={label} css={scoped(styles.bar)}>
      {segments
        .filter((segment) => segment.value > 0)
        .map((segment) => (
          <div
            key={segment.key}
            title={segment.label}
            css={scoped(styles.segment)}
            style={{ width: `${(segment.value / total) * 100}%`, backgroundColor: segment.color }}
          />
        ))}
    </div>
  );
};

SegmentedBar.displayName = 'SegmentedBar';

export default SegmentedBar;
export type { Segment };

const styles = defineStyles({
  bar: {
    display: 'flex',
    width: '100%',
    height: '32px',
    gap: '1px',
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  segment: {
    height: '100%',
    minWidth: '4px',
  },
});
