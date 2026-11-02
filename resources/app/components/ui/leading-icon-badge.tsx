import { type CSSObject } from '@emotion/react';
import { type ComponentPropsWithoutRef, forwardRef, type ReactNode } from 'react';

import Flex from '@/components/ui/flex';
import { theme } from '@/theme';
import { defineStyles, mergeCss } from '@/theme/mixins';

type LeadingIconBadgeVariant = 'default' | 'success' | 'warning' | 'caution' | 'critical' | 'info';

type LeadingIconBadgeProps = Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'css'> & {
  variant?: LeadingIconBadgeVariant;
  icon?: ReactNode;
  cssOverride?: CSSObject;
  dotIconCssOverride?: CSSObject;
};

const LeadingIconBadge = forwardRef<HTMLDivElement, LeadingIconBadgeProps>((props, ref) => {
  const { variant = 'default', icon, cssOverride, dotIconCssOverride, ...rest } = props;

  return (
    <Flex
      ref={ref}
      align="center"
      justify="center"
      shrink={0}
      data-variant={variant}
      cssOverride={mergeCss(styles.badge, styles.variants[variant], cssOverride)}
      {...rest}
    >
      {icon ?? (
        <Flex cssOverride={mergeCss(styles.dot, styles.dotVariants[variant], dotIconCssOverride)} />
      )}
    </Flex>
  );
});

LeadingIconBadge.displayName = 'LeadingIconBadge';

const leadingIconBadgeVariantStyles = defineStyles({
  default: {},
  success: {
    backgroundColor: theme.colors.background.fillSuccessSecondary,
  },
  warning: {
    backgroundColor: theme.colors.background.fillWarningSecondary,
  },
  caution: {
    backgroundColor: theme.colors.background.fillCautionSecondary,
  },
  critical: {
    backgroundColor: theme.colors.background.fillCriticalSecondary,
  },
  info: {
    backgroundColor: theme.colors.background.fillSpecial2Secondary,
  },
});

const leadingIconBadgeDotVariantStyles = defineStyles({
  default: {},
  success: {
    backgroundColor: theme.colors.background.fillSuccess,
  },
  warning: {
    backgroundColor: theme.colors.background.fillWarning,
  },
  caution: {
    backgroundColor: theme.colors.background.fillCaution,
  },
  critical: {
    backgroundColor: theme.colors.background.fillCritical,
  },
  info: {
    backgroundColor: theme.colors.background.fillSpecial2,
  },
});

const styles = defineStyles({
  badge: {
    width: '1.25rem',
    height: '1.25rem',
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.solidSurfaceSecondary,
    position: 'relative',
    zIndex: 1,
  },
  dot: {
    width: '0.5rem',
    height: '0.5rem',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.icon.primary,
  },
  variants: leadingIconBadgeVariantStyles,
  dotVariants: leadingIconBadgeDotVariantStyles,
});

export default LeadingIconBadge;
export type { LeadingIconBadgeProps, LeadingIconBadgeVariant };
