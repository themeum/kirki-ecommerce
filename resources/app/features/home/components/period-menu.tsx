import { ChevronDown } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { getPeriodLabel } from '@/features/home/lib/labels';
import { HOME_PERIODS, type HomePeriod } from '@/features/home/lib/layout';
import { theme } from '@/theme';
import { defineStyles, scoped, uiFocusRing } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type PeriodMenuProps = {
  period: HomePeriod;
  onChange: (period: HomePeriod) => void;
};

const PeriodMenu = (props: PeriodMenuProps) => {
  const { period, onChange } = props;
  const label = getPeriodLabel(period);

  return (
    <Flex align="center" gap={1}>
      <Text variant="paragraph" color="secondary">
        {__('Your store at a glance:', 'kirki-ecommerce')}
      </Text>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            css={scoped(styles.trigger)}
            aria-label={sprintf(
              /* translators: %s: selected period, such as "This month" */
              __('Period: %s. Change', 'kirki-ecommerce'),
              label,
            )}
          >
            {label}
            <ChevronDown size={14} aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup
            value={period}
            onValueChange={(value) => onChange(value as HomePeriod)}
          >
            {HOME_PERIODS.map((value) => (
              <DropdownMenuRadioItem key={value} value={value}>
                {getPeriodLabel(value)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </Flex>
  );
};

PeriodMenu.displayName = 'PeriodMenu';

export default PeriodMenu;

const styles = defineStyles({
  trigger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing[1],
    padding: 0,
    border: 'none',
    borderBottom: `1px dotted ${theme.colors.border.inverse}`,
    borderRadius: 0,
    background: 'transparent',
    color: theme.colors.text.primary,
    cursor: 'pointer',
    ...theme.typography.paragraph('semibold'),
    '&:focus-visible': {
      ...uiFocusRing(theme),
    },
  },
});
