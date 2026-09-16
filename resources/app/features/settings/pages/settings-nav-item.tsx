import type { KeyboardEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router';

import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { defineStyles, scoped, scopedMerge } from '@/theme/mixins';

type SettingsNavItemRowProps = {
  link: string;
  header: string;
  icon: ReactNode;
  isActive?: boolean;
  disabled?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
};

const SettingsNavItemRow = (props: SettingsNavItemRowProps) => {
  const { link, header, icon, isActive = false, disabled = false } = props;
  const navigate = useNavigate();
  const isDisabled = disabled || !link;

  const handleClick = () => {
    if (isDisabled) {
      return;
    }
    void navigate(link);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isDisabled) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      void navigate(link);
    }
  };

  return (
    <div
      css={scopedMerge(styles.row, isDisabled && styles.rowDisabled)}
      data-active={isActive ? 'true' : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isDisabled ? undefined : 'button'}
      tabIndex={isDisabled ? -1 : 0}
      aria-disabled={isDisabled || undefined}
      aria-current={isActive ? 'page' : undefined}
    >
      <Flex gap={2} align="center" cssOverride={styles.content}>
        <span css={scoped(styles.iconWrap)} data-settings-icon>
          {icon}
        </span>
        <Text variant="small" weight="medium" data-settings-heading>
          {header}
        </Text>
      </Flex>
    </div>
  );
};

SettingsNavItemRow.displayName = 'SettingsNavItemRow';

export { SettingsNavItemRow };

const styles = defineStyles({
  row: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing[2],
    height: '28px',
    padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
    cursor: 'pointer',
    backgroundColor: theme.colors.background.fill,
    borderRadius: theme.radius.lg,
    '&:hover, &:focus-visible': {
      backgroundColor: theme.colors.background.surfaceAlt,
      color: theme.colors.text.primary,
      '& svg': {
        color: theme.colors.text.primary,
      },
    },
    '&[data-active="true"]': {
      backgroundColor: theme.colors.background.fillSecondary,
      '& [data-settings-heading]': {
        color: theme.colors.background.fillBrand,
      },
      '& svg': {
        color: theme.colors.background.fillBrand,
      },
    },
  },
  rowDisabled: {
    cursor: 'default',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  iconWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'color 0.2s ease',
    '& svg': {
      width: 16,
      height: 16,
      color: theme.colors.icon.primary,
    },
  },
  heading: {
    transition: 'color 0.2s ease',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});
