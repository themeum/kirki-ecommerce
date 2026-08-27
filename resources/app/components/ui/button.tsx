import { type CSSObject, keyframes } from '@emotion/react';
import { Slot } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';

import { theme } from '@/theme';
import { defineStyles, flexCenter, mergeCss, scoped, scopedMerge, uiFocusRing } from '@/theme/mixins';

type ButtonVariant =
  | 'primary'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';

type ButtonSize =
  | 'default'
  | 'xs'
  | 'sm'
  | 'lg'
  | 'icon'
  | 'icon-xs'
  | 'icon-sm'
  | 'icon-lg';

type ButtonProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  'className' | 'css'
> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  loading?: boolean;
  cssOverride?: CSSObject;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const {
    cssOverride,
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
  const buttonCss = scopedMerge(
    styles.base,
    styles.variants[variant],
    variant !== 'link' && styles.sizes[size],
    variant === 'link' && styles.linkSize,
    isDisabled && styles.disabled,
    loading && styles.loading,
    cssOverride,
  );

  if (asChild && !loading) {
    return (
      <Slot
        ref={ref}
        data-slot="button"
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
      data-slot="button"
      css={buttonCss}
      {...rest}
    >
      {loading ? (
        <>
          <span
            css={scoped(mergeCss(styles.content, styles.contentHidden))}
            aria-hidden="true"
          >
            {children}
          </span>
          <span css={scoped(styles.loader)}>
            <Loader2 aria-hidden="true" />
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

const buttonSpin = keyframes({
  from: {
    transform: 'rotate(0deg)',
  },
  to: {
    transform: 'rotate(360deg)',
  },
});

const styles = defineStyles({
  base: {
    ...flexCenter(),
    ...theme.typography.small('medium'),
    position: 'relative',
    width: 'max-content',
    cursor: 'pointer',
    columnGap: theme.spacing[2],
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    border: '1px solid transparent',
    margin: 0,
    appearance: 'none',
    WebkitAppearance: 'none',
    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    '& svg': {
      flexShrink: 0,
      pointerEvents: 'none',
    },
    '&:hover, &:active, &:focus, &:visited': {
      textDecoration: 'none',
      outline: 'none',
    },
    '&:active:not([aria-haspopup])': {
      transform: 'translateY(1px)',
    },
    '&:focus-visible': {
      textDecoration: 'none',
      ...uiFocusRing(theme),
    },
  },
  variants: {
    primary: {
      backgroundColor: theme.colors.background.fillBrand,
      color: theme.colors.text.light,
      '&:hover': {
        backgroundColor: theme.colors.background.fillBrandHover,
        color: theme.colors.text.light,
      },
    },
    secondary: {
      backgroundColor: theme.colors.background.fillSecondary,
      color: theme.colors.text.primary,
      '&:hover': {
        backgroundColor: theme.colors.background.fillSecondaryHover,
        color: theme.colors.text.primary,
      },
    },
    destructive: {
      backgroundColor: theme.colors.background.fillCritical,
      color: theme.colors.text.light,
      '&:hover': {
        backgroundColor: theme.colors.border.critical,
        color: theme.colors.text.light,
      },
    },
    outline: {
      backgroundColor: theme.colors.background.fill,
      border: `1px solid ${theme.colors.border.default}`,
      color: theme.colors.text.primary,
      '&:hover': {
        backgroundColor: theme.colors.background.fillHover,
        color: theme.colors.text.primary,
      },
    },
    ghost: {
      backgroundColor: theme.colors.background.fill,
      color: theme.colors.text.primary,
      '&:hover': {
        backgroundColor: theme.colors.background.fillSpecial3Tertiary,
        color: theme.colors.text.primary,
      },
    },
    link: {
      backgroundColor: theme.colors.background.fill,
      color: theme.colors.text.primary,
    },
  },
  sizes: {
    xs: {
      ...theme.typography.tiny(),
      height: '24px',
      padding: `0 ${theme.spacing[2]}`,
      borderRadius: theme.radius.md,
      '& svg': {
        width: '12px',
        height: '12px',
      },
    },
    sm: {
      ...theme.typography.tiny(),
      height: '28px',
      padding: '0 10px',
      borderRadius: theme.radius.md,
      '& svg': {
        width: '14px',
        height: '14px',
      },
    },
    default: {
      height: '32px',
      padding: `0 ${theme.spacing[3]}`,
      borderRadius: theme.radius.md,
      '& svg': {
        width: '16px',
        height: '16px',
      },
    },
    lg: {
      height: '36px',
      padding: `0 ${theme.spacing[4]}`,
      borderRadius: theme.radius.lg,
      '& svg': {
        width: '16px',
        height: '16px',
      },
    },
    'icon-xs': {
      height: '24px',
      width: '24px',
      padding: 0,
      borderRadius: theme.radius.md,
      '& svg': {
        width: '12px',
        height: '12px',
      },
    },
    'icon-sm': {
      height: '28px',
      width: '28px',
      padding: 0,
      borderRadius: theme.radius.md,
      '& svg': {
        width: '14px',
        height: '14px',
      },
    },
    icon: {
      height: '32px',
      width: '32px',
      padding: 0,
      borderRadius: theme.radius.md,
      '& svg': {
        width: '16px',
        height: '16px',
      },
    },
    'icon-lg': {
      height: '36px',
      width: '36px',
      padding: 0,
      borderRadius: theme.radius.lg,
      '& svg': {
        width: '16px',
        height: '16px',
      },
    },
  },
  linkSize: {
    height: 'auto',
    width: 'auto',
    padding: 0,
  },
  disabled: {
    opacity: 0.5,
    pointerEvents: 'none',
  },
  loading: {
    pointerEvents: 'none',
  },
  content: {
    ...flexCenter(),
    columnGap: theme.spacing[2],
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  contentHidden: {
    visibility: 'hidden',
  },
  loader: {
    ...flexCenter(),
    position: 'absolute',
    inset: 0,
    svg: {
      animation: `${buttonSpin} 0.8s linear infinite`,
    },
  },
});
