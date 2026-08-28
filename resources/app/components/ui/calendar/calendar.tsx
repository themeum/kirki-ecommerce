import type { CSSObject } from '@emotion/react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import {
  type ChevronProps,
  DayPicker,
  type DayPickerProps,
  getDefaultClassNames,
} from 'react-day-picker';

import { WEEK_STARTS_ON } from '@/libs/date';
import { theme } from '@/theme';
import { defineStyles, flexCenter, itemCenter, scopedMerge, uiFocusRing } from '@/theme/mixins';

type OmitStyleProps<TProps> = TProps extends unknown
  ? Omit<TProps, 'className' | 'classNames' | 'styles' | 'css'>
  : never;

type CalendarProps = OmitStyleProps<DayPickerProps> & {
  cssOverride?: CSSObject;
};

const NavChevron = ({ orientation = 'left', size = 16 }: ChevronProps) => {
  if (orientation === 'up') {
    return <ChevronUp size={size} />;
  }

  if (orientation === 'down') {
    return <ChevronDown size={size} />;
  }

  if (orientation === 'right') {
    return <ChevronRight size={size} />;
  }

  return <ChevronLeft size={size} />;
};

NavChevron.displayName = 'NavChevron';

const Calendar = ({ cssOverride, ...props }: CalendarProps) => {
  const { showOutsideDays = true, weekStartsOn = WEEK_STARTS_ON, components, ...rest } = props;

  return (
    <div css={scopedMerge(styles.calendar, cssOverride)}>
      <DayPicker
        showOutsideDays={showOutsideDays}
        weekStartsOn={weekStartsOn}
        components={{ Chevron: NavChevron, ...components }}
        {...rest}
      />
    </div>
  );
};

Calendar.displayName = 'Calendar';

export default Calendar;
export type { CalendarProps, OmitStyleProps };

const defaultClassNames = getDefaultClassNames();

const styles = defineStyles({
  calendar: {
    width: 'max-content',
    ...theme.typography.small(),
    color: theme.colors.text.primary,
    [`.${defaultClassNames.months}`]: {
      position: 'relative',
      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing[4],
    },
    [`.${defaultClassNames.month}`]: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing[2],
    },
    [`.${defaultClassNames.month_caption}`]: {
      ...flexCenter(),
      height: '2rem',
      ...theme.typography.small('semibold'),
      color: theme.colors.text.primary,
    },
    [`.${defaultClassNames.nav}`]: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '2rem',
      ...itemCenter(),
      justifyContent: 'space-between',
      pointerEvents: 'none',
    },
    [`.${defaultClassNames.button_previous}, .${defaultClassNames.button_next}`]: {
      ...flexCenter(),
      width: '1.75rem',
      height: '1.75rem',
      padding: 0,
      border: `1px solid ${theme.colors.border.default}`,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.background.fill,
      color: theme.colors.icon.secondary,
      cursor: 'pointer',
      pointerEvents: 'auto',
      '&:hover': {
        backgroundColor: theme.colors.background.fillHover,
        color: theme.colors.icon.primary,
      },
      '&:focus-visible': {
        ...uiFocusRing(theme),
      },
      '&:disabled': {
        color: theme.colors.icon.disabled,
        borderColor: theme.colors.border.disabled,
        cursor: 'not-allowed',
      },
    },
    [`.${defaultClassNames.month_grid}`]: {
      borderCollapse: 'collapse',
      margin: 0,
    },
    [`.${defaultClassNames.weekdays}`]: {
      ...theme.typography.tiny('medium'),
    },
    [`.${defaultClassNames.weekday}`]: {
      width: '2.25rem',
      height: '2rem',
      padding: 0,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      textTransform: 'none',
    },
    [`.${defaultClassNames.day}`]: {
      width: '2.25rem',
      height: '2.25rem',
      padding: 0,
      textAlign: 'center',
    },
    [`.${defaultClassNames.day_button}`]: {
      ...flexCenter(),
      width: '100%',
      height: '100%',
      padding: 0,
      border: 'none',
      borderRadius: theme.radius.md,
      backgroundColor: 'transparent',
      ...theme.typography.small(),
      color: 'inherit',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: theme.colors.background.fillHover,
      },
      '&:focus-visible': {
        ...uiFocusRing(theme),
      },
    },
    [`.${defaultClassNames.today}:not(.${defaultClassNames.selected}) .${defaultClassNames.day_button}`]:
      {
        ...theme.typography.small('semibold'),
        color: theme.colors.text.emphasis,
      },
    [`.${defaultClassNames.outside}`]: {
      color: theme.colors.text.subdued,
    },
    [`.${defaultClassNames.disabled}`]: {
      color: theme.colors.text.disabled,
    },
    [`.${defaultClassNames.disabled} .${defaultClassNames.day_button}`]: {
      cursor: 'not-allowed',
      '&:hover': {
        backgroundColor: 'transparent',
      },
    },
    [`.${defaultClassNames.selected} .${defaultClassNames.day_button}`]: {
      backgroundColor: theme.colors.background.fillBrand,
      color: theme.colors.text.light,
      '&:hover': {
        backgroundColor: theme.colors.background.fillBrandHover,
      },
    },
    [`.${defaultClassNames.range_middle}`]: {
      backgroundColor: theme.colors.background.fillSecondary,
    },
    [`.${defaultClassNames.range_middle} .${defaultClassNames.day_button}`]: {
      backgroundColor: 'transparent',
      color: theme.colors.text.primary,
      borderRadius: theme.radius.none,
      '&:hover': {
        backgroundColor: theme.colors.background.fillSecondaryHover,
      },
    },
    [`.${defaultClassNames.range_start}`]: {
      backgroundColor: theme.colors.background.fillSecondary,
      borderTopLeftRadius: theme.radius.md,
      borderBottomLeftRadius: theme.radius.md,
    },
    [`.${defaultClassNames.range_end}`]: {
      backgroundColor: theme.colors.background.fillSecondary,
      borderTopRightRadius: theme.radius.md,
      borderBottomRightRadius: theme.radius.md,
    },
    [`.${defaultClassNames.range_start}.${defaultClassNames.range_end}`]: {
      backgroundColor: 'transparent',
    },
  },
});
