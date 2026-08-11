import { type CSSObject } from '@emotion/react';
import { Slot } from '@radix-ui/react-slot';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';

import { theme } from '@/theme';
import { defineStyles, scopedMerge, uiFocusRing } from '@/theme/mixins';

type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'ghost'
  | 'link'
  | 'success'
  | 'warning'
  | 'caution'
  | 'info'
  | 'requested';

type BadgeProps = Omit<
  ComponentPropsWithoutRef<'span'>,
  'className' | 'css'
> & {
  variant?: BadgeVariant;
  asChild?: boolean;
  cssOverride?: CSSObject;
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>((props, ref) => {
  const {
    cssOverride,
    variant = 'default',
    asChild = false,
    ...rest
  } = props;

  const Comp = asChild ? Slot : 'span';
  return (
    <Comp
      ref={ref}
      data-slot="badge"
      data-variant={variant}
      css={scopedMerge(styles.base, styles.variants[variant], cssOverride)}
      {...rest}
    />
  );
});

Badge.displayName = 'Badge';

const badgeVariantStyles = defineStyles({
  default: {
    backgroundColor: theme.colors.background.surfaceTertiary,
    color: theme.colors.text.secondary,
    'a&:hover': {
      backgroundColor: theme.colors.background.fillHover,
    },
  },
  secondary: {
    backgroundColor: theme.colors.background.fillSecondary,
    color: theme.colors.text.secondary,
    'a&:hover': {
      backgroundColor: theme.colors.background.fillSecondaryHover,
    },
  },
  destructive: {
    backgroundColor: theme.colors.background.fillCriticalSecondary,
    color: theme.colors.text.critical,
    'a&:hover': {
      opacity: 0.9,
    },
  },
  outline: {
    backgroundColor: 'transparent',
    border: `1px solid ${theme.colors.border.default}`,
    color: theme.colors.text.primary,
    'a&:hover': {
      backgroundColor: theme.colors.background.surfaceSecondary,
    },
  },
  ghost: {
    backgroundColor: 'transparent',
    color: theme.colors.text.primary,
    'a&:hover': {
      backgroundColor: theme.colors.background.surfaceSecondary,
    },
  },
  link: {
    backgroundColor: 'transparent',
    color: theme.colors.text.brand,
    textUnderlineOffset: '4px',
    'a&:hover': {
      textDecoration: 'underline',
    },
  },
  success: {
    backgroundColor: theme.colors.background.fillSuccessSecondary,
    color: theme.colors.text.success,
    'a&:hover': {
      opacity: 0.9,
    },
  },
  warning: {
    backgroundColor: theme.colors.background.fillWarningSecondary,
    color: theme.colors.text.warning,
    'a&:hover': {
      opacity: 0.9,
    },
  },
  caution: {
    backgroundColor: theme.colors.background.fillCautionSecondary,
    color: theme.colors.text.caution,
    'a&:hover': {
      opacity: 0.9,
    },
  },
  info: {
    backgroundColor: theme.colors.background.fillSpecialSecondary,
    color: theme.colors.text.special2,
    'a&:hover': {
      opacity: 0.9,
    },
  },
  requested: {
    backgroundColor: theme.colors.background.fillSpecial2Secondary,
    color: theme.colors.text.special3,
    'a&:hover': {
      opacity: 0.9,
    },
  },
});

const styles = defineStyles({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[1],
    width: 'max-content',
    flexShrink: 0,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    border: '1px solid transparent',
    borderRadius: theme.radius.md,
    padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
    ...theme.typography.micro('medium'),
    maxHeight: '24px',
    textDecoration: 'none',
    transition: 'color 150ms ease, box-shadow 150ms ease, background-color 150ms ease',
    '&:focus-visible': {
      ...uiFocusRing(theme),
    },
    '& svg': {
      flexShrink: 0,
      width: '12px',
      height: '12px',
      pointerEvents: 'none',
    },
    '& [data-icon]': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
  },
  variants: badgeVariantStyles,
});

export default Badge;
export { badgeVariantStyles };
export type { BadgeProps, BadgeVariant };

