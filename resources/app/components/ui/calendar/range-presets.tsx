import Button from '@/components/ui/button';
import type {
  DateRangePresetKey,
  DateRangePresetsPosition,
  PresetRange,
} from '@/components/ui/calendar/calendar-presets';
import Flex from '@/components/ui/flex';
import { theme } from '@/theme';
import { defineStyles, mergeCss } from '@/theme/mixins';

type RangePresetOption = {
  key: DateRangePresetKey;
  label: string;
  range: PresetRange | null;
};

type RangePresetsProps = {
  options: RangePresetOption[];
  position: DateRangePresetsPosition;
  activeKey: DateRangePresetKey | null;
  onSelect: (option: RangePresetOption) => void;
};

/**
 * Quick-range shortcuts rendered beside the range picker's calendar.
 *
 * @param props Component props.
 *
 * @returns RangePresets element.
 */
const RangePresets = ({
  options,
  position,
  activeKey,
  onSelect,
}: RangePresetsProps) => {
  const isSidebar = position !== 'bottom';

  return (
    <Flex
      direction={isSidebar ? 'column' : 'row'}
      wrap={isSidebar ? 'nowrap' : 'wrap'}
      gap={1}
      data-slot="range-presets"
      cssOverride={mergeCss(styles.bar, styles.positions[position])}
    >
      {options.map((option) => (
        <Button
          key={option.key}
          variant={option.key === activeKey ? 'secondary' : 'ghost'}
          size="sm"
          aria-pressed={option.key === activeKey}
          disabled={!option.range}
          onClick={() => onSelect(option)}
          cssOverride={isSidebar ? styles.sidebarButton : undefined}
        >
          {option.label}
        </Button>
      ))}
    </Flex>
  );
};

RangePresets.displayName = 'RangePresets';

export default RangePresets;
export type { RangePresetOption, RangePresetsProps };

const styles = defineStyles({
  bar: {
    flexShrink: 0,
  },
  positions: {
    left: {
      paddingRight: theme.spacing[2],
      borderRight: `1px solid ${theme.colors.border.default}`,
    },
    right: {
      paddingLeft: theme.spacing[2],
      borderLeft: `1px solid ${theme.colors.border.default}`,
    },
    bottom: {
      width: 0,
      minWidth: '100%',
      paddingTop: theme.spacing[2],
      borderTop: `1px solid ${theme.colors.border.default}`,
    },
  },
  sidebarButton: {
    width: '100%',
    justifyContent: 'flex-start',
    minWidth: '120px',
  },
});
