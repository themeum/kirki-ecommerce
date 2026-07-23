import { type SerializedStyles } from '@emotion/react';
import { forwardRef, type CSSProperties, type ReactNode } from 'react';

import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import type { BadgeType } from '@/types';

type BadgeProps = {
  type?: BadgeType;
  state?: 'disabled';
  text?: ReactNode;
  style?: CSSProperties;
  leftIcon?: ReactNode;
  css?: SerializedStyles;
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>((props, ref) => {
  const {
    css: cssProp,
    type = 'default',
    state,
    text,
    style,
    leftIcon,
  } = props;

  return (
    <span
      ref={ref}
      css={[
        styles.base,
        styles.types[type],
        state === 'disabled' && styles.disabled,
        cssProp,
      ]}
      style={style}
    >
      {leftIcon}
      {text}
    </span>
  );
});

Badge.displayName = 'Badge';

export default Badge;

const styles = {
  base: scoped({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    fontFamily: 'Inter',
    fontSize: '11px',
    fontWeight: 500,
    lineHeight: '14px',
    borderRadius: theme.radius.sm,
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    width: 'max-content',
    boxSizing: 'border-box',
  }),
  types: {
    secondary: scoped({
      backgroundColor: theme.colors.background.fillSpecial2Secondary,
      color: theme.colors.text.secondary,
    }),
    published: scoped({
      color: theme.colors.text.success,
      backgroundColor: theme.colors.background.fillSuccessSecondary,
    }),
    trashed: scoped({
      color: theme.colors.text.critical,
      backgroundColor: theme.colors.background.fillCriticalSecondary,
    }),
    draft: scoped({
      color: theme.colors.background.badgeDraft,
      backgroundColor: theme.colors.background.neutralSurface,
    }),
    pending: scoped({
      color: theme.colors.text.warning,
      backgroundColor: theme.colors.background.fillWarningSecondary,
    }),
    processing: scoped({
      color: theme.colors.text.special2,
      backgroundColor: theme.colors.background.fillSpecialSecondary,
    }),
    onHold: scoped({
      color: theme.colors.text.caution,
      backgroundColor: theme.colors.background.fillCautionSecondary,
    }),
    refunded: scoped({
      color: theme.colors.text.secondary,
      backgroundColor: theme.colors.background.fillSecondary,
    }),
    requested: scoped({
      color: theme.colors.text.special3,
      backgroundColor: theme.colors.background.fillSpecial2Secondary,
    }),
    default: scoped({
      color: theme.colors.text.secondary,
      backgroundColor: theme.colors.background.surfaceTertiary,
    }),
  },
  disabled: scoped({
    opacity: 0.5,
    pointerEvents: 'none',
  }),
};
