import type { CSSObject } from '@emotion/react';

import { theme } from '@/theme';

const cardStyles = {
  formCard: {
    rowGap: theme.spacing[4],
  } satisfies CSSObject,
  tableCard: {
    overflow: 'hidden',
    border: `1px solid ${theme.colors.border.alt}`,
    gap: 0,
    padding: theme.spacing[0],
  } satisfies CSSObject,
  tableCardRounded: {
    overflow: 'hidden',
    border: `1px solid ${theme.colors.border.alt}`,
    gap: 0,
    borderRadius: theme.radius.md,
    padding: theme.spacing[0],
  } satisfies CSSObject,
  tableContent: {
    padding: theme.spacing[0],
  } satisfies CSSObject,
  largeCard: {
    gap: theme.spacing[5],
    padding: theme.spacing[0],
  } satisfies CSSObject,
  largeContent: {
    paddingInline: theme.spacing[5],
  } satisfies CSSObject,
  largeContentPadded: {
    padding: theme.spacing[5],
  } satisfies CSSObject,
  sectionHeader: {
    gap: theme.spacing[2],
    paddingInline: theme.spacing[5],
  } satisfies CSSObject,
  innerCard: {
    borderRadius: theme.radius.lg,
    boxShadow: 'none',
    padding: theme.spacing[0],
  } satisfies CSSObject,
  innerContent: {
    padding: theme.spacing[3],
  } satisfies CSSObject,
  innerCardContent: {
    padding: theme.spacing[4],
  } satisfies CSSObject,
  innerDarkCard: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.surfaceSecondary,
    border: 'none',
    padding: theme.spacing[0],
  } satisfies CSSObject,
  innerDarkContent: {
    padding: theme.spacing[3],
  } satisfies CSSObject,
  darkCard: {
    backgroundColor: theme.colors.background.surfaceSecondary,
    padding: theme.spacing[0],
  } satisfies CSSObject,
  lightCard: {
    borderRadius: theme.radius.md,
    padding: theme.spacing[0],
  } satisfies CSSObject,
  shadowCard: {
    boxShadow: theme.shadow.sm,
    border: 'none',
  } satisfies CSSObject,
  tartiaryCard: {
    backgroundColor: theme.colors.background.surfaceSecondary,
    padding: theme.spacing[0],
  } satisfies CSSObject,
  navbarCard: {
    padding: `${theme.spacing[0]} ${theme.spacing[3]}`,
    borderRadius: theme.radius.sm,
    minHeight: '36px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 0,
    flexDirection: 'row',
  } satisfies CSSObject,
  pageCard: {
    backgroundColor: theme.colors.background.surfaceSecondary,
    gap: 0,
    padding: theme.spacing[0],
  } satisfies CSSObject,
};

export { cardStyles };
