import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';

const cardStyles = {
  formCard: scoped({
    rowGap: theme.spacing['2xl'],
  }),
  tableCard: scoped({
    overflow: 'hidden',
    border: `1px solid ${theme.colors.border.alt}`,
    gap: 0,
    padding: theme.spacing.none,
  }),
  tableCardRounded: scoped({
    overflow: 'hidden',
    border: `1px solid ${theme.colors.border.alt}`,
    gap: 0,
    borderRadius: theme.radius.md,
    padding: theme.spacing.none,
  }),
  tableContent: scoped({
    padding: theme.spacing.none,
  }),
  largeCard: scoped({
    gap: theme.spacing['3xl'],
    padding: theme.spacing.none,
  }),
  largeContent: scoped({
    paddingInline: theme.spacing['3xl'],
  }),
  largeContentPadded: scoped({
    padding: theme.spacing['3xl'],
  }),
  sectionHeader: scoped({
    gap: theme.spacing.base,
    paddingInline: theme.spacing['3xl'],
  }),
  innerCard: scoped({
    borderRadius: theme.radius.lg,
    boxShadow: 'none',
    padding: theme.spacing.none,
  }),
  innerContent: scoped({
    padding: theme.spacing.lg,
  }),
  innerCardContent: scoped({
    padding: theme.spacing['2xl'],
  }),
  innerDarkCard: scoped({
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.surfaceSecondary,
    border: 'none',
    padding: theme.spacing.none,
  }),
  innerDarkContent: scoped({
    padding: theme.spacing.lg,
  }),
  darkCard: scoped({
    backgroundColor: theme.colors.background.surfaceSecondary,
    padding: theme.spacing.none,
  }),
  lightCard: scoped({
    borderRadius: theme.radius.md,
    padding: theme.spacing.none,
  }),
  shadowCard: scoped({
    boxShadow: '0px -1px 1px 0.5px #0000001a inset',
    border: 'none',
  }),
  tartiaryCard: scoped({
    backgroundColor: theme.colors.background.surfaceSecondary,
    padding: theme.spacing.none,
  }),
  navbarCard: scoped({
    padding: `${theme.spacing.none} ${theme.spacing.lg}`,
    borderRadius: theme.radius.sm,
    minHeight: '36px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 0,
    flexDirection: 'row',
  }),
  pageCard: scoped({
    backgroundColor: theme.colors.background.surfaceSecondary,
    gap: 0,
    padding: theme.spacing.none,
  }),
};

export { cardStyles };
