import { ChevronRight } from 'lucide-react';
import type { KeyboardEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { scoped, scopedMerge } from '@/theme/mixins';
import { CSSObject } from '@emotion/react';

type SettingsItemProps = {
  link: string;
  header: string;
  subHeader: string;
  icon: ReactNode;
  isActive?: boolean;
  disabled?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
};

const SettingsItem = (props: SettingsItemProps) => {
  const {
    link,
    header,
    subHeader,
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
      <Flex gap={3} cssOverride={styles.content}>
        <span css={scoped(styles.iconWrap)} data-settings-icon>
          {icon}
        </span>
        <Flex direction="column" gap={1} cssOverride={styles.textWrap}>
          <Text weight="medium" cssOverride={styles.heading}>
            <span data-settings-heading>{header}</span>
          </Text>
          <Text variant="small" color="secondary">
            {subHeader}
          </Text>
        </Flex>
      </Flex>
      <Button
        variant="ghost"
        size="icon"
        cssOverride={styles.actionButton}
        data-settings-chevron
        tabIndex={-1}
        aria-hidden="true"
        onClick={handleClick}
      >
        <ChevronRight size={16} aria-hidden="true" />
      </Button>
    </div>
  );
};

SettingsItem.displayName = 'SettingsItem';

export { SettingsItem };

const highlightedRow = {
  backgroundColor: theme.colors.background.fillSecondary,
  borderRadius: theme.radius.xl,
};

const highlightedHeading = {
  color: theme.colors.background.fillBrand,
};

const highlightedIcon = {
  color: theme.colors.background.fillBrand,
};

const showHighlightedAffordances: CSSObject = {
  opacity: 1,
  visibility: 'visible',
};

const styles = {
  row: ({
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing[2],
    minHeight: '56px',
    padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
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
  } satisfies CSSObject),
  rowOnly: ({
    borderRadius: theme.radius.xl,
  } satisfies CSSObject),
  rowFirst: ({
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    borderBottomLeftRadius: theme.radius.sm,
    borderBottomRightRadius: theme.radius.sm,
  } satisfies CSSObject),
  rowLast: ({
    borderTopLeftRadius: theme.radius.sm,
    borderTopRightRadius: theme.radius.sm,
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
  } satisfies CSSObject),
  rowMiddle: ({
    borderRadius: theme.radius.sm,
  } satisfies CSSObject),
  rowDisabled: ({
    cursor: 'default',
  } satisfies CSSObject),
  identifier: ({
    position: 'absolute',
    top: '8px',
    bottom: '8px',
    left: 0,
    width: '4px',
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.background.fillBrand,
    opacity: 0,
    visibility: 'hidden',
    transition: 'opacity 0.2s ease, visibility 0.2s ease',
  } satisfies CSSObject),
  content: ({
    alignItems: 'flex-start',
    flex: 1,
    minWidth: 0,
  } satisfies CSSObject),
  iconWrap: ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: theme.spacing[1],
    color: theme.colors.icon.primary,
    transition: 'color 0.2s ease',
  } satisfies CSSObject),
  textWrap: ({
    minWidth: 0,
  } satisfies CSSObject),
  heading: ({
    transition: 'color 0.2s ease',
  } satisfies CSSObject),
  actionButton: ({
    flexShrink: 0,
    opacity: 0,
    visibility: 'hidden',
    transition: 'opacity 0.2s ease, visibility 0.2s ease',
    backgroundColor: theme.colors.background.fillSecondaryHover,
    color: theme.colors.background.fillBrand,
    '&:hover': {
      backgroundColor: theme.colors.background.fillSecondaryHover,
      color: theme.colors.background.fillBrand,
    },
  } satisfies CSSObject),
};
