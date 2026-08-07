import type { KeyboardEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router';

import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { defineStyles, scoped, scopedMerge } from '@/theme/mixins';
import { CSSObject } from '@emotion/react';

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
  const {
    link,
    header,
    icon,
    isActive = false,
    disabled = false,
    isFirst = false,
    isLast = false,
  } = props;
  const navigate = useNavigate();
  const isDisabled = disabled || !link;
  const isOnly = isFirst && isLast;

  const handleClick = () => {
    if (isDisabled) {
      return;
    }
    navigate(link);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isDisabled) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigate(link);
    }
  };

  return (
    <div
      css={scopedMerge(styles.row,
        isOnly && styles.rowOnly,
        !isOnly && isFirst && styles.rowFirst,
        !isOnly && isLast && styles.rowLast,
        !isOnly && !isFirst && !isLast && styles.rowMiddle,
        isDisabled && styles.rowDisabled,)}
      data-active={isActive ? 'true' : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isDisabled ? undefined : 'button'}
      tabIndex={isDisabled ? -1 : 0}
      aria-disabled={isDisabled || undefined}
      aria-current={isActive ? 'page' : undefined}
    >
      <div css={scoped(styles.identifier)} data-settings-identifier aria-hidden="true" />
      <Flex gap={2} align="center" cssOverride={styles.content}>
        <span css={scoped(styles.iconWrap)} data-settings-icon>
          {icon}
        </span>
        <Text variant='small' weight="medium" cssOverride={styles.heading}>
          <span data-settings-heading>{header}</span>
        </Text>
      </Flex>
    </div>
  );
};

SettingsNavItemRow.displayName = 'SettingsNavItemRow';

export { SettingsNavItemRow };

const highlightedRow = defineStyles({
  backgroundColor: theme.colors.background.fillSecondary,
  borderRadius: theme.radius.xl,
  '& svg': {
    color: theme.colors.background.fillBrand,
  }
});

const highlightedHeading = defineStyles({
  color: theme.colors.background.fillBrand,
});

const highlightedIcon = defineStyles({
  color: theme.colors.background.fillBrand,
});

const showHighlightedAffordances: CSSObject = {
  opacity: 1,
  visibility: 'visible',
};

const styles = defineStyles({
  row: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing[2],
    height: '40px',
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    cursor: 'pointer',
    backgroundColor: theme.colors.background.surface,
    transition: 'background-color 0.2s ease, color 0.2s ease',
    '&:hover, &:focus-visible, &[data-active="true"]': highlightedRow,
    '&:hover [data-settings-heading], &:focus-visible [data-settings-heading], &[data-active="true"] [data-settings-heading]':
      highlightedHeading,
    '&:hover [data-settings-icon], &:focus-visible [data-settings-icon], &[data-active="true"] [data-settings-icon]':
      highlightedIcon,
    '&:hover [data-settings-identifier], &:focus-visible [data-settings-identifier], &[data-active="true"] [data-settings-identifier]':
      showHighlightedAffordances,
    '&:hover [data-settings-chevron], &:focus-visible [data-settings-chevron], &[data-active="true"] [data-settings-chevron]':
      showHighlightedAffordances,
  },
  rowOnly: {
    borderRadius: theme.radius.xl,
  },
  rowFirst: {
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    borderBottomLeftRadius: theme.radius.sm,
    borderBottomRightRadius: theme.radius.sm,
  },
  rowLast: {
    borderTopLeftRadius: theme.radius.sm,
    borderTopRightRadius: theme.radius.sm,
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
  },
  rowMiddle: {
    borderRadius: theme.radius.sm,
  },
  rowDisabled: {
    cursor: 'default',
  },
  identifier: {
    position: 'absolute',
    top: '4px',
    bottom: '4px',
    left: 0,
    width: '4px',
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.background.fillBrand,
    opacity: 0,
    visibility: 'hidden',
    transition: 'opacity 0.2s ease, visibility 0.2s ease',
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
    color: theme.colors.icon.primary,
    transition: 'color 0.2s ease',
    '& svg': {
      width: 16,
      height: 16,
      color: theme.colors.icon.primary,
    }
  },
  heading: {
    transition: 'color 0.2s ease',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});
