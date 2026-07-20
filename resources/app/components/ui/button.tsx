import { keyframes, type Theme } from '@emotion/react';
import { Slot } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
} from 'react';

import { theme } from '@/theme';
import { flex_center, scoped, ui_focus_ring } from '@/theme/mixins';

type ButtonVariant =
  | 'primary'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';

type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  loading?: boolean;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const {
    className,
    variant = 'primary',
    size = 'default',
    asChild = false,
    loading = false,
    disabled,
    type = 'button',
    children,
    ...rest
  } = props;

  const isDisabled = Boolean(disabled || loading);
  const buttonCss = [
    styles.base,
    styles.variants[variant],
    styles.sizes[size],
    isDisabled && styles.disabled,
    loading && styles.loading,
    className,
  ];

  if (asChild && !loading) {
    return (
      <Slot
        ref={ref}
        css={buttonCss}
        {...rest}
      >
        {children}
      </Slot>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      data-loading={loading ? 'true' : undefined}
      css={buttonCss}
      {...rest}
    >
      {loading ? (
        <>
          <span
            css={[styles.content, styles.contentHidden]}
            aria-hidden="true"
          >
            {children}
          </span>
          <span css={styles.loader}>
            <Loader2 size={16} aria-hidden="true" />
          </span>
        </>
      ) : (
        children
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;

const button_spin = keyframes({
  from: {
    transform: 'rotate(0deg)',
  },
  to: {
    transform: 'rotate(360deg)',
  },
});

const styles = {
  base: scoped({
    ...flex_center(),
    position: 'relative',
    height: 'max-content',
    width: 'max-content',
    padding: `${theme.spacing.md} ${theme.spacing['2xl']}`,
    borderRadius: theme.radius.lg,
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeight: 500,
    fontSize: '14px',
    lineHeight: '21px',
    cursor: 'pointer',
    columnGap: theme.spacing.md,
    textDecoration: 'none',
    boxSizing: 'border-box',
    whiteSpace: 'nowrap',
    border: '1px solid transparent',
    margin: 0,
    appearance: 'none',
    WebkitAppearance: 'none',
    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover, &:active, &:focus, &:visited': {
      textDecoration: 'none',
      outline: 'none',
    },
    '&:active:not([aria-haspopup])': {
      transform: 'translateY(1px)',
    },
    '&:focus-visible': {
      textDecoration: 'none',
      ...ui_focus_ring(theme as Theme),
    },
  }),
  variants: {
    primary: scoped({
      backgroundColor: theme.colors.background.fillBrand,
      color: theme.colors.text.light,
      '&:hover': {
        backgroundColor: theme.colors.background.fillBrandHover,
        color: theme.colors.text.light,
      },
    }),
    secondary: scoped({
      backgroundColor: theme.colors.background.fillSecondary,
      color: theme.colors.text.primary,
      '&:hover': {
        backgroundColor: theme.colors.background.fillSecondaryHover,
        color: theme.colors.text.primary,
      },
    }),
    destructive: scoped({
      backgroundColor: theme.colors.background.fillCritical,
      color: theme.colors.text.light,
      '&:hover': {
        backgroundColor: theme.colors.border.critical,
        color: theme.colors.text.light,
      },
    }),
    outline: scoped({
      backgroundColor: theme.colors.background.fill,
      border: `1px solid ${theme.colors.border.default}`,
      color: theme.colors.text.primary,
      '&:hover': {
        backgroundColor: theme.colors.background.fillHover,
        color: theme.colors.text.primary,
      },
    }),
    ghost: scoped({
      backgroundColor: theme.colors.background.fill,
      color: theme.colors.text.primary,
      '&:hover': {
        backgroundColor: theme.colors.background.fillSpecial3Tertiary,
        color: theme.colors.text.primary,
      },
    }),
    link: scoped({
      backgroundColor: theme.colors.background.fill,
      color: theme.colors.text.primary,
    }),
  },
  sizes: {
    default: scoped({
      padding: `${theme.spacing.md} ${theme.spacing['2xl']}`,
      fontSize: '14px',
      lineHeight: '21px',
    }),
    sm: scoped({
      fontSize: '12px',
      padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
    }),
    lg: scoped({
      padding: `${theme.spacing.base} ${theme.spacing['6xl']}`,
    }),
    icon: scoped({
      padding: theme.spacing.base,
    }),
  },
  disabled: scoped({
    opacity: 0.5,
    pointerEvents: 'none',
  }),
  loading: scoped({
    pointerEvents: 'none',
  }),
  content: scoped({
    ...flex_center(),
    columnGap: theme.spacing.md,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  contentHidden: scoped({
    visibility: 'hidden',
  }),
  loader: scoped({
    ...flex_center(),
    position: 'absolute',
    inset: 0,
    svg: {
      animation: `${button_spin} 0.8s linear infinite`,
    },
  }),
};
