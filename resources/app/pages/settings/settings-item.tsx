import { ChevronRight } from 'lucide-react';
import type { KeyboardEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
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
      css={[
        styles.row,
        isOnly && styles.rowOnly,
        !isOnly && isFirst && styles.rowFirst,
        !isOnly && isLast && styles.rowLast,
        !isOnly && !isFirst && !isLast && styles.rowMiddle,
        isDisabled && styles.rowDisabled,
      ]}
      data-active={isActive ? 'true' : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isDisabled ? undefined : 'button'}
      tabIndex={isDisabled ? -1 : 0}
      aria-disabled={isDisabled || undefined}
      aria-current={isActive ? 'page' : undefined}
    >
      <div css={styles.identifier} data-settings-identifier aria-hidden="true" />
      <Flex gap={3} css={styles.content}>
        <span css={styles.iconWrap} data-settings-icon>
          {icon}
        </span>
        <Flex direction="column" gap={1} css={styles.textWrap}>
          <Text weight="medium" css={styles.heading}>
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
        css={styles.actionButton}
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
  row: scoped({
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
  }),
  rowOnly: scoped({
    borderRadius: theme.radius.xl,
  }),
  rowFirst: scoped({
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    borderBottomLeftRadius: theme.radius.sm,
    borderBottomRightRadius: theme.radius.sm,
  }),
  rowLast: scoped({
    borderTopLeftRadius: theme.radius.sm,
    borderTopRightRadius: theme.radius.sm,
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
  }),
  rowMiddle: scoped({
    borderRadius: theme.radius.sm,
  }),
  rowDisabled: scoped({
    cursor: 'default',
  }),
  identifier: scoped({
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
  }),
  content: scoped({
    alignItems: 'flex-start',
    flex: 1,
    minWidth: 0,
  }),
  iconWrap: scoped({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: theme.spacing[1],
    color: theme.colors.icon.primary,
    transition: 'color 0.2s ease',
  }),
  textWrap: scoped({
    minWidth: 0,
  }),
  heading: scoped({
    transition: 'color 0.2s ease',
  }),
  actionButton: scoped({
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
  }),
};
