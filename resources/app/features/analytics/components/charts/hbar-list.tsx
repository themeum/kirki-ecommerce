import Text from '@/components/ui/text';
import ChangeBadge from '@/features/analytics/components/change-badge';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';

type HBarItem = {
  key: string;
  label: string;
  value: number;
  display: string;
  /** Hover title of the display, such as the long amount of a short amount. */
  displayTitle?: string;
  detail?: string;
  note?: string;
  change?: number | null;
  onSelect?: () => void;
  onHighlight?: (active: boolean) => void;
};

type HBarListProps = {
  items: HBarItem[];
};

const toPercent = (value: number, max: number) => `${Math.max(0, (value / max) * 100)}%`;

type HBarRowProps = {
  item: HBarItem;
  max: number;
};

const HBarRow = (props: HBarRowProps) => {
  const { item, max } = props;

  return (
    <>
      <div css={scoped(styles.header)}>
        <Text variant="small" truncate>
          {item.label}
        </Text>
        <div css={scoped(styles.values)}>
          <Text variant="small" weight="semibold" title={item.displayTitle}>
            {item.display}
          </Text>
          {item.detail && (
            <Text variant="small" color="subdued">
              {item.detail}
            </Text>
          )}
          <ChangeBadge change={item.change} />
        </div>
      </div>
      <div css={scoped(styles.track)} aria-hidden="true">
        <div css={scoped(styles.bar)} style={{ width: toPercent(item.value, max) }} />
      </div>
      {item.note && (
        <Text variant="tiny" color="subdued">
          {item.note}
        </Text>
      )}
    </>
  );
};

HBarRow.displayName = 'HBarRow';

const HBarList = (props: HBarListProps) => {
  const { items } = props;
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <ul css={scoped(styles.list)}>
      {items.map((item) => (
        <li key={item.key} css={scoped(styles.row)}>
          {item.onSelect ? (
            <button
              type="button"
              css={scoped(styles.select)}
              onClick={item.onSelect}
              onMouseEnter={() => item.onHighlight?.(true)}
              onMouseLeave={() => item.onHighlight?.(false)}
              onFocus={() => item.onHighlight?.(true)}
              onBlur={() => item.onHighlight?.(false)}
            >
              <HBarRow item={item} max={max} />
            </button>
          ) : (
            <HBarRow item={item} max={max} />
          )}
        </li>
      ))}
    </ul>
  );
};

HBarList.displayName = 'HBarList';

export default HBarList;
export type { HBarItem };

const styles = defineStyles({
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[3],
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[1],
    minWidth: 0,
    margin: 0,
  },
  select: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[1],
    width: '100%',
    minWidth: 0,
    padding: 0,
    border: 'none',
    background: 'none',
    color: 'inherit',
    font: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: theme.spacing[3],
    minWidth: 0,
  },
  values: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing[3],
    flexShrink: 0,
  },
  track: {
    height: '6px',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.analytics.chart.grid,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.analytics.breakdown.bar,
  },
});
