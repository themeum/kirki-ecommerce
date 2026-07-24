import type { SerializedStyles, Theme } from '@emotion/react';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
} from 'react';

import { theme } from '@/theme';
import { fontGeneralSettings, scoped } from '@/theme/mixins';

type CardProps = Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'css'> & {
  css?: SerializedStyles | SerializedStyles[];
};

const Card = forwardRef<HTMLDivElement, CardProps>((props, ref) => {
  const { css: cssProp, ...rest } = props;

  return <div ref={ref} css={[styles.card, cssProp]} {...rest} />;
});

Card.displayName = 'Card';

type CardSectionProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'className' | 'css'
> & {
  css?: SerializedStyles | SerializedStyles[];
};

const CardHeader = forwardRef<HTMLDivElement, CardSectionProps>(
  (props, ref) => {
    const { css: cssProp, ...rest } = props;

    return <div ref={ref} css={[styles.header, cssProp]} {...rest} />;
  },
);

CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLDivElement, CardSectionProps>((props, ref) => {
  const { css: cssProp, ...rest } = props;

  return <div ref={ref} css={[styles.title, cssProp]} {...rest} />;
});

CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLDivElement, CardSectionProps>(
  (props, ref) => {
    const { css: cssProp, ...rest } = props;

    return <div ref={ref} css={[styles.description, cssProp]} {...rest} />;
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
export type { CardProps };

const styles = {
  card: scoped({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[4],
    width: '100%',
    paddingBlock: theme.spacing[4],
    borderRadius: theme.radius.xl,
    border: `1px solid ${theme.colors.border.secondary}`,
    backgroundColor: theme.colors.background.fill,
    color: theme.colors.text.primary,
    boxSizing: 'border-box',
    ...fontGeneralSettings(theme as Theme),
  }),
  header: scoped({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[2],
    paddingInline: theme.spacing[4],
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
    paddingInline: theme.spacing[4],
  }),
  footer: scoped({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing[2],
    paddingInline: theme.spacing[4],
  }),
};
