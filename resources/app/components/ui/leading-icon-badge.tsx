import { type CSSObject } from '@emotion/react';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';

import Flex from '@/components/ui/flex';
import { theme } from '@/theme';
import { defineStyles, mergeCss } from '@/theme/mixins';

type LeadingIconBadgeVariant = 'default' | 'success' | 'warning' | 'caution' | 'critical' | 'info';

type LeadingIconBadgeProps = Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'css'> & {
  variant?: LeadingIconBadgeVariant;
  cssOverride?: CSSObject;
  badgeCssOverride?: CSSObject;
};

const LeadingIconBadge = forwardRef<HTMLDivElement, LeadingIconBadgeProps>((props, ref) => {
  const { variant = 'default', cssOverride, badgeCssOverride, ...rest } = props;

  return (
    <Flex ref={ref} align="center" justify="center" shrink={0} cssOverride={cssOverride} {...rest}>
      <Flex
        align="center"
        justify="center"
        data-variant={variant}
        cssOverride={mergeCss(styles.badge, styles.variants[variant], badgeCssOverride)}
      />
    </Flex>
  );
});

LeadingIconBadge.displayName = 'LeadingIconBadge';

const leadingIconBadgeVariantStyles = defineStyles({
  default: {},
  success: {
    backgroundColor: theme.colors.background.fillSuccessSecondary,
    '&::after': {
      backgroundColor: theme.colors.text.success,
    },
  },
  warning: {
    backgroundColor: theme.colors.background.fillWarningSecondary,
    '&::after': {
      backgroundColor: theme.colors.text.warning,
    },
  },
  caution: {
    backgroundColor: theme.colors.background.fillCautionSecondary,
    '&::after': {
      backgroundColor: theme.colors.text.caution,
    },
  },
  critical: {
    backgroundColor: theme.colors.background.fillCriticalSecondary,
    '&::after': {
      backgroundColor: theme.colors.text.critical,
    },
  },
  info: {
    backgroundColor: theme.colors.background.fillSpecialSecondary,
    '&::after': {
      backgroundColor: theme.colors.text.special2,
    },
  },
});

const styles = defineStyles({
  badge: {
    width: theme.spacing[5],
    height: theme.spacing[5],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.fillSecondary,
    position: 'relative',
    zIndex: 1,
    '&::after': {
      content: '""',
      width: theme.spacing[2],
      height: theme.spacing[2],
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.text.primary,
    },
  },
  variants: leadingIconBadgeVariantStyles,
});

export default LeadingIconBadge;
export type { LeadingIconBadgeProps, LeadingIconBadgeVariant };
