import type { SerializedStyles, Theme } from '@emotion/react';
import {
  forwardRef,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router';

import { theme } from '@/theme';
import { fontGeneralSettings, scoped } from '@/theme/mixins';
import type { CardType } from '@/types';

type CardVariantType = CardType | 'large' | 'tartiary' | 'navbar';

type CardProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'className' | 'children'
> & {
  children?: ReactNode;
  type?: CardVariantType;
  link?: string | false;
  style?: CSSProperties;
  css?: SerializedStyles;
};

const Card = forwardRef<HTMLDivElement, CardProps>((props, ref) => {
  const {
    css: cssProp,
    children,
    style,
    type = 'default',
    link = false,
    onClick,
    ...rest
  } = props;
  const navigate = useNavigate();

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (link) {
      navigate(link);
    }
    onClick?.(event);
  };

  return (
    <div
      ref={ref}
      css={[styles.base, styles.variants[type], cssProp]}
      style={{
        ...style,
        cursor: link ? 'pointer' : style?.cursor,
      }}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

type CardSectionProps = Omit<HTMLAttributes<HTMLDivElement>, 'className'> & {
  css?: SerializedStyles;
};

const CardHeader = forwardRef<HTMLDivElement, CardSectionProps>(
  (props, ref) => {
    const { css: cssProp, ...rest } = props;

    return <div ref={ref} css={[styles.header, cssProp]} {...rest} />;
  },
);

CardHeader.displayName = 'CardHeader';

type CardTitleProps = Omit<HTMLAttributes<HTMLHeadingElement>, 'className'> & {
  css?: SerializedStyles;
};

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  (props, ref) => {
    const { css: cssProp, ...rest } = props;

    return <h3 ref={ref} css={[styles.title, cssProp]} {...rest} />;
  },
);

CardTitle.displayName = 'CardTitle';

type CardDescriptionProps = Omit<
  HTMLAttributes<HTMLParagraphElement>,
  'className'
> & {
  css?: SerializedStyles;
};

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  (props, ref) => {
    const { css: cssProp, ...rest } = props;

    return <p ref={ref} css={[styles.description, cssProp]} {...rest} />;
  },
);

CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, CardSectionProps>(
  (props, ref) => {
    const { css: cssProp, ...rest } = props;

    return <div ref={ref} css={[styles.content, cssProp]} {...rest} />;
  },
);

CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, CardSectionProps>(
  (props, ref) => {
    const { css: cssProp, ...rest } = props;

    return <div ref={ref} css={[styles.footer, cssProp]} {...rest} />;
  },
);

CardFooter.displayName = 'CardFooter';

export {
  Card, CardContent, CardDescription, CardFooter, CardHeader,
  CardTitle
};
export type { CardProps, CardVariantType };

const styles = {
  base: scoped({
    width: '100%',
    backgroundColor: theme.colors.background.fill,
    border: `1px solid ${theme.colors.border.secondary}`,
    borderRadius: theme.radius.xl,
    boxSizing: 'border-box',
    ...fontGeneralSettings(theme as Theme),
  }),
  variants: {
    default: scoped({
      padding: theme.spacing['2xl'],
    }),
    large: scoped({
      padding: theme.spacing['3xl'],
      gap: theme.spacing['3xl'],
      display: 'flex',
      flexDirection: 'column',
    }),
    table: scoped({
      padding: theme.spacing.none,
      overflow: 'hidden',
      border: '1px solid #e6e6e6',
    }),
    form: scoped({
      display: 'flex',
      flexDirection: 'column',
      rowGap: theme.spacing['2xl'],
      padding: theme.spacing['2xl'],
    }),
    inner: scoped({
      padding: theme.spacing.lg,
      border: `1px solid ${theme.colors.border.secondary}`,
      borderRadius: theme.radius.lg,
      boxShadow: 'none',
    }),
    dark: scoped({
      padding: theme.spacing['2xl'],
      backgroundColor: theme.colors.background.surfaceSecondary,
    }),
    light: scoped({
      padding: theme.spacing['2xl'],
      backgroundColor: theme.colors.background.fill,
      border: `1px solid ${theme.colors.border.secondary}`,
      borderRadius: theme.radius.md,
    }),
    innerDark: scoped({
      padding: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.background.surfaceSecondary,
    }),
    shadow: scoped({
      padding: theme.spacing['2xl'],
      boxShadow: '0px -1px 1px 0.5px #0000001a inset',
      border: 'none',
    }),
    tartiary: scoped({
      backgroundColor: theme.colors.background.surfaceSecondary,
    }),
    navbar: scoped({
      padding: `${theme.spacing.none} ${theme.spacing.lg}`,
      borderRadius: theme.radius.sm,
      minHeight: '36px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }),
  },
  header: scoped({
    display: 'flex',
    flexDirection: 'column',
    rowGap: theme.spacing.sm,
    padding: theme.spacing['2xl'],
  }),
  title: scoped({
    margin: 0,
    fontWeight: 600,
    fontSize: '16px',
    lineHeight: '24px',
    letterSpacing: '-0.025em',
    color: theme.colors.text.primary,
  }),
  description: scoped({
    margin: 0,
    fontSize: '14px',
    lineHeight: '20px',
    color: theme.colors.text.secondary,
  }),
  content: scoped({
    padding: `0 ${theme.spacing['2xl']} ${theme.spacing['2xl']}`,
  }),
  footer: scoped({
    display: 'flex',
    alignItems: 'center',
    padding: `0 ${theme.spacing['2xl']} ${theme.spacing['2xl']}`,
    columnGap: theme.spacing.md,
  }),
};
