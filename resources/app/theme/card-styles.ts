import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';

const cardStyles = defineStyles({
  formCard: {
    rowGap: theme.spacing[4],
  },
  tableCard: {
    overflow: 'hidden',
    border: `1px solid ${theme.colors.border.alt}`,
    gap: 0,
    padding: theme.spacing[0],
  },
  tableCardRounded: {
    overflow: 'hidden',
    border: `1px solid ${theme.colors.border.alt}`,
    gap: 0,
    borderRadius: theme.radius.md,
    padding: theme.spacing[0],
  },
  tableContent: {
    padding: theme.spacing[0],
  },
  largeCard: {
    gap: theme.spacing[5],
  },
  largeContent: {
    paddingInline: theme.spacing[5],
  },
  largeContentPadded: {
    padding: theme.spacing[5],
  },
  sectionHeader: {
    gap: theme.spacing[2],
    paddingInline: theme.spacing[5],
  },
  innerCard: {
    borderRadius: theme.radius.lg,
    boxShadow: 'none',
    padding: theme.spacing[0],
  },
  innerContent: {
    padding: theme.spacing[3],
  },
  innerCardContent: {
    padding: theme.spacing[4],
  },
  innerDarkCard: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.surfaceSecondary,
    border: 'none',
    padding: theme.spacing[0],
  },
  innerDarkContent: {
    padding: theme.spacing[3],
  },
  darkCard: {
    backgroundColor: theme.colors.background.surfaceSecondary,
    padding: theme.spacing[0],
  },
  lightCard: {
    borderRadius: theme.radius.md,
    padding: theme.spacing[0],
  },
  shadowCard: {
    boxShadow: theme.shadow.sm,
    border: 'none',
  },
  tartiaryCard: {
    backgroundColor: theme.colors.background.surfaceSecondary,
    padding: theme.spacing[0],
  },
  navbarCard: {
    padding: `${theme.spacing[0]} ${theme.spacing[3]}`,
    borderRadius: theme.radius.sm,
    minHeight: '36px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 0,
    flexDirection: 'row',
    '& svg': {
      width: 16,
      height: 16,
      color: theme.colors.icon.primary,
    }
  },
  pageCard: {
    backgroundColor: theme.colors.background.surfaceSecondary,
    gap: 0,
    padding: theme.spacing[0],
  },
});

export { cardStyles };
