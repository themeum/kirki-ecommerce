import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';

const cardStyles = {
  formCard: scoped({
    rowGap: theme.spacing[4],
  }),
  tableCard: scoped({
    overflow: 'hidden',
    border: `1px solid ${theme.colors.border.alt}`,
    gap: 0,
    padding: theme.spacing[0],
  }),
  tableCardRounded: scoped({
    overflow: 'hidden',
    border: `1px solid ${theme.colors.border.alt}`,
    gap: 0,
    borderRadius: theme.radius.md,
    padding: theme.spacing[0],
  }),
  tableContent: scoped({
    padding: theme.spacing[0],
  }),
  largeCard: scoped({
    gap: theme.spacing[5],
    padding: theme.spacing[0],
  }),
  largeContent: scoped({
    paddingInline: theme.spacing[5],
  }),
  largeContentPadded: scoped({
    padding: theme.spacing[5],
  }),
  sectionHeader: scoped({
    gap: theme.spacing[2],
    paddingInline: theme.spacing[5],
  }),
  innerCard: scoped({
    borderRadius: theme.radius.lg,
    boxShadow: 'none',
    padding: theme.spacing[0],
  }),
  innerContent: scoped({
    padding: theme.spacing[3],
  }),
  innerCardContent: scoped({
    padding: theme.spacing[4],
  }),
  innerDarkCard: scoped({
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.surfaceSecondary,
    border: 'none',
    padding: theme.spacing[0],
  }),
  innerDarkContent: scoped({
    padding: theme.spacing[3],
  }),
  darkCard: scoped({
    backgroundColor: theme.colors.background.surfaceSecondary,
    padding: theme.spacing[0],
  }),
  lightCard: scoped({
    borderRadius: theme.radius.md,
    padding: theme.spacing[0],
  }),
  shadowCard: scoped({
    boxShadow: theme.shadow.sm,
    border: 'none',
  }),
  tartiaryCard: scoped({
    backgroundColor: theme.colors.background.surfaceSecondary,
    padding: theme.spacing[0],
  }),
  navbarCard: scoped({
    padding: `${theme.spacing[0]} ${theme.spacing[3]}`,
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
    padding: theme.spacing[0],
  }),
};

export { cardStyles };
